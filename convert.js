/**
 * 将思源(SiYuan)导出的 WordPress 块格式 Markdown 转换为 Hexo 兼容格式
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'xendria_hexo_markdown');
const destDir = path.join(__dirname, 'source', '_posts');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  console.log(`Processing: ${file}`);
  const raw = fs.readFileSync(path.join(srcDir, file), 'utf-8');

  // Split front-matter and body
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    console.log(`  SKIP: no front-matter`);
    return;
  }

  let fm = fmMatch[1];
  let body = fmMatch[2];

  // --- Clean front-matter ---
  // Remove permalink
  fm = fm.split('\n').filter(line => !line.startsWith('permalink:')).join('\n');
  // Fix author
  fm = fm.replace(/author:\s*Xebdria/i, 'author: Xendr1a');
  // Add tags from categories if not present
  if (!fm.includes('tags:')) {
    const catMatch = fm.match(/categories:\s*\n([\s\S]*?)(?=\n\S|$)/);
    if (catMatch) {
      const cats = catMatch[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('- '))
        .map(l => l.replace('- ', ''));
      if (cats.length > 0) {
        const tagsBlock = '\ntags:\n' + cats.map(c => `  - ${c}`).join('\n');
        fm = fm + tagsBlock;
      }
    }
  }

  // --- Convert body ---

  // 1. wp:code blocks -> markdown fenced code
  body = body.replace(
    /<!-- wp:code -->\s*<pre class="wp-block-code"><code>([\s\S]*?)<\/code><\/pre>\s*<!-- \/wp:code -->/g,
    (_, code) => {
      code = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      // Detect language from first line like <?php
      let lang = '';
      const firstLine = code.trim().split('\n')[0];
      if (firstLine.includes('<?php')) lang = 'php';
      else if (firstLine.includes('import ') || firstLine.includes('def ')) lang = 'python';
      return `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    }
  );

  // 2. wp:heading -> markdown headings
  body = body.replace(
    /<!-- wp:heading(?:\s*\{[^}]*\})?\s*-->\s*<h([1-6])[^>]*>([\s\S]*?)<\/h\1>\s*<!-- \/wp:heading -->/g,
    (_, level, content) => {
      // Remove inner HTML tags but keep text
      content = stripHtml(content);
      return '\n' + '#'.repeat(parseInt(level)) + ' ' + content + '\n';
    }
  );

  // 3. wp:paragraph -> plain text (handle inline HTML)
  body = body.replace(
    /<!-- wp:paragraph -->\s*<p>([\s\S]*?)<\/p>\s*<!-- \/wp:paragraph -->/g,
    (_, content) => {
      return '\n' + convertInlineHtml(content) + '\n';
    }
  );

  // 4. wp:image -> markdown image
  body = body.replace(
    /<!-- wp:image\s*(\{[^}]*\})?\s*-->\s*<figure[^>]*>\s*<img[^>]*src="([^"]+)"[^>]*\/?>\s*(?:<figcaption>[^<]*<\/figcaption>\s*)?<\/figure>\s*<!-- \/wp:image -->/g,
    (_, __, src) => {
      const alt = '';
      return `\n![${alt}](${src})\n`;
    }
  );

  // 5. wp:table -> markdown table (simple conversion)
  body = body.replace(
    /<!-- wp:table -->\s*<figure[^>]*>\s*<table[^>]*>([\s\S]*?)<\/table>\s*<\/figure>\s*<!-- \/wp:table -->/g,
    (_, tableContent) => {
      return '\n' + convertTable(tableContent) + '\n';
    }
  );

  // 6. wp:list (unordered) -> markdown list
  body = body.replace(
    /<!-- wp:list -->\s*<ul[^>]*>([\s\S]*?)<\/ul>\s*<!-- \/wp:list -->/g,
    (_, listContent) => {
      return '\n' + convertList(listContent, '-') + '\n';
    }
  );

  // 7. wp:list (ordered) -> markdown list
  body = body.replace(
    /<!-- wp:list\s*\{[^}]*"ordered"\s*:\s*true[^}]*\}\s*-->\s*<ol[^>]*>([\s\S]*?)<\/ol>\s*<!-- \/wp:list -->/g,
    (_, listContent) => {
      return '\n' + convertList(listContent, '1.') + '\n';
    }
  );

  // 8. wp:quote -> markdown blockquote
  body = body.replace(
    /<!-- wp:quote -->\s*<blockquote[^>]*>([\s\S]*?)<\/blockquote>\s*<!-- \/wp:quote -->/g,
    (_, content) => {
      const lines = stripHtml(content).split('\n').filter(l => l.trim());
      return '\n' + lines.map(l => '> ' + l.trim()).join('\n') + '\n';
    }
  );

  // 9. Remove any remaining wp: comments
  body = body.replace(/<!-- \/?wp:[a-z-]+[^>]*-->/g, '');

  // 10. Clean up inline HTML remnants
  body = body
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // --- Assemble and write ---
  // Wrap body in {% raw %} to prevent Nunjucks from parsing {{ }} {%% %%} etc.
  const output = `---\n${fm.trim()}\n---\n\n{% raw %}\n${body}\n{% endraw %}\n`;
  const outPath = path.join(destDir, file);
  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`  -> ${outPath}`);
});

console.log(`\nDone! Converted ${files.length} files.`);

// --- Helpers ---

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function convertInlineHtml(html) {
  // Convert <a href="...">text</a>
  html = html.replace(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  // Convert <strong>text</strong> or <b>text</b>
  html = html.replace(/<\/?(?:strong|b)>/gi, '**');
  // Convert <em>text</em> or <i>text</i>
  html = html.replace(/<\/?(?:em|i)>/gi, '*');
  // Convert <code>text</code>
  html = html.replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`');
  // Convert <img ...> to markdown
  html = html.replace(/<img[^>]*src="([^"]+)"[^>]*\/?>/gi, '![]($1)');
  // Remove remaining HTML tags
  html = stripHtml(html);
  return html;
}

function convertTable(html) {
  const rows = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!rows || rows.length < 2) return stripHtml(html);

  const parsedRows = rows.map(row => {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    return (cells || []).map(cell => stripHtml(cell.replace(/<\/?t[dh][^>]*>/gi, '')).trim());
  });

  if (parsedRows.length === 0) return '';

  const colCount = Math.max(...parsedRows.map(r => r.length));
  const result = [];

  // Header row
  result.push('| ' + parsedRows[0].map(c => c || ' ').join(' | ') + ' |');
  result.push('| ' + Array(colCount).fill('---').join(' | ') + ' |');

  // Data rows
  for (let i = 1; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    while (row.length < colCount) row.push('');
    result.push('| ' + row.join(' | ') + ' |');
  }

  return result.join('\n');
}

function convertList(html, prefix) {
  const items = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (!items) return stripHtml(html);
  return items.map(item => `${prefix} ${stripHtml(item.replace(/<\/?li[^>]*>/gi, '')).trim()}`).join('\n');
}
