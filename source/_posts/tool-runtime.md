---
title: 工具手册：运行时与开发环境
date: 2026-11-20 09:01:00
author: Xendr1a
categories: [工具与运维]
tags: [工具, 环境]
description: 工具手册：运行时与开发环境，按用途与常用参数整理。
toc: true
---

## 01 运行时与开发环境

### PHP（static 版，三套并存）

**作用**：跑 PHP 代码、语法检查、本地起站点复现漏洞。`~/opt/php/php-8.x`，软链在 `~/.local/bin`。**自带 pdo_mysql·pdo_sqlite·sqlite3·curl·gd·zip·mbstring·openssl·sockets，但没有 mysqli**。

```bash
php -v                        # 8.3.32（默认）
php82 -v ; php81 -v           # 按题目版本切（老代码用 8.1 更贴近线上）
php -l 修改过的.php           # 语法检查（只查语法，不执行）；rc=255 就是有错
php -m | grep -i mysql        # 看扩展（pdo_mysql 有，mysqli 没有）
php -S 127.0.0.1:18080 -t ./src        # 本地起站点（单进程，够复现）
php -S 0.0.0.0:18080 -t ./src 2>&1 | tee srv.log
php -r 'echo phpversion();'
php script.php arg1           # 跑脚本
php -d display_errors=1 -d error_reporting=E_ALL t.php   # 打开全部报错
```

- **跑 mysqli 代码**：`docker run --rm -v $PWD:/app -w /app php:8.3-cli php -f x.php`（镜像本机已有）
- 起站后要测 `.htaccess`/`.user.ini` 行为：`php -S` 不支持，只能线上验。
- 输出 `No syntax errors detected` 才是绿；`Parse error` 会指出行号。

### Python（系统 + web venv）

**作用**：写利用脚本、跑现成工具。系统 `python3` 无 pip（PEP 668），所有第三方库装在 `~/opt/webvenv`，用 `pyweb` 调。

```bash
python3 -V                     # 3.14.10
pyweb -c "import requests; print(requests.__version__)"   # 2.34.2
pyweb exp.py                   # 用装了 requests/bs4/pymysql 的解释器跑脚本
pyweb -m http.server 8080      # 起个静态文件服务（传马/传 payload 用）
python3 -m py_compile x.py     # 语法检查
uv pip install --python ~/opt/webvenv/bin/python <包>      # 装包（别用 pip，本机没有）
uv tool install <cli工具>       # 装命令行工具（semgrep/dirsearch/bandit/fenjing 都这么来的）
```

已装库：`requests` `beautifulsoup4` `lxml` `pyjwt` `flask` `httpx` `rich` `pycryptodome` `pymysql` `redis` `urllib3` `ratelimit` `termcolor` `pycryptodomex`。

### Java（JRE27 + JDK17 + JDK8）

**作用**：跑 Burp（需 JRE）、编译 payload、跑 ysoserial/jadx。`javac` 是包装脚本指向 JDK17，`java` 仍是系统 JRE27。

```bash
java -version                  # 27.0.1.1（Burp 靠它）
javac -version                 # 17.0.21（编译）
javac -cp lib.jar Evil.java -d out      # 编译（注意 -cp 与 -d）
java -cp out:lib.jar Evil                # 跑
jar cf x.jar -C out .                    # 打包
javap -p -c out/Evil.class               # 反汇编看字节码
java17 -version ; java8 -version         # 指定版本跑（ysoserial 必须 java8）
java8 -jar ~/ctf/tools/ysoserial-all.jar CC5 'id'
```

- **别 `export JAVA_HOME=<jdk17>`**：`/usr/bin/burpsuite` 内部走 `$JAVA_HOME/bin/java`，换了 Burp 起不来。

### Node / Go

```bash
node -v ; npm -v               # 26.13.1 / 12.2.3
node --check x.js              # 语法检查
node -e "console.log(1+1)"
npm i express ; npx http-server . -p 8080
npm audit                      # 依赖 CVE（需网络）

go version                     # 1.27.4
GOBIN=~/.local/bin GOPROXY=https://goproxy.cn,direct go install github.com/xxx/yyy@latest
```

### Composer（PHP 依赖/工具）

**作用**：装 phpstan、跑 `composer audit`。走 static php 8.3。

```bash
composer --version             # 2.11.2
composer install               # 按 lock 装依赖
composer require --dev phpstan/phpstan
./vendor/bin/phpstan analyse src --level 5        # PHP 静态分析
composer audit                 # 依赖 CVE（需网络）
composer show -i               # 已装包与版本（判 CVE 用）
```

### VSCode（1.147，20 扩展）

```bash
code .                         # 打开当前目录
code --list-extensions
code --install-extension bmewburn.vscode-intelephense-client
```

已配：`php.validate.executablePath=~/.local/bin/php`、`java.jdt.ls.java.home=~/opt/jdk/jdk-17.0.21+9`、`.php/.phtml/.inc/.user.ini` 文件关联。
审计相关扩展：intelephense（跳转/补全）、xdebug.php-debug（断点）、SonarLint（实时问题）、REST Client（`.http` 文件发请求）、SQLTools+MySQL、Error Lens。

- `.http` 文件写法（REST Client 直接点 Send）：
  ```http
  ### 测试注入
  GET http://HOST/index.php?id=1%20and%201=1 HTTP/1.1
  Cookie: PHPSESSID=xxx
  ```

### Docker（daemon 已 active，无 compose 插件）

```bash
docker ps -a
docker images                  # ctf-toolbox:latest / :extras / php:8.3-cli / jwt_hub / debian:stable-slim
docker run --rm -it php:8.3-cli bash
docker run --rm -v $PWD:/app -w /app php:8.3-cli php -f test.php
docker run -it --rm mariadb:11 mariadb -h DB_HOST -u root -p     # 没有 mysql 客户端时这么连库
docker cp <cid>:/var/www/html ./src                              # 把容器里的源码拷出来审
docker exec -it <cid> bash ; docker logs -f <cid>
docker save <image> -o x.tar && mkdir x && tar xf x.tar -C x     # 拆镜像看层（题目给 tar 时）
```

### 自制的 CTF 沙箱/容器三件套

| 命令 | 作用 |
|---|---|
| `ctfbox <cmd>` | 在 `ctf-toolbox` 容器里跑任意工具，当前目录挂 `/work`，`--network host`；不接参数进交互 shell |
| `ctfroot <cmd>` | 不进 docker，直接在宿主终端用镜像 rootfs 里的工具（如容器版 python3 + pwntools/z3） |
| `ctfrun <样本>` | 用 firejail 沙箱跑当前目录样本（先 `chmod +x`） |
| `ctfdbg <样本>` | firejail + pwndbg 调试样本 |

```bash
ctfbox nmap -sV 10.1.1.5
ctfroot python3 exp.py
ctfrun ./chall
ctfdbg ./chall
```

### Git（提交东西/看历史）

```bash
git status -sb ; git log --oneline -10 ; git diff ; git stash
git clone --depth 1 <url> ~/ctf/tools/xxx
```

### 桌面小工具（顺手）

`text-open <文件>`（alacritty+nvim 打开文本）、`screenshot-annotate`（区域截图→satty 标注→剪贴板）、`ocr-region`（区域截图→tesseract 中英 OCR→剪贴板）、`tesseract img.png - -l chi_sim+eng`、`magick input.png -resize 200% out.png`、`convert`（ImageMagick 老名字）。
