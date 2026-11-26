---
title: FTP 常用命令
date: 2026-11-18 12:00:00
author: Xendr1a
categories: [工具与运维]
tags: [FTP, 运维]
description: FTP 常用命令，按用途与常用参数整理。
toc: true
---

## 常用 FTP

## 

常用 FTP 下载命令主要分为 **命令行 FTP 客户端** 和 **Linux 常用工具（wget/curl/lftp）**。下面整理一些最常用的。

---

### 1. 登录 FTP

```text
ftp 服务器地址
```

示例：

```text
ftp 192.168.1.100
```

输入：

```text
Name: username
Password: password
```

登录成功后进入 FTP 命令环境。

---

## 2. FTP 常用下载命令

### （1）查看服务器文件

#### 查看当前目录

```text
pwd
```

#### 查看文件列表

```text
ls
```

或者：

```text
dir
```

---

### （2）切换目录

进入服务器目录：

```text
cd 目录名
```

例如：

```text
cd /pub/files
```

查看本地目录：

```text
lcd 本地目录
```

例如：

```text
lcd D:\download
```

---

## 3. 下载单个文件

### get 命令

格式：

```text
get 文件名
```

示例：

```text
get test.zip
```

下载后保存到本地当前目录。

---

### 指定本地文件名

格式：

```text
get 服务器文件名 本地文件名
```

例如：

```text
get linux.iso linux_backup.iso
```

---

## 4. 批量下载文件

### mget 命令

下载多个文件：

```text
mget 文件名
```

例如：

```text
mget *.zip
```

下载所有 zip 文件。

如果不想每个文件确认：

```text
prompt
```

关闭交互确认：

```text
prompt off
```

然后：

```text
mget *
```

---

## 5. 上传文件（补充）

上传单个文件：

```text
put 文件名
```

例如：

```text
put test.txt
```

批量上传：

```text
mput *.txt
```

---

## 6. 设置二进制下载模式（重要）

下载压缩包、程序、镜像等必须：

```text
binary
```

或者：

```text
bin
```

否则可能导致文件损坏。

文本文件：

```text
ascii
```

---

## 7. 断点续传

使用：

```text
reget 文件名
```

例如：

```text
reget bigfile.iso
```

继续下载未完成文件。

---

## 8. 退出 FTP

```text
bye
```

或者：

```text
quit
```

---

## 9. Linux 下更常用的 FTP 下载方式

### wget 下载 FTP 文件

格式：

```text
wget ftp://用户名:密码@服务器地址/文件路径
```

示例：

```text
wget ftp://user:123456@192.168.1.100/test.zip
```

匿名 FTP：

```text
wget ftp://192.168.1.100/test.zip
```

---

### curl 下载 FTP

```text
curl -u 用户名:密码 -O ftp://服务器/文件
```

示例：

```text
curl -u admin:123456 -O ftp://192.168.1.100/a.zip
```

---

### lftp（功能更强）

登录：

```text
lftp ftp://user:password@server
```

下载：

```text
get filename
```

批量：

```text
mget *.zip
```

镜像下载整个目录：

```text
mirror /remote/path /local/path
```

---

## 10. FTP 常用命令速查表

| 命令 | 功能 |
| --- | --- |
| `open` | 连接 FTP 服务器 |
| `user` | 输入用户名 |
| `pwd` | 查看服务器当前目录 |
| `ls` | 查看文件 |
| `cd` | 切换服务器目录 |
| `lcd` | 切换本地目录 |
| `get` | 下载单个文件 |
| `mget` | 批量下载 |
| `reget` | 断点续传 |
| `put` | 上传文件 |
| `mput` | 批量上传 |
| `binary` | 二进制模式 |
| `ascii` | 文本模式 |
| `delete` | 删除服务器文件 |
| `mkdir` | 创建目录 |
| `rmdir` | 删除目录 |
| `bye` | 退出 |
