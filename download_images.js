/**
 * Download remote images from xendria.icu and fix image references
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const postDir = path.join(__dirname, 'source', '_posts');
const imgDir = path.join(__dirname, 'source', 'img', 'remote');

if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });

// Collect all remote image URLs from all posts
const posts = fs.readdirSync(postDir).filter(f => f.endsWith('.md'));
const urlMap = new Map(); // URL -> [filenames]

for (const post of posts) {
  const content = fs.readFileSync(path.join(postDir, post), 'utf-8');
  const matches = content.matchAll(/!\[\]\((http:\/\/xendria\.icu\/wp-content\/uploads\/[^)]+)\)/g);
  for (const m of matches) {
    const url = m[1];
    if (!urlMap.has(url)) urlMap.set(url, new Set());
    urlMap.get(url).add(post);
  }
}

console.log(`Found ${urlMap.size} unique remote images in ${[...new Set([...urlMap.values()].flatMap(s => [...s]))].length} posts`);

// Download each image
let downloaded = 0;
let failed = 0;
const promises = [];

for (const [url, postFiles] of urlMap) {
  const filename = url.split('/').pop();
  const dest = path.join(imgDir, filename);

  if (fs.existsSync(dest)) {
    console.log(`SKIP (exists): ${filename}`);
    continue;
  }

  promises.push(new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        const redirectProto = res.headers.location.startsWith('https') ? https : http;
        redirectProto.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => {
            fs.writeFileSync(dest, Buffer.concat(chunks));
            console.log(`OK: ${filename} (${(Buffer.concat(chunks).length / 1024).toFixed(1)}KB)`);
            downloaded++;
            resolve();
          });
        }).on('error', () => { console.log(`FAIL: ${filename}`); failed++; resolve(); });
      } else if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          fs.writeFileSync(dest, Buffer.concat(chunks));
          console.log(`OK: ${filename} (${(Buffer.concat(chunks).length / 1024).toFixed(1)}KB)`);
          downloaded++;
          resolve();
        });
      } else {
        console.log(`FAIL(${res.statusCode}): ${filename}`);
        failed++;
        resolve();
      }
    }).on('error', () => { console.log(`FAIL(net): ${filename}`); failed++; resolve(); });
  }));
}

Promise.all(promises).then(() => {
  console.log(`\nDownloaded: ${downloaded}, Failed: ${failed}`);

  // Fix image references in all posts
  for (const post of posts) {
    const filePath = path.join(postDir, post);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    for (const [url] of urlMap) {
      const filename = url.split('/').pop();
      const destFile = path.join(imgDir, filename);
      if (fs.existsSync(destFile)) {
        const newRef = `/img/remote/${filename}`;
        if (content.includes(url)) {
          content = content.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newRef);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Fixed: ${post}`);
    }
  }

  console.log('\nDone!');
});
