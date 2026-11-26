---
title: Nmap 使用笔记
date: 2026-11-18 11:00:00
author: Xendr1a
categories: [工具与运维]
tags: [Nmap, 扫描]
description: Nmap 使用笔记，按用途与常用参数整理。
toc: true
---

## nmap

## 一、目标指定参数

| 参数 | 作用 | 示例 |
| --- | --- | --- |
| `IP` | 扫描单个目标 | `nmap 192.168.1.1` |
| `IP1 IP2` | 多目标 | `nmap 192.168.1.1 192.168.1.2` |
| `范围` | IP范围 | `nmap 192.168.1.1-100` |
| `网段` | CIDR扫描 | `nmap 192.168.1.0/24` |
| `-iL` | 从文件读取目标 | `nmap -iL ip.txt` |
| `-iR` | 随机扫描目标 | `nmap -iR 100` |
| `--exclude` | 排除目标 | `nmap --exclude 192.168.1.5` |
| `--excludefile` | 从文件排除 | `--excludefile exclude.txt` |

---

## 二、主机发现参数

### Ping探测

| 参数 | 功能 |
| --- | --- |
| `-sL` | 列出目标，不扫描 |
| `-sn` | Ping扫描，只发现主机 |
| `-Pn` | 跳过主机发现，直接扫描 |
| `-PS` | TCP SYN Ping |
| `-PA` | TCP ACK Ping |
| `-PU` | UDP Ping |
| `-PE` | ICMP Echo Ping |
| `-PP` | ICMP Timestamp Ping |
| `-PM` | ICMP Address Mask Ping |
| `-PR` | ARP Ping |

例如：

```text
nmap -sn 192.168.1.0/24
```

---

## 三、端口扫描模式

### TCP扫描

| 参数 | 说明 |
| --- | --- |
| `-sS` | TCP SYN 半连接扫描 ⭐ |
| `-sT` | TCP Connect扫描 |
| `-sA` | TCP ACK扫描（判断防火墙） |
| `-sW` | TCP Window扫描 |
| `-sM` | TCP Maimon扫描 |

---

### UDP扫描

| 参数 | 说明 |
| --- | --- |
| `-sU` | UDP扫描 |
| `-sV` | UDP服务识别 |

例如：

```text
nmap -sU -p 53,161 192.168.1.1
```

---

### 特殊扫描

| 参数 | 说明 |
| --- | --- |
| `-sN` | Null扫描 |
| `-sF` | FIN扫描 |
| `-sX` | Xmas Tree扫描 |

例如：

```text
nmap -sX IP
```

主要用于研究防火墙行为。

---

## 四、端口选择参数

| 参数 | 作用 |
| --- | --- |
| `-p 80` | 扫80端口 |
| `-p 22,80,443` | 多端口 |
| `-p 1-1000` | 范围端口 |
| `-p-` | 全65535端口 |
| `-F` | 快速扫描 |
| `--top-ports 100` | 扫最常见100端口 |
| `-p http,https` | 按服务名扫描 |

例如：

```text
nmap --top-ports 50 IP
```

---

## 五、服务识别

| 参数 | 功能 |
| --- | --- |
| `-sV` | 服务版本检测 |
| `--version-intensity 0-9` | 版本探测强度 |
| `--version-light` | 轻量版本扫描 |
| `--version-all` | 全版本探测 |
| `--version-trace` | 查看版本探测过程 |

例如：

```text
nmap -sV --version-intensity 9 IP
```

---

## 六、操作系统识别

| 参数 | 功能 |
| --- | --- |
| `-O` | OS检测 |
| `--osscan-limit` | 限制OS扫描 |
| `--osscan-guess` | 猜测系统 |

例如：

```text
nmap -O IP
```

---

## 七、NSE脚本系统（重点）

Nmap Script Engine

### 查看脚本

```text
ls /usr/share/nmap/scripts/
```

---

### 默认脚本

```text
nmap -sC IP
```

---

### 漏洞扫描

```text
nmap --script vuln IP
```

---

### 分类扫描

格式：

```text
--script 类别
```

类别：

| 类别 | 作用 |
| --- | --- |
| auth | 认证检测 |
| broadcast | 广播发现 |
| brute | 暴力破解 |
| default | 默认脚本 |
| discovery | 信息发现 |
| dos | 拒绝服务 |
| exploit | 漏洞利用 |
| external | 外部脚本 |
| fuzzer | 模糊测试 |
| intrusive | 侵入式 |
| malware | 恶意软件检测 |
| safe | 安全脚本 |
| version | 版本检测 |
| vuln | 漏洞检测 |

例如：

```text
nmap --script smb-vuln* IP
```

---

## 八、输出参数

| 参数 | 说明 |
| --- | --- |
| `-oN` | 普通文本 |
| `-oX` | XML |
| `-oG` | Grep格式 |
| `-oA` | 全格式 |

示例：

```text
nmap -oA result IP
```

---

## 九、扫描速度参数

### 时间模板

| 参数 | 速度 |
| --- | --- |
| `-T0` | 极慢 |
| `-T1` | 隐蔽 |
| `-T2` | 慢 |
| `-T3` | 默认 |
| `-T4` | 快速 |
| `-T5` | 极快 |

---

### 并发控制

| 参数 | 作用 |
| --- | --- |
| `--min-hostgroup` | 最小主机组 |
| `--max-hostgroup` | 最大主机组 |
| `--min-parallelism` | 最小并发 |
| `--max-parallelism` | 最大并发 |
| `--min-rate` | 最低发包速度 |
| `--max-rate` | 最高发包速度 |

例如：

```text
nmap --min-rate 1000 IP
```

---

## 十、防火墙/IDS绕过参数

| 参数 | 功能 |
| --- | --- |
| `-f` | IP分片 |
| `--mtu` | 指定分片大小 |
| `-D` | 诱饵扫描 |
| `-S` | 伪造源地址 |
| `--source-port` | 指定源端口 |
| `--data-length` | 增加数据长度 |
| `--randomize-hosts` | 随机扫描顺序 |
| `--spoof-mac` | MAC伪装 |

---

## 十一、网络信息收集

| 参数 | 功能 |
| --- | --- |
| `--traceroute` | 路由追踪 |
| `-R` | DNS解析 |
| `-n` | 不解析DNS |
| `-sL` | DNS列表扫描 |

例如：

```text
nmap --traceroute IP
```

---

## 十二、IPv6相关

| 参数 | 作用 |
| --- | --- |
| `-6` | IPv6扫描 |

例如：

```text
nmap -6 fe80::1
```

---

## 十三、常用组合（建议记）

### 1. 快速发现内网主机

```text
nmap -sn 192.168.1.0/24
```

---

### 2. CTF第一轮信息收集 ⭐⭐⭐

```text
nmap -sS -sV -p- IP
```

---

### 3. 完整扫描 ⭐⭐⭐

```text
nmap -A -p- IP
```

---

### 4. 漏洞探测

```text
nmap -sV --script vuln IP
```

---

### 5. UDP重点端口

```text
nmap -sU --top-ports 100 IP
```

---

### 6. 绕过Ping限制

```text
nmap -Pn -sV IP
```
