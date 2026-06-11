const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workDir = __dirname;
const postDir = path.join(workDir, 'source', '_posts');
const imgBaseDir = path.join(workDir, 'source', 'img');

const docxFiles = fs.readdirSync(workDir).filter(f => f.endsWith('.docx'));

for (const docxFile of docxFiles) {
  const safeName = docxFile.replace(/[\\/:*?"<>|]/g, '_').replace('.docx', '');
  const slug = makeSlug(safeName);
  const tmpDir = path.join(workDir, '.tmp2', safeName);
  const imgDir = path.join(imgBaseDir, slug);

  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\nProcessing: ${docxFile}`);

  try {
    execSync(`powershell -Command "Expand-Archive -LiteralPath '${docxFile}' -DestinationPath '${tmpDir}' -Force"`, { cwd: workDir, stdio: 'pipe' });
  } catch (e) { console.log(`  Skip unzip`); continue; }

  // Copy images
  const mediaDir = path.join(tmpDir, 'word', 'media');
  let imgMap = {};
  if (fs.existsSync(mediaDir)) {
    fs.readdirSync(mediaDir).forEach(f => fs.copyFileSync(path.join(mediaDir, f), path.join(imgDir, f)));
  }

  // Build rels mapping
  const relsFile = path.join(tmpDir, 'word', '_rels', 'document.xml.rels');
  if (fs.existsSync(relsFile)) {
    const rels = fs.readFileSync(relsFile, 'utf-8');
    const relMatches = rels.match(/<Relationship[^>]*\/>/g) || [];
    relMatches.forEach(m => {
      const id = (m.match(/Id="([^"]*)"/) || [])[1];
      const target = (m.match(/Target="media\/([^"]*)"/) || [])[1];
      if (id && target) imgMap[id] = target;
    });
  }
  console.log(`  Images: ${Object.keys(imgMap).length}`);

  // Parse document.xml
  const docXml = path.join(tmpDir, 'word', 'document.xml');
  const xml = fs.readFileSync(docXml, 'utf-8');
  const paragraphs = [];

  const wpRegex = /<w:p[ >]([\s\S]*?)<\/w:p>/g;
  let match;
  while ((match = wpRegex.exec(xml)) !== null) {
    const pXml = match[1];
    const blipMatch = pXml.match(/r:embed="([^"]*)"/);
    if (blipMatch && imgMap[blipMatch[1]]) {
      paragraphs.push({ type: 'image', file: imgMap[blipMatch[1]] });
      continue;
    }
    const texts = [];
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pXml)) !== null) texts.push(tMatch[1]);
    const text = texts.join('').trim();
    if (!text) continue;
    const styleMatch = pXml.match(/<w:pStyle w:val="([^"]*)"/);
    const style = styleMatch?.[1] || '';
    if (/heading/i.test(style)) {
      const lv = (style.match(/\d/) || ['2'])[0];
      paragraphs.push({ type: 'heading', level: Math.min(+lv + 1, 4), text });
    } else {
      paragraphs.push({ type: 'text', text });
    }
  }

  let md = '';
  for (const p of paragraphs) {
    if (p.type === 'heading') md += '\n' + '#'.repeat(p.level) + ' ' + p.text + '\n\n';
    else if (p.type === 'text') md += p.text + '\n\n';
    else if (p.type === 'image') md += `![${p.file}](/img/${slug}/${p.file})\n\n`;
  }

  const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const post = `---\ntitle: "${safeName}"\ndate: ${dateStr}\nauthor: Xendr1a\n---\n\n{% raw %}\n\n${md.trim()}\n\n{% endraw %}\n`;
  fs.writeFileSync(path.join(postDir, `${slug}.md`), post, 'utf-8');
  console.log(`  -> ${slug}.md (${paragraphs.length} elements)`);
}

const tmpRoot = path.join(workDir, '.tmp2');
if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log('\nDone!');

function makeSlug(name) {
  return name.replace(/[（(]/g, '-').replace(/[）)]/g, '').replace(/["""]/g, '')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').trim();
}
