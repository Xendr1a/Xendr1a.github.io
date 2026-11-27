# 博客园单向同步工具

把本仓库 `source/_posts/*.md` 推送到博客园 <https://www.cnblogs.com/Xendria> 的
MetaWeblog 接口。只用 Python 3 标准库（`xmlrpc.client`），不需要 `npm install`。

**单向**：本地 Markdown 是唯一真源，永远不读回博客园正文再改写。原因是 Markdown
文章经 `getPost` 返回的已经是转换后的 HTML，任何「读回 → 修改 → 写回」都会破坏原文。
`state.json` 只记录 `postid`、内容 hash 和 URL。

## 文件

| 文件 | 作用 |
| --- | --- |
| `sync.py` | 主程序 |
| `state.json` | `{slug: {postid, sha256, url}}`，随仓库提交。初始 `{}` |
| `images.json` | `{"/img/...": "博客园 URL"}` 上传缓存，随仓库提交。初始 `{}` |
| `reconcile-report.md` | `reconcile` 生成的候选对照报告，供人工确认；不自动写入 state |

## 令牌

1. 登录博客园，打开管理后台 <https://i.cnblogs.com/settings>，找到
   **MetaWeblog 访问令牌**（通常在“设置 / 其他设置”里；界面改版时搜索 “MetaWeblog”）。
2. 只放在环境变量里，绝不写进代码、shell 历史或仓库：

   ```sh
   export CNBLOGS_TOKEN='...'
   ```

3. 未配置令牌时，联网命令会直接报错；令牌错误时接口返回 `Fault 401`。
   令牌泄露后立即在博客园后台重置。

接口常量（已核实）：`https://rpc.cnblogs.com/metaweblog/Xendria`，
`username = Xendr1a`，`blogid = ""`。

## 用法

```sh
# 1. 离线盘点，不需要令牌
python3 scripts/cnblogs/sync.py plan

# 2. 离线演练：打印每篇将发送的完整 struct（正文截断 200 字，附真实长度/sha256）
python3 scripts/cnblogs/sync.py push --dry-run
python3 scripts/cnblogs/sync.py push --dry-run --only ctfshow-ssti

# 3. 联网对账：仓库 slug <-> 博客园 postid 候选，写 reconcile-report.md
export CNBLOGS_TOKEN='...'
python3 scripts/cnblogs/sync.py reconcile

# 4. 联网推送
python3 scripts/cnblogs/sync.py push --only 0xgame2025-week1 --limit 1
python3 scripts/cnblogs/sync.py push
python3 scripts/cnblogs/sync.py push --draft          # 发草稿
python3 scripts/cnblogs/sync.py push --interval 90    # 放慢限速
python3 scripts/cnblogs/sync.py push --force          # 忽略 hash，强制 editPost
```

`plan` 在存在缺失图片时列出全部缺失项并以非 0 退出；`push` 在真实推送前也会做同样
检查并中止。

## 推送行为

- 没有 `postid` → `metaWeblog.newPost`；有 `postid` → `metaWeblog.editPost`。
- `editPost` 是**全量替换**，所以每次都发送完整 struct：
  `title`、`description`、`categories`、`mt_keywords`、`mt_excerpt`、`dateCreated`，
  外加 `publish`（`--draft` 时为 `False`）。
- 内容 hash 是本地规范化内容的 SHA-256（标题、北京时间、目标分类、标签、摘要、
  已剥离 `raw` 标签的正文），与图片 URL 缓存无关。hash 相同且已有 `postid` 时跳过；
  `--force` 可绕过。草稿推送会在 state 里记 `draft: true`，避免之后普通推送误跳过。
- 每成功一篇立即原子写入 `state.json`；中断后重跑即可续传。
- 篇间隔默认 60 秒（`--interval`），只在实际推送之间等待，跳过的不等待。
- XML-RPC fault 按 5s、10s、20s 退避重试 3 次后停止；`Fault 401` 不重试。
  `newPost` 遇到传输层错误不自动重试，避免服务器已建文但响应丢失时重复创建；
  其余调用遇到网络错误也会重试。

## 转换规则

- 删除 `{% raw %}` / `{% endraw %}` 标签本身，保留中间内容（代码块里的 `{{ }}`
  不会丢）。
- 图片：只处理 `/img/...` 形式的引用。命中 `images.json` 直接用缓存 URL；未命中则
  在真实 push 时调用 `metaWeblog.newMediaObject` 上传，`name` 用原文件名，MIME
  按扩展名映射，上传成功立刻写 `images.json`。单张上限 10MB。`--dry-run` 不联网，
  未缓存的图片保留本地路径并列入“待上传清单”。
- 分类：目标数组为 `['[Markdown]'] + 展平结果`。展平 = 去重后的
  `[叶分类, 父分类]` 顺序；例如 `[CTF题解, 0xgame2025]` → `['[Markdown]', '0xgame2025', 'CTF题解']`。
  `[Markdown]` 是博客园按 Markdown 解析正文的开关，不能省。推送前用
  `metaWeblog.getCategories` 比对（读取返回结构里的 `title`），缺少的用
  `wp.newCategory`（`parent_id=0`，平铺）创建。若已有分类以 `[随笔分类]` 前缀
  返回，会按裸名匹配并回传博客园实际使用的完整名称，缺失分类也按同一前缀创建，
  避免重复建分类。
- `tags` → `mt_keywords`（逗号连接，无空格）；`description` → `mt_excerpt`；
  `date` → `dateCreated`。
- 日期：无时区的写法按北京时间解释；带 `Z`/时区的写法先换算成 UTC+8 再发送。
  XML-RPC 会把它序列化成 `YYYYMMDDTHH:MM:SS`。
- 正文开头已有的「本文同时发表于博客园」链接原样保留，不重复插入。
- 正文中的站内绝对链接 `/YYYY/MM/DD/slug/`：如果 `state.json` 里已有对应文章的
  博客园 URL，则替换；否则保留原样并告警。目前 `handler-command.md` 里的两个链接
  指向仓库中不存在的文章，会一直告警。

## 历史文章对账（重要）

博客园已有 14 篇历史文章，且**标题被改写过**，所以不能靠标题自动匹配后直接
`newPost`，否则会产生重复文章。

`reconcile` 会：

1. `metaWeblog.getRecentPosts(blogid, user, token, 1000)` 拉取现有文章；
2. 对每篇仓库文章计算 `0.55 × 标题归一化相似度 + 0.45 × 正文前 80 字相似度`；
3. 若仓库正文里已有 `https://www.cnblogs.com/Xendria/p/<postid>` 链接，直接给 1.0；
4. 输出建议映射、每篇前 3 个候选、未匹配的博客园文章，写入
   `scripts/cnblogs/reconcile-report.md`。

它**不会**修改 `state.json`。人工确认后，把映射写成：

```json
{
  "0xgame2025-week1": {
    "postid": "19380137",
    "sha256": "<当前 `push --dry-run` 打印的 content_sha256>",
    "url": "https://www.cnblogs.com/Xendria/p/19380137"
  }
}
```

`sha256` 必须是当前本地内容的值，否则第一次 push 会走 `editPost`（通常可接受，但
先用 dry-run 核对）。没有把握的文章先不要写 state，交给 `push --only` 单篇试跑。

## 风险

- **重复文章**：state 丢失、或对账时把新 slug 当成新文章，都会 `newPost` 出重复。
  首次正式推送前必须完成 `reconcile` 人工确认。
- **全量覆盖**：`editPost` 会清空未发送的字段。不要绕过本工具在博客园后台改正文，
  否则下一次 push 会用本地内容覆盖。
- **标题改写**：博客园侧标题可能与仓库不同；本工具推送时以仓库标题为准，会让
  历史标题被覆盖。
- **正文是唯一真源**：博客园侧任何在线修改都不会回流仓库。
- **图片**：上传后 URL 被缓存；如果博客园删除图片，本地缓存仍指向失效 URL，需要
  手动从 `images.json` 删掉对应条目重传。超过 10MB 的图片会中止。
- **限速**：默认 60 秒/篇是保守值；调小可能触发博客园限流或封禁。
- **令牌**：只从 `CNBLOGS_TOKEN` 读取。不要把它写进 `.env` 并提交、不要贴进 issue。
- **分类**：博客园分类是平铺的，父子关系只体现在本工具的分类名顺序里；重名分类
  以博客园为准，不会自动改名。
- **站内链接**：只有 state 里已有 URL 的文章才会被替换；顺序推送时，先推的文章
  可能仍保留旧链接，需要后续 `--force` 再推一次。
- **草稿**：`--draft` 创建的仍是真实 postid；确认发布前不要在博客园手动删除，否则
  state 会指向不存在的 postid，需要手动清理。
