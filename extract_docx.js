/**
 * Extract .docx files to Hexo markdown posts with images
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workDir = __dirname;
const postDir = path.join(workDir, 'source', '_posts');
const imgBaseDir = path.join(workDir, 'source', 'img');

// Find all .docx files
const docxFiles = fs.readdirSync(workDir).filter(f => f.endsWith('.docx'));
console.log(`Found ${docxFiles.length} .docx files`);

for (const docxFile of docxFiles) {
  console.log(`\nProcessing: ${docxFile}`);
  
  // Create temp dir for extraction
  const safeName = docxFile.replace(/[\\/:*?"<>|]/g, '_').replace('.docx', '');
  const tmpDir = path.join(workDir, '.tmp_docx', safeName);
  const slug = makeSlug(safeName);
  const imgDir = path.join(imgBaseDir, slug);
  
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  
  // Unzip docx (it's a ZIP file)
  try {
    execSync(`powershell -Command "Expand-Archive -LiteralPath '${docxFile}' -DestinationPath '${tmpDir}' -Force"`, { cwd: workDir, stdio: 'pipe' });
  } catch (e) {
    console.log(`  Failed to unzip: ${e.message}`);
    continue;
  }
  
  // Copy images
  const mediaDir = path.join(tmpDir, 'word', 'media');
  let imgCount = 0;
  if (fs.existsSync(mediaDir)) {
    const images = fs.readdirSync(mediaDir).filter(f => /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i.test(f));
    for (const img of images) {
      const src = path.join(mediaDir, img);
      const dest = path.join(imgDir, img);
      fs.copyFileSync(src, dest);
      imgCount++;
    }
  }
  console.log(`  Images: ${imgCount}`);
  
  // Extract text from document.xml
  const docXml = path.join(tmpDir, 'word', 'document.xml');
  if (!fs.existsSync(docXml)) {
    console.log(`  No document.xml found`);
    continue;
  }
  
  // Generate date from file info
  const stat = fs.statSync(path.join(workDir, docxFile));
  const dateStr = stat.mtime.toISOString().replace('T', ' ').substring(0, 19);
  
  // Build markdown frontmatter
  let fm = `---\ntitle: "${safeName}"\ndate: ${dateStr}\nauthor: Xendr1a\n---\n\n{% raw %}\n\n`;
  
  // Read body text if exists (previously generated)
  const bodyFile = path.join(tmpDir, 'body.txt');
  let body = '';
  
  // Try to extract text using PowerShell COM object
  try {
    // Use Word COM to extract text (if Word is installed)
    const psScript = `
      $word = New-Object -ComObject Word.Application
      $word.Visible = $false
      $doc = $word.Documents.Open('${path.join(workDir, docxFile).replace(/'/g, "''")}')
      $text = $doc.Content.Text
      $doc.Close()
      $word.Quit()
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($doc) | Out-Null
      [System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
      Write-Output $text
    `;
    body = execSync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`, { 
      cwd: workDir, 
      stdio: 'pipe',
      timeout: 30000,
      encoding: 'utf-8'
    });
    console.log(`  Text extracted via Word COM`);
  } catch (e) {
    console.log(`  Word COM failed, trying XML parse...`);
    // Fallback: extract text from XML
    const xml = fs.readFileSync(docXml, 'utf-8');
    // Extract text from <w:t> tags
    const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
    body = paragraphs.map(p => {
      const texts = p.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      return texts.map(t => t.replace(/<\/?w:t[^>]*>/g, '').replace(/<[^>]+>/g, '')).join('');
    }).filter(t => t.trim()).join('\n\n');
    console.log(`  Text extracted via XML (${body.length} chars)`);
  }
  
  // Clean up text
  body = body
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Try to detect headings (lines that are all caps or short)
  const lines = body.split('\n');
  const mdLines = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { mdLines.push(''); continue; }
    
    // Detect potential headings (short lines, often capitalized)
    if (trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.endsWith('。') && 
        !trimmed.includes('http') && trimmed.split(' ').length < 15) {
      // Check if it looks like a heading
      if (/^[A-Z\u4e00-\u9fff]/.test(trimmed)) {
        mdLines.push(`## ${trimmed}`);
        continue;
      }
    }
    mdLines.push(trimmed);
  }
  
  body = mdLines.join('\n\n');
  
  // Add image references at end of post
  if (imgCount > 0) {
    const imgFiles = fs.readdirSync(imgDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    body += '\n\n';
    for (const img of imgFiles) {
      body += `![${img}](/img/${slug}/${img})\n\n`;
    }
  }
  
  const md = fm + body + '\n\n{% endraw %}\n';
  const outPath = path.join(postDir, `${slug}.md`);
  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`  -> ${outPath}`);
}

console.log('\nDone!');
// Clean temp
const tmpRoot = path.join(workDir, '.tmp_docx');
if (fs.existsSync(tmpRoot)) fs.rmSync(tmpRoot, { recursive: true, force: true });

function makeSlug(name) {
  return name
    .replace(/[（(]/g, '-')
    .replace(/[）)]/g, '')
    .replace(/["""]/g, '')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}
