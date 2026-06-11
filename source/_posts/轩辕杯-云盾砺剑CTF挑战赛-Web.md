---

title: "“轩辕杯”云盾砺剑CTF挑战赛（Web)"
date: 2025-05-21 23:13:58
author: Xendr1a

---

“轩辕杯”云盾砺剑CTF挑战赛（Web)

日期：2025-05-21 23:13:58

前言

这是我在这里写的第一篇wp，欢迎各位师傅的评价与建议

ezjs

简单的js，我们在开发者工具中发现main.js

![rId21.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId21.png)

进入/getflag.php，然后POST改score就行

![rId24.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId24.png)

ezflask

输入&#123;&#123;7*7}},回显49

![rId28.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId28.png)

ssti，fenjing秒了

![rId31.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId31.png)

ezrce

&lt;?phperror_reporting(0);highlight_file(__FILE__);function waf($a) {    $disable_fun = array(        &quot;exec&quot;, &quot;shell_exec&quot;, &quot;system&quot;, &quot;passthru&quot;, &quot;proc_open&quot;, &quot;show_source&quot;,        &quot;phpinfo&quot;, &quot;popen&quot;, &quot;dl&quot;, &quot;proc_terminate&quot;, &quot;touch&quot;, &quot;escapeshellcmd&quot;,        &quot;escapeshellarg&quot;, &quot;assert&quot;, &quot;substr_replace&quot;, &quot;call_user_func_array&quot;,        &quot;call_user_func&quot;, &quot;array_filter&quot;, &quot;array_walk&quot;, &quot;array_map&quot;,        &quot;register_shutdown_function&quot;, &quot;register_tick_function&quot;, &quot;filter_var&quot;,        &quot;filter_var_array&quot;, &quot;uasort&quot;, &quot;uksort&quot;, &quot;array_reduce&quot;, &quot;array_walk&quot;,        &quot;array_walk_recursive&quot;, &quot;pcntl_exec&quot;, &quot;fopen&quot;, &quot;fwrite&quot;,        &quot;file_put_contents&quot;, &quot;readfile&quot;, &quot;file_get_contents&quot;, &quot;highlight_file&quot;, &quot;eval&quot;    );    $disable_fun = array_map(&#39;strtolower&#39;, $disable_fun);    $a = strtolower($a);    if (in_array($a, $disable_fun)) {        echo &quot;宝宝这对嘛,这不对噢&quot;;        return false;    }    return $a;}$num = $_GET[&#39;num&#39;];$new = $_POST[&#39;new&#39;];$star = $_POST[&#39;star&#39;];if (isset($num) &amp;&amp; $num != 1234) {    echo &quot;看来第一层对你来说是小case&lt;br&gt;&quot;;    if (is_numeric($num) &amp;&amp; $num &gt; 1234) {        echo &quot;还是有点实力的嘛&lt;br&gt;&quot;;        if (isset($new) &amp;&amp; isset($star)) {            echo &quot;看起来你遇到难关了哈哈&lt;br&gt;&quot;;            $b = waf($new);    #对于new的检测            if ($b) {                call_user_func($b, $star);   #前方为new是函数，后面star为函数的值                echo &quot;恭喜你，又成长了&lt;br&gt;&quot;;            }        }    }}?&gt;

num的传参我们可以用八进制绕过num=02322然后就是如何进行命令执行的问题，我们看到这里

$disable_fun = array_map(&#39;strtolower&#39;, $disable_fun);    $a = strtolower($a);   #将字符串化为小写    if (in_array($a, $disable_fun)) {        echo &quot;宝宝这对嘛,这不对噢&quot;;        return false;    }

注意到这个是in_array()函数检测，我们可以用&quot; \ &quot;来绕过其的检测

![rId35.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId35.png)

后面就能自由命令执行了。

ezssrf1.0

&lt;?phperror_reporting(0);highlight_file(__FILE__);$url = $_GET[&#39;url&#39;];if ($url == null)    die(&quot;Try to add ?url=xxxx.&quot;);$x = parse_url($url);if (!$x)    die(&quot;(;_;)&quot;);if ($x[&#39;host&#39;] === null &amp;&amp; $x[&#39;scheme&#39;] === &#39;http&#39;) {    echo (&#39;Well, Going to &#39; . $url);    $ch = curl_init($url);    curl_setopt($ch, CURLOPT_HEADER, 0);    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);    $result = curl_exec($ch);    curl_close($ch);    echo ($result);} else    echo &quot;(^-＿-^)&quot;;

我们观察这个代码，对于输入的参数url进行检测，要求为http头，然后域名为null我们就可以构造了

![rId39.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId39.png)

访问此路由即可得flag

签到

第一关GET ?a=welcome POST b=new Cookie star=admin弟二关if (is_string($password) &amp;&amp; preg_match(&#39;/^\d+$/&#39;, $password)) { echo &quot;纯数字是不行的哦！&quot;; exit; }password=2025!第三关

POST /levelThree.php HTTP/1.1Host: 27.25.151.26:30379Accept-Language: zh-CN,zh;q=0.9Upgrade-Insecure-Requests: 1User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7Accept-Encoding: gzip, deflate, brReferer:secretcodeCookie: star=user; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImZseTIzMyJ9.inCoyLUdTLkcp-ZHLvIyBEa27Glfu-jHBpWdh_DpWrAConnection: keep-aliveContent-Type: application/x-www-form-urlencodedContent-Length: 11key=ctfpass

第四关

HEAD /level444Four.php HTTP/1.1Host: 27.25.151.26:30379Accept-Language: zh-CN,zh;q=0.9Upgrade-Insecure-Requests: 1User-Agent:identity=n1c3Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7Accept-Encoding: gzip, deflate, brCookie: star=user; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImZseTIzMyJ9.inCoyLUdTLkcp-ZHLvIyBEa27Glfu-jHBpWdh_DpWrAConnection: keep-alive

第五关

&lt;script&gt;function(){    var a = [&#39;E&#39;, &#39;l&#39;, &#39;W&#39;, &#39;_&#39;, &#39;F&#39;, &#39;3&#39;, &#39;t&#39;, &#39;0&#39;, &#39;C&#39;, &#39;C&#39;];    var order = [2, 5, 1, 8, 7, 0, 3, 9, 6, 4];    var code = &#39;&#39;;    for (var i = 0; i &lt; order.length; i++) {        code += a[order[i]];    }    console.log(&quot;Your hidden key is:&quot;, code);})();&lt;/script&gt;W3lC0E_CtF

第六关nl /*

ezsql1.0

测试发现只过滤了select和空格，我们可以用双写和/**/绕过

![rId44.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId44.png)

这借着下去是个假flag

![rId47.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId47.png)

我们重新找数据库

![rId50.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId50.png)

这个才是对的，然后就是接着的一系列套公式操作

![rId53.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId53.png)

ez_web1

密码九位猜测123456789

![rId57.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId57.png)

这三都可以进行非预期

![rId60.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId60.png)

![rId63.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId63.png)

![rId66.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId66.png)

特性

/proc/self/environ

/proc/1/environ

目标进程

当前进程（调用它的进程）

PID=1 的初始化进程（如systemd）

路径含义

动态指向当前进程的/proc/[pid]

固定指向/proc/1

内容变化

随进程不同而变化

系统启动后通常不变（除非重启）

权限要求

需有当前进程的读取权限

通常需要 root 权限（普通用户可能受限）

典型用途

调试单个进程的环境变量

查看系统级环境变量或启动配置

就是说一个看admin一个当前用户

现在咱们来说说预期，我们先读取源码

from flask import Flask, render_template, request, redirect, url_for, make_response, jsonifyimport osimport reimport jwtapp = Flask(__name__, template_folder=&#39;templates&#39;)app.config[&#39;TEMPLATES_AUTO_RELOAD&#39;] = TrueSECRET_KEY = os.getenv(&#39;JWT_KEY&#39;)book_dir = &#39;books&#39;users = {&#39;fly233&#39;: &#39;123456789&#39;}def generate_token(username):    payload = {        &#39;username&#39;: username    }    token = jwt.encode(payload, SECRET_KEY, algorithm=&#39;HS256&#39;)    return tokendef decode_token(token):    try:        payload = jwt.decode(token, SECRET_KEY, algorithms=[&#39;HS256&#39;])        return payload    except jwt.ExpiredSignatureError:        return None    except jwt.InvalidTokenError:        return None@app.route(&#39;/&#39;)def index():    token = request.cookies.get(&#39;token&#39;)    if not token:        return redirect(&#39;/login&#39;)    payload = decode_token(token)    if not payload:        return redirect(&#39;/login&#39;)    username = payload[&#39;username&#39;]    books = [f for f in os.listdir(book_dir) if f.endswith(&#39;.txt&#39;)]    return render_template(&#39;./index.html&#39;, username=username, books=books)@app.route(&#39;/login&#39;, methods=[&#39;GET&#39;, &#39;POST&#39;])def login():    if request.method == &#39;GET&#39;:        return render_template(&#39;./login.html&#39;)    elif request.method == &#39;POST&#39;:        username = request.form.get(&#39;username&#39;)        password = request.form.get(&#39;password&#39;)        if username in users and users[username] == password:            token = generate_token(username)            response = make_response(jsonify({                &#39;message&#39;: &#39;success&#39;            }), 200)            response.set_cookie(&#39;token&#39;, token, httponly=True, path=&#39;/&#39;)            return response        else:            return {&#39;message&#39;: &#39;Invalid username or password&#39;}@app.route(&#39;/read&#39;, methods=[&#39;POST&#39;])def read_book():    token = request.cookies.get(&#39;token&#39;)    if not token:        return redirect(&#39;/login&#39;)    payload = decode_token(token)    if not payload:        return redirect(&#39;/login&#39;)    book_path = request.form.get(&#39;book_path&#39;)    full_path = os.path.join(book_dir, book_path)    try:        with open(full_path, &#39;r&#39;, encoding=&#39;utf-8&#39;) as file:            content = file.read()        return render_template(&#39;reading.html&#39;, content=content)    except FileNotFoundError:        return &quot;文件未找到&quot;, 404    except Exception as e:        return f&quot;发生错误: {str(e)}&quot;, 500@app.route(&#39;/upload&#39;, methods=[&#39;GET&#39;, &#39;POST&#39;])def upload():    token = request.cookies.get(&#39;token&#39;)    if not token:        return redirect(&#39;/login&#39;)    payload = decode_token(token)    if not payload:        return redirect(&#39;/login&#39;)    if request.method == &#39;GET&#39;:        return render_template(&#39;./upload.html&#39;)    if payload.get(&#39;username&#39;) != &#39;admin&#39;:        return &quot;&quot;&quot;        &lt;script&gt;            alert(&#39;只有管理员才有添加图书的权限&#39;);            window.location.href = &#39;/&#39;;        &lt;/script&gt;        &quot;&quot;&quot;    file = request.files[&#39;file&#39;]    if file:        book_path = request.form.get(&#39;book_path&#39;)        file_path = os.path.join(book_path, file.filename)        if not os.path.exists(book_path):            return &quot;文件夹不存在&quot;, 400        file.save(file_path)        with open(file_path, &#39;r&#39;, encoding=&#39;utf-8&#39;) as f:            content = f.read()            pattern = r&#39;[{}&lt;&gt;_%]&#39;            if re.search(pattern, content):                os.remove(file_path)                return &quot;&quot;&quot;                &lt;script&gt;                    alert(&#39;SSTI,想的美！&#39;);                    window.location.href = &#39;/&#39;;                &lt;/script&gt;                &quot;&quot;&quot;        return redirect(url_for(&#39;index&#39;))    return &quot;未选择文件&quot;, 400

cookie有个jwt，而且根据源码我们也知道了要jwt伪造admin，那key在哪呢？在环境变量里，可见上面的../../proc/self/environkey=th1s_1s_k3ytoken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIn0.EYrwzSGzfGe_PMnw-Wl4Ymt_QuMtyApHi57DMcZ7e3U然后我们观察到这段代码

if file:        book_path = request.form.get(&#39;book_path&#39;)        file_path = os.path.join(book_path, file.filename)        if not os.path.exists(book_path):            return &quot;文件夹不存在&quot;, 400        file.save(file_path)        with open(file_path, &#39;r&#39;, encoding=&#39;utf-8&#39;) as f:            content = f.read()            pattern = r&#39;[{}&lt;&gt;_%]&#39;            if re.search(pattern, content):                os.remove(file_path)                return &quot;&quot;&quot;                &lt;script&gt;                    alert(&#39;SSTI,想的美！&#39;);                    window.location.href = &#39;/&#39;;                &lt;/script&gt;                &quot;&quot;&quot;        return redirect(url_for(&#39;index&#39;))    return &quot;未选择文件&quot;, 400

他是先file.save(file_path) 先保存到磁盘，再进行检测来判断是否删除的，所以只要我们上传后去/read访问的够快就行了。

![rId70.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId70.png)

设置一直发包就行了，然后我们可以手动或者再开一个重复访问（我这是是手动访问

![rId73.png](/img/轩辕杯-云盾砺剑CTF挑战赛-Web/rId73.png)

至此，轩辕之旅结束~~~~
