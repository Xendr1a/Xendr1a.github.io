---
title: ChainDemo 2026 chainmisc writeup
date: 2026-11-28 10:42:55
author: Xendr1a
categories: [CTF题解, ChainDemo 2026]
tags: [ChainDemo 2026, Writeup]
description: 由对局记录导出：1 道题，平台确认 0 道。
toc: true
---

## 摘要

- 赛事：ChainDemo 2026
- 记录时间：2026-11-28 10:42:55 至 2026-11-28 10:42:55
- 题目：1 道
- 平台确认：0 道
- state.json 状态：done 1
- worker 轮次：2 条记录，合计 0 秒

## 时间线

- `2026-11-28 10:42:55` 发现 c1《chainmisc》（Misc，1000 分）
- `2026-11-28 10:42:55` c1 第 1 轮启动（chain-demo，时限 180s）
- `2026-11-28 10:42:55` c1 本轮失败（chain-demo，0.0s，rc=1，超时=否）
- `2026-11-28 10:42:55` c1 第 2 轮启动（chain-demo，时限 180s）
- `2026-11-28 10:42:55` c1 本轮产出 FLAG.txt（0.0s）

## 试错与回滚

### 失败与未获判定

- `2026-11-28 10:42:55` c1 本轮失败（chain-demo，0.0s，rc=1，超时=否）
- c1《chainmisc》，state.json 记录 2 次尝试，当前状态 done

### NOTES.md 记录的排除方向与卡点

**c1 `work/1/NOTES.md`**
- 已排除方向：
  - 命令：`printf "%s\n" 344bab80 | nc -N -w 5 127.0.0.1 "$HOST_PORT"`
  - 错误参数：`HOST_PORT=57217`，端口是故意挑的关闭端口，不是映射的 43159
  - 真实输出（rc=1）：（无输出）
  - 结论：参数写错时服务没有任何回应；重跑必须用本步打印的映射端口，不要凭记忆填端口。

## flag

- c1《chainmisc》：`flag{***}` **flag 未获平台确认，本地判定**

（flag 已打码；`--show-flag` 输出原文。）

## 记录来源

- 对局目录：`.chain-run`
- `logs/events.jsonl`：5 条记录
- `state.json`：1 条题目记录
- 题目工作目录：`work/1/NOTES.md`

本文件由 `writeup.py` 从上述落盘记录生成；记录中没有的内容不写入。
