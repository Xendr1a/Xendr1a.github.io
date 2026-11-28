#!/usr/bin/env python3
"""Hexo 写作流水线：idea / new / preview / publish。

真源是 ``source`` 分支的 ``source/_posts/*.md``。博客园由 GitHub Actions
单向同步（push 到 source 触发），本工具不直接调用博客园接口。

用法::

    python3 tools/blog.py idea "一句话灵感"
    python3 tools/blog.py new ["文章标题"]
    python3 tools/blog.py preview [--port 4000] [-- <hexo server 参数>]
    python3 tools/blog.py publish [-m "提交说明"] [--branch source] [--dry-run]
    python3 tools/blog.py --help

``idea``
    把一条灵感按 ``YYYY-MM-DD 内容`` 追加到 ``source/_ideas.md``。文件名以下划线
    开头，Hexo 不会把它渲染成页面。

``new``
    在 ``source/_posts/`` 创建 ``<标题>.md``，front-matter 字段与现有文章一致
    （title/date/author/categories/tags/description/toc），正文给出最小骨架。
    标题里的空白转成 ``-``，非法文件名字符被删除；同名文件已存在时追加
    ``-2``、``-3``，绝不覆盖。省略标题时列出 ``source/_ideas.md`` 的条目供选择，
    选中后建草稿并把该条从清单移除。

``preview``
    调用本地 ``node_modules/.bin/hexo server`` 起预览；先 ``npm install``。

``publish``
    只提交 ``source/_posts`` 与 ``source/img`` 的改动，然后推送到 ``--branch``
    指定的远端分支（默认 ``source``）。当前分支必须与目标分支同名，否则拒绝，
    避免把别的分支内容推上 source。``--dry-run`` 只打印计划，``--no-push`` 只提交。

详见 tools/README.md。
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "source" / "_posts"
IDEAS_FILE = ROOT / "source" / "_ideas.md"
PUBLISH_PATHS = ("source/_posts", "source/img")
HEXO_BIN = ROOT / "node_modules" / ".bin" / "hexo"

ILLEGAL_FILENAME = re.compile(r'[\\/:*?"<>|\x00-\x1f\x7f]')
IDEA_LINE = re.compile(r"^(\d{4}-\d{2}-\d{2})\s+(\S.*)$")
WHITESPACE = re.compile(r"\s+")
DASHES = re.compile(r"-+")
YAML_SPECIAL = re.compile(r"""[:#\[\]{}&*!|>'"%@`]""")
FRONT_MATTER = re.compile(r"\A---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|\Z)", re.S)

TEMPLATE_BODY = """## 题目

## 解题思路

## 复现过程

## 总结
"""


class BlogError(Exception):
    """Fatal, user-facing error."""


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def now_local() -> dt.datetime:
    """当前时间；优先按站点时区 Asia/Shanghai 取。"""
    try:
        from zoneinfo import ZoneInfo

        return dt.datetime.now(ZoneInfo("Asia/Shanghai")).replace(tzinfo=None)
    except Exception:  # pragma: no cover - 时区数据库缺失时退回本机时间
        return dt.datetime.now().replace(tzinfo=None)


def yaml_scalar(value: str) -> str:
    """标题按 YAML 安全写法输出：普通标题裸写，含特殊字符时加双引号。"""
    if (
        not value
        or value != value.strip()
        or YAML_SPECIAL.search(value)
        or value.startswith(("-", "?", "!"))
    ):
        escaped = value.replace("\\", "\\\\").replace('"', '\\"')
        return f'"{escaped}"'
    return value


def slugify(title: str) -> str:
    """把标题变成文件名片段：保留中文，空格转 -，去掉非法字符。"""
    slug = ILLEGAL_FILENAME.sub("", title.strip())
    slug = WHITESPACE.sub("-", slug)
    slug = DASHES.sub("-", slug).strip("-.")
    if not slug or not re.search(r"\w", slug):
        slug = "post"
    # 留出扩展名（3 字节）的空间，文件名上限 255 字节，中文按 UTF-8 计。
    while len(slug.encode("utf-8")) > 240:
        slug = slug[:-1].rstrip("-.")
    return slug or "post"


def render_post(title: str, when: dt.datetime) -> str:
    return (
        "---\n"
        f"title: {yaml_scalar(title)}\n"
        f"date: {when.strftime('%Y-%m-%d %H:%M:%S')}\n"
        "author: Xendr1a\n"
        "categories: []\n"
        "tags: []\n"
        "description: ''\n"
        "toc: true\n"
        "---\n"
        f"\n{TEMPLATE_BODY}"
    )


def cmd_idea(args: argparse.Namespace) -> int:
    text = WHITESPACE.sub(" ", " ".join(args.text)).strip()
    if not text:
        raise BlogError("灵感内容不能为空")
    IDEAS_FILE.parent.mkdir(parents=True, exist_ok=True)
    prefix = ""
    if IDEAS_FILE.exists() and IDEAS_FILE.stat().st_size:
        with IDEAS_FILE.open("rb") as fh:
            fh.seek(-1, os.SEEK_END)
            if fh.read(1) != b"\n":
                prefix = "\n"
    line = f"{now_local().strftime('%Y-%m-%d')} {text}"
    with IDEAS_FILE.open("a", encoding="utf-8", newline="\n") as fh:
        fh.write(f"{prefix}{line}\n")
    print(f"已记录灵感：{line}")
    return 0


def idea_entries() -> list[tuple[int, str, str]]:
    """返回 (行号, 原始行, 内容)，只认 ``YYYY-MM-DD 内容`` 格式的行。"""
    if not IDEAS_FILE.exists():
        return []
    entries: list[tuple[int, str, str]] = []
    for index, line in enumerate(IDEAS_FILE.read_text(encoding="utf-8").splitlines()):
        match = IDEA_LINE.match(line.strip())
        if match:
            entries.append((index, line, match.group(2)))
    return entries


def select_idea() -> tuple[int, str] | None:
    """列出灵感并让用户按编号选择；直接回车返回 None。"""
    entries = idea_entries()
    if not entries:
        raise BlogError(
            f"{IDEAS_FILE.relative_to(ROOT)} 里没有可用灵感；"
            '先用 python3 tools/blog.py idea "一句话" 记一条'
        )
    print(f"灵感清单（{IDEAS_FILE.relative_to(ROOT)}）：")
    for number, (_, line, _) in enumerate(entries, 1):
        print(f"  {number}. {line.strip()}")
    try:
        choice = input(f"选择 1-{len(entries)}（回车取消）：").strip()
    except EOFError as exc:
        raise BlogError("没有读到编号，已取消") from exc
    if not choice:
        return None
    if not (choice.isascii() and choice.isdigit()) or not 1 <= int(choice) <= len(entries):
        raise BlogError(f"无效的编号：{choice}")
    index, _, title = entries[int(choice) - 1]
    return index, title


def remove_idea_line(index: int) -> None:
    lines = IDEAS_FILE.read_text(encoding="utf-8").splitlines(keepends=True)
    if not 0 <= index < len(lines):
        raise BlogError("灵感清单在创建草稿后发生变化，请检查 source/_ideas.md")
    del lines[index]
    with IDEAS_FILE.open("w", encoding="utf-8", newline="\n") as fh:
        fh.write("".join(lines))


def create_post(title: str) -> Path:
    when = now_local()
    base = slugify(title)
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    path = POSTS_DIR / f"{base}.md"
    suffix = 2
    while path.exists():
        path = POSTS_DIR / f"{base}-{suffix}.md"
        suffix += 1

    # "x" 模式：并发或竞态下也不会覆盖已有文章。
    try:
        with path.open("x", encoding="utf-8", newline="\n") as fh:
            fh.write(render_post(title, when))
    except FileExistsError as exc:
        raise BlogError(f"文件已存在：{path.relative_to(ROOT)}") from exc

    rel = path.relative_to(ROOT)
    print(f"已创建 {rel}")
    print(f"下一步：python3 tools/blog.py preview")
    return path


def cmd_new(args: argparse.Namespace) -> int:
    if not args.title:
        selected = select_idea()
        if selected is None:
            print("已取消，未创建草稿")
            return 0
        index, title = selected
        create_post(title)
        remove_idea_line(index)
        print("已从灵感清单移除该条")
        return 0

    title = " ".join(args.title).strip()
    if not title:
        raise BlogError("标题不能为空")
    create_post(title)
    return 0


def script_hexo() -> Path:
    if not HEXO_BIN.exists():
        raise BlogError("未找到 node_modules/.bin/hexo，请先在仓库根目录执行 npm install")
    return HEXO_BIN


def cmd_preview(args: argparse.Namespace) -> int:
    hexo = script_hexo()
    cmd = [str(hexo), "server", "--port", str(args.port), *args.hexo_args]
    print(f"Hexo 预览：http://localhost:{args.port}/  （Ctrl-C 退出）", flush=True)
    try:
        proc = subprocess.run(cmd, cwd=ROOT)
    except KeyboardInterrupt:
        return 130
    return proc.returncode


def git(*argv: str, capture: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["git", *argv],
            cwd=ROOT,
            text=True,
            capture_output=capture,
            check=False,
        )
    except OSError as exc:
        raise BlogError(f"无法执行 git：{exc}") from exc


def git_ok(*argv: str) -> str:
    result = git(*argv)
    if result.returncode != 0:
        detail = (result.stderr or result.stdout).strip()
        raise BlogError(f"git {' '.join(argv)} 失败：{detail}")
    return result.stdout.strip()


def changed_article_paths() -> list[str]:
    """相对仓库根、位于 PUBLISH_PATHS 下的改动（含未跟踪文件）。"""
    result = git(
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--",
        *PUBLISH_PATHS,
    )
    if result.returncode != 0:
        raise BlogError(f"git status 失败：{result.stderr.strip()}")
    entries = result.stdout.split("\0")
    paths: list[str] = []
    index = 0
    while index < len(entries):
        entry = entries[index]
        index += 1
        if not entry:
            continue
        status, path = entry[:2], entry[3:]
        if status[0] in "RC":
            index += 1  # rename/copy 的第二段是原路径，跳过
        paths.append(path)
    return sorted(set(paths))


def post_title(path: Path) -> str | None:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError:
        return None
    match = FRONT_MATTER.match(text)
    if not match:
        return None
    for line in match.group(1).splitlines():
        if line.startswith("title:"):
            value = line[len("title:"):].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            return value or None
    return None


def validate_article(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    match = FRONT_MATTER.match(text)
    if not match:
        raise BlogError(f"{path.relative_to(ROOT)} 缺少 front-matter，已中止发布")
    meta = match.group(1)
    missing = [key for key in ("title:", "date:") if not re.search(rf"^{key}", meta, re.M)]
    if missing:
        fields = "、".join(item.rstrip(":") for item in missing)
        raise BlogError(f"{path.relative_to(ROOT)} 的 front-matter 缺少 {fields}，已中止发布")


def default_message(paths: list[Path]) -> str:
    titles = [title for title in (post_title(path) for path in paths) if title]
    if len(titles) == 1:
        return f"post: {titles[0]}"
    if len(titles) > 1:
        return f"post: 更新 {len(titles)} 篇文章"
    return "post: 更新文章"


def cmd_publish(args: argparse.Namespace) -> int:
    git_ok("rev-parse", "--is-inside-work-tree")
    branch = git_ok("rev-parse", "--abbrev-ref", "HEAD")
    if branch != args.branch:
        raise BlogError(
            f"当前分支是 {branch}，不是 {args.branch}；"
            f"请先 git switch {args.branch}（发布不会跨分支推送）"
        )

    changed = changed_article_paths()
    if not changed:
        print(f"{'、'.join(PUBLISH_PATHS)} 下没有改动，无需发布")
        return 0

    articles = [
        ROOT / path
        for path in changed
        if path.startswith("source/_posts/") and path.endswith(".md") and (ROOT / path).is_file()
    ]
    for path in articles:
        validate_article(path)

    message = args.message or default_message(articles)
    print("将提交：")
    for path in changed:
        print(f"  {path}")
    print(f"提交说明：{message}")
    if args.dry_run:
        print(f"dry-run：未执行 git add/commit/push（目标 {args.remote}/{args.branch}）")
        return 0

    git_ok("add", "-A", "--", *PUBLISH_PATHS)
    commit = git("commit", "-m", message, "--", *PUBLISH_PATHS)
    if commit.returncode != 0:
        raise BlogError(f"git commit 失败：{(commit.stderr or commit.stdout).strip()}")
    print(commit.stdout.strip().splitlines()[0] if commit.stdout.strip() else "已提交")

    if args.no_push:
        print("--no-push：已提交，未推送")
        return 0

    push = git("push", args.remote, f"HEAD:{args.branch}")
    if push.returncode != 0:
        detail = (push.stderr or push.stdout).strip()
        raise BlogError(
            f"git push {args.remote} HEAD:{args.branch} 失败：{detail}\n"
            "若远端有新提交，请先 git pull --rebase 后再发布"
        )
    print(f"已推送到 {args.remote}/{args.branch}（GitHub Actions 会单向同步新文章到博客园）")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="blog.py",
        description="Hexo 写作流水线：idea / new / preview / publish",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "示例：\n"
            '  python3 tools/blog.py idea "某道题可以写"\n'
            "  python3 tools/blog.py new\n"
            '  python3 tools/blog.py new "NEPCTF 2026 Web 题解"\n'
            "  python3 tools/blog.py preview --port 4000\n"
            '  python3 tools/blog.py publish -m "post: NEPCTF 2026"\n'
        ),
    )
    sub = parser.add_subparsers(dest="command", metavar="{idea,new,preview,publish}")
    sub.required = True

    p_idea = sub.add_parser("idea", help="记录一条灵感", description="记录一条灵感到 source/_ideas.md")
    p_idea.add_argument("text", nargs="*", metavar="内容", help="灵感内容（可含空格）")
    p_idea.set_defaults(func=cmd_idea)

    p_new = sub.add_parser(
        "new",
        help="创建草稿",
        description="创建草稿；省略标题时从 source/_ideas.md 选一条",
    )
    p_new.add_argument("title", nargs="*", metavar="标题", help="文章标题（可含空格）；省略则从灵感清单选择")
    p_new.set_defaults(func=cmd_new)

    p_preview = sub.add_parser("preview", help="启动 Hexo 本地预览", description="启动 Hexo 本地预览")
    p_preview.add_argument("-p", "--port", type=int, default=4000, help="端口，默认 4000")
    p_preview.add_argument(
        "hexo_args",
        nargs=argparse.REMAINDER,
        metavar="-- 额外参数",
        help="原样传给 hexo server，例如 -- --draft",
    )
    p_preview.set_defaults(func=cmd_preview)

    p_publish = sub.add_parser("publish", help="提交文章并推送到 source", description="提交文章并推送")
    p_publish.add_argument("-m", "--message", help="提交说明；默认取文章标题")
    p_publish.add_argument("--branch", default="source", help="目标分支，默认 source，且必须与当前分支一致")
    p_publish.add_argument("--remote", default="origin", help="远端名，默认 origin")
    p_publish.add_argument("--dry-run", action="store_true", help="只打印将提交/推送的内容")
    p_publish.add_argument("--no-push", action="store_true", help="只提交，不推送")
    p_publish.set_defaults(func=cmd_publish)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "preview" and args.hexo_args and args.hexo_args[0] == "--":
        args.hexo_args = args.hexo_args[1:]
    try:
        return int(args.func(args))
    except BlogError as exc:
        eprint(f"错误：{exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
