# Xendr1a's Blog 使用文档

基于 [Hexo](https://hexo.io/zh-cn/) + [Fluid](https://fluid.ist/) 主题的个人博客。

---

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [写文章](#写文章)
- [本地预览](#本地预览)
- [部署上线](#部署上线)
- [主题配置](#主题配置)
- [页面管理](#页面管理)
- [评论系统](#评论系统)
- [搜索功能](#搜索功能)
- [常见问题](#常见问题)

---

## 环境要求

- **Node.js** ≥ 18.x（当前 v22.14.0）
- **npm** ≥ 9.x（当前 10.9.2）
- **Git**

---

## 快速开始

```bash
# 1. 克隆源码（首次使用）
git clone -b source https://github.com/Xendr1a/Xendr1a.github.io.git blog
cd blog

# 2. 安装依赖
npm install

# 3. 本地预览
npx hexo server
```

打开浏览器访问 [http://localhost:4000](http://localhost:4000)

---

## 写文章

### 创建新文章

```bash
npx hexo new post "我的文章标题"
```

这会在 `source/_posts/` 下生成 `我的文章标题.md`。

### 文章 Front-matter 示例

```yaml
---
title: 我的文章标题
date: 2026-06-11 17:00:00
categories:
  - 技术
tags:
  - Hexo
  - 博客
index_img: /img/default.png     # 首页封面图（可选）
banner_img: /img/default.png    # 文章页头图（可选）
sticky: 1                       # 置顶，数字越大越靠前（可选）
math: false                     # 是否启用数学公式（可选）
mermaid: false                  # 是否启用流程图（可选）
comments: true                  # 是否启用评论（可选）
---

正文内容（Markdown 格式）...
```

### Markdown 常用语法

```markdown
## 二级标题

**粗体** *斜体* ~~删除线~~

- 无序列表
- 无序列表

1. 有序列表
2. 有序列表

> 引用文字

[链接](https://example.com)
![图片](https://example.com/img.png)

`行内代码`

​```python
# 代码块
print("Hello World")
​```
```

---

## 本地预览

```bash
# 启动本地服务器（支持热更新）
npx hexo server

# 指定端口
npx hexo server -p 5000

# 预览草稿
npx hexo server --draft
```

---

## 部署上线

### 一键部署

```bash
# 清理缓存 → 生成静态文件 → 部署到 GitHub Pages
npx hexo clean && npx hexo generate && npx hexo deploy
```

部署会将 `public/` 目录推送到 GitHub 的 `main` 分支，GitHub Pages 会自动更新。

### 推送源码

```bash
git add -A
git commit -m "描述你的变更"
git push origin main:source
```

> ⚠️ **分支说明**：
> - `source` 分支 → 存放 Hexo 源码
> - `main` 分支 → GitHub Pages 展示的静态站点

---

## 主题配置

### 主配置文件

| 文件 | 说明 |
|------|------|
| `_config.yml` | Hexo 全局配置（站点名、URL、部署等） |
| `_config.fluid.yml` | Fluid 主题配置（外观、功能、插件等） |

### 常用主题设置

所有主题配置都在 `_config.fluid.yml` 中，修改后重新生成即可生效。

| 设置项 | 位置 | 说明 |
|--------|------|------|
| 博客标题 | `navbar.blog_title` | 导航栏显示的名称 |
| 首页标语 | `index.slogan.text` | 首页大标题下的副标题 |
| 关于页信息 | `about.name` / `about.intro` | 关于页的名称和简介 |
| 导航菜单 | `navbar.menu` | 增减导航栏菜单项 |
| 暗色模式 | `dark_mode.enable` | 开启/关闭暗色模式 |
| 文章搜索 | `search.enable` | 开启/关闭本地搜索 |
| 代码高亮 | `code.lib` | highlightjs / prismjs |
| 评论插件 | `post.comments.type` | disqus / gitalk / valine / waline 等 |
| 访问统计 | `web_analytics` | 百度统计 / Google Analytics 等 |
| 友链 | `links.items` | 友链列表 |

详细配置参考：[Fluid 配置指南](https://fluid.ist/docs/guide/)

---

## 页面管理

### 创建新页面

```bash
npx hexo new page "页面名称"
```

在生成的 `source/页面名称/index.md` 中设置 `layout`。

### 已有页面

| 页面 | 路径 | layout |
|------|------|--------|
| 首页 | `/` | index |
| 归档 | `/archives/` | 自动生成 |
| 分类 | `/categories/` | 自动生成 |
| 标签 | `/tags/` | 自动生成 |
| 关于 | `/about/` | `about` |
| 友链 | `/links/` | `links` |
| 404 | `/404.html` | 自动生成 |

---

## 评论系统

Fluid 支持多种评论插件，在 `_config.fluid.yml` 中配置：

```yaml
post:
  comments:
    enable: true      # 开启评论
    type: giscus      # 选择评论插件
```

可选插件：`disqus` | `gitalk` | `valine` | `waline` | `twikoo` | `giscus` | `utterances`

每种插件需要在对应配置块中填入必要参数。

---

## 搜索功能

已集成 **本地搜索**，基于 `hexo-generator-search` 插件。

```bash
# 搜索索引会在 hexo generate 时自动生成
npx hexo generate
```

在 `_config.fluid.yml` 中配置：

```yaml
search:
  enable: true
  path: /local-search.xml
  field: post      # post | page | all
  content: true    # 是否搜索正文内容
```

---

## 项目结构

```
new blog/
├── _config.yml              # Hexo 全局配置
├── _config.fluid.yml        # Fluid 主题配置
├── package.json             # 项目依赖
├── scaffolds/               # 模板文件
│   ├── draft.md             # 草稿模板
│   ├── page.md              # 页面模板
│   └── post.md              # 文章模板
├── source/                  # 源文件目录
│   ├── _posts/              # 文章（Markdown）
│   ├── about/               # 关于页
│   └── img/                 # 图片资源
├── themes/                  # 主题目录
├── public/                  # 生成的静态文件（不提交）
└── node_modules/            # 依赖包（不提交）
```

---

## 常见问题

### Q: 部署后网站没有更新？

```bash
# 先清理缓存再重新生成部署
npx hexo clean && npx hexo generate && npx hexo deploy
```

### Q: 本地预览正常但部署后样式丢失？

检查 `_config.yml` 中的 `url` 和 `root` 配置是否正确：
```yaml
url: https://xendr1a.github.io
root: /
```

### Q: 如何升级 Fluid 主题？

```bash
npm update hexo-theme-fluid
```

### Q: 图片放在哪里？

将图片放在 `source/img/` 目录下，文章中引用：
```markdown
![](/img/your-image.png)
```

### Q: 如何添加自定义域名？

1. 在 `source/` 目录下创建 `CNAME` 文件，写入你的域名
2. 在 `_config.yml` 中修改 `url`
3. 重新部署

---

## 有用的链接

- [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
- [Fluid 主题文档](https://fluid.ist/docs/)
- [Fluid 配置指南](https://fluid.ist/docs/guide/)
- [Fluid GitHub](https://github.com/fluid-dev/hexo-theme-fluid)
- [Markdown 语法指南](https://markdown.com.cn/)
