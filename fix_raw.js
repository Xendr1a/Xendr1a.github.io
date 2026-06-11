/**
 * Fix: Remove {% raw %} wrapper and only escape Nunjucks patterns in code blocks
 */
const fs = require('fs');
const path = require('path');

const postDir = path.join(__dirname, 'source', '_posts');
const files = fs.readdirSync(postDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(postDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove the {% raw %} / {% endraw %} wrapper
  content = content.replace(/^\{% raw %\}\s*\n/gm, '');
  content = content.replace(/\n\{% endraw %\}\s*$/gm, '');

  // Escape Nunjucks patterns in the body
  // Split into frontmatter and body
  const parts = content.split(/^---\s*$/m);
  if (parts.length >= 3) {
    let fm = parts[1];
    let body = parts.slice(2).join('---');

    // Escape {{ and {% in code blocks (between ``` markers)
    body = body.replace(
      /(```[\s\S]*?```)/g,
      (block) => {
        // Escape patterns inside code blocks
        return block
          .replace(/\{\{/g, '&#123;&#123;')
          .replace(/\}\}/g, '&#125;&#125;')
          .replace(/\{%/g, '&#123;%')
          .replace(/%\}/g, '%&#125;');
      }
    );

    // Escape {{ and {% outside code blocks (inline)
    body = body.replace(/\{\{/g, '&#123;&#123;');
    body = body.replace(/\{%/g, '&#123;%');

    content = `---\n${fm}\n---\n${body}`;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed: ${file}`);
}

console.log('Done!');
