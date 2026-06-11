const fs=require('fs'),path=require('path'),base='.tmp_sy',dirs=fs.readdirSync(base);
dirs.forEach(dir=>{
  const d=path.join(base,dir),md=fs.readdirSync(d).find(f=>f.endsWith('.md'));
  if(!md)return;
  const slug=dir.replace(/[（(]/g,'-').replace(/[）)]/g,'').replace(/[^\w\u4e00-\u9fff\-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').trim();
  let c=fs.readFileSync(path.join(d,md),'utf8'),fm=c.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
  if(!fm)return;
  let fmY=fm[1],body=fm[2];
  fmY=fmY.split('\n').filter(l=>!/^(lastmod|permalink|cover|toc|toc_number|mathjax|katex|comments):/.test(l)).join('\n');
  if(!fmY.includes('author:'))fmY+='\nauthor: Xendr1a';
  const ad=path.join(d,'assets'),id=path.join('source','img',slug);
  if(!fs.existsSync(id))fs.mkdirSync(id,{recursive:true});
  if(fs.existsSync(ad))fs.readdirSync(ad).forEach(f=>{fs.copyFileSync(path.join(ad,f),path.join(id,f));body=body.split('](assets/'+f+')').join('](/img/'+slug+'/'+f+')')});
  body=body.replace(/\]\(assets\//g,'](/img/'+slug+'/');
  fs.writeFileSync(path.join('source','_posts',slug+'.md'),'---\n'+fmY.trim()+'\n---\n\n'+body.trim()+'\n');
  console.log(slug+'.md');
});
console.log('Done');
