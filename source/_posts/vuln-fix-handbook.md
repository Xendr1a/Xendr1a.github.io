---
title: 漏洞修复速查手册（AWDP/应急）
date: 2026-11-21 10:00:00
author: Xendr1a
categories: [Web安全, 漏洞修复]
tags: [漏洞修复, AWDP, SOP]
description: 从判据到最小修复、验收与补丁包结构的赛中速查手册。
toc: true
---

这套速查按「判据 → 最小修复 → 验收 → 坑」组织，赛中和应急时可以直接照着改。

## 00 索引与赛中用法

> 时间线版流程见 **10 赛中SOP**（0–180 分钟该干什么，命令可直接复制）。

### 一、赛中三步（不要跳）

```bash
# 1) 找汇聚点（入口 + 危险函数一次列全）
~/ctf/省赛/tools/audit.sh <源码目录>

# 2) 按本文档对应章节贴最小修复 → 语法闸门
php -l 改过的.php            # static php 8.3：~/opt/php
python3 -m py_compile x.py
node --check x.js

# 3) 验业务没坏 + 打包
curl -sv "http://127.0.0.1:8080/原接口" | tail -20
~/ctf/省赛/tools/mkpatch.sh <题目目录> <题名> -d <基线>
```

### 二、三条铁律（违反就倒扣）

1. **不许删功能**：删路由 / 删接口 / 删返回字段 = checker 探活失败。
2. **不许返回 500**：宁可只拦特征，不要全站 WAF / 全站 403 / `die()` 兜底。
3. **不许改协议**：字段名、HTTP 状态码、JSON 结构保持原样。

### 三、修完必须重启（不重启＝没修）

| 栈 | 生效动作 |
|---|---|
| PHP-FPM | reload/重启 php-fpm；开 opcache 要 `opcache_reset()` 或重启 |
| `.user.ini` / `php.ini` 改动 | PHP 轮询加载（默认 300s），急就重启 |
| Python（gunicorn/uvicorn） | 无 `--reload` 必须重启进程 |
| Node（express/pm2） | `pm2 restart <name>` / 重启 node |
| Java（jar/war） | `javac` 重编译替换 class；先 `ps aux \| grep java` 确认真实部署路径 |
| Nginx/Apache 配置 | `nginx -t && nginx -s reload` |

### 四、自伤清单（自查）

- [ ] 加了鉴权 → checker 没登录会不会 302/403？
- [ ] 参数改名/改必填 → 原请求会不会 400？
- [ ] 过滤太狠 → 正常业务里的引号、`-`、`.`、中文会不会被拦？
- [ ] 上传目录禁解析 → 会不会把业务要读的附件也断了？
- [ ] 只改了副本 → 线上跑的是哪份代码？（`ps aux` 看启动路径）

### 五、目录

| 笔记 | 什么时候打开 |
|---|---|
| 01 SQL注入 | 有 `->query` / `mysqli_query` / 字符串拼 SQL / `order by`、`limit` 参数 |
| 02 命令执行与代码执行 | `system/exec/shell_exec/eval/assert/preg_replace /e`、`Runtime.exec` |
| 03 文件包含-读取-上传 | `include $_GET`、`readfile`、`file_get_contents`、上传点 |
| 04 反序列化 | `unserialize`、`ObjectInputStream`、`pickle.loads`、`phar://` |
| 05 模板注入与表达式注入 | `render_template_string`、Thymeleaf、SpEL、OGNL |
| 06 认证越权-SSRF-XXE | 接口能改别人 id、URL 参数抓取、XML 解析 |
| 07 XSS-CSRF-逻辑漏洞 | 回显用户输入、改密码/下单/领券、竞态 |
| 08 框架配置与依赖CVE | Spring Actuator、ThinkPHP、Laravel、Log4j2、Nginx 配置 |
| 11 补丁包结构 | 要交防御包之前（结构/前缀/自检/坑） |
| 09 工具清单与命令速查 | 不知道用哪个命令时先看这篇（含判型速查表） |

### 六、通用一键兜底（最后手段，慎用）

只在**单点**上做，且必须保留原返回结构：

```php
// 例：只拦命令执行特征，不拦整站
if (preg_match('/[;&|`$()<>]/', $cmd)) { http_response_code(200); echo json_encode(['code'=>1,'msg'=>'invalid']); exit; }
```

```nginx
# 例：只拒敏感静态文件，不影响业务
location ~ /\.(env|git|svn|DS_Store) { deny all; }
```

## 01 SQL注入

### 一手判据（确认洞在不在）

```bash
# 有拼接就一定可疑
rg -n "query\s*\(|prepare|mysqli_query|createStatement|executeQuery" -g '*.php' -g '*.java'
rg -n "(select|insert|update|delete).*\\\$_(GET|POST|REQUEST|COOKIE)" -i
rg -n "order by.*\\\$|limit.*\\\$|like.*\\\$" -i      # 预处理修不掉的两种：order by / limit / 表名
rg -n '\$\{' -g '*.xml'                                # MyBatis #{} 安全，${} 拼接
```

分类决定修法：

| 类型 | 例子 | 修法 |
|---|---|---|
| 数字型 | `where id=$id` | `intval()` / `(int)` |
| 字符型 | `where name='$name'` | 预处理；做不到用 `real_escape_string` |
| 结构型 | `order by $col`、`limit $a,$b`、`table $t` | **白名单映射**，预处理无效 |
| 二次注入 | 入库转义了，取出再拼 | 同一份 `real_escape_string` 逻辑要贯穿到使用点 |

### 最小修复

#### PHP / mysqli（最常见）

```php
// ① 数字型：一行搞定
$id = intval($_GET['id'] ?? 0);

// ② 字符型：预处理（首选）
$stmt = $conn->prepare("select * from users where name=? limit 1");
$stmt->bind_param("s", $name);
$stmt->execute();
$res = $stmt->get_result();

// ③ 仓库到处都是拼接、来不及改写：最小面 = 每个进入 SQL 的变量先转义
$name = $conn->real_escape_string($_GET['name']);
// 注意：real_escape_string 依赖连接字符集，务必确认 set_charset('utf8mb4')
$conn->set_charset('utf8mb4');
```

#### PHP / PDO

```php
$stmt = $pdo->prepare('select * from users where id = ?');
$stmt->execute([$_GET['id']]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
```

#### 结构型（order by / limit / 表名）——必须白名单

```php
$allow = ['id','name','created_at'];
$col = in_array($_GET['sort'] ?? 'id', $allow, true) ? $_GET['sort'] : 'id';
$dir = (strtolower($_GET['dir'] ?? '') === 'desc') ? 'DESC' : 'ASC';
$page = max(1, (int)($_GET['page'] ?? 1));
$size = 20;
$sql = "select * from users order by $col $dir limit " . (($page-1)*$size) . ", $size";
```

#### Python

```python
# sqlite3 / pymysql / psycopg2 通用：占位符，绝不 f-string 拼
cur.execute("select * from users where id = ?", (uid,))          # sqlite3 用 ?
cur.execute("select * from users where id = %s", (uid,))          # mysql/psycopg2 用 %s
# 表名/列名走白名单
if col not in {"id", "name"}: col = "id"
cur.execute(f"select * from users order by {col}")
```

#### Node

```js
// mysql2
await conn.execute('select * from users where id = ?', [id]);
// sequelize / typeorm 用参数替换，别用 literal / query 拼串
```

#### Java

```java
// JDBC
PreparedStatement ps = conn.prepareStatement("select * from users where name=?");
ps.setString(1, name);

// MyBatis：${} 改 #{}，这是 Java 侧最高频的洞
// 改前：where name like '%${name}%'     改后：where name like concat('%', #{name}, '%')
```

### 验收

```bash
# 注入 payload 不再生效，且正常查询返回结构与原来一致
curl -s "http://127.0.0.1:8080/user?id=1%20and%201=1"    # 应与 id=1 结果相同（不是报错、不是空）
curl -s "http://127.0.0.1:8080/user?id=1"                # 正常
```

### 坑

- **只 `intval` 不校验业务**：`intval('1 and 1=1')=1`，安全；但如果原逻辑允许 `1,2,3` 多值，`intval` 会把它改成 1 → 破坏功能。多值要 `explode(',')` 后逐个 `intval`。
- **宽字节注入**：GBK 连接下 `addslashes` 可被 `%df%27` 绕过。根治只有预处理或强制 `utf8mb4`（改连接字符集需同时改建表字符集，别只改一处）。
- **`real_escape_string` 漏点位**：一个页面有 5 个变量，只转义了 3 个等于没修。用 `rg -n '\$_(GET|POST|REQUEST)'` 对着 SQL 逐行核。
- **盲注也要修**：checker 不测注入，但别的队会打；修复目标是「payload 无效」，不是「报错变好看」。
- 别用 `addslashes` + 手写过滤表，绕过太多，且中文场景会破坏数据。

### NoSQL（MongoDB）

```php
// 洞：find(['user' => $_POST['user']]) 传进来 {"$ne": null} 直接绕过登录
// 修：强制类型 + 禁止以 $ 开头的键
if (!is_string($_POST['user'] ?? '')) { exit('bad'); }
$u = str_replace('$', '', $_POST['user']);
```

## 02 命令执行与代码执行

### 一手判据

```bash
# 命令执行
rg -n "\b(system|exec|shell_exec|passthru|popen|proc_open|pcntl_exec)\s*\(" -g '*.php'
rg -n '`[^`]*\$' -g '*.php'                      # 反引号执行
rg -n "Runtime\.getRuntime\(\)\.exec|ProcessBuilder" -g '*.java'
rg -n "child_process|execSync|exec\(" -g '*.js'
rg -n "os\.system|subprocess|popen\(" -g '*.py'

# 代码执行
rg -n "\beval\s*\(|\bassert\s*\(|create_function|preg_replace\s*\([^)]*/e" -g '*.php'
rg -n "ScriptEngine|SpelExpressionParser|Ognl|GroovyShell" -g '*.java'
rg -n "\beval\s*\(|\bexec\s*\(|new Function|vm\.runIn" -g '*.js' -g '*.py'
rg -n "include|require" -g '*.php' | rg '\$_'    # 同时看 03 文件包含
```

### 最小修复

#### PHP

```php
// ① 有白名单场景（ping/curl/解压某固定工具）：白名单 + escapeshellarg
$allow = ['ping' => 'ping -c 1 ', 'whois' => 'whois '];
if (!isset($allow[$act])) { exit('bad action'); }
$host = $_GET['host'] ?? '';
if (!preg_match('/^[a-zA-Z0-9\.\-]{1,253}$/', $host)) { exit('bad host'); }
$out = shell_exec($allow[$act] . escapeshellarg($host));

// ② 参数是自由文本：整段用 escapeshellarg 包，别自己过滤字符
$cmd = 'convert ' . escapeshellarg($file) . ' /tmp/out.png';

// ③ 纯后端无必要就是删掉：业务不需要执行外部命令时直接去掉调用
```

```php
// ④ eval / assert / create_function：一律改成具名函数或 switch 分派
// 改前：eval($_POST['code']);
switch ($_POST['op'] ?? '') {
    case 'sum':  echo array_sum($_POST['nums']); break;
    default:     http_response_code(200); echo 'unsupported';
}

// ⑤ preg_replace /e（PHP7 已移除，老代码可能残留）：换 preg_replace_callback
```

#### Python

```python
import subprocess, shlex
# 好：列表参数，永不 shell=True
subprocess.run(["ping", "-c", "1", host], capture_output=True, timeout=10)
# 需要 shell 特性时最小面：shlex.quote 包参数
subprocess.run("convert " + shlex.quote(path), shell=True)
# 输入校验（和上面 PHP 同款正则）
assert re.fullmatch(r"[A-Za-z0-9.\-]{1,253}", host)
```

#### Node

```js
const { execFile } = require('child_process');
// 好：execFile 不经过 shell
execFile('ping', ['-c', '1', host], (e, out) => { /* ... */ });
// 已经用 exec() 的最小面：过滤 + 校验
if (!/^[A-Za-z0-9.\-]{1,253}$/.test(host)) return res.status(200).json({code:1});
exec(`ping -c 1 ${host}`, ...);   // 仅在上一步校验严格时才可接受
```

#### Java

```java
// ProcessBuilder 列表参数
new ProcessBuilder("ping", "-c", "1", host).start();
// 校验
if (!host.matches("[A-Za-z0-9.\\-]{1,253}")) { throw new IllegalArgumentException(); }
```

### `disable_functions` 兜底（配置类，慎当唯一手段）

```ini
; .user.ini 或 php.ini（放站点根目录才生效；改完要重启/等轮询）
disable_functions = system,exec,shell_exec,passthru,popen,proc_open,pcntl_exec,putenv
```

必须写入**补丁包里**的 `.user.ini` 才会被平台解包带上；只带 `.php` 无效。

### 验收

```bash
curl -s "http://127.0.0.1:8080/tool?host=127.0.0.1%3Bid"   # 应报错/被拒，不返回 uid=
curl -s "http://127.0.0.1:8080/tool?host=127.0.0.1"         # 业务正常（关键：别把正常功能一起堵死）
```

### 坑

- **`escapeshellarg` 用法错**：必须包住「整个参数」。`ping -c 1 " . escapeshellarg($h)` 错在把选项拆开；写成 `escapeshellarg($h)` 单独一段才对。
- **只想堵 `;` 和 `|`**：`$()`、反引号、换行 `%0a`、`%26%26` 全是绕过。宁可白名单。
- **`disable_functions` 堵不住 `eval`/`assert`/`include`**，那是代码执行不是命令执行，得改代码。
- **LD_PRELOAD / putenv** 组合能绕过 `disable_functions`，看到 `putenv` 一起禁。
- 别删函数：业务就是「执行 ping」，删了接口 = checker 探活失败。校验参数，保留功能。

## 03 文件包含 / 任意文件读取 / 文件上传

### 一手判据

```bash
rg -n "(include|include_once|require|require_once)\s*\(?\s*\\\$" -g '*.php'
rg -n "(file_get_contents|readfile|fopen|file|show_source|highlight_file|copy|unlink)\s*\([^)]*\\\$_(GET|POST|REQUEST)" -g '*.php'
rg -n "move_uploaded_file|\\\$_FILES" -g '*.php'
rg -n "MultipartFile|transferTo\(" -g '*.java'
rg -n "upload|uploadFile|filename" -g '*.py' -g '*.js'
```

### A. 文件包含（LFI / RFI）

```php
// ① 最稳：白名单映射（纯静态页面/模块）
$pages = ['home' => 'pages/home.php', 'about' => 'pages/about.php'];
$p = $_GET['page'] ?? 'home';
include $pages[$p] ?? 'pages/404.php';

// ② 需要动态目录时：basename + realpath + 前缀校验（缺一不可）
$base = realpath(__DIR__ . '/pages');
$f = realpath($base . '/' . basename($_GET['page'] ?? ''));
if ($f **= false || strpos($f, $base . DIRECTORY_SEPARATOR) !** 0) {
    http_response_code(200); echo 'invalid page'; exit;   // 保持 200，别 500
}
include $f;
```

要点：

- `basename()` 防 `../`；`realpath()` 防符号链接与 `..%2f` 编码；前缀校验防 `realpath` 落到 `/etc/passwd`。
- 只做 `str_replace('../','')` 会被 `....//` 绕过。
- `php://filter`、`data://`、`phar://` 都靠 `realpath` 失败挡住（这些 wrapper 没有真实路径）。

### B. 任意文件读取（下载/预览接口）

```php
$base = realpath(__DIR__ . '/uploads');
$name = basename($_GET['f'] ?? '');
$f = realpath($base . '/' . $name);
if ($f **= false || strpos($f, $base . DIRECTORY_SEPARATOR) !** 0) { exit('denied'); }
header('Content-Type: application/octet-stream');
readfile($f);
```

```java
// Java 同款思路：Paths.get(...).normalize() 后必须 startsWith 白名单根
Path base = Paths.get("/app/uploads").toRealPath();
Path f = base.resolve(name).normalize().toRealPath();
if (!f.startsWith(base)) { throw new SecurityException(); }
```

### C. 文件上传

```php
// ① 扩展名白名单（不要黑名单：php3/php4/phtml/pht/inc 全在排队）
$allow = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
$ext = strtolower(pathinfo($_FILES['f']['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allow, true)) { exit('bad type'); }

// ② 真实 MIME（finfo，不信任 $_FILES['type'] 与前端）
$mime = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['f']['tmp_name']);
if (!in_array($mime, ['image/jpeg','image/png','image/gif','application/pdf'], true)) { exit('bad mime'); }

// ③ 内容嗅探：图片类要求 getimagesize 成功；同时拒 PHP/脚本标记
if (strpos($ext, 'gif') !== false && !getimagesize($_FILES['f']['tmp_name'])) { exit('not image'); }
$head = file_get_contents($_FILES['f']['tmp_name'], false, null, 0, 512);
if (preg_match('/<\?php|<\?=|<script|eval\s*\(/i', $head)) { exit('bad content'); }

// ④ 随机重命名 + 目标目录不可执行（关键）
$new = bin2hex(random_bytes(8)) . '.' . $ext;
move_uploaded_file($_FILES['f']['tmp_name'], __DIR__ . '/uploads/' . $new);
```

配套「上传目录禁执行」必须真的进包：

```nginx
# nginx：上传目录只当静态文件
location ^~ /uploads/ { location ~ \.php$ { deny all; } }
```

```apache
# Apache：uploads/.htaccess
php_flag engine off
<FilesMatch "\.(php|php3|phtml|phar)$"> Require all denied </FilesMatch>
```

```ini
; .user.ini（放站点根）：即便上传点被绕过，也限制解析与目录穿越
open_basedir = /var/www/html
```

要点：**`.htaccess` / `.user.ini` 本身也是上传目标**，白名单里绝不能出现它们（无扩展名的白名单校验要显式拒绝文件名以 `.` 开头）。

### 验收

```bash
# 包含：被拒且不是 500
curl -s "http://127.0.0.1:8080/index.php?page=../../../../etc/passwd"
curl -s "http://127.0.0.1:8080/index.php?page=php://filter/convert.base64-encode/resource=index.php"
# 上传：正常图片仍能上传成功并回显可访问 URL（别把业务上传堵死）
curl -s -F "f=@/tmp/1.png" "http://127.0.0.1:8080/upload.php"
# 上传目录里历史 shell 也要清（别人上一轮已经传过马）
find /var/www/html/uploads -name "*.php" -o -name "*.phtml" -o -name ".htaccess" | head
```

### 坑

- **只校验 Content-Type**：`$_FILES['type']` 与 `Content-Type` 完全由客户端决定，等于没校验。
- **`.phtml` / `.php5` / `.phar`** 在某些配置下仍被解析；白名单（不是黑名单）才稳。
- **文件名带路径**：`name="../../x.php"` —— 一定要 `basename()`。
- **二次渲染型**：先上传图片再拼接，处理点在图像库（`imagecreatefrom*`），走 MIME + 内容校验即可，别指望扩展名。
- **禁止把上传目录放在 webroot 之外的软链**：`/uploads -> /etc` 这种洞修法是把目录写死、不允许 `..` 与符号链接（`realpath` 校验）。

## 04 反序列化

### 一手判据

```bash
rg -n "unserialize\s*\(" -g '*.php'
rg -n "phar://|Phar::|file_exists|filesize|md5_file|getimagesize" -g '*.php'   # phar 反序列化触发点
rg -n "ObjectInputStream|readObject|readUnshared" -g '*.java'
rg -n "XStream|readValue|JSON\.parseObject|enableDefaultTyping|autoType" -g '*.java'
rg -n "pickle\.loads|yaml\.load\(|jsonpickle|dill" -g '*.py'
rg -n "node-serialize|unserialize\s*\(" -g '*.js'
```

判据一句话：**攻击者能控制序列化字符串 + 目标语言存在 gadget 类**。修复目标是「控制点不再反序列化」，不是「过滤危险类名」。

### PHP

```php
// ① 首选：换成 JSON（同时改前端，若前端也由你改）
$data = json_decode($_POST['data'], true);

// ② 必须保留原格式：限制允许的类（PHP 7+）
$obj = unserialize($_POST['data'], ['allowed_classes' => false]);   // 只允许数组/标量
// 需要特定类时给白名单：['allowed_classes' => ['Cart', 'Order']]

// ③ phar:// 反序列化：所有接文件路径的函数都受影响
//    修法：入口统一校验，禁止 wrapper 前缀
$p = $_GET['file'] ?? '';
if (preg_match('/^[a-z0-9]+\:\/\//i', $p) || strpos($p, 'phar://') !== false) { exit('denied'); }
```

要点：`allowed_classes => false` 会把本该是对象的数据变成 `__PHP_Incomplete_Class`，**先确认真实业务流**；如果业务真需要对象，就必须写死类名白名单而不是「全放开」。

### Java

```java
// ① 首选：换 JSON（Jackson/Gson）
MyDto dto = objectMapper.readValue(body, MyDto.class);

// ② 必须用 Java 原生序列化：JEP 290 白名单过滤器（JDK 9+ / 8u121+ 均可用）
ObjectInputStream ois = new ObjectInputStream(input);
ois.setObjectInputFilter(info -> {
    Class<?> c = info.serialClass();
    if (c == null) return ObjectInputFilter.Status.UNDECIDED;
    Set<String> allow = Set.of("com.example.dto.User", "java.lang.String", "java.lang.Integer");
    return allow.contains(c.getName())
        ? ObjectInputFilter.Status.ALLOWED
        : ObjectInputFilter.Status.REJECTED;
});
Object o = ois.readObject();
```

```java
// ③ Fastjson：开 safeMode（1.2.68+），或至少关 autoType
ParserConfig.getGlobalInstance().setSafeMode(true);
// 1.2.25~1.2.67 的 autotype 黑名单常被绕过，别指望 deny 列表
```

```java
// ④ Jackson：绝不开 enableDefaultTyping / activateDefaultTyping
// ⑤ XStream：xstream.allowTypes(new Class[]{User.class}) 或 allowTypesByWildcard
// ⑥ SnakeYAML：new Yaml(new SafeConstructor()) —— 默认构造函数是洞
```

### Python

```python
# pickle → json
data = json.loads(body)                     # 改前：pickle.loads(body)

# yaml → safe_load（load 默认可构造任意对象）
cfg = yaml.safe_load(text)

# 必须用 pickle（如内部缓存）时：只允许白名单类
import pickle, io
class SafeUnpickler(pickle.Unpickler):
    OK = {"__main__.Point", "builtins.dict", "builtins.list", "builtins.str"}
    def find_class(self, mod, name):
        if f"{mod}.{name}" not in self.OK:
            raise pickle.UnpicklingError("blocked")
        return super().find_class(mod, name)
SafeUnpickler(io.BytesIO(raw)).load()
```

### Node

```js
// node-serialize 的 unserialize 等于 RCE（IIFE 特性），直接移除
const obj = JSON.parse(body);
```

### 验收

```bash
# 原来的恶意串应不再触发（不落地文件、不回显命令输出），正常业务数据仍能解析
curl -s -X POST --data-urlencode 'data=O:8:"Evil":0:{}' http://127.0.0.1:8080/api/load
curl -s -X POST --data-urlencode 'data={"uid":1}' http://127.0.0.1:8080/api/load
```

### 坑

- **黑名单过滤类名必被绕过**：`java.util.PriorityQueue`、TemplatesImpl、CC 链的类名变形太多，只能白名单。
- **`unserialize` 只改了主入口**：`cookie`、`session`、`cache`、`api/v1/`、旧版接口都可能还有一处。`rg` 全仓扫一遍。
- **phar:// 是无文件触发**：修了 `unserialize` 但 `file_exists($_GET['f'])` 还在，一样能打。禁用 wrapper 前缀。
- **只加 `@` 抑制报错不算修**：错误被吞但对象照样构造、魔术方法照样执行。
- Java 里 `readObject` 常在 filter/拦截器里被调用，注意 `Spring` 的 `SerializationUtils`、`RabbitMQ` 消息体、`Redis` 序列化器（`JdkSerializationRedisSerializer` → 换 `StringRedisSerializer`）。

## 05 模板注入与表达式注入

### 一手判据

```bash
rg -n "render_template_string|render_template\(.*request|Template\(" -g '*.py'
rg -n "|safe|Markup\(|autoescape\s*=\s*False" -g '*.py' -g '*.html'
rg -n "SpelExpressionParser|parseExpression|Ognl|ScriptEngine|GroovyShell|eval\(" -g '*.java'
rg -n "Thymeleaf|templateEngine\.process|resolveTemplate" -g '*.java'
rg -n "ejs\.render|pug\.render|handlebars\.compile|new Function" -g '*.js'
rg -n "velocity|freemarker|\.ftl|\.vm" -g '*.java' -g '*.ftl'
```

手测探针（看到回显数字就是洞）：`{% raw %}{{{% endraw %}7*7}}` → 49、`${7*7}` → 49、`#{7*7}` → 49、`<%= 7*7 %>` → 49、`${% raw %}{{{% endraw %}7*7}}`（Handlebars）。

### Python / Jinja2（最高频）

```python
# 洞：用户输入直接当模板
# return render_template_string(request.args['t'])

# ① 首选：模板固定，数据当变量传
return render_template_string("<h1>Hello {% raw %}{{{% endraw %} name }}</h1>", name=request.args.get('t'))

# ② 业务确实需要动态模板：沙箱环境
from jinja2.sandbox import SandboxedEnvironment
env = SandboxedEnvironment()
return env.from_string(user_tpl).render(name=request.args.get('t'))

# ③ 模板名由用户控制（选皮肤/选语言）→ 白名单
TPL = {'cn': 'index_cn.html', 'en': 'index_en.html'}
return render_template(TPL.get(lang, 'index_cn.html'))
```

要点：`SandboxedEnvironment` 能挡 `__class__`/`__globals__` 链；但**它不禁危险的 filter 组合**，能在沙箱的话就用固定模板。

### Java

```java
// ① Thymeleaf：模板名禁止用户控制；必须动态就白名单
Set<String> ok = Set.of("home", "list", "detail");
String view = ok.contains(req.getParameter("v")) ? req.getParameter("v") : "home";
return new ModelAndView(view);

// ② SpEL：绝不把用户输入交给 parseExpression
// 改前：parser.parseExpression(req.getParameter("q")).getValue();
// 改后：用固定表达式 + 变量注入
Expression exp = parser.parseExpression("#a + #b");
StandardEvaluationContext ctx = new StandardEvaluationContext();
ctx.setVariable("a", 1); ctx.setVariable("b", 2);
exp.getValue(ctx);

// ③ 确实必须解析用户表达式：用 SimpleEvaluationContext（禁反射/禁方法调用/禁构造）
SimpleEvaluationContext ctx2 = SimpleEvaluationContext.forReadOnlyDataBinding().build();

// ④ OGNL / GroovyShell / ScriptEngine(js)：生产环境不要解析用户输入
```

### Node

```js
// 洞：ejs.render(userTpl, data) / handlebars.compile(userTpl)
// 修：模板文件固定，用户只提供数据
res.render('profile', { bio: req.body.bio });
// 需要编译期自定义就把模板放到 templates/ 且文件名白名单校验
if (!/^[a-z0-9_-]+\.ejs$/.test(name)) return res.status(200).end('bad');
```

### 验收

```bash
curl -s "http://127.0.0.1:8080/preview?t=%7B%7B7*7%7D%7D"    # 应原样回显 {% raw %}{{{% endraw %}7*7}} 或走转义，不能出现 49
curl -s "http://127.0.0.1:8080/preview?t=hello"              # 正常渲染
```

### 坑

- **只过滤 `{% raw %}{{{% endraw %}`**：`{% raw %}{%{% endraw %}`、`${% raw %}{{{% endraw %}`、`#{`、`<%=` 全是别的引擎语法；多引擎混用时逐引擎验。
- **`render_template_string` 换成 `render_template`** 若模板文件名仍由用户拼，等于只换了个洞（`../../etc/passwd`）。
- **`|safe` 不是 SSTI**：那是 XSS 面（见 07 XSS-CSRF-逻辑漏洞），别搞混。
- Spring 的 `SimpleEvaluationContext` 必须显式创建，默认 `StandardEvaluationContext` 就是 RCE 面。
- FreeMarker 的 `?new()` 能实例化任意类，老版本要 `setNewBuiltinClassResolver(TemplateClassResolver.ALLOWS_NOTHING_RESOLVER)`。

## 06 认证越权 / SSRF / XXE

### A. 越权（AWD 里最容易被别人稳吃的洞）

#### 判据

```bash
rg -n "getParameter\(\"id\"\)|\\\$_GET['id']|req\.params\.id" -g '*.java' -g '*.php' -g '*.js'
# 关键：查到数据后有没有校验 owner
rg -n "where id\s*=|findById|select .* from .* where id" -g '*'
```

三类：水平（改 id 看别人数据）、垂直（普通用户打管理接口）、未授权（接口根本没拦）。

#### 最小修复

```php
// ① 对象级鉴权：查到数据后必须校验归属，不能只靠前端隐藏
$row = $db->query("select * from orders where id=" . intval($_GET['id']))->fetch();
if (!$row || (int)$row['uid'] !== (int)$_SESSION['uid']) {
    http_response_code(200); echo json_encode(['code'=>1,'msg'=>'not found']); exit;  // 200 + 原结构
}
```

```java
// ② Spring：用 @PreAuthorize 或方法内显式校验，并注意 @RequestParam 猜测式 id
Order o = repo.findById(id).orElse(null);
if (o == null || !o.getUid().equals(SecurityUtils.uid())) {
    return ResponseEntity.ok(Result.fail("not found"));
}
```

```java
// ③ 垂直越权：管理路由统一拦截（不要在每个方法里手写判断）
// Spring Security 配置：.antMatchers("/admin/**").hasRole("ADMIN")
// 或 filter 里：if (uri.startsWith("/admin") && !isAdmin(session)) return 403 页面（保持原协议）
```

```python
# ④ Flask 装饰器统一兜底，避免漏点
def login_required(f):
    @wraps(f)
    def w(*a, **k):
        if not session.get('uid'): return redirect('/login')   # 注意 checker 需登录态时别改成 500
        return f(*a, **k)
    return w
```

要点：**未授权修复最容易自伤** —— checker 如果带登录态探活，改完仍要能用；如果 checker 匿名探活某接口，就别给它加鉴权。先用 `curl` 模拟 checker 那一条请求。

#### JWT 相关

```python
# 必须校验 alg，禁用 none；密钥别写死弱口令
import jwt
header = jwt.get_unverified_header(token)
if header.get('alg') not in ('HS256', 'RS256'):
    abort(401)
payload = jwt.decode(token, SECRET, algorithms=['HS256'])   # algorithms 白名单是关键
```

```java
// jjwt：解析时显式指定算法，别用 parseClaimsJwt（不验签）
Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
```

### B. SSRF

#### 判据

```bash
rg -n "curl_exec|file_get_contents|fsockopen|requests\.(get|post)\(|urlopen|axios\.(get|post)|RestTemplate|HttpClient" -g '*'
```

#### 最小修复（PHP）

```php
function safe_url(string $u): ?string {
    $p = parse_url($u);
    if (!$p || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true)) return null;
    $host = $p['host'] ?? '';
    if ($host === '') return null;
    $ip = gethostbyname($host);
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return null;                                     // 私有段 / 保留段 一律拒
    }
    return $u;
}
$url = safe_url($_GET['url'] ?? '');
if ($url === null) { exit('bad url'); }
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,      // 禁跟随跳转，否则 302 到 127.0.0.1 绕过
    CURLOPT_TIMEOUT => 5,
    CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
]);
```

Python 同款要点：

```python
import ipaddress, socket, urllib.parse
def ok(u):
    p = urllib.parse.urlparse(u)
    if p.scheme not in ("http", "https"): return False
    ip = ipaddress.ip_address(socket.gethostbyname(p.hostname))
    return not (ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local)
```

#### 坑

- **只校验字符串**（`strpos($u,'127.0.0.1')`）：`0x7f000001`、`2130706433`、`127.1`、`[::1]`、`@` 前缀全绕。
- **`gethostbyname` 与真实连接之间可 DNS rebinding**：要求严格时解析出的 IP 直接 pin 给 curl（`CURLOPT_RESOLVE`）。
- `FOLLOWLOCATION` 开着等于送一个内网跳板。
- 云环境还要拒 `169.254.169.254`（元数据）；`FILTER_FLAG_NO_RES_RANGE` 已覆盖。

### C. XXE

#### 最小修复

```php
// PHP 8 默认不加载外部实体；PHP 7 需显式关
libxml_disable_entity_loader(true);          // PHP < 8
$xml = simplexml_load_string($input, 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOENT);
// 更稳：LIBXML_NONET 禁网络实体；不要加 LIBXML_DTDLOAD
```

```java
DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
f.setFeature("http://xml.org/sax/features/external-general-entities", false);
f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
f.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
f.setXIncludeAware(false);
f.setExpandEntityReferences(false);
```

```python
from lxml import etree
parser = etree.XMLParser(resolve_entities=False, no_network=True, dtd_validation=False, load_dtd=False)
root = etree.fromstring(data, parser)
# 备选：defusedxml（drop-in 替换，最省事）
```

#### 验收

```bash
# 上传/提交一个带 <!DOCTYPE> 外部实体的 XML，应报错或原样失败，不能回显文件内容
curl -s -X POST -H 'Content-Type: application/xml' --data-binary @xxe.xml http://127.0.0.1:8080/api/parse
```

### 坑

- **`simplexml_load_file`/`DOMDocument::load` 的兄弟函数**常被漏，全仓搜 XML 入口。
- XXE 也能打 SSRF / DoS（billion laughs），修复点是「禁 DOCTYPE + 禁外部实体」，只关网络不关本地文件还不够（`file://` 读 `/flag`）。
- Office/PDF 解析库（POI、iText）也吃 XML，注意它们的解析器配置。

## 07 XSS / CSRF / 逻辑漏洞

### A. XSS

#### 判据

```bash
rg -n "echo\s+.*\\\$_(GET|POST|REQUEST)|print\s+.*\\\$_" -g '*.php'
rg -n "innerHTML|document\.write|v-html|dangerouslySetInnerHTML" -g '*.js' -g '*.html'
rg -n "\|safe|Markup\(|autoescape\s*=\s*False" -g '*.py' -g '*.html'
rg -n "\$\{.*\}|<c:out|c:out" -g '*.jsp'
```

#### 最小修复：按上下文编码（不是一律 `htmlspecialchars`）

```php
// HTML 文本/属性
echo htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

// 属性里放 URL：还要校验协议（javascript: 绕过）
$u = $v;
if (!preg_match('#^https?://#i', $u)) { $u = '/'; }
echo '<a href="' . htmlspecialchars($u, ENT_QUOTES, 'UTF-8') . '">x</a>';

// 塞进 <script>：不要用 htmlspecialchars，用 json_encode
echo '<script>var d = ' . json_encode($v, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . ';</script>';
```

```python
# Jinja2 默认自动转义，洞来自 |safe / Markup
{% raw %}{{{% endraw %} v }}          {# 安全 #}
{% raw %}{{{% endraw %} v|e }}        {# 显式转义 #}
{% raw %}{{{% endraw %} v|safe }}     {# 洞：用户可控时删掉 safe #}
```

```java
// JSP：用 <c:out value="${v}"/> 或 fn:escapeXml；别用 ${v} 直出
// Thymeleaf 的 th:utext 是洞，th:text 安全
```

**兜底 CSP**（不作为唯一手段）：

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'";
```

#### 坑

- 存储型 XSS：库里已有的恶意数据不会被新加的编码「清掉」——但输出编码后浏览器不再执行，够了；**别去批量改数据库**（checker 可能校验数据一致性）。
- 富文本场景（要保留 `<b>`）：用白名单过滤器（`HTMLPurifier` / `DOMPurify`），别用正则删 `script`。
- `htmlspecialchars` 默认 `ENT_COMPAT` 不转单引号，**属性用单引号的场景必用 `ENT_QUOTES`**。

### B. CSRF

```php
// ① token：会话内生成，表单/请求头带回来，服务端比对
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
$sent = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
if (!hash_equals($_SESSION['csrf'], (string)$sent)) { http_response_code(200); echo 'bad token'; exit; }

// ② 双保险：校验 Origin/Referer（同源才放行）
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !** '' && parse_url($origin, PHP_URL_HOST) !** $_SERVER['HTTP_HOST']) { exit('bad origin'); }
```

```python
# Flask-WTF 自带 CSRFProtect；纯手写就对比 session token
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
```

```java
// Spring Security 默认开 CSRF；若被 disable() 过，改回默认或加 SameSite
// .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
```

要点：`SameSite=Lax` 能挡掉大部分跨站 POST，但 GET 型改状态接口仍会中招——**改状态的接口必须是 POST + token**。

### C. 逻辑漏洞（AWD 里常是「一击拿分」的点）

#### 1) 竞态 / 超领（并发重复使用）

```php
// 洞：先查余额再扣，两个请求都能过
// 修 ①：数据库层唯一约束（最稳，SQL 单独执行一次）
// CREATE UNIQUE INDEX uk_redeem ON redeem_log (uid, coupon_id);

// 修 ②：行锁 + 事务
$db->beginTransaction();
$row = $db->query("select stock from goods where id=1 for update")->fetch();   // SELECT ... FOR UPDATE
if ($row['stock'] <= 0) { $db->rollBack(); exit('sold out'); }
$db->exec("update goods set stock=stock-1 where id=1");
$db->commit();

// 修 ③：Redis 分布式锁 / SETNX
if (!$redis->set("lock:coupon:{$uid}:{$cid}", 1, ['nx', 'ex' => 5])) { exit('busy'); }
```

```python
# 乐观锁：带版本号更新，影响行数为 0 就是失败
cur.execute("update goods set stock=stock-1, ver=ver+1 where id=%s and stock>0 and ver=%s", (gid, ver))
if cur.rowcount == 0: return {"code": 1, "msg": "conflict"}
```

#### 2) 金额 / 数量

```php
// 洞：价格来自前端
// $price = $_POST['price'];
$price = (float)$db->query("select price from goods where id=" . intval($_POST['gid']))->fetchColumn();  // 服务端取价
// 数量必须有上下限，且乘完校验总价
$num = max(1, min(10, (int)$_POST['num']));
```

#### 3) 验证码 / 短信 / 找回密码

```php
// 三要素：一次性 + 服务端校验 + 失效时间
$k = "code:{$phone}";
$code = $redis->get($k);
if (!$code || !hash_equals($code, (string)$_POST['code'])) { exit('bad code'); }
$redis->del($k);                                    // 用完即删（防重放）
if ($redis->exists("try:{$phone}") && $redis->get("try:{$phone}") > 5) { exit('too many'); }
$redis->incr("try:{$phone}"); $redis->expire("try:{$phone}", 300);
```

#### 4) 越权改状态 / 参数污染

```php
// 白名单字段，禁止 $data = $_POST 直接 update
$allow = ['nickname', 'avatar', 'intro'];
$data = array_intersect_key($_POST, array_flip($allow));
// 关键：uid 只能来自 session，不能来自参数
$data['uid'] = $_SESSION['uid'];
```

### 验收

```bash
# 并发验证（竞态修完应只有一个成功）
seq 20 | xargs -P 20 -I{} curl -s -X POST -d "gid=1&num=1" http://127.0.0.1:8080/buy -o /dev/null -w "%{http_code}\n" | sort | uniq -c
# XSS 修复：回显应被编码
curl -s "http://127.0.0.1:8080/search?q=<script>alert(1)</script>" | head -5
```

### 坑

- 用 `xargs -P` 打自己服务验证竞态时注意：**别把 checker 探活打挂**，并发数控制在个位数、只打本地副本。
- 加 `token` 让 checker 的「原请求」失效 = 探活失败：只给**改状态**的接口加，且兼容原有字段名。
- 逻辑修复最容易破坏返回结构：改完必须比对新旧 JSON 字段。

## 08 框架配置与依赖 CVE（改不动代码时的最小面）

> 原则：依赖升级在中通常做不到（要联网重装），所以这类修的落点是**关开关、改配置、堵入口**。每条都写清「能挡什么、挡不住什么」，别当成彻底修复。

### A. Spring Boot

```properties
# 1) Actuator 泄露（/env /heapdump /jolokia 常被打）
management.endpoints.web.exposure.include=health,info
management.endpoint.env.show-values=NEVER
management.server.port=                     # 或干脆只监听内网

# 2) 上传/静态目录暴露、debug
server.error.include-stacktrace=never
server.error.include-message=never
```

- **Spring4Shell（CVE-2022-22965）**：数据绑定 `class.module.classLoader` 打，修法 = 升级，或加 `@InitBinder` 禁 `class.*`：
  ```java
  @InitBinder
  public void lockProps(WebDataBinder b) { b.setDisallowedFields("class.*", "Class.*", "*.class.*"); }
  ```
- **SpEL / OGNL 注入**：见 05 模板注入与表达式注入。
- **Log4j2（CVE-2021-44228）**：`lookup` 打 JNDI。挡：`-Dlog4j2.formatMsgNoLookups=true`、`log4j2.component.properties` 写 `log4j2.formatMsgNoLookups=true`；根治升级 2.17+。

### B. ThinkPHP（国内赛题高频）

```php
// 5.0.x / 5.1.x RCE 走的都是「路由参数 → 反射调用」。
// 临时挡法（不完美但能过 checker）：入口统一过滤请求参数里的危险片段
// public/index.php 顶部
foreach ($_GET as $k => $v) {
    if (preg_match('/\\\\|\\$|\\{|\\}/', (string)$v) || preg_match('/^(s|filter|invokeFunction)$/i', (string)$k)) {
        http_response_code(200); echo json_encode(['code'=>1,'msg'=>'bad request']); exit;
    }
}
```

```php
// 更对症：关掉不必要的能力
// config/app.php —— 合并进现有数组返回
return [
    'debug'          => false,
    'app_debug'      => false,
    'default_filter' => 'htmlspecialchars',
];
```

- `5.0.23/5.1.31` 之后的补丁思路是**禁止 `s` 参数走反射**；能升级就升级，否则按上面过滤 + `app_debug=false`（debug 页面本身有信息泄露与变量注入）。
- ThinkPHP 3.x 的 `?s=/index/\think\app/invokefunction` 一类入口：直接拦 `s` 参数中的反斜杠。

### C. Laravel

```text
APP_DEBUG=false          # debug 页面 = .env 泄露 + 变量注入
APP_KEY=base64:xxxx      # 为空会导致 cookie/加密失效（也可能是反序列化洞）
```

```nginx
# 无论什么框架，这些路径都不该被访问
location ~* /\.(env|git|svn|hg|DS_Store) { deny all; }
location ~* \.(sql|bak|swp|old|zip|tar\.gz)$ { deny all; }
location ~ /(storage|bootstrap/cache)/.*\.php$ { deny all; }
```

- **Laravel Ignition（CVE-2021-3129）**：`APP_DEBUG=true` + Ignition < 2.5.2 → 日志投毒 RCE。挡：`APP_DEBUG=false`。
- **反序列化 gadget**（Laravel/Yii/ThinkPHP）：见 04 反序列化，只在「能控制 unserialize 输入」时成立。

### D. Nginx / Apache 通用加固（配置类，打进包才算数）

```nginx
# 关目录列举、关版本号
autoindex off;
server_tokens off;

# 上传目录禁解析（双保险）
location ^~ /uploads/ { location ~ \.php$ { deny all; } }

# 限制危险方法
if ($request_method !~ ^(GET|POST|HEAD)$) { return 405; }
```

```apache
Options -Indexes
ServerTokens Prod
<Directory /var/www/html/uploads>
  php_flag engine off
</Directory>
```

### E. 依赖 CVE 快速判型（没有网时）

```bash
# 先看版本，再对内存里的洞表
cat composer.json composer.lock 2>/dev/null | rg '"name"|"version"' | head -40
cat pom.xml | rg -n "version|artifactId" | head -40
cat package.json | rg -n '"dependencies"' -A 30
cat requirements.txt 2>/dev/null

# 有网时（赛前预热过才能离线用）
composer audit         # 走 static php：composer
npm audit
pip-audit              # 或 bandit 只查代码不查依赖
```

常见一击命中清单：Log4j2 <2.17、Fastjson <1.2.83（safeMode 未开）、Shiro <1.8（rememberMe 反序列化 → 硬编码 key）、Struts2（OGNL）、Spring <5.3.18（Spring4Shell）、ThinkPHP 5.0.x/5.1.x、Laravel Ignition <2.5.2、Yii2 <2.0.42、Jenkins/Confluence 之类组件题。

### 验收与坑

```bash
# 配置类改动也要验业务：静态资源、上传、原接口
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/.env     # 期望 403/404，不是 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/uploads/1.png
```

- **配置类改动必须真的进包**：`.htaccess`、`.user.ini`、`nginx.conf` 只带 `.php` 是不生效的。
- `deny all` 写太宽（例如把 `/api/` 也拒了）直接探活失败——只用 `location` 精确匹配敏感后缀。
- 关 `debug` 后错误页变了：如果 checker 依赖某个报错字段，先看平台给的正常响应样例。
- **Shiro 硬编码 key** 的修法：换 key（`shiro.ini` 的 `rememberMe` cipherKey）+ 关闭 `rememberMe` 不必要功能；只改 key 而不清 cookie 的话，旧的恶意 cookie 仍可能触发（注意 base64 编码后的 AES 解密异常处理）。

## 09 工具清单与命令速查

> 赛中流程见 **10 赛中SOP**。
>
> **完整版（每个工具的作用+参数+坑）在** 00 工具手册索引（`03 环境与运维/工具手册/`）；本篇只留最常用命令。
>
> 全部路径/版本为 2026-11-21 实测。除特别说明外都在 `~/.local/bin`（已在 PATH）。
> 打靶机时记得 `--no-proxy` 或 `unset http_proxy`，否则 Clash（127.0.0.1:7897）会把内网请求吞掉。

### 一、语言运行时（改代码/编译/本地复现）

| 命令 | 版本 | 说明 |
|---|---|---|
| `php` / `php82` / `php81` | 8.3.32 / 8.2.32 / 8.1.34 | static-php，含 pdo_mysql·sqlite3·curl·gd·zip；**无 mysqli** |
| `php -S 127.0.0.1:18080 -t <站点根>` | — | 本地起 PHP 站（单进程） |
| `php -l x.php` | — | 语法闸门（打包前必过） |
| `pyweb` | Python 3.14.10 | 进 `~/opt/webvenv`：requests·bs4·lxml·pyjwt·flask·httpx·pymysql·redis·pycryptodome |
| `python3` | 3.14.10 | 系统解释器（无 pip，装包用 `uv pip install --python ~/opt/webvenv/bin/python`） |
| `javac` / `jar` / `javap` | 17.0.21 | 指向 `~/opt/jdk/jdk-17.0.21+9` |
| `java` | JRE 27 | 系统默认（**Burp 靠它启动，别 export JAVA_HOME**） |
| `java17` / `java8` | 17.0.21 / 1.8.0_504 | 指定版本跑 jar（ysoserial 用 `java8`） |
| `node` / `npm` | 26.13.1 / 12.2.3 | — |
| `go` | 1.27.4 | `GOBIN=~/.local/bin go install <pkg>@latest` |
| `composer` | 2.11.2 | 走 static php 8.3 |

### 二、判型与侦察（先看清是什么）

```bash
nmap -sV -p- -T4 <host>                       # 7.95  端口/服务先跑一遍（题目环境内）
whatweb -a 3 http://<host>/                   # 0.5.5 指纹：框架/CMS/中间件
httpx -u http://<host> -title -tech-detect -status-code -no-color   # 资产+技术栈一行流
katana -u http://<host>/ -d 3 -jc -o urls.txt                       # 爬虫，-jc 抓 JS 里的接口
waybackurls <domain>                          # 历史 URL（有域名时）
```

### 三、路径 / 参数 / 漏洞扫描

```bash
dirsearch -u http://<host>/ -e php,html,js,bak,zip,txt -t 30 -q          # 0.5.0
gobuster dir -u http://<host>/ -w /usr/share/wordlists/dirb/common.txt -t 30   # 3.6
ffuf -u http://<host>/FUZZ -w <字典> -mc 200,301,302,403 -t 50            # 2.1.0
ffuf -u http://<host>/index.php?FUZZ=1 -w <参数字典> -fs <正常响应长度>    # 找隐藏参数
nuclei -u http://<host>/ -tags cve,rce,sqli,lfi -severity critical,high,medium   # v3.11.1，14225 模板已离线
nuclei -l targets.txt -t ~/nuclei-templates/http/cves/ -stats            # 按模板目录打
dalfox url "http://<host>/?q=1" --skip-bav                               # XSS 自动验证
```

Banner/常见坑：`nuclei -u ... -rate-limit 50` 限速，别把 checker 打挂；`-duc` 关更新检查可提速。

### 四、手工利用（Burp 及替代）

**Burp Suite 2026.11-55090** —— `burpsuite`（走 `/bin/java`=JRE27）
扩展 jar：`~/opt/burp-ext/turbo-intruder-all.jar`、`param-miner-all.jar`（Extensions → Add → Java）。

- 竞态/大字典爆破：Turbo Intruder（会话内写 python，能压到毫秒级并发）
- 隐藏参数/未文档化 header：Param Miner（右键 → Guess params）
- Scope 先划死（只填题目 host），Proxy 勾 `And URL Is in target scope`，避免把平台流量带进录屏

CLI 替代（比 Burp 适合批量）：

```bash
sqlmap -u "http://<host>/x.php?id=1" --batch --dbs --level 3 --risk 2    # 1.9.6
sqlmap -r req.txt -p id --os-shell                                     # 从 Burp 存的请求文件跑
jwt -t http://<host>/ -M at -rh "Authorization: Bearer <token>"        # jwt_tool：-M at=全测，a=alg:none，c=弱密钥
fenjing crack -u "http://<host>/page" -i name -m GET -e "id"           # SSTI 自动（-i 参数名必填，-e 成功后执行）
fenjing scan -u "http://<host>/"                                       # 只扫表单不改数据
fenjing webui                                                          # 浏览器界面操作，最直观
```

### 五、反序列化武器库（`~/ctf/tools/`）

```bash
# PHP gadget 链（170 条）
php ~/ctf/tools/phpggc/phpggc -l                                     # 列链
php ~/ctf/tools/phpggc/phpggc Monolog/RCE1 system id                  # 生成 payload
php ~/ctf/tools/phpggc/phpggc Laravel/RCE1 exec 'ls' -b              # -b 输出 base64
php ~/ctf/tools/phpggc/phpggc ThinkPHP/RCE2 system id --fast-destruct

# php://filter 链（无文件写 shell，用在 include 点）
python3 ~/ctf/tools/php_filter_chain_generator.py --chain '<?php system("id");?>'
python3 ~/ctf/tools/php_filter_chain_generator.py --chain '<?php system("id");?>' --raw

# Java gadget 链（ysoserial，必须 java8）
java8 -jar ~/ctf/tools/ysoserial-all.jar                                    # 列 payload
java8 -jar ~/ctf/tools/ysoserial-all.jar CommonsCollections5 'id' | base64 -w0
java8 -jar ~/ctf/tools/ysoserial-all.jar CommonsBeanutils1 'bash -c {echo,<b64>}|{base64,-d}|bash' -o /tmp/p.ser

# 速查库
ls ~/ctf/tools/Web-CTF-Cheatsheet        # 离线 payload 速查（gh 打得开）
```

### 六、源码审计

```bash
~/ctf/省赛/tools/audit.sh <源码目录> [名字]      # 一键摸底：入口/flag/残留 + 四语言汇聚点 + semgrep + gitleaks
semgrep --config p/php --config p/java --config p/python --config p/security-audit --metrics=off <dir>
semgrep --config p/secrets --json <dir> | jq -r '.results[] | "\(.path):\(.start.line) \(.check_id)"'
bandit -r <py目录> -ll -q                        # Python 专项（1.9.4）
gitleaks dir <dir> --no-banner -v                # 硬编码密钥（8.30.1）
composer audit ; npm audit                       # 依赖 CVE（需网络/预热缓存）
```

**离线规则包**（赛场没网也能扫，已实测断网可用）：`~/ctf/省赛/rules/*.yaml`
（php 24 条 / java 60 / python 151 / javascript 74 / secrets 52 / security-audit 225 / sql-injection 47 / xss 35 / command-injection 30）

```bash
R=~/ctf/省赛/rules
semgrep --config "$R/php.yaml" --config "$R/secrets.yaml" --metrics=off ~/awd/题目目录
# audit.sh 会自动优先用本地规则包，没有才回落到 registry
```

### 七、修复验证与交付

```bash
php -l 改过的.php && pyweb -m py_compile x.py && node --check x.js     # 语法闸门
curl -sv "http://127.0.0.1:8080/原接口" | tail -20                     # 业务没坏（200 + 字段不变）
curl -s "http://127.0.0.1:8080/x?id=1%20and%201=1"                     # 攻击 payload 已失效

~/ctf/省赛/tools/mkpatch.sh <题目目录> <题名> -d <基线>                 # 打 tar.gz（含 php -l 闸门）
~/ctf/省赛/tools/mkpatch.sh <题目目录> <题名> -p var/www/html           # 平台解包到 / 时加前缀
~/ctf/省赛/tools/mkpatch.sh --check dist/<题名>.tar.gz                  # 上传前复核路径/文件数/sha256
```

### 八、批量打多队

```bash
printf '10.1.1.5\n10.1.1.6:8080\n' > targets.txt
~/ctf/省赛/tools/batchhit.py -t targets.txt -m GET --path /index.php --query 'id=1%20or%201=1'
~/ctf/省赛/tools/batchhit.py -t targets.txt -m POST --path /upload.php --file 'f=@/tmp/s.php'
~/ctf/省赛/tools/batchhit.py -t targets.txt -m GET --path /x.php --query 'cmd=cat%20/flag%s' -j 16
# 结果落 ~/ctf/省赛/evidence/<name>.jsonl，终端直接打命中行
```

### 九、非 web 顺手工具（团队需要时）

`jadx`（Java 反编译）· `hashcat`/`john`（爆破 hash）· `binwalk`·`foremost`（拆固件/隐写）·
`steghide`·`zsteg`·`exiftool`（杂项）· `ropper`/`one_gadget`/`seccomp-tools`（pwn）·
`socat`·`nc`（转发/连接）· `tcpdump`/`tshark`/`capinfos`（流量分析）· `ghidra`（**仅 zip 未解包**：`~/opt/ghidra_12.2_PUBLIC_20261016.zip`）

### 十、判型速查：看到什么用什么

| 线索 | 第一条命令 |
|---|---|
| 只知道 IP:PORT | `whatweb -a 3` + `httpx -tech-detect` |
| 有源码目录 | `audit.sh` |
| 疑似目录/备份 | `dirsearch -e php,bak,zip,txt` + 手看 `robots.txt` `/www.zip` `/backup` |
| 有 `?id=` 类参数 | `sqlmap -u ... --batch`（先手测 `and 1=1`） |
| 有回显用户输入 | `dalfox url` |
| 有登录/JWT | `jwt -M at`，看 alg/kid/jwks |
| 有上传 | 手测 `.php`/`.phtml`/`.user.ini`/`.htaccess`/MIME/内容嗅探 |
| 有 `include`/`file=` | `php_filter_chain_generator.py` + 手测 `php://filter` |
| 有 `unserialize`/cookie 序列化串 | `phpggc` 对应链 |
| Java 站 + 有反序列化入口 | `java8 -jar ysoserial-all.jar` |
| 只知道是 Java 组件 | `nuclei -tags <cve名>`；`jadx` 反编译 jar 看依赖版本 |

## 10 赛中 SOP（照这个做）

> AWD PLUS，3 小时。**防御分每轮结算，攻击分一次性**——补丁过 check 的性价比高于多啃一题。
> 开赛第一件事是**确认录屏在跑**，不是看题。

### 0–5 min ｜ 开场

```bash
# 1) 录屏（手册要求全程、不得剪辑、不得虚拟机内录）
# 2) 平台登录（手机号+验证码）→ 抄下所有靶机 IP:PORT 与题目列表
# 3) 记时间：比赛 9:00-12:00，WP 当天 14:00 前，录屏次日 9:00 前
```

### 5–15 min ｜ 拿环境

```bash
cd ~/ctf/省赛 && mkdir -p work && cd work
# 附件下到本地（只从平台下，不要 IM 转发）
unzip -q -O UTF-8 xxx.zip -d web1 || tar xzf xxx.tgz
cp -a web1 .baseline_web1          # ★ 基线：--diff 打包 + 回滚的唯一依据，不能省
docker save img.tar | tar x -C web1_img   # 给的是镜像时
ls -la web1; grep -rn 'flag' web1 | head
```

判线上跑的是哪份代码：`ps aux | grep -E 'php-fpm|gunicorn|java|node'`。

### 15–30 min ｜ 摸底

```bash
~/ctf/省赛/tools/audit.sh web1            # 6 秒出报告：入口/flag/残留/汇聚点/semgrep/gitleaks
cat ~/ctf/省赛/evidence/web1.audit.txt
```

同时开 Burp：Scope 只填题目 host，Proxy 勾 `And URL Is in target scope`。

### 30–90 min ｜ 打（先拿一个 flag 交掉）

```bash
# 手工验证一条链（Burp Repeater / curl）
curl -s "http://HOST/index.php?id=1%20and%201=1" | head
sqlmap -u "http://HOST/x.php?id=1" --batch --dbs          # 或 -r req.txt
php ~/ctf/tools/phpggc/phpggc -l Laravel                  # 反序列化
python3 ~/ctf/tools/php_filter_chain_generator.py --chain '<?php system("id");?>'   # LFI 造码
# 拿到 flag 立刻网页提交，别等

# 量产：同一条链打所有队
printf '10.1.1.5\n10.1.1.6:8080\n' > targets.txt
~/ctf/省赛/tools/batchhit.py -t targets.txt -m GET --path /x.php --query 'id=1%20or%201=1'
```

### 90–165 min ｜ 守（这段最容易白丢分）

```bash
# 1) 改最小面：只堵入口，不动路由/字段/状态码（按 01–08 篇的模板）
# 2) 语法闸门
php -l 改过的.php
# 3) 验业务没坏（checker 就探这个）
curl -s -o /dev/null -w '%{http_code} %{size_download}\n' "http://HOST/原接口"
# 4) 重启才生效
systemctl reload php-fpm 2>/dev/null || docker restart <cid> || pm2 restart app
# 5) 打包 + 自检
~/ctf/省赛/tools/mkpatch.sh web1 web1 -d .baseline_web1 -p var/www/html
~/ctf/省赛/tools/mkpatch.sh --check dist/web1.tar.gz
# 6) 平台：防御 → 上传 → 查看提交记录 → 申请 check → 防御日志看绿
```

包结构/自检细节见 **11 补丁包结构**。**看到防御日志没绿就是没过**，不要凭“传上去了”就放心。改动后重新打包重新 check。

### 165–180 min ｜ 收尾

- 每道题补丁都 check 全绿；再跑一次 `batchhit.py` 抢别人的新洞。
- 截图存档（分析过程/脚本/取 flag/交 flag），录屏分段保存。
- 平台记录里核对已交 flag 数。

### 三条铁律 + 四条红线

**铁律**：① 不删功能 ② 不返回 500 ③ 不改协议（字段名/状态码/JSON 结构）。
**红线**：只打题目环境；不扫不压比赛平台；不跨队交流；附件只从平台下。

### 卡住时贴什么给我（省往返）

1. `audit.sh` 报告（199 行左右）+ 它点名的 3–5 个文件
2. 你要的效果（“要拿 flag” 还是 “要过 checker”）
3. 报错原文 / 响应原文（前 300 字）

**别**一次贴 300 个文件，我会被截断。文件 < 10 个 / < 500 行 → 直接贴全，比跑脚本快。

## 11 补丁包（tar.gz）——五步，照着敲

> 你只要记 5 条命令。每步都写了「实际会看到什么」，对上了就继续下一步。

### 第 1 步：把题目解包到一个目录

```bash
cd ~/ctf/省赛
mkdir -p work/web1
tar xzf ~/Downloads/题目附件.tgz -C work/web1     # zip 用 unzip -q -O UTF-8 附件.zip -d work/web1
find work/web1 -type f | head
```

会看到类似：
```text
work/web1/index.php
work/web1/inc/db.php
```
👉 **`work/web1` 就等于靶机上的站点根**，后面所有路径都相对它。

### 第 2 步：立刻复制一份「原样」备份（基线）

```bash
cp -a work/web1 work/.base_web1
```

👉 这份不要改、不要删。第 4 步靠它算「我改了哪些文件」。

### 第 3 步：改代码

```bash
code ~/ctf/省赛/work/web1          # vscode 打开改
php -l work/web1/index.php         # 可选：期望 No syntax errors detected
```

改动模板看 01 SQL注入 那一组速查（判据 → 修复代码 → 验收）。

### 第 4 步：一条命令打包

```bash
~/ctf/省赛/tools/mkpatch.sh work/web1 web1 -d work/.base_web1
```

实际输出（我跑过的样子）：
```text
[*] 扫描 /home/xendr1a/ctf/省赛/work/web1
[*] 命中 1 个文件
[*] 语法自检
[+] 语法自检通过（1 个文件）
[+] 打包完成: /home/xendr1a/ctf/省赛/work/dist/web1.tar.gz
   文件数  1
   结构
     index.php
```

👉 包在 **`work/dist/web1.tar.gz`**。「命中 1 个文件」＝你只改了 1 个（没改的不进包，正常）。

### 第 5 步：自检 → 上传

```bash
~/ctf/省赛/tools/mkpatch.sh --check work/dist/web1.tar.gz
```

期望看到：
```text
文件数: 1   大小: 4.0K
结构:
    index.php
[+] 包结构合法
```

然后平台：**题目页 → 防御 → 上传 `work/dist/web1.tar.gz` → 查看提交记录 → 申请 check → 防御日志**。
日志变绿才算过；红了就改代码 → **回第 4 步重新打包重新 check**（check 通过的是「那个包」，不是「那个洞」）。

---

### 只有一种情况要加参数

平台**把包解到 `/` 根**（而不是站点根）时，包内要带 `var/www/html` 前缀：

```bash
~/ctf/省赛/tools/mkpatch.sh work/web1 web1 -d work/.base_web1 -p var/www/html
# 包内结构变成： var/www/html/index.php
```

不确定平台解到哪？**先按第 4 步默认传一次**，check 红了再加 `-p` 重传。别在这上面猜太久。

---

### 附：为什么必须这样（赶时间可以不看）

- check 的动作是「解包 → 覆盖线上文件 → 看服务还活着」，所以**包内路径必须与线上文件位置一一对应**：
  - ✅ `index.php` → 覆盖 `/var/www/html/index.php`
  - ❌ `web1/index.php`（多套一层）→ 覆盖 `/var/www/html/web1/index.php`，线上文件没变 = check 红
- 包里绝对不能有：绝对路径、`..`、`.git`、`*.bak`、旧的 `*.tar.gz`。`mkpatch.sh` 会自动剔除；结构非法时它会**删掉产物**并报 `[x] 路径不合法`。
- **改完要重启服务**（php-fpm / gunicorn / node / 容器），否则磁盘是新代码、内存里还是旧的，check 必红。
- 属主要改时加 `-u 33:33`（www-data）；不加就是 `0:0`（root），多数平台都认。
- 手工等价命令（脚本坏了才用）：
  ```bash
  cd work/web1
  tar -czf ../../work/dist/web1.tar.gz --owner=0 --group=0 --numeric-owner \
      --exclude='.git' --exclude='*.bak' --exclude='*.swp' --exclude='*.tar.gz' \
      index.php            # 只列改过的文件，路径相对当前目录（=站点根）
  tar -tzf ../../work/dist/web1.tar.gz
  ```
- 彻底失败想回滚：`rm -rf work/web1 && cp -a work/.base_web1 work/web1`
