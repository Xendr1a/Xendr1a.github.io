---
title: 流量分析：从 pcap 里找答案
date: 2026-11-22 08:10:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [流量分析, 取证, MISC]
description: 流量分析的基本流程、常用过滤与取 flag 思路。
toc: true
---

按「先看协议 → 再追流 → 最后提取」的顺序整理 pcap 分析流程和常用过滤表达式。

## 流量分析

### Wireshark 常用查询命令

1. 基本过滤器

过滤 HTTP 状态码 200：

`http.response.code == 200`

过滤 HTTP GET 请求：

`http.request.method == "GET"`

1. IP 地址过滤

过滤特定源 IP 地址的流量：

`ip.src == 192.168.1.1`

过滤特定目标 IP 地址的流量：

`ip.dst == 192.168.1.1`

过滤特定源或目标 IP 地址的流量：

`ip.addr == 192.168.1.1`

1. 端口过滤

过滤特定源端口的流量：

`tcp.srcport == 80`

过滤特定目标端口的流量：

`tcp.dstport == 80`

过滤特定端口的流量（无论是源端口还是目标端口）：

`tcp.port == 80`

1. 协议过滤

过滤 HTTP 流量：

`http`

过滤 HTTPS 流量：

`ssl`

过滤 DNS 流量：

`dns`

1. 其他常用过滤器

过滤特定 MAC 地址的流量：

`eth.addr == 00:11:22:33:44:55`

过滤 TCP 重传：

`tcp.analysis.retransmission`

过滤 TCP 三次握手过程：

`tcp.flags.syn ** 1 &amp;&amp; tcp.flags.ack ** 0`

过滤 TCP 连接终止过程：

`tcp.flags.fin == 1`

1. 组合过滤器

过滤特定源 IP 和目标端口的流量：

`ip.src ** 192.168.1.1 &amp;&amp; tcp.dstport ** 80`

过滤 HTTP 200 响应的流量：

`http &amp;&amp; http.response.code == 200`

过滤 HTTP 200 服务器成功处理了请求：

`http contains "200"`
