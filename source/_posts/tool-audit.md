---
title: 工具手册：源码审计与修复流水线
date: 2026-11-20 09:04:00
author: Xendr1a
categories: [工具与运维]
tags: [工具, 代码审计]
description: 工具手册：源码审计与修复流水线，按用途与常用参数整理。
toc: true
---

## 04 源码审计与修复流水线

> 顺序：`audit.sh` 摸底 → 逐条核汇聚点 → 按 01 SQL注入 起的一组速查改代码 → `php -l` 闸门 → `curl` 验业务 → `mkpatch.sh` 打包 → 平台 check。

### semgrep（1.186.0）— 多语言污点分析

**作用**：把「用户输入 → 危险函数」的链路自动标出来，带规则名和修复建议。这是源码审计的主力。

```bash
# 单语言（联网跑 registry 规则）
semgrep --config p/php ./src
# 本地规则包（断网可用，赛场必用这个）
R=~/ctf/省赛/rules
semgrep --config "$R/php.yaml" --config "$R/secrets.yaml" --metrics=off ./src
# 一次挂多包
semgrep --config "$R/php.yaml" --config "$R/java.yaml" --config "$R/python.yaml" \
        --config "$R/security-audit.yaml" --metrics=off --quiet ./src
# 只要 JSON（做统计/存档）
semgrep --config "$R/php.yaml" --json --metrics=off ./src | jq -r '.results[] | "\(.path):\(.start.line) \(.check_id)"'
# 单条规则试跑（不用装规则包）
semgrep -l php -e 'eval(...)' ./src
```

**输出怎么读**：`❯❯❱ 规则id` + `Details: https://sg.run/xxxx` + 命中行（`❰❰ Blocking ❱❱` 是高置信）。`Code Findings` 数量就是待处理项数。
**离线规则包**（`~/ctf/省赛/rules/`，1.9M）：php 24 / java 60 / python 151 / javascript 74 / secrets 52 / security-audit 225 / sql-injection 47 / xss 35 / command-injection 30。
坑：`p/xxx` 每次都要联网拉规则（没有可用缓存）；`--config` 可重复；误报率高，看 `Blocking` 优先。

### bandit（1.9.4）— Python 专项

```bash
bandit -r ./src -ll -q                     # 只看 medium/high
bandit -r ./src -f json -o bandit.json
bandit -r ./src -s B101,B404               # 跳过指定规则
bandit file.py -ll
```

规则号对应：`B602` shell=True、`B301` pickle、`B307` eval、`B506` yaml.load、`B324` 弱 hash。

### gitleaks（8.30.1）— 硬编码密钥

```bash
gitleaks dir ./src --no-banner -v            # 扫目录（无需 git 历史）
gitleaks dir ./src --no-banner --redact=0 -f json -o secrets.json
gitleaks detect --source ./repo --no-banner   # 有 .git 时扫历史
```

规则内置（AWS/GitHub/私钥/JWT/数据库串…），**完全离线**。输出 `WRN leaks found: 1` + `RuleID/File/Secret`。

### composer audit / npm audit — 依赖 CVE

```bash
composer audit                    # PHP（需 vendor/composer.lock + 网络）
composer show -i                  # 没网时看版本，自己对 CVE 表
npm audit --json                  # Node
```

### audit.sh（我自己写的编排脚本）

**作用**：一次把「部署形态 + 入口 + flag + 备份残留 + 四语言危险汇聚点 + semgrep + gitleaks + 后门残留」全打出来，日志落 `~/ctf/省赛/evidence/`。

```bash
~/ctf/省赛/tools/audit.sh ./src                 # 名字默认取目录名
~/ctf/省赛/tools/audit.sh ./src web1
cat ~/ctf/省赛/evidence/web1.audit.txt
```

会优先用本地规则包（无网也能跑）。输出九节：0 概况 / 1 部署与入口 / 2 flag 与敏感文件 / 3 PHP 汇聚点 / 4 Java / 5 Python+Node / 6 鉴权与路由 / 7 semgrep / 8 gitleaks / 9 后门残留。

### mkpatch.sh（修补包流水线）

> 包结构为什么不能多套一层、错误示范与自检输出：见 **11 补丁包结构**。

**作用**：把改过的文件打成平台要求的 `xxxx.tar.gz`，带语法闸门和结构校验。

```bash
cp -a ./src ./src.baseline                                     # 动手前先备份基线
./tools/mkpatch.sh ./src web1                                   # 全量打
./tools/mkpatch.sh ./src web1 -d ./src.baseline                  # 只打改动文件（推荐）
./tools/mkpatch.sh ./src web1 -p var/www/html                    # 平台解包到 / 时加前缀
./tools/mkpatch.sh ./src web1 -u 33:33                           # 属主 www-data
./tools/mkpatch.sh --check ./dist/web1.tar.gz                    # 上传前复核结构/文件数/sha256
./tools/mkpatch.sh ./src web1 -n                                 # dry-run 只列文件
```

内置：排除 `.git/__pycache__/*.bak/*.swp/旧tar.gz/*.sha256`、`php -l` 语法闸门（坏语法直接中止，`-f` 强制）、包内路径不得含绝对路径或 `..`、属主归一 `0:0`。
坑：包内**不套多余顶层目录**（多套一层＝平台解包错位＝check 失败）。

### 手工兜底命令（脚本不好用时）

```bash
php -l x.php ; php81 -l x.php                    # 老代码用老版本查
python3 -m py_compile x.py
node --check x.js
bash -n x.sh
# 打最小包（保留相对路径，不套目录）
tar -czf patch.tar.gz -C ./src . --owner=0 --group=0 --numeric-owner \
    --exclude='.git' --exclude='__pycache__' --exclude='*.bak' --exclude='*.tar.gz'
tar -tzf patch.tar.gz | head                                   # 确认结构
```

### 修复后必测（否则 checker 全红）

```bash
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' http://127.0.0.1:8080/       # 首页仍 200
curl -s "http://127.0.0.1:8080/原正常接口" | head -c 300                                # 字段结构没变
curl -s "http://127.0.0.1:8080/x?id=1%20and%201=1"                                      # 攻击 payload 失效
# 重启对应服务（不重启＝没修）
systemctl reload php-fpm 2>/dev/null || kill -USR2 $(pgrep -f php-fpm | head -1)
pm2 restart app ; systemctl restart myapp ; docker restart <cid>
```

### SonarLint（VSCode 内）

**作用**：边写边标问题（空指针、资源泄漏、危险 API）。打开项目即生效，问题面板 `Ctrl+Shift+M`。
PHP/Java/Python/JS 都支持；不需要联网。
