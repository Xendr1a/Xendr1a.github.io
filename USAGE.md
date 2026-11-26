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

2026-11-26 重整后共 59 篇，按栏目分组：

| 栏目 | 内容 |
|------|------|
| Web 基础 | SQL 注入、SSTI、PHP 反序列化、文件包含、命令执行、PHP 特性、JWT、Java 反序列化、信息收集、AWD 等 14 篇合并稿 |
| CTF 题解 | 0xgame、newstar、ISCTF、LitCTF、TGCTF、轩辕杯、H&NCTF、GCTF、NSSCTF、CCB、NEPCTF、PolarisCTF、BUUCTF、ctfshow 系列等 |
| CVE 复现 | vsftpd、Laravel、Vite、ThinkPHP、Yii |
| 工具与运维 | 工具手册 5 篇、Volatility 2/3、Docker、Nmap、FTP |
| 漏洞修复 | 《漏洞修复速查手册》单篇合集（判据 → 修复 → 验收 → 补丁包） |

早期 12 篇保留原链接不删除，仅重整了 front-matter。

---

## 主题维护（柔和低对比度）

| 改什么 | 在哪里 |
|--------|--------|
| 主配色 / 字体 | `_config.fluid.yml` → `color`、`font` |
| 圆角、阴影、行距、标题字体 | `source/css/custom.css` |
| 代码块底色 / 角标 | `custom.css` 的 `figure.highlight`；角标由 `code.language.enable` 控制 |

当前方案：暖纸白 `#f3f0ea` + 雾灰蓝导航 `#8a949b`，正文 `#555b61`，链接 `#6f8494`，暗色 `#1f2328`。文章标题恢复显示（Fluid 默认仅打印可见），代码块不显示语言角标，避免裸代码块被错误识别。

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
