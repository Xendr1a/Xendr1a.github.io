---
title: range-v1 r1-sqli-basic writeup
date: 2026-11-28 11:04:55
author: Xendr1a
categories: [CTF题解, range-v1]
tags: [range-v1, Writeup]
description: 由对局记录导出：1 道题，平台确认 0 道。
toc: true
---

## 摘要

- 赛事：range-v1
- 记录时间：2026-11-28 11:04:55 至 2026-11-28 11:05:02
- 题目：1 道
- 平台确认：0 道
- state.json 状态：done 1
- worker 轮次：2 条记录，合计 0.026 秒

## 时间线

- `2026-11-28 11:04:55` 发现 c1《r1-sqli-basic》（Web，1000 分）
- `2026-11-28 11:04:57` c1 租到靶机（127.0.0.1:12001）
- `2026-11-28 11:04:58` c1 第 1 轮启动（chain-demo，时限 180s）
- `2026-11-28 11:04:59` c1 本轮未拿到 flag（chain-demo，0.017s，('SQL error', 'no such table: secret')）
- `2026-11-28 11:05:00` c1 第 2 轮启动（chain-demo，时限 180s）
- `2026-11-28 11:05:01` c1 本轮产出 FLAG.txt（0.009s）
- `2026-11-28 11:05:02` c1 释放靶机（chain-demo down -v）

## 试错与回滚

### 失败与未获判定

- `2026-11-28 11:04:59` c1 本轮未拿到 flag（chain-demo，0.017s，('SQL error', 'no such table: secret')）
- c1《r1-sqli-basic》，state.json 记录 2 次尝试，当前状态 done

### NOTES.md 记录的排除方向与卡点

**c1 `work/1/NOTES.md`**
- 已排除方向：
  - 命令：`curl -s -G http://127.0.0.1:$HOST_PORT/login --data-urlencode "name=' UNION SELECT 1,secret,3 FROM secret--" --data-urlencode pw=x`
  - 环境：`HOST_PORT=12001`，rc=0，耗时 0.017s
  - 真实输出（末尾）：('SQL error', 'no such table: secret') / </pre><!-- 记录型 SQL 错误会原样显示，便于盲注/报错注入练习 -->
  - 结论：这次没有拿到 flag；重跑用下面的成功命令，不要重复这条。

## flag

- c1《r1-sqli-basic》：`flag{***}` **flag 未获平台确认，本地判定**

（flag 已打码；`--show-flag` 输出原文。）

## 记录来源

- 对局目录：`.chain-run`
- `logs/events.jsonl`：7 条记录
- `state.json`：1 条题目记录
- 题目工作目录：`work/1/NOTES.md`

本文件由 `writeup.py` 从上述落盘记录生成；记录中没有的内容不写入。
