const fs = require('fs');
const path = require('path');

const postDir = path.join(__dirname, 'source', '_posts');
const posts = fs.readdirSync(postDir).filter(f =>
  ['2025H-NCTF-web.md','LitCTF2025-公开赛道-web.md','TGCTF-2025-web-复现.md','轩辕杯-云盾砺剑CTF挑战赛-Web.md'].includes(f)
);

for (const post of posts) {
  const fp = path.join(postDir, post);
  let content = fs.readFileSync(fp, 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;
  let fm = fmMatch[1], body = fmMatch[2];

  // Remove raw tags
  body = body.replace(/\{% raw %\}\s*\n?/g, '').replace(/\n?\{% endraw %\}/g, '');

  // Convert HTML entities
  body = body.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  body = body.replace(/&#125;&#125;/g, '}}').replace(/&#123;&#123;/g, '{{').replace(/&#123;%/g, '{%');

  // Preserve existing ``` blocks
  const codeBlocks = [];
  body = body.replace(/```[\s\S]*?```/g, m => { codeBlocks.push(m); return `__CB${codeBlocks.length-1}__`; });

  // Code patterns
  const isCode = (t) => /^(<\?php|error_reporting|highlight_file|class\s+\w+|public\s+\$|private\s+\$|function\s+__|if\s*\(isset|preg_match|\$\w+\s*=|system\(|eval\(|echo\s+[`'"])/i.test(t) ||
    /^(import\s+|from\s+\w+\s+import|def\s+|class\s+\w+.*:|payload\d*\s*=|flagstr\s*=|headers\s*=|url\s*=\s*["']|for\s+\w+\s+in|try:|except)/i.test(t) ||
    /^(data=|GET\s+\/|POST\s+\/|curl\s+|cat\s+|ls\s+)/i.test(t) || /^[a-zA-Z]:\d+:\{/.test(t) || /^\s+payload\d*/.test(t);

  const lines = body.split('\n');
  const result = [];
  let inCode = false, codeLines = [], lang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], t = line.trim();
    if (t.startsWith('__CB')) { if (inCode) { result.push('```' + lang); result.push(...codeLines.map(l => l.trimEnd())); result.push('```\n'); inCode = false; codeLines = []; } result.push(line); continue; }
    if (inCode && t === '') {
      const next = i + 1 < lines.length ? lines[i + 1].trim() : '';
      if (next === '' || /^##?\s|!\[|__CB/.test(next)) {
        result.push('```' + lang); result.push(...codeLines.map(l => l.trimEnd())); result.push('```\n');
        inCode = false; codeLines = []; lang = '';
      } else { codeLines.push(line); }
      continue;
    }
    if (isCode(t) && !inCode) {
      if (result.length > 0 && result[result.length - 1] !== '') result.push('');
      inCode = true; codeLines = [line];
      lang = /^<\?php|^\$\w+->|^class\s|^function\s+__|^public|^private|^error_reporting|^highlight_file|^preg_match/i.test(t) ? 'php' :
             /^import\s|^from\s+\w+\s+import|^def\s|^class\s+\w+.*:|^url\s*=|^flagstr\s*=|^headers\s*=|^payload|^try:|^except/i.test(t) ? 'python' : '';
    } else if (inCode) { codeLines.push(line); }
    else { result.push(line); }
  }
  if (inCode && codeLines.length >= 2) { result.push('```' + lang); result.push(...codeLines.map(l => l.trimEnd())); result.push('```'); }

  body = result.join('\n');
  body = body.replace(/__CB(\d+)__/g, (_, i) => codeBlocks[+i]);

  // Fix <?php missing newline
  body = body.replace(/```php\n<\?php(\w)/g, '```php\n<?php\n$1');
  body = body.replace(/([^`\n])<\?php/g, '$1\n\n```php\n<?php');

  const out = `---\n${fm}\n---\n\n${body}\n`;
  fs.writeFileSync(fp, out, 'utf-8');
  console.log(`Fixed: ${post}`);
}
console.log('Done!');
