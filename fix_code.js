/**
 * Fix docx-extracted articles:
 * 1. Convert HTML entities in code back to real characters
 * 2. Detect PHP code and wrap in ```php blocks
 */
const fs = require('fs');
const path = require('path');

const postDir = path.join(__dirname, 'source', '_posts');
const newPosts = [
  '2025H-NCTF-web.md',
  'LitCTF2025-公开赛道-web.md', 
  'TGCTF-2025-web-复现.md',
  '轩辕杯-云盾砺剑CTF挑战赛-Web.md'
];

for (const post of newPosts) {
  const fp = path.join(postDir, post);
  if (!fs.existsSync(fp)) continue;
  
  let content = fs.readFileSync(fp, 'utf-8');
  
  // Split frontmatter and body
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;
  
  let fm = fmMatch[1];
  let body = fmMatch[2];
  
  // Remove {% raw %} tags
  body = body.replace(/^\{% raw %\}\s*\n/gm, '');
  body = body.replace(/\n\{% endraw %\}\s*$/gm, '');
  
  // Convert HTML entities back to real characters
  body = body.replace(/&lt;/g, '<');
  body = body.replace(/&gt;/g, '>');
  body = body.replace(/&quot;/g, '"');
  body = body.replace(/&#39;/g, "'");
  body = body.replace(/&amp;/g, '&');
  
  // Detect PHP code blocks (lines starting with <?php or containing PHP patterns)
  // and wrap them in ```php
  const lines = body.split('\n');
  const result = [];
  let inPhpBlock = false;
  let phpBlockLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect start of PHP code
    const isPhpStart = /^<\?php/i.test(trimmed) || 
      /^(error_reporting|highlight_file|class\s+\w+\s*\{|public\s+\$|function\s+__|if\s*\(isset|preg_match)/.test(trimmed) ||
      /^(const|require|include|use\s+)/.test(trimmed);
    
    // Detect end of PHP code (empty line after PHP or closing ?>)
    const isPhpEnd = trimmed === '?>' || 
      (inPhpBlock && trimmed === '' && i + 1 < lines.length && 
       !/^(<?php|error_reporting|class|public|function|if|preg_match|\$|throw|echo|return|catch|try)/.test(lines[i+1].trim()) &&
       !/^[\s]*[})]/.test(lines[i+1]) &&
       !/^[\s]*\w+::/.test(lines[i+1]));
    
    if (isPhpStart && !inPhpBlock) {
      // Flush any pending text
      if (result.length > 0 && result[result.length-1] !== '') result.push('');
      inPhpBlock = true;
      phpBlockLines = [line];
    } else if (inPhpBlock) {
      if (isPhpEnd || (trimmed === '' && phpBlockLines.length > 5 && !isPhpStart)) {
        // End of PHP block
        result.push('```php');
        result.push(...phpBlockLines);
        result.push('```');
        result.push('');
        inPhpBlock = false;
        phpBlockLines = [];
        if (trimmed !== '' && trimmed !== '?>') result.push(line);
      } else {
        phpBlockLines.push(line);
      }
    } else {
      result.push(line);
    }
  }
  
  // Flush remaining PHP block
  if (inPhpBlock && phpBlockLines.length > 0) {
    result.push('```php');
    result.push(...phpBlockLines);
    result.push('```');
  }
  
  body = result.join('\n');
  
  // Escape Nunjucks patterns
  body = body.replace(/\{\{/g, '&#123;&#123;');
  body = body.replace(/\}\}/g, '&#125;&#125;');
  body = body.replace(/\{%/g, '&#123;%');
  
  const out = `---\n${fm}\n---\n\n${body}\n`;
  fs.writeFileSync(fp, out, 'utf-8');
  console.log(`Fixed: ${post}`);
}

console.log('Done!');
