/**
 * Fix: Rename actual image files to match markdown references
 * SiYuan exported files with different names than markdown references
 */
const fs = require('fs');
const path = require('path');

const postDir = path.join(__dirname, 'source', '_posts');
const imgBaseDir = path.join(__dirname, 'source', 'img');

const posts = fs.readdirSync(postDir).filter(f => f.endsWith('.md'));

for (const post of posts) {
  const content = fs.readFileSync(path.join(postDir, post), 'utf-8');
  
  // Find all image references: ![alt](/img/xxx/filename.png)
  const imgRefs = [...content.matchAll(/!\[([^\]]*)\]\(\/img\/([^/]+)\/([^)]+)\)/g)];
  if (imgRefs.length === 0) continue;

  const slug = imgRefs[0][2];
  const imgDir = path.join(imgBaseDir, slug);
  
  if (!fs.existsSync(imgDir)) {
    console.log(`SKIP (no img dir): ${slug}`);
    continue;
  }

  // Get actual image files (sorted)
  const actualFiles = fs.readdirSync(imgDir)
    .filter(f => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))
    .sort();

  if (actualFiles.length === 0) continue;

  console.log(`\n${post} -> ${slug}`);
  console.log(`  Refs: ${imgRefs.length}, Files: ${actualFiles.length}`);

  let fixed = 0;
  for (let i = 0; i < imgRefs.length && i < actualFiles.length; i++) {
    const refFilename = imgRefs[i][3];
    const actualFile = actualFiles[i];
    
    const refPath = path.join(imgDir, refFilename);
    const actualPath = path.join(imgDir, actualFile);

    if (refFilename === actualFile) {
      // Already matching
      continue;
    }

    if (fs.existsSync(refPath)) {
      // Target already exists, skip
      continue;
    }

    // Rename actual file to match reference
    fs.renameSync(actualPath, refPath);
    console.log(`  ${actualFile} -> ${refFilename}`);
    fixed++;
  }

  if (fixed > 0) {
    console.log(`  Fixed: ${fixed} images`);
  } else {
    console.log(`  All matched`);
  }
}

console.log('\nDone!');
