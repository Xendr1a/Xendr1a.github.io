/**
 * Convert SiYuan exported articles (v2) to Hexo format
 * Handles: folder-based articles with assets, standalone .md files
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'xendria_hexo_markdown');
const postDir = path.join(__dirname, 'source', '_posts');
const imgDir = path.join(__dirname, 'source', 'img');

if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

const processed = new Set();
const items = fs.readdirSync(srcDir);

// Step 1: Process folder-based articles (those with assets)
for (const item of items) {
  const itemPath = path.join(srcDir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;
  if (item.startsWith('.') || item.endsWith('.sy')) continue; // skip .siyuan, .sy

  const content = fs.readdirSync(itemPath);
  let mdFile = null;
  let assetDirs = [];

  for (const f of content) {
    const fp = path.join(itemPath, f);
    const stat = fs.statSync(fp);
    if (stat.isFile() && f.endsWith('.md')) {
      mdFile = { name: f, path: fp };
    }
    if (stat.isDirectory() && f === 'assets') {
      assetDirs.push(fp);
    }
    if (stat.isDirectory() && !f.startsWith('.') && f !== 'assets') {
      const sub = fs.readdirSync(fp);
      const subMd = sub.find(s => s.endsWith('.md'));
      const subAssets = sub.find(s => s === 'assets');
      if (subMd && subAssets) {
        mdFile = { name: subMd, path: path.join(fp, subMd) };
        assetDirs.push(path.join(fp, subAssets));
      } else if (sub.some(s => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(s))) {
        assetDirs.push(fp);
        if (subMd) mdFile = { name: subMd, path: path.join(fp, subMd) };
      }
    }
  }

  if (!mdFile) {
    console.log(`SKIP (no .md): ${item}`);
    continue;
  }

  const slug = makeSlug(item.replace(/\.md$/i, ''));
  console.log(`Processing: ${item} -> ${slug}`);

  let raw = fs.readFileSync(mdFile.path, 'utf-8');
  raw = raw.replace(/^\uFEFF/, '');
  let { fm, body } = parseFrontMatter(raw);
  fm = cleanFM(fm, slug);

  const isWpBlocks = body.includes('<!-- wp:');
  if (isWpBlocks) body = convertWpBlocks(body);

  if (assetDirs.length > 0) {
    const targetImgDir = path.join(imgDir, slug);
    body = copyAndFixImages(body, assetDirs, targetImgDir, slug);
  }
  body = body.replace(/\]\(assets\//g, `](/img/${slug}/`);

  body = `{% raw %}\n${body.trim()}\n{% endraw %}\n`;
  const outPath = path.join(postDir, `${slug}.md`);
  fs.writeFileSync(outPath, `---\n${fm}\n---\n\n${body}`);
  processed.add(item);
  console.log(`  -> ${outPath}`);
}

// Step 2: Process standalone .md files
for (const item of items) {
  const itemPath = path.join(srcDir, item);
  const stat = fs.statSync(itemPath);
  if (!stat.isFile() || !item.endsWith('.md')) continue;
  const folderName = item.replace(/\.md$/, '');
  if (processed.has(folderName)) continue;

  const slug = makeSlug(folderName);
  console.log(`Processing standalone: ${item} -> ${slug}`);

  let raw = fs.readFileSync(itemPath, 'utf-8');
  raw = raw.replace(/^\uFEFF/, '');
  let { fm, body } = parseFrontMatter(raw);
  fm = cleanFM(fm, slug);

  if (body.includes('<!-- wp:')) body = convertWpBlocks(body);
  body = `{% raw %}\n${body.trim()}\n{% endraw %}\n`;

  const outPath = path.join(postDir, `${slug}.md`);
  fs.writeFileSync(outPath, `---\n${fm}\n---\n\n${body}`);
  processed.add(item);
  console.log(`  -> ${outPath}`);
}

// Step 3: Process subdirectories with just .md files
for (const item of items) {
  const itemPath = path.join(srcDir, item);
  if (!fs.statSync(itemPath).isDirectory()) continue;
  if (processed.has(item)) continue;

  const mdFiles = fs.readdirSync(itemPath).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  for (const mdf of mdFiles) {
    const slug = makeSlug(mdf.replace(/\.md$/i, ''));
    console.log(`Processing subdir: ${item}/${mdf} -> ${slug}`);

    let raw = fs.readFileSync(path.join(itemPath, mdf), 'utf-8');
    raw = raw.replace(/^\uFEFF/, '');
    let { fm, body } = parseFrontMatter(raw);
    fm = cleanFM(fm, slug);

    if (body.includes('<!-- wp:')) body = convertWpBlocks(body);
    body = `{% raw %}\n${body.trim()}\n{% endraw %}\n`;

    const outPath = path.join(postDir, `${slug}.md`);
    fs.writeFileSync(outPath, `---\n${fm}\n---\n\n${body}`);
    console.log(`  -> ${outPath}`);
  }
  processed.add(item);
}

console.log(`\nDone! Processed ${processed.size} items.`);

// ========== Helpers ==========

function makeSlug(name) {
  return name
    .replace(/[（(]/g, '-')
    .replace(/[）)]/g, '')
    .replace(/[^\w\u4e00-\u9fff\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
}

function parseFrontMatter(raw) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { fm: 'title: untitled\ndate: 2026-06-11', body: raw };
  return { fm: match[1], body: match[2] };
}

function cleanFM(fm, slug) {
  const lines = fm.split('\n').filter(line => {
    const key = line.split(':')[0].trim();
    return !['lastmod', 'permalink', 'cover', 'toc', 'toc_number', 'mathjax', 'katex', 'comments'].includes(key);
  });

  const keys = lines.map(l => l.split(':')[0].trim());
  if (!keys.includes('author')) lines.push('author: Xendr1a');
  if (!keys.includes('date')) lines.push('date: 2026-06-11');

  // Fix tags: ["a","b"] format
  let tagsLine = lines.find(l => l.startsWith('tags:'));
  if (tagsLine) {
    const idx = lines.indexOf(tagsLine);
    const tagVal = tagsLine.replace('tags:', '').trim();
    if (tagVal.startsWith('[')) {
      const tagNames = tagVal.slice(1, -1).split(',').map(t => t.trim().replace(/['"]/g, ''));
      lines.splice(idx, 1, ...tagNames.map(t => `  - ${t}`));
      if (!lines.some(l => l.trim() === 'tags:')) {
        lines.splice(idx, 0, 'tags:');
      }
    }
  }

  // Clean title
  let titleLine = lines.find(l => l.startsWith('title:'));
  if (titleLine) {
    const idx = lines.indexOf(titleLine);
    let title = titleLine.replace('title:', '').trim();
    title = title.replace(/[（(][^)）]*$/g, '').trim();
    lines[idx] = `title: ${title}`;
  }

  return lines.join('\n');
}

// ========== WordPress Block Converter ==========

function convertWpBlocks(body) {
  body = body.replace(
    /<!-- wp:code -->\s*<pre class="wp-block-code"><code>([\s\S]*?)<\/code><\/pre>\s*<!-- \/wp:code -->/g,
    (_, code) => {
      code = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      let lang = code.trim().startsWith('<?php') ? 'php' : '';
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    }
  );
  body = body.replace(
    /<!-- wp:heading[^>]*-->\s*<h([1-6])[^>]*>([\s\S]*?)<\/h\1>\s*<!-- \/wp:heading -->/g,
    (_, l, c) => '\n' + '#'.repeat(+l) + ' ' + stripHtml(c) + '\n'
  );
  body = body.replace(
    /<!-- wp:paragraph -->\s*<p>([\s\S]*?)<\/p>\s*<!-- \/wp:paragraph -->/g,
    (_, c) => '\n' + inlineToMd(c) + '\n'
  );
  body = body.replace(
    /<!-- wp:image[^>]*-->\s*<figure[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*\/?>\s*(?:<figcaption>[^<]*<\/figcaption>\s*)?<\/figure>\s*<!-- \/wp:image -->/g,
    (_, src) => `\n![](${src})\n`
  );
  body = body.replace(
    /<!-- wp:table -->\s*<figure[^>]*>\s*<table[^>]*>([\s\S]*?)<\/table>\s*<\/figure>\s*<!-- \/wp:table -->/g,
    (_, tbl) => '\n' + convertTable(tbl) + '\n'
  );
  body = body.replace(
    /<!-- wp:list -->\s*<ul[^>]*>([\s\S]*?)<\/ul>\s*<!-- \/wp:list -->/g,
    (_, l) => '\n' + convertList(l, '-') + '\n'
  );
  body = body.replace(
    /<!-- wp:list\s*\{[^}]*"ordered"\s*:\s*true[^}]*\}\s*-->\s*<ol[^>]*>([\s\S]*?)<\/ol>\s*<!-- \/wp:list -->/g,
    (_, l) => '\n' + convertList(l, '1.') + '\n'
  );
  body = body.replace(/<!-- \/?wp:[a-z-]+[^>]*-->/g, '');
  body = body.replace(/<br\s*\/?>/gi, '\n').replace(/\n{3,}/g, '\n\n');
  return body;
}

function stripHtml(html) {
  const ents = { '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };
  return html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/g, c => ents[c] || c).trim();
}

function inlineToMd(html) {
  html = html.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  html = html.replace(/<\/?(?:strong|b)>/gi, '**');
  html = html.replace(/<\/?(?:em|i)>/gi, '*');
  html = html.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  html = html.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, '![]($1)');
  return stripHtml(html);
}

function convertTable(html) {
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!rows || rows.length < 2) return stripHtml(html);
  const parsed = rows.map(row => {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    return (cells || []).map(c => stripHtml(c.replace(/<\/?t[dh][^>]*>/gi, '')).trim());
  });
  if (!parsed.length) return '';
  const cols = Math.max(...parsed.map(r => r.length));
  const result = ['| ' + (parsed[0] || []).map(c => c || ' ').join(' | ') + ' |'];
  result.push('| ' + Array(cols).fill('---').join(' | ') + ' |');
  for (let i = 1; i < parsed.length; i++) {
    while (parsed[i].length < cols) parsed[i].push('');
    result.push('| ' + parsed[i].join(' | ') + ' |');
  }
  return result.join('\n');
}

function convertList(html, prefix) {
  const items = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (!items) return stripHtml(html);
  return items.map(item => `${prefix} ${stripHtml(item.replace(/<\/?li[^>]*>/gi, '')).trim()}`).join('\n');
}

function copyAndFixImages(body, assetDirs, targetDir, slug) {
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const allImages = new Set();
  for (const assetDir of assetDirs) {
    if (!fs.existsSync(assetDir)) continue;
    fs.readdirSync(assetDir).forEach(f => {
      if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f)) {
        allImages.add(f);
        const src = path.join(assetDir, f);
        const dest = path.join(targetDir, f);
        if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
      }
    });
  }

  for (const img of allImages) {
    const escaped = img.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    body = body.replace(new RegExp(`\\]\\([^)]*${escaped}\\)`, 'g'), `](/img/${slug}/${img})`);
  }

  return body;
}
