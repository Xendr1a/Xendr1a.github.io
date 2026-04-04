---
title: “轩辕杯”云盾砺剑CTF挑战赛（Web)
date: '2026-03-31 20:13:49'
updated: '2026-04-04 20:12:53'
permalink: /post/xuanyuan-cup-cloud-shield-sword-ctf-challenge-web-1tckhy.html
comments: true
toc: true
---



# “轩辕杯”云盾砺剑CTF挑战赛（Web)

日期：2025-05-21 23:13:58

## 前言

这是我在这里写的第一篇wp，欢迎各位师傅的评价与建议

## ezjs

简单的js，我们在开发者工具中发现main.js

![](/source/images/939759a9-2d73-4457-a9c1-267c0454c57f-20260331201349-tgtqpky.png)

进入/getflag.php，然后POST改score就行

![](/source/images/c4b8de3a-4f36-45f5-8e46-d5921623ecef-20260331201349-wm323xm.png)

## ezflask

输入{{7*7}},回显49

![](/source/images/edc0fc5c-c854-46a3-bdcb-6586d8b749df-20260331201349-eqhb43c.png)

ssti，fenjing秒了

![](/source/images/e5981aa0-c618-40c0-9f3d-e045baae179d-20260331201350-ecynn29.png)

## ezrce

```php
<?php
error_reporting(0);
highlight_file(__FILE__);

function waf($a) {
    $disable_fun = array(
        "exec", "shell_exec", "system", "passthru", "proc_open", "show_source",
        "phpinfo", "popen", "dl", "proc_terminate", "touch", "escapeshellcmd",
        "escapeshellarg", "assert", "substr_replace", "call_user_func_array",
        "call_user_func", "array_filter", "array_walk", "array_map",
        "register_shutdown_function", "register_tick_function", "filter_var",
        "filter_var_array", "uasort", "uksort", "array_reduce", "array_walk",
        "array_walk_recursive", "pcntl_exec", "fopen", "fwrite",
        "file_put_contents", "readfile", "file_get_contents", "highlight_file", "eval"
    );

    $disable_fun = array_map('strtolower', $disable_fun);
    $a = strtolower($a);

    if (in_array($a, $disable_fun)) {
        echo "宝宝这对嘛,这不对噢";
        return false;
    }
    return $a;
}

$num = $_GET['num'];
$new = $_POST['new'];
$star = $_POST['star'];

if (isset($num) && $num != 1234) {
    echo "看来第一层对你来说是小case<br>";
    if (is_numeric($num) && $num > 1234) {
        echo "还是有点实力的嘛<br>";
        if (isset($new) && isset($star)) {
            echo "看起来你遇到难关了哈哈<br>";
            $b = waf($new);    #对于new的检测
            if ($b) {
                call_user_func($b, $star);   #前方为new是函数，后面star为函数的值
                echo "恭喜你，又成长了<br>";
            }
        }
    }
}
?>
```

num的传参我们可以用八进制绕过num=02322
然后就是如何进行命令执行的问题，我们看到这里

```php
   $disable_fun = array_map('strtolower', $disable_fun);
    $a = strtolower($a);   #将字符串化为小写

    if (in_array($a, $disable_fun)) {
        echo "宝宝这对嘛,这不对噢";
        return false;
    }
```

注意到这个是in_array()函数检测，我们可以用" \ "来绕过其的检测

![](/source/images/ddd8efc6-6ee5-4749-9fc6-71a9947a924f-20260331201350-h35o6k3.png)

后面就能自由命令执行了。

## ezssrf1.0

```php
<?php
error_reporting(0);
highlight_file(__FILE__);
$url = $_GET['url'];

if ($url == null)
    die("Try to add ?url=xxxx.");

$x = parse_url($url);

if (!$x)
    die("(;_;)");

if ($x['host'] === null && $x['scheme'] === 'http') {
    echo ('Well, Going to ' . $url);
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    curl_close($ch);
    echo ($result);
} else
    echo "(^-＿-^)";
```

我们观察这个代码，对于输入的参数url进行检测，要求为http头，然后域名为null
我们就可以构造了

![](/source/images/005d0933-735e-40d6-9056-64687ffef9d8-20260331201350-i1jeh8t.png)

访问此路由即可得flag

## 签到

第一关
GET ?a=welcome POST b=new Cookie star=admin
弟二关
if (is_string($password) &amp;&amp; preg_match('/^\d+$/', $password)) { echo "纯数字是不行的哦！"; exit; }
password=2025!
第三关

```http
POST /levelThree.php HTTP/1.1
Host: 27.25.151.26:30379
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br
Referer:secretcode
Cookie: star=user; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImZseTIzMyJ9.inCoyLUdTLkcp-ZHLvIyBEa27Glfu-jHBpWdh_DpWrA
Connection: keep-alive
Content-Type: application/x-www-form-urlencoded
Content-Length: 11

key=ctfpass
```

第四关

```http
HEAD /level444Four.php HTTP/1.1
Host: 27.25.151.26:30379
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent:identity=n1c3
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Accept-Encoding: gzip, deflate, br
Cookie: star=user; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImZseTIzMyJ9.inCoyLUdTLkcp-ZHLvIyBEa27Glfu-jHBpWdh_DpWrA
Connection: keep-alive
```

第五关

```js
<script>
function(){
    var a = ['E', 'l', 'W', '_', 'F', '3', 't', '0', 'C', 'C'];
    var order = [2, 5, 1, 8, 7, 0, 3, 9, 6, 4];
    var code = '';
    for (var i = 0; i < order.length; i++) {
        code += a[order[i]];
    }
    console.log("Your hidden key is:", code);
})();
</script>

W3lC0E_CtF
```

第六关
nl /*

## ezsql1.0

测试发现只过滤了select和空格，我们可以用双写和/**/绕过

![](/source/images/e4913759-3eb0-4f3a-92fb-e48972adf91b-1024x422-20260331201350-dwhhgd8.png)

这借着下去是个假flag

![](/source/images/bdb15274-5051-4001-8ad9-ebf9cd5f6785-20260331201350-lfdwwoi.png)

我们重新找数据库

![](/source/images/71f91403-2ca1-408f-8daa-99ecc445c8bc-20260331201350-b81x6jx.png)

这个才是对的，然后就是接着的一系列套公式操作

![](/source/images/5f38c1f4-12a4-47db-8cc1-f5ab926e1877-1024x501-20260331201350-xu6zcnq.png)

## ez_web1

密码九位猜测123456789

![](/source/images/0d964c71-24da-4cf7-8d94-0abe33e896a4-1024x566-20260331201350-7iepzlw.png)

这三都可以进行非预期

![](/source/images/720da359-8f6d-47a8-9c36-01ff5d803d06-1024x390-20260331201350-hhyllhc.png)

![](/source/images/6bcb25a4-ac47-40ff-81d1-17313f2a5c33-1024x468-20260331201350-rqgzb4m.png)

![](/source/images/9641c2a1-2761-449b-8a19-f52dccce1c20-1024x465-20260331201350-dz8hyym.png)

|特性|`/proc/self/environ`|`/proc/1/environ`|
| ----| ------------------------| --------------------------------------|
|**目标进程**|当前进程（调用它的进程）|PID=1 的初始化进程（如`systemd`）|
|**路径含义**|动态指向当前进程的`/proc/[pid]`|固定指向`/proc/1`|
|**内容变化**|随进程不同而变化|系统启动后通常不变（除非重启）|
|**权限要求**|需有当前进程的读取权限|通常需要 root 权限（普通用户可能受限）|
|**典型用途**|调试单个进程的环境变量|查看系统级环境变量或启动配置|

就是说一个看admin一个当前用户

现在咱们来说说预期，我们先读取源码

```py
from flask import Flask, render_template, request, redirect, url_for, make_response, jsonify
import os
import re
import jwt

app = Flask(__name__, template_folder='templates')
app.config['TEMPLATES_AUTO_RELOAD'] = True
SECRET_KEY = os.getenv('JWT_KEY')
book_dir = 'books'
users = {'fly233': '123456789'}

def generate_token(username):
    payload = {
        'username': username
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    return token

def decode_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/')
def index():
    token = request.cookies.get('token')
    if not token:
        return redirect('/login')
    payload = decode_token(token)
    if not payload:
        return redirect('/login')
    username = payload['username']
    books = [f for f in os.listdir(book_dir) if f.endswith('.txt')]
    return render_template('./index.html', username=username, books=books)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':

        return render_template('./login.html')
    elif request.method == 'POST':

        username = request.form.get('username')
        password = request.form.get('password')


        if username in users and users[username] == password:
            token = generate_token(username)
            response = make_response(jsonify({
                'message': 'success'
            }), 200)

            response.set_cookie('token', token, httponly=True, path='/')
            return response
        else:

            return {'message': 'Invalid username or password'}

@app.route('/read', methods=['POST'])
def read_book():
    token = request.cookies.get('token')
    if not token:
        return redirect('/login')
    payload = decode_token(token)
    if not payload:
        return redirect('/login')
    book_path = request.form.get('book_path')
    full_path = os.path.join(book_dir, book_path)
    try:
        with open(full_path, 'r', encoding='utf-8') as file:
            content = file.read()
        return render_template('reading.html', content=content)
    except FileNotFoundError:
        return "文件未找到", 404
    except Exception as e:
        return f"发生错误: {str(e)}", 500

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    token = request.cookies.get('token')
    if not token:
        return redirect('/login')
    payload = decode_token(token)
    if not payload:
        return redirect('/login')
    if request.method == 'GET':

        return render_template('./upload.html')
    if payload.get('username') != 'admin':
        return """
        <script>
            alert('只有管理员才有添加图书的权限');
            window.location.href = '/';
        </script>
        """
    file = request.files['file']
    if file:
        book_path = request.form.get('book_path')
        file_path = os.path.join(book_path, file.filename)
        if not os.path.exists(book_path):
            return "文件夹不存在", 400
        file.save(file_path)

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            pattern = r'[{}<>_%]'

            if re.search(pattern, content):
                os.remove(file_path)
                return """
                <script>
                    alert('SSTI,想的美！');
                    window.location.href = '/';
                </script>
                """
        return redirect(url_for('index'))
    return "未选择文件", 400
```

cookie有个jwt，而且根据源码我们也知道了要jwt伪造admin，那key在哪呢？
在环境变量里，可见上面的../..`/proc/self/environ`
key=th1s_1s_k3y
token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIn0.EYrwzSGzfGe_PMnw-Wl4Ymt_QuMtyApHi57DMcZ7e3U
然后我们观察到这段代码

```py
    if file:
        book_path = request.form.get('book_path')
        file_path = os.path.join(book_path, file.filename)
        if not os.path.exists(book_path):
            return "文件夹不存在", 400
        file.save(file_path)

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            pattern = r'[{}<>_%]'

            if re.search(pattern, content):
                os.remove(file_path)
                return """
                <script>
                    alert('SSTI,想的美！');
                    window.location.href = '/';
                </script>
                """
        return redirect(url_for('index'))
    return "未选择文件", 400
```

他是先file.save(file_path) 先保存到磁盘，再进行检测来判断是否删除的，
所以只要我们上传后去/read访问的够快就行了。

![](/source/images/8e83faf9-c322-4192-8ebf-0da8d6b38d2c-1024x466-20260331201350-tizo8x8.png)

设置一直发包就行了，然后我们可以手动或者再开一个重复访问（我这是是手动访问

![](/source/images/4f716ce8-bea8-4a38-bb76-b08f7b3b21f5-1024x656-20260331201350-fxo5r5r.png)

至此，轩辕之旅结束~~~~
