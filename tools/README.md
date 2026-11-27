# tools

辅助脚本，不属于 Hexo 站点配置。

| 工具 | 作用 |
| --- | --- |
| `blog.py` | 写作流水线：`new` 建草稿、`preview` 本地预览、`publish` 提交并推送 |
| `cnblogs/` | 博客园单向同步（GitHub Actions 使用，见 `cnblogs/README.md`） |

## 写作流水线 `blog.py`

只依赖 Python 3 标准库；`preview` 需要仓库根目录已执行 `npm install`。

```sh
# 1. 新建草稿：source/_posts/<标题>.md
python3 tools/blog.py new "NEPCTF 2026 Web 题解"

# 2. 本地预览 http://localhost:4000/
python3 tools/blog.py preview
python3 tools/blog.py preview --port 4001
python3 tools/blog.py preview -- --log       # 额外参数原样传给 hexo server

# 3. 提交并推送
python3 tools/blog.py publish                # 默认提交说明取文章标题
python3 tools/blog.py publish -m "post: xxx"
python3 tools/blog.py publish --dry-run      # 只看会提交/推送什么
python3 tools/blog.py publish --no-push      # 只提交，不推送
```

`new` 生成的 front-matter 与现有文章一致：

```yaml
---
title: 标题
date: 2026-11-27 23:59:00
author: Xendr1a
categories: []
tags: []
description: ''
toc: true
---
```

标题中的空白转成 `-`，非法文件名字符会被删除。同名文件已存在时追加 `-2`、`-3`，
不会覆盖。`date` 取当前时间（Asia/Shanghai）；文章排序由 front-matter 的 `date`
决定，文件名不带日期前缀。

`publish` 的行为与边界：

- 只 `git add` / `commit` `source/_posts` 与 `source/img`，不会带上其他改动。
- 当前分支必须与 `--branch`（默认 `source`）一致，否则中止；它不会把功能分支内容
  直接推上 source。
- 提交前检查改动文章的 front-matter 必须有 `title` 和 `date`，缺失则中止。
- `git push origin HEAD:source` 失败（例如远端有新提交）时直接报错，需手动
  `git pull --rebase` 后重跑；不自动 rebase。
- **不直接调用博客园**。push 到 `source` 会触发 `.github/workflows/cnblogs-sync.yml`
  （`push --new-only`），由 Actions 单向同步新文章；不要绕过它手工改博客园正文，
  否则下一次同步会以仓库为准覆盖。

## 博客园同步

见 [`cnblogs/README.md`](cnblogs/README.md)。本目录没有改动该工具的行为。
