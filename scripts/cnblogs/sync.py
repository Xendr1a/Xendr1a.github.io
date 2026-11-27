#!/usr/bin/env python3
"""One-way sync: Hexo ``source/_posts/*.md`` -> cnblogs MetaWeblog API.

Standard library only. The local Markdown files are the single source of truth;
the remote copy is never read back for editing (Markdown posts are returned as
HTML by ``getPost``).

Commands::

    sync.py plan                 # offline inventory, no token
    sync.py push --dry-run       # offline payload dump, no token
    sync.py reconcile            # online: propose slug <-> postid mappings
    sync.py push                 # online: create/update posts

See README.md in this directory.
"""

from __future__ import annotations

import argparse
import datetime as dt
import difflib
import hashlib
import html
import json
import mimetypes
import os
import re
import sys
import time
import unicodedata
import xmlrpc.client
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Mapping, Sequence

# --------------------------------------------------------------------------
# Constants
# --------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[2]
POSTS_DIR = ROOT / "source" / "_posts"
SOURCE_DIR = ROOT / "source"
IMG_DIR = SOURCE_DIR / "img"
STATE_FILE = Path(__file__).resolve().parent / "state.json"
IMAGES_FILE = Path(__file__).resolve().parent / "images.json"
REPORT_FILE = Path(__file__).resolve().parent / "reconcile-report.md"

RPC_URL = "https://rpc.cnblogs.com/metaweblog/Xendria"
USERNAME = "Xendr1a"
BLOGID = "853206"
TOKEN_FILE = Path.home() / ".config" / "cnblogs" / "token"
MARKDOWN_CATEGORY = "[Markdown]"
BLOG_BASE = "https://www.cnblogs.com/Xendria"

BEIJING = dt.timezone(dt.timedelta(hours=8))
MAX_IMAGE_BYTES = 10 * 1024 * 1024
RETRY_DELAYS = (5, 10, 20)  # 3 retries after the first attempt, exponential

MIME_OVERRIDES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
}

FRONT_MATTER_RE = re.compile(r"\A---[ \t]*\n(.*?)\n---[ \t]*(?:\n|\Z)", re.S)
RAW_TAG_RE = re.compile(r"\{%-?\s*(?:raw|endraw)\s*-?%\}")
IMAGE_RE = re.compile(r"!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)([^)]*)\)")
INTERNAL_LINK_RE = re.compile(r"\]\((/20\d{2}/\d{2}/\d{2}/[^)\s]+)\)")
CNBLOGS_POST_URL_RE = re.compile(
    r"https?://(?:www\.)?cnblogs\.com/Xendria/p/(\d+)", re.IGNORECASE
)


# --------------------------------------------------------------------------
# Small utilities
# --------------------------------------------------------------------------


class SyncError(Exception):
    """Fatal, user-facing error."""


def eprint(*args: Any) -> None:
    print(*args, file=sys.stderr)


def display_width(text: str) -> int:
    return sum(2 if unicodedata.east_asian_width(ch) in "WF" else 1 for ch in text)


def pad(text: str, width: int) -> str:
    text = truncate(text, width)
    return text + " " * max(0, width - display_width(text))


def truncate(text: str, width: int) -> str:
    if display_width(text) <= width:
        return text
    out: list[str] = []
    used = 0
    for ch in text:
        step = 2 if unicodedata.east_asian_width(ch) in "WF" else 1
        if used + step > width - 1:
            break
        out.append(ch)
        used += step
    return "".join(out) + "…"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        with path.open(encoding="utf-8") as fh:
            data = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        raise SyncError(f"无法读取 {path}: {exc}") from exc
    if not isinstance(data, type(default)):
        raise SyncError(f"{path} 结构错误: 期望 {type(default).__name__}")
    return data


def save_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    tmp.replace(path)


def fmt_date(value: dt.datetime) -> str:
    return value.astimezone(BEIJING).strftime("%Y-%m-%dT%H:%M:%S")


def yaml_scalar(raw: str) -> str:
    raw = raw.strip()
    if not raw:
        return ""
    if len(raw) >= 2 and raw[0] == raw[-1] and raw[0] in "\"'":
        quote = raw[0]
        body = raw[1:-1]
        if quote == '"':
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return body
        return body.replace("''", "'")
    return raw


def split_inline_list(raw: str) -> list[str]:
    raw = raw.strip()
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    if not raw.strip():
        return []
    items: list[str] = []
    buf: list[str] = []
    quote = ""
    for ch in raw:
        if quote:
            buf.append(ch)
            if ch == quote:
                quote = ""
        elif ch in "\"'":
            quote = ch
            buf.append(ch)
        elif ch == ",":
            items.append("".join(buf))
            buf = []
        else:
            buf.append(ch)
    items.append("".join(buf))
    return [yaml_scalar(item) for item in items if yaml_scalar(item)]


def split_front_matter(text: str) -> tuple[dict[str, Any], str]:
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, text
    meta: dict[str, Any] = {}
    current_key: str | None = None
    for line in match.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        stripped = line.lstrip()
        if stripped.startswith("- ") and current_key:
            meta.setdefault(current_key, [])
            if isinstance(meta[current_key], list):
                meta[current_key].append(yaml_scalar(stripped[2:]))
            continue
        key, sep, value = line.partition(":")
        if not sep or " " in key.strip():
            continue
        key = key.strip()
        current_key = key
        value = value.strip()
        if value.startswith("[") and value.endswith("]"):
            meta[key] = split_inline_list(value)
        else:
            meta[key] = yaml_scalar(value)
    return meta, text[match.end() :]


def parse_date(raw: str) -> dt.datetime:
    value = raw.strip()
    if not value:
        raise SyncError("front-matter 缺少 date")
    try:
        if value.endswith("Z"):
            parsed = dt.datetime.fromisoformat(value[:-1]).replace(tzinfo=dt.timezone.utc)
        elif "T" in value:
            parsed = dt.datetime.fromisoformat(value)
        else:
            parsed = dt.datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    except ValueError as exc:
        raise SyncError(f"无法解析 date: {value!r}") from exc
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=BEIJING)
    return parsed.astimezone(BEIJING)


def hexo_slugify(title: str) -> str:
    lowered = title.strip().lower()
    slug = re.sub(r"[^\w\u4e00-\u9fff]+", "-", lowered, flags=re.UNICODE)
    return slug.strip("-")


# --------------------------------------------------------------------------
# Post model / conversion
# --------------------------------------------------------------------------


@dataclass
class Post:
    slug: str
    path: Path
    title: str
    date: dt.datetime
    author: str
    categories: list[str]
    tags: list[str]
    excerpt: str
    body: str  # after {% raw %} stripping, before URL substitution
    images: list[str] = field(default_factory=list)  # unique /img/... paths
    missing_images: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def target_categories(self) -> list[str]:
        """[leaf, parent] deduplicated, then prefixed by the Markdown marker."""
        flat: list[str] = []
        for name in reversed(self.categories):
            if name and name not in flat:
                flat.append(name)
        return [MARKDOWN_CATEGORY] + flat

    @property
    def keywords(self) -> str:
        return ",".join(tag for tag in self.tags if tag)

    def content_sha(self) -> str:
        """Stable hash of local content; independent of image URL cache."""
        h = hashlib.sha256()
        parts = [
            self.title,
            fmt_date(self.date),
            "\n".join(self.target_categories),
            self.keywords,
            self.excerpt,
            self.body,
        ]
        for part in parts:
            h.update(part.encode("utf-8"))
            h.update(b"\0")
        return h.hexdigest()


def image_local_path(ref: str) -> str:
    return ref.strip().strip("<>")


def local_image_file(ref: str) -> Path:
    return SOURCE_DIR / ref.lstrip("/")


def load_posts() -> list[Post]:
    if not POSTS_DIR.is_dir():
        raise SyncError(f"找不到文章目录: {POSTS_DIR}")
    posts: list[Post] = []
    for path in sorted(POSTS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        meta, body = split_front_matter(text)
        body = RAW_TAG_RE.sub("", body)
        title = str(meta.get("title") or path.stem).strip()
        categories = meta.get("categories") or []
        tags = meta.get("tags") or []
        if isinstance(categories, str):
            categories = split_inline_list(categories)
        if isinstance(tags, str):
            tags = split_inline_list(tags)
        try:
            date = parse_date(str(meta.get("date") or ""))
        except SyncError as exc:
            raise SyncError(f"{path.name}: {exc}") from exc
        excerpt = str(meta.get("description") or "").strip()
        images: list[str] = []
        missing: list[str] = []
        for match in IMAGE_RE.finditer(body):
            ref = image_local_path(match.group(2))
            if not ref.startswith("/img/"):
                continue
            if ref not in images:
                images.append(ref)
            if not local_image_file(ref).is_file() and ref not in missing:
                missing.append(ref)
        posts.append(
            Post(
                slug=path.stem,
                path=path,
                title=title,
                date=date,
                author=str(meta.get("author") or USERNAME),
                categories=[str(c) for c in categories if str(c).strip()],
                tags=[str(t) for t in tags if str(t).strip()],
                excerpt=excerpt,
                body=body,
                images=images,
                missing_images=missing,
            )
        )
    return posts


def substitute_images(body: str, urls: Mapping[str, str]) -> str:
    def repl(match: re.Match[str]) -> str:
        alt, target, rest = match.group(1), match.group(2), match.group(3)
        ref = image_local_path(target)
        remote = urls.get(ref)
        if not remote:
            return match.group(0)
        return f"![{alt}]({remote}{rest})"

    return IMAGE_RE.sub(repl, body)


def permalink_map(posts: Sequence[Post]) -> dict[str, str]:
    """Map ``/YYYY/MM/DD/hexo-slug/`` -> cnblogs URL using state.json."""
    state = load_json(STATE_FILE, {})
    mapping: dict[str, str] = {}
    for post in posts:
        entry = state.get(post.slug) or {}
        url = entry.get("url")
        if not url:
            continue
        key = f"/{fmt_date(post.date)[:10].replace('-', '/')}/{hexo_slugify(post.title)}/"
        if key in mapping:
            mapping[key] = ""  # ambiguous -> leave unresolved
        else:
            mapping[key] = str(url)
    return mapping


def substitute_internal_links(body: str, mapping: Mapping[str, str]) -> tuple[str, list[str]]:
    unresolved: list[str] = []

    def repl(match: re.Match[str]) -> str:
        path = match.group(1)
        url = mapping.get(path)
        if url:
            return f"]({url})"
        unresolved.append(path)
        return match.group(0)

    return INTERNAL_LINK_RE.sub(repl, body), unresolved


def build_body(post: Post, urls: Mapping[str, str], links: Mapping[str, str]) -> tuple[str, list[str]]:
    body = substitute_images(post.body, urls)
    return substitute_internal_links(body, links)


def build_struct(
    post: Post,
    body: str,
    *,
    draft: bool,
    categories: Sequence[str] | None = None,
) -> dict[str, Any]:
    return {
        "title": post.title,
        "description": body,
        "categories": list(categories) if categories is not None else post.target_categories,
        "mt_keywords": post.keywords,
        "mt_excerpt": post.excerpt,
        "dateCreated": xmlrpc.client.DateTime(
            post.date.astimezone(BEIJING).replace(tzinfo=None)
        ),
        "publish": not draft,
    }


# --------------------------------------------------------------------------
# plan
# --------------------------------------------------------------------------


def cmd_plan(args: argparse.Namespace) -> int:
    posts = load_posts()
    state = load_json(STATE_FILE, {})
    new_count = update_count = 0
    mapped_count = 0
    missing_total = 0
    changed: list[str] = []

    print(
        pad("slug", 33)
        + pad("title", 38)
        + pad("字数", 7)
        + pad("图片", 6)
        + pad("目标分类", 44)
        + "状态"
    )
    print("-" * 152)
    for post in posts:
        entry = state.get(post.slug) or {}
        digest = post.content_sha()
        if not entry.get("postid"):
            status = "待新建"
            new_count += 1
        elif str(entry.get("sha256") or "") != digest or entry.get("draft"):
            status = "待更新"
            update_count += 1
        else:
            status = "已同步"
            changed.append(post.slug)
        if entry.get("postid"):
            status += f" #{entry['postid']}"
            mapped_count += 1
        cat_text = ", ".join(post.target_categories)
        print(
            pad(post.slug, 33)
            + pad(post.title, 38)
            + pad(str(len(post.body)), 7)
            + pad(str(len(post.images)), 6)
            + pad(cat_text, 44)
            + status
        )
        if post.missing_images:
            missing_total += len(post.missing_images)
            for ref in post.missing_images:
                print(f"    !! 缺失图片: {ref}")

    print()
    print(
        f"汇总: 共 {len(posts)} 篇 | 已映射 {mapped_count} 篇 | "
        f"待新建 {new_count} 篇 | 待更新 {update_count} 篇 | "
        f"已同步 {len(changed)} 篇 | 缺失图片 {missing_total} 个"
    )
    if missing_total:
        eprint(f"错误: {missing_total} 个图片引用不存在于 source/img/，先修复再推送。")
        return 1
    return 0


# --------------------------------------------------------------------------
# dry-run push
# --------------------------------------------------------------------------


def selected_posts(posts: Sequence[Post], args: argparse.Namespace) -> list[Post]:
    result = list(posts)
    if args.only:
        result = [p for p in result if p.slug == args.only]
        if not result:
            raise SyncError(f"--only 未匹配任何 slug: {args.only}")
    if args.limit is not None:
        result = result[: args.limit]
    return result


def cmd_push_dry_run(args: argparse.Namespace) -> int:
    posts = selected_posts(load_posts(), args)
    state = load_json(STATE_FILE, {})
    if args.new_only:
        posts = [p for p in posts if not (state.get(p.slug) or {}).get("postid")]
    images_cache = load_json(IMAGES_FILE, {})
    links = permalink_map(load_posts())
    missing_total = 0
    planned_uploads: dict[str, str] = {}
    warnings_total = 0

    for index, post in enumerate(posts, 1):
        if post.missing_images:
            missing_total += len(post.missing_images)
        urls = {k: v for k, v in images_cache.items() if isinstance(v, str) and v}
        body, unresolved = build_body(post, urls, links)
        for ref in post.missing_images:
            print(f"!! {post.slug}: 缺失图片 {ref}")
        print(f"\n{'=' * 78}")
        print(f"[{index}/{len(posts)}] {post.slug}  ({post.path.relative_to(ROOT)})")
        print(f"content_sha256: {post.content_sha()}")
        entry = state.get(post.slug) or {}
        if not entry.get("postid"):
            action = "待新建"
        elif str(entry.get("sha256") or "") != post.content_sha() or entry.get("draft"):
            action = "待更新"
        elif args.force:
            action = "待更新（--force）"
        else:
            action = "已同步（push 将跳过）"
        print(f"action: {action}")
        print(f"postid: {entry.get('postid') or '(new)'}")
        print("struct:")
        struct = build_struct(post, body, draft=args.draft)
        preview = dict(struct)
        preview["description"] = body[:200] + ("…" if len(body) > 200 else "")
        preview["dateCreated"] = fmt_date(post.date)
        print(json.dumps(preview, ensure_ascii=False, indent=2))
        print(f"body_length: {len(body)}")
        print(f"body_sha256: {sha256_text(body)}")
        if len(body) > 200:
            print(f"body[:200]: {body[:200]}")
        print("images:")
        if not post.images:
            print("  (无)")
        for ref in post.images:
            cached = images_cache.get(ref)
            if cached:
                print(f"  {ref} -> {cached}  [cached]")
            else:
                planned_uploads[ref] = post.slug
                print(f"  {ref} -> (dry-run: 未上传，push 时将上传)")
        for path in unresolved:
            warnings_total += 1
            print(f"  ! 站内链接无法解析（保留原样）: {path}")

    print(f"\n{'=' * 78}")
    print(
        f"dry-run 汇总: {len(posts)} 篇 | 待上传图片 {len(planned_uploads)} 张 | "
        f"缺失图片 {missing_total} 个 | 未解析站内链接 {warnings_total} 个"
    )
    if planned_uploads:
        print("待上传图片清单:")
        for ref in sorted(planned_uploads):
            print(f"  {ref}  ({local_image_file(ref).stat().st_size} bytes)")
    if missing_total:
        eprint("错误: 存在缺失图片，真实 push 会中止。")
        return 1
    return 0


# --------------------------------------------------------------------------
# XML-RPC plumbing
# --------------------------------------------------------------------------


def require_token() -> str:
    token = os.environ.get("CNBLOGS_TOKEN", "").strip()
    if not token and TOKEN_FILE.is_file():
        try:
            token = TOKEN_FILE.read_text(encoding="utf-8").strip()
        except OSError as exc:
            raise SyncError(f"无法读取令牌文件 {TOKEN_FILE}: {exc}") from exc
    if not token:
        raise SyncError(
            "缺少访问令牌。优先使用环境变量，否则写入 "
            f"{TOKEN_FILE}（chmod 600）；不要写进仓库。"
        )
    return token


def make_proxy() -> xmlrpc.client.ServerProxy:
    return xmlrpc.client.ServerProxy(RPC_URL, allow_none=False, use_builtin_types=True)


def rpc(
    proxy: xmlrpc.client.ServerProxy,
    method: str,
    *args: Any,
    retry_transport: bool = True,
) -> Any:
    fn = getattr(proxy, method)
    attempt = 0
    while True:
        try:
            return fn(*args)
        except xmlrpc.client.Fault as exc:
            if exc.faultCode == 401:
                raise SyncError(
                    "认证失败 (Fault 401)：访问令牌无效或未生效。"
                ) from exc
            error: Exception = exc
        except (OSError, xmlrpc.client.ProtocolError) as exc:
            if not retry_transport:
                raise SyncError(
                    f"{method} 传输失败，未自动重试以避免重复创建: {exc}"
                ) from exc
            error = exc
        if attempt >= len(RETRY_DELAYS):
            raise SyncError(f"{method} 失败（已重试 {len(RETRY_DELAYS)} 次）: {error}") from error
        delay = RETRY_DELAYS[attempt]
        attempt += 1
        eprint(f"  ! {method} 出错，{delay}s 后第 {attempt}/{len(RETRY_DELAYS)} 次重试: {error}")
        time.sleep(delay)


def mime_for(path: Path) -> str:
    override = MIME_OVERRIDES.get(path.suffix.lower())
    if override:
        return override
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "application/octet-stream"


def upload_image(
    proxy: xmlrpc.client.ServerProxy, token: str, ref: str
) -> str:
    path = local_image_file(ref)
    if not path.is_file():
        raise SyncError(f"图片不存在: {ref}")
    size = path.stat().st_size
    if size > MAX_IMAGE_BYTES:
        raise SyncError(f"图片超过 10MB ({size} bytes): {ref}")
    payload = {
        "name": path.name,
        "type": mime_for(path),
        "bits": xmlrpc.client.Binary(path.read_bytes()),
    }
    result = rpc(proxy, "metaWeblog.newMediaObject", BLOGID, USERNAME, token, payload)
    if not isinstance(result, dict) or not result.get("url"):
        raise SyncError(f"newMediaObject 未返回 URL: {ref} -> {result!r}")
    return str(result["url"])


POST_CATEGORY_PREFIX = "[随笔分类]"


def ensure_categories(
    proxy: xmlrpc.client.ServerProxy, token: str, wanted: Iterable[str]
) -> dict[str, str]:
    """Ensure categories exist; return {front-matter name: exact remote name}.

    cnblogs may return category titles with a ``[随笔分类]`` prefix, so compare
    on the bare name but send back the exact title that already exists.
    """
    needed = [name for name in dict.fromkeys(wanted) if name and name != MARKDOWN_CATEGORY]
    if not needed:
        return {}
    existing_raw = rpc(proxy, "metaWeblog.getCategories", BLOGID, USERNAME, token)
    resolved: dict[str, str] = {}
    uses_prefix = False
    for item in existing_raw:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or item.get("name") or "")
        if not title:
            continue
        if title.startswith(POST_CATEGORY_PREFIX):
            uses_prefix = True
            bare = title[len(POST_CATEGORY_PREFIX) :]
        else:
            bare = title
        resolved.setdefault(bare, title)
    for name in needed:
        if name in resolved:
            continue
        remote_name = f"{POST_CATEGORY_PREFIX}{name}" if uses_prefix else name
        rpc(
            proxy,
            "wp.newCategory",
            BLOGID,
            USERNAME,
            token,
            {"name": remote_name, "slug": name, "parent_id": 0, "description": ""},
        )
        resolved[name] = remote_name
        print(f"  新建分类: {remote_name}")
    return resolved


# --------------------------------------------------------------------------
# push
# --------------------------------------------------------------------------


def _post_id(value: Any) -> str:
    text = str(value).strip()
    return text


def cmd_push(args: argparse.Namespace) -> int:
    token = require_token()
    posts = selected_posts(load_posts(), args)
    state = load_json(STATE_FILE, {})
    images_cache = load_json(IMAGES_FILE, {})
    links = permalink_map(load_posts())

    missing = [(p.slug, ref) for p in posts for ref in p.missing_images]
    if missing:
        for slug, ref in missing:
            eprint(f"缺失图片: {slug}: {ref}")
        raise SyncError(f"{len(missing)} 个图片引用不存在，终止")

    todo = []
    skipped = 0
    for post in posts:
        entry = state.get(post.slug) or {}
        if args.new_only and entry.get("postid"):
            skipped += 1
            continue
        unchanged = (
            entry.get("postid")
            and str(entry.get("sha256") or "") == post.content_sha()
            and not entry.get("draft")
        )
        if unchanged and not args.force:
            skipped += 1
            continue
        todo.append(post)

    print(f"共选中 {len(posts)} 篇: 待处理 {len(todo)} 篇, 跳过 {skipped} 篇")
    if not todo:
        return 0

    proxy = make_proxy()
    resolved_categories = ensure_categories(
        proxy, token, (c for p in todo for c in p.target_categories)
    )

    created = updated = 0
    pushed_any = False
    try:
        for index, post in enumerate(todo, 1):
            entry = dict(state.get(post.slug) or {})
            postid = entry.get("postid")
            print(f"\n[{index}/{len(todo)}] {post.slug}  {post.title}")
            for ref in post.images:
                if images_cache.get(ref):
                    continue
                url = upload_image(proxy, token, ref)
                images_cache[ref] = url
                save_json(IMAGES_FILE, images_cache)
                print(f"  图片已上传: {ref} -> {url}")

            body, unresolved = build_body(post, images_cache, links)
            for path in unresolved:
                eprint(f"  ! 站内链接无法解析，保留原样: {path}")
            struct = build_struct(
                post,
                body,
                draft=args.draft,
                categories=[
                    resolved_categories.get(name, name) for name in post.target_categories
                ],
            )

            if postid:
                result = rpc(
                    proxy, "metaWeblog.editPost", str(postid), USERNAME, token, struct, not args.draft
                )
                if result is False:
                    raise SyncError(f"editPost 返回 False: slug={post.slug} postid={postid}")
                updated += 1
                print(f"  已更新 postid={postid}")
            else:
                result = rpc(
                    proxy,
                    "metaWeblog.newPost",
                    BLOGID,
                    USERNAME,
                    token,
                    struct,
                    not args.draft,
                    retry_transport=False,
                )
                postid = _post_id(result)
                if not postid or postid == "None":
                    raise SyncError(f"newPost 未返回 postid: slug={post.slug}")
                created += 1
                print(f"  已新建 postid={postid}")

            entry = {
                "postid": str(postid),
                "sha256": post.content_sha(),
                "url": f"{BLOG_BASE}/p/{postid}",
            }
            if args.draft:
                entry["draft"] = True
            state[post.slug] = entry
            save_json(STATE_FILE, state)
            links[
                f"/{fmt_date(post.date)[:10].replace('-', '/')}/{hexo_slugify(post.title)}/"
            ] = entry["url"]
            pushed_any = True

            if index < len(todo) and args.interval > 0:
                print(f"  限速等待 {args.interval}s ...")
                time.sleep(args.interval)
    except SyncError as exc:
        eprint(f"\n中止: {exc}")
        eprint(
            f"进度已保留: 新建 {created} 篇, 更新 {updated} 篇; "
            f"state.json 已逐篇落盘，可重新运行续传。"
        )
        return 1

    print(f"\n完成: 新建 {created} 篇, 更新 {updated} 篇, 跳过 {skipped} 篇")
    if pushed_any:
        try:
            state_path = STATE_FILE.relative_to(ROOT)
            images_path = IMAGES_FILE.relative_to(ROOT)
        except ValueError:
            state_path, images_path = STATE_FILE, IMAGES_FILE
        print(f"state: {state_path}")
        print(f"images: {images_path}")
    return 0


# --------------------------------------------------------------------------
# reconcile
# --------------------------------------------------------------------------


def normalize_text(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"本文同时发表于博客园[^\n<]*", " ", value)
    value = re.sub(r"<script\b.*?</script>", " ", value, flags=re.S | re.I)
    value = re.sub(r"<style\b.*?</style>", " ", value, flags=re.S | re.I)
    value = re.sub(r"<[^>]+>", " ", value)
    value = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", value)
    value = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", value)
    value = re.sub(r"`{1,3}", " ", value)
    value = re.sub(r"[\s\W_]+", "", value, flags=re.UNICODE)
    return value.lower()


def title_similarity(left: str, right: str) -> float:
    a, b = normalize_text(left), normalize_text(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    ratio = difflib.SequenceMatcher(None, a, b).ratio()
    if a in b or b in a:
        ratio = max(ratio, 0.85)
    return ratio


def body_similarity(local_body: str, remote_body: str) -> float:
    a = normalize_text(local_body)[:80]
    b = normalize_text(remote_body)[:80]
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def remote_excerpt(item: Mapping[str, Any]) -> str:
    for key in ("description", "mt_excerpt", "mt_text_more"):
        value = item.get(key)
        if value:
            return str(value)
    return ""


def evaluate_candidates(
    post: Post, recent: Sequence[Mapping[str, Any]], cache: dict[str, Any]
) -> list[dict[str, Any]]:
    local_links = {
        str(m.group(1)) for m in CNBLOGS_POST_URL_RE.finditer(post.body)
    }
    owner_by_postid = {
        str(entry.get("postid")): slug
        for slug, entry in cache.items()
        if isinstance(entry, dict) and entry.get("postid")
    }
    candidates: list[dict[str, Any]] = []
    for item in recent:
        postid = str(item.get("postid") or "")
        remote_title = str(item.get("title") or "")
        remote_body = remote_excerpt(item)
        title_score = title_similarity(post.title, remote_title)
        body_score = body_similarity(post.body, remote_body)
        score = 0.55 * title_score + 0.45 * body_score
        reasons: list[str] = []
        occupied_by = owner_by_postid.get(postid)
        if occupied_by and occupied_by != post.slug:
            reasons.append(f"已被 {occupied_by} 的冻结映射占用")
        if postid and postid in local_links:
            score = 1.0
            reasons.append("正文含该 postid 的博客园链接")
        if normalize_text(post.title) == normalize_text(remote_title):
            reasons.append("标题归一化后相同")
        if title_score >= 0.85:
            reasons.append(f"标题相似 {title_score:.2f}")
        if body_score >= 0.35:
            reasons.append(f"正文前80字相似 {body_score:.2f}")
        cached = (cache.get(post.slug) or {}).get("postid")
        if cached and str(cached) == postid:
            reasons.append("state.json 已映射")
        candidates.append(
            {
                "postid": postid,
                "title": remote_title,
                "link": str(item.get("link") or f"{BLOG_BASE}/p/{postid}"),
                "score": score,
                "title_score": title_score,
                "body_score": body_score,
                "occupied_by": occupied_by if occupied_by != post.slug else "",
                "reasons": reasons,
            }
        )
    candidates.sort(key=lambda c: c["score"], reverse=True)
    return candidates


def cmd_reconcile(args: argparse.Namespace) -> int:
    token = require_token()
    posts = load_posts()
    state = load_json(STATE_FILE, {})
    mapped_postids = {
        str((state.get(post.slug) or {}).get("postid"))
        for post in posts
        if (state.get(post.slug) or {}).get("postid")
    }
    proxy = make_proxy()
    print("拉取 getRecentPosts(1000) ...")
    recent = rpc(proxy, "metaWeblog.getRecentPosts", BLOGID, USERNAME, token, 1000)
    recent = [item for item in recent if isinstance(item, dict)]
    print(f"博客园现有文章: {len(recent)} 篇；仓库文章: {len(posts)} 篇")

    evaluated: list[tuple[Post, list[dict[str, Any]]]] = []
    for post in posts:
        evaluated.append((post, evaluate_candidates(post, recent, state)))
    mapped_here = sum(
        1 for post in posts if (state.get(post.slug) or {}).get("postid")
    )
    orphans = [
        item
        for item in recent
        if str(item.get("postid") or "") not in mapped_postids
    ]

    lines: list[str] = []
    lines.append("# 博客园对账报告")
    lines.append("")
    lines.append(f"- 仓库文章: {len(posts)} 篇")
    lines.append(f"- 博客园文章: {len(recent)} 篇")
    lines.append(
        f"- 冻结映射: {mapped_here} 篇；仓库未映射: {len(posts) - mapped_here} 篇；"
        f"orphan: {len(orphans)} 篇"
    )
    lines.append("- 评分: 0.55 × 标题归一化相似度 + 0.45 × 正文前 80 字相似度；")
    lines.append("  正文中出现 `cnblogs.com/Xendria/p/<postid>` 链接时直接视为 1.0。")
    lines.append("- `state.json` 中的映射是人工核对的**冻结映射**，本报告不会修改它。")
    lines.append("- 不在 `state.json` 中的博客园文章标记为 `orphan`，工具绝不 editPost/deletePost。")
    lines.append("")
    lines.append("## 建议映射")
    lines.append("")
    lines.append("| 仓库 slug | 仓库标题 | 建议 postid | 博客园标题 | 分数 | 判定 | state |")
    lines.append("| --- | --- | --- | --- | --- | --- | --- |")
    proposals: list[tuple[Post, dict[str, Any] | None, str]] = []
    for post, candidates in evaluated:
        best = candidates[0] if candidates else None
        current = str((state.get(post.slug) or {}).get("postid") or "—")
        if current != "—":
            verdict = "冻结映射"
            suggested = current
        else:
            verdict = "无候选"
            if best:
                occupied = bool(best.get("occupied_by"))
                if best["score"] >= 0.85 and not occupied:
                    verdict = "高置信"
                elif best["score"] >= 0.45:
                    verdict = "已占用" if occupied else "待确认"
                    if not occupied and len(candidates) > 1 and best["score"] - candidates[1]["score"] < 0.05:
                        verdict = "歧义"
                else:
                    verdict = "无可靠候选"
            suggested = (
                best["postid"]
                if best and best["score"] >= 0.45 and not best.get("occupied_by")
                else "—"
            )
        proposals.append((post, best, verdict))
        lines.append(
            "| {slug} | {title} | {pid} | {rtitle} | {score} | {verdict} | {state} |".format(
                slug=post.slug,
                title=post.title.replace("|", "\\|"),
                pid=suggested,
                rtitle=(best["title"].replace("|", "\\|") if best else "—"),
                score=f"{best['score']:.3f}" if best else "—",
                verdict=verdict,
                state=current,
            )
        )

    lines.append("")
    lines.append("## 候选详情")
    for post, candidates in evaluated:
        lines.append("")
        lines.append(f"### {post.slug} — {post.title}")
        lines.append("")
        if not candidates:
            lines.append("(无候选)")
            continue
        lines.append("| # | postid | 博客园标题 | 总分 | 标题 | 正文 | 链接 | 依据 |")
        lines.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
        for rank, cand in enumerate(candidates[:3], 1):
            lines.append(
                "| {rank} | {pid} | {title} | {score:.3f} | {ts:.2f} | {bs:.2f} | {link} | {why} |".format(
                    rank=rank,
                    pid=cand["postid"],
                    title=cand["title"].replace("|", "\\|"),
                    score=cand["score"],
                    ts=cand["title_score"],
                    bs=cand["body_score"],
                    link=cand["link"],
                    why="；".join(cand["reasons"]) or "—",
                )
            )

    lines.append("")
    lines.append("## 博客园 orphan 文章（state.json 中不存在，工具绝不修改）")
    lines.append("")
    lines.append("| 状态 | postid | 标题 | 链接 |")
    lines.append("| --- | --- | --- | --- |")
    for item in sorted(orphans, key=lambda x: str(x.get("postid") or "")):
        postid = str(item.get("postid") or "")
        title = str(item.get("title") or "").replace("|", "\\|")
        link = str(item.get("link") or f"{BLOG_BASE}/p/{postid}")
        lines.append(f"| orphan | {postid} | {title} | {link} |")
    if not orphans:
        lines.append("| — | — | 无 | — |")

    lines.append("")
    lines.append("## 人工确认后的下一步")
    lines.append("")
    lines.append("1. `state.json` 当前是人工核对的冻结映射；只有确认新文章后才手动追加。")
    lines.append("2. 运行 `python3 scripts/cnblogs/sync.py push --dry-run` 复核。")
    lines.append("3. 先 `--only <slug> --limit 1` 小流量试跑。")
    lines.append("")

    REPORT_FILE.write_text("\n".join(lines), encoding="utf-8")

    print()
    print(pad("slug", 34) + pad("建议 postid", 14) + pad("分数", 8) + pad("判定", 10) + "博客园标题")
    print("-" * 110)
    for post, best, verdict in proposals:
        suggested = (
            best["postid"]
            if best and best["score"] >= 0.45 and not best.get("occupied_by")
            else "—"
        )
        print(
            pad(post.slug, 34)
            + pad(suggested, 14)
            + pad(f"{best['score']:.3f}" if best else "—", 8)
            + pad(verdict, 12)
            + (best["title"] if best else "—")
        )
    print()
    try:
        report_path = REPORT_FILE.relative_to(ROOT)
    except ValueError:
        report_path = REPORT_FILE
    print(f"报告已写入: {report_path}")
    print(f"orphan: {len(orphans)} 篇（不会 editPost/deletePost，详见报告）")
    for item in sorted(orphans, key=lambda x: str(x.get("postid") or "")):
        postid = str(item.get("postid") or "")
        title = str(item.get("title") or "")
        print(f"  orphan #{postid}  {title}")
    print("未自动修改 state.json。")
    return 0


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="sync.py",
        description="Hexo source/_posts -> 博客园 单向同步工具（标准库实现）",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    plan = sub.add_parser("plan", help="离线盘点：字数、图片、分类、映射状态")
    plan.set_defaults(func=cmd_plan)

    push = sub.add_parser("push", help="推送（需网络与令牌）")
    push.add_argument("--dry-run", action="store_true", help="只打印将发送的 struct，不联网")
    push.add_argument("--only", metavar="SLUG", help="只处理指定 slug")
    push.add_argument("--limit", type=int, metavar="N", help="最多处理 N 篇")
    push.add_argument("--draft", action="store_true", help="以草稿方式发布")
    push.add_argument("--force", action="store_true", help="忽略 hash 跳过逻辑")
    push.add_argument(
        "--new-only",
        action="store_true",
        help="只 newPost 没有 postid 的文章，已有 postid 的一律跳过",
    )
    push.add_argument("--interval", type=float, default=60.0, help="篇间隔秒数（默认 60）")

    rec = sub.add_parser("reconcile", help="联网对账，生成候选映射报告")
    rec.set_defaults(func=cmd_reconcile)

    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "push":
        if args.dry_run:
            return cmd_push_dry_run(args)
        return cmd_push(args)
    return args.func(args)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SyncError as exc:
        eprint(f"错误: {exc}")
        sys.exit(2)
    except KeyboardInterrupt:
        eprint("\n已中断。state.json 中已完成部分保留。")
        sys.exit(130)
