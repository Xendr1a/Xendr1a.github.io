---
title: PHP 反序列化：魔术方法、字符串逃逸与利用链
date: 2026-11-22 08:02:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [反序列化, PHP, 魔术方法]
description: PHP 反序列化的基础、魔术方法触发时机、字符串逃逸，以及从 CTF 题里总结的利用方式。
toc: true
---

先讲清序列化/反序列化的数据格式，再按「魔术方法触发时机 → 字符串逃逸 → 常见利用链」组织，便于比赛时反向查表。

## 反序列化

### 什么是序列化与反序列化

在PHP中，序列化（serialize()）是将变量（包括对象）转换为可存储或传输的字符串的过程，而反序列化（unserialize()）则是将序列化后的字符串还原为原始变量或对象的过程。序列化的主要目的是方便数据存储（如保存到文件或数据库）或传输（如通过网络传递），而反序列化则是为了将这些数据还原为PHP程序可以操作的变量或对象。

## 字符串逃逸

php在反序列化时，底层代码是以`;`作为字段的分隔，以`}`作为结尾，并且是**根据长度判断内容** ，同时反序列化的过程中必须严格按照序列化规则才能成功实现反序列化 。

们逃逸字符的目的以及操作就是进行**闭合**然后插入我们需要被反序列化的字符来成功攻击,而闭合我们需要知道一个前置知识

```text
反序列化字符串都是以";}结束的
```

### 列题可以看ctfshow web262

```text
源码
<?
/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-12-03 02:37:19
# @Last Modified by:   h1xa
# @Last Modified time: 2020-12-03 16:05:38
# @message.php
# @email: h1xa@ctfer.com
# @link: https://ctfer.com

*/

error_reporting(0);
class message{
    public $from;
    public $msg;
    public $to;
    public $token='user';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

$f = $_GET['f'];
$m = $_GET['m'];
$t = $_GET['t'];

if(isset($f) && isset($m) && isset($t)){
    $msg = new message($f,$m,$t);
    $umsg = str_replace('fuck', 'loveU', serialize($msg));
    setcookie('msg',base64_encode($umsg));
    echo 'Your message has been sent';
}

highlight_file(__FILE__);
```

我们先看看这个str_replace怎么利用

比如说我们有这样一个

```text
<?
class User{
    public $username;
    public $password;
    public $VIP;
    public function __construct($u,$p){
        $this ->username=$u;
        $this ->password=$p;
        $this ->VIP=0;
    }
}

$u=new User('admin','123456');
echo serialize($u);
//O:4:"User":3:{s:8:"username";s:5:"admin";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
```

我们里面也有个

```text
function filter($s){
    return str_replace('admin','hacker',$s);
}
```

那就是

```text
<?
class User{
    public $username;
    public $password;
    public $VIP;
    public function __construct($u,$p){
        $this ->username=$u;
        $this ->password=$p;
        $this ->VIP=0;
    }
}

function filter($s){
    return str_replace('admin','hacker',$s);
}

$u=new User('admin','123456');
$u_seri=serialize($u);
$us=filter($u_seri);

echo $us;

//O:4:"User":3:{s:8:"username";s:5:"admin";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
//O:4:"User":3:{s:8:"username";s:5:"hacker";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
我们需要把vip的值变成
```

我们发现当admin转为hacker时，反序列化的长度并没有改变都是5

我们需要的是

```text
O:4:"User":3:{s:8:"username";s:50:"hacker";s:8:"password";s:6:"123456";s:3:"VIP";i:1;}";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
```

发现`";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}`刚好是45个  
那我们就可以构造45个admin来给换出来

```text
<?
class User{
    public $username;
    public $password;
    public $VIP;
    public function __construct($u,$p){
        $this ->username=$u;
        $this ->password=$p;
        $this ->VIP=0;
    }
}

function filter($s){
    return str_replace('admin','hacker',$s);
}

$u=new User('adminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadminadmin";s:8:"password";s:6:"123456";s:3:"VIP";i:1;}','123456');
$u_seri=serialize($u);
$us=filter($u_seri);

echo $us;

//O:4:"User":3:{s:8:"username";s:5:"admin";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
//O:4:"User":3:{s:8:"username";s:5:"hacker";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
//O:4:"User":3:{s:8:"username";s:5:"admin";s:8:"password";s:6:"123456";s:3:"VIP";i:1;}
//O:4:"User":3:{s:8:"username";s:50:"hacker";s:8:"password";s:6:"123456";s:3:"VIP";i:1;}";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
//O:4:"User":3:{s:8:"username";s:270:"hackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhacker";s:8:"password";s:6:"123456";s:3:"VIP";i:1;}";s:8:"password";s:6:"123456";s:3:"VIP";i:0;}
```

可以检测一下

```text
$xendria=unserialize($us);
var_dump($xendria);

/*object(User)#2 (3) {
  ["username"]=>
  string(270) "hackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhackerhacker"
  ["password"]=>
  string(6) "123456"
  ["VIP"]=>
  int(1)
}
```

讲到这突然发现web262可以直接拿来链手了.....

## 魔术方法

| magicMethods | attribute |
| --- | --- |
| __construct | 当一个对象被创建时自动调用这个方法，可以用来初始化对象的属性。 |
| __destruct | 当一个对象被销毁时自动调用这个方法，可以用来释放对象占用的资源。 |
| __call | 在对象中调用一个不存在的方法时自动调用这个方法，可以用来实现动态方法调用。 |
| __callStatic | 在静态上下文中调用一个不存在的方法时自动调用这个方法，可以用来实现动态静态方法调用。 |
| __get | 当一个对象的属性被读取时自动调用这个方法，可以用来实现属性的访问控制。 |
| __set | 当一个对象的属性被设置时自动调用这个方法，可以用来实现属性的访问控制。 |
| __isset | 当使用 isset() 或 empty() 测试一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __unset | 当使用 unset() 删除一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __toString | 当一个对象被转换为字符串时自动调用这个方法，可以用来实现对象的字符串表示。 |
| __invoke | 当一个对象被作为函数调用时自动调用这个方法，可以用来实现对象的可调用性。 |
| __set_state | 当使用 var_export() 导出一个对象时自动调用这个方法，可以用来实现对象的序列化和反序列化。 |
| __clone | 当一个对象被克隆时自动调用这个方法，可以用来实现对象的克隆。 |
| __sleep | 在对象被序列化之前自动调用这个方法，可以用来控制哪些属性被序列化。 |
| __wakeup | 在对象被反序列化之后自动调用这个方法，可以用来重新初始化对象的属性。 |

| __debugInfo | 当使用 var_dump() 或 print_r() 输出一个对象时自动调用这个方法，可以用来控制对象的调试信息输出。 |
| --- | --- |

## __call

当调用一个不存在的方法或者是不可访问的方法时，会触发

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用";
    }
    public function __call($method, $args){
        echo "__call被调用";
    }
}
$a=new Xendria();
$a->ohye();
echo serialize($a);

#构造函数被调用
#__call被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __callStatic

当调用一个不存在的**静态**方法或者是不可访问的**静态**方法时，会触发

静态方法和动态方法的区别就是，调用方式不同，我们上面所调用的方法都是动态方法，而静态方法是直接利用类名来调用的而不是对象

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public static function __callStatic($method, $args){
        echo "__call被调用\n";
    }
}
$a=new Xendria();
$result = Xendria::nosee('1', '1');
echo serialize($a);
Xendria::nosee(123, 'test');

#构造函数被调用
#__call被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
#__call被调用
```

## __get

读取不可访问或者是不存在的属性时触发

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
        public function __get($name){
        echo "get被调用\n";
    }
}
$a=new Xendria();
$a->nosee;
echo serialize($a);

#构造函数被调用
#get被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __set_state

- 当使用 `var_export()` 函数导出对象时会被自动调用

```text
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public static function __set_state($properties) {
        echo "__set_state已被调用\n";
    }
}
$a = new Xendria();
$exported_code = var_export($a, true);
eval('$b = ' . $exported_code . ';');
echo serialize($a) . "\n";

#构造函数被调用
#__set_state已被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __toString

也就是当对象被当成字符串处理时会触发

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "已被调用\n";
    }
    public function __toString(){
        return "toString被调用\n";
    }
}
$a=new Xendria();
echo $a;
echo serialize($a);

#已被调用
#toString被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## clone

- 当使用 `clone` 关键字复制对象时自动调用

```text
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __clone() {
        echo "\n__clone已被调用\n";
    }
}

$a = new Xendria();
echo serialize($a);
$b = clone $a;
echo $b->user;
/*
构造函数被调用
O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
__clone已被调用
admin
```

## construct

确实是创建对象时被调用并且其中的初始化赋值会直接覆盖最初的赋值

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用";
    }
}
$a=new Xendria();
echo serialize($a);

#构造函数被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## debug

```text
<?
class Xendria{
    public $user = "user";
    
    public function __construct(){
        $this->user = "admin";
        echo "构造函数被调用";
    }
    
    public function __debugInfo() {
        return [
            'user' => $this->user="ls"
        ];
    }
}

$a = new Xendria();
echo serialize($a);
var_dump($a);
```

## destruct

- **显式销毁对象**（如使用 `unset()` 函数）时，`__destruct()` 会被立即调用。
- **脚本执行结束时**，PHP 会自动销毁所有对象，触发 `__destruct()` 方法。

看到回显，也就是我们进行最后的序列化过程结束之后进行对象的销毁的时候才进行`destruct`

## invoke

当你尝试将一个对象像函数一样调用时，__invoke() 会被触发。

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public  function __invoke(){
        echo "invoke被调用\n";
    }
}
$a=new Xendria();
$a("1");
echo serialize($a);

#构造函数被调用
#invoke被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## isset

当使用isset或者是empty来检查不存在或者不可访问的属性时触发

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __isset($name){
        echo "isset被调用\n";
    }
}
$a=new Xendria();
isset($a->nosee);
echo serialize($a);

#构造函数被调用
#isset被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## set

将数据写入不可访问或者不存在的属性，也就是说赋值时触发

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
        public function __set($name, $value){
        echo "set被调用\n";
    }
}
$a=new Xendria();
$a->nosee="";
echo serialize($a);
#构造函数被调用
#set被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## sleep

这个魔术方法就是用来控制那些属性可以被序列化,并且是先序列化一步执行

```text
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __sleep() {
        echo "sleep魔术方法被调用\n";
        // 返回需要序列化的属性名数组
        return array('user');
    }
}
$a = new Xendria();
echo serialize($a);

#构造函数被调用
#sleep魔术方法被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
#__sleep()魔术方法会在对象被序列化时自动调用。它应返回一个包含需要序列化的属性名的数组
```

## unset

使用 unset() 删除一个不存在或不可访问的属性时，__unset() 方法会被调用。

```text
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __unset($name){
        echo "unset被调用\n";
    }
}
$a=new Xendria();
unset($a->nosee);
echo serialize($a);

#构造函数被调用
#unset被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## weakup

php的特性，当序列化后对象的参数列表中成员个数和实际个数不符合时会绕过 __weakup();

## 常用魔术方法

```text
方法名	描述
__sleep()	执行序列化serialize()时，先会调用这个函数
__wakeup()	执行反序列化unserialize()时，先会调用这个函数
__get()	    当获得一个类的成员变量时调用
__set()	    当设置一个类的成员变量时调用
__isset()	当对不可访问属性调用isset()或empty()时调用
__unset()	当对不可访问属性调用unset()时被调用。
__construct()	类的构造函数
__destruct()	类的析构函数
__call()	在对象中调用一个不可访问方法时调用
__callStatic()	用静态方式中调用一个不可访问方法时调用
__autoload()	尝试加载未定义的类
__toString()	在将一个对象转化成字符串时自动调用
```

#### `__construct()` & `__destruct()`

**触发条件**：对象创建时和销毁时（如脚本结束、`unset()`）。

| magicMethods | attribute |
| --- | --- |
| __construct | 当一个对象被创建时自动调用这个方法，可以用来初始化对象的属性。 |
| __destruct | 当一个对象被销毁时自动调用这个方法，可以用来释放对象占用的资源。 |
| __call | 在对象中调用一个不存在的方法时自动调用这个方法，可以用来实现动态方法调用。 |
| __callStatic | 在静态上下文中调用一个不存在的方法时自动调用这个方法，可以用来实现动态静态方法调用。 |
| __get | 当一个对象的属性被读取时自动调用这个方法，可以用来实现属性的访问控制。 |
| __set | 当一个对象的属性被设置时自动调用这个方法，可以用来实现属性的访问控制。 |
| __isset | 当使用 isset() 或 empty() 测试一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __unset | 当使用 unset() 删除一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __toString | 当一个对象被转换为字符串时自动调用这个方法，可以用来实现对象的字符串表示。 |
| __invoke | 当一个对象被作为函数调用时自动调用这个方法，可以用来实现对象的可调用性。 |
| __set_state | 当使用 var_export() 导出一个对象时自动调用这个方法，可以用来实现对象的序列化和反序列化。 |
| __clone | 当一个对象被克隆时自动调用这个方法，可以用来实现对象的克隆。 |
