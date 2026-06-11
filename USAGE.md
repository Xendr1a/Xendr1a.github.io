# Xendr1a's Blog 使用文档

基于 [Hexo](https://hexo.io/zh-cn/) + [Fluid](https://fluid.ist/) 主题的 CTF Writeup 博客。

---

## 快速开始

```bash
git clone -b source https://github.com/Xendr1a/Xendr1a.github.io.git blog
cd blog
npm install
npx hexo server      # → http://localhost:4000
```

---

## 写文章

```bash
npx hexo new post "文章标题"
# 生成 source/_posts/文章标题.md
```

Front-matter 模板：

```yaml
---
title: 文章标题
date: 2026-06-11 17:00:00
author: Xendr1a
categories: [CTF, Web]
tags: [Writeup, SQL注入]
---
```

代码块：

````markdown
```php
<?php echo "Hello"; ?>
```
```python
print("Hello")
```
````

---

## 从思源导入

### zip 导出（推荐）

思源右键 → 导出 → Markdown zip → 放到博客根目录 → 运行：

```bash
node _import_sy.js
npx hexo clean && npx hexo generate && npx hexo deploy
```

### 文件夹导出

放到 `xendria_hexo_markdown/` → 运行：

```bash
node convert.js      # WordPress块 → Markdown
node fix_raw.js      # 修复 Nunjucks 转义
node fix_images.js   # 修复图片文件名
```

---

## 部署

```bash
# 一键
npx hexo clean && npx hexo generate && npx hexo deploy

# 如网络超时，手动推送部署
cd .deploy_git
git push https://github.com/Xendr1a/Xendr1a.github.io.git master:main

# 推送源码
cd .. && git add -A && git commit -m "msg" && git push origin main:source
```

> **分支**：`source` = 源码，`main` = GitHub Pages 站点

---

## 配置文件

| 文件 | 用途 | 注释 |
|------|------|------|
| `_config.yml` | 站点名、URL、部署 | ✅ 中文 |
| `_config.fluid.yml` | 主题外观、功能 | ✅ 中文 |

### 常用修改速查

| 改什么 | 在哪里 |
|--------|--------|
| 站点标题 | `_config.yml` → `title` |
| 副标题 | `_config.fluid.yml` → `subtitle` |
| 头像 | 图片 `source/img/my-avatar.png`；配置 `about.avatar` |
| 标签页图标 | `favicon: /img/my-avatar.png` |
| 背景头图 | 图片 `source/img/default.jpg`（182KB）；配置 `banner_img` |
| 导航菜单 | `navbar.menu` |
| 暗色模式 | `dark_mode.enable` |

---

## 图片说明

| 用途 | 路径 | 备注 |
|------|------|------|
| 头像 | `source/img/my-avatar.png` | 改名避免主题覆盖 |
| 背景 | `source/img/default.jpg` | 原 4MB → 压缩 182KB |
| 文章图片 | `source/img/<文章名>/` | `![](/img/<文章名>/xxx.png)` |

> 懒加载已禁用（`lazyload.enable: false`），因与 Fluid 存在兼容问题。

---

## 当前文章

| 文章 | 日期 |
|------|------|
| 菜狗杯ctfshow web | 2024-01-20 |
| 轩辕杯-云盾砺剑CTF挑战赛 | 2025-05-21 |
| TGCTF 2025 web | 2025-06-01 |
| 2025H&NCTF web | 2025-06-09 |
| LitCTF2025 | 2025-08-30 |
| 0xgame2025 week1~3 | 2025-10 |
| newstar2025 week1 | 2025-10-15 |
| ISCTF web | 2025-12-04 |
| PHP反序列化魔术方法 | 2025-09-02 |
| pearcmd.php利用 | 2025-11-23 |

---

## 常见问题

| 问题 | 解决 |
|------|------|
| 部署没更新 | `hexo clean && hexo g && hexo d` |
| GitHub 推送超时 | 多试几次或换热点 |
| 头像不显示 | 确认文件名为 `my-avatar.png` |
| 图片不显示 | 确认路径 `/img/...`、懒加载已关 |
| 代码没高亮 | 用 ` ```语言 ` 包裹 |

## 链接

- [Hexo 文档](https://hexo.io/zh-cn/docs/)
- [Fluid 配置指南](https://fluid.ist/docs/guide/)
- [Markdown 语法](https://markdown.com.cn/)
