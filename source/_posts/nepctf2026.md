---
title: NEPCTF 2026 Web
date: 2026-04-10 10:00:00
author: Xendr1a
categories: [CTF题解, NEPCTF]
tags: [NEPCTF, Writeup]
description: NEPCTF 2026 Web，包含题目思路、payload 与踩坑记录。
toc: true
---

## 挂钩都在干什么呢？（CVE-2026-39363

给了附件，先看看

```text
信息量挺大的，有个robots.txt
User-agent: *
Disallow: /@fs/
```

然后vite.config.js写了白名单和黑名单

```text
import { defineConfig } from 'vite'
import path from 'node:path'

const root = process.cwd()

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,

    allowedHosts: true,

    fs: {
      strict: true,
      allow: [
        root,
        path.join(root, 'src'),
        path.join(root, 'public')
      ],
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**']
    }
  }
})
```

docker-entrypoint.sh上写了把flag写到了/flag

```text
#!/bin/sh
set -eu

echo $FLAG > /flag
unset FLAG

chown ctf:ctf /flag
chmod 777 /flag

exec su-exec ctf npm run start
```

测了一下/@fs/下的/flag

![QQ_1784903808523-20260724223658-f4t5m4u](/img/nepctf2026/img-01.png)

意料之中被拦了，然后后面回头发现，主界面这里直接把WebSocket 协议甩脸上了

![QQ_1784903942722-20260724223906-uojmkcj](/img/nepctf2026/img-02.png)

连起来就是Vite 6.4.1  WebSocket 查了一手cve

![QQ_1784904111607-20260724224159-d3z4ed7](/img/nepctf2026/img-03.png)

看了一会儿，试一试

![QQ_1784905073642-20260724225800-4vqw7a2](/img/nepctf2026/img-04.png)

![QQ_1784905194255-20260724225959-6o1ncfy](/img/nepctf2026/img-05.png)![QQ_1784905107497-20260724225841-uwf0zlj](/img/nepctf2026/img-06.png)

找出来了

总结就是，Vite 上需要两个通道是因为 HTTP 做不到"服务器主动通知浏览器"，所以加了一个 WebSocket 通道来做 HMR 推送，但是这题只在http上有waf，ws上是畅通无阻的，能直接读文件
