---
title: MD5 与哈希：CTF 里的那些套路
date: 2026-11-22 08:13:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [MD5, 哈希, CTF]
description: MD5 碰撞、弱类型比较、0e 绕过与双写等常考点。
toc: true
---

把 MD5 相关的 CTF 套路集中：0e 绕过、数组绕过、碰撞与扩展长度攻击的适用边界。

## MD5的传说

**万能通式：**129581926211651571912466741651878684928和ffifdyop

**ffifdyop** **~****特殊的万能密码**

经过md5加密后：276f722736c95d99e921722cf9ed621c

再转换为字符串：'or'6<乱码>  即  'or'66�]��!r,��b

用途：

select * from admin where password=''or'6<乱码>'

就相当于select * from admin where password=''or 1  实现sql注入

**强弱比较**

a==b   将a，b的值转换成同类型再比较值

a===b 先判断a，b类型，若相同，则比较值，若不相同，则返回false

**常见的字符串md5值为0e开头**

加密后的密文                      原值

QNKCDZO           0E830400451993494058024219903391  
240610708           0E462097431906509019562988736854  
s878926199a       0E545993274517709034328855841020  
s155964671a       0E342768416822451524974117254469  
s214587387a       0E848240448830537924465865611904

##### **数组绕过**(出现is_array时 无法进行数组绕过)

**数组绕过的原理**

md5不能加密数组 ，如 a[]=1 , b[]=1 , 传入数组会报错,但会继续执行并且返回结果为null

比如传入md5(a[]=1)**md5(b[]=2)，实际上是null**null，所以数组进行md5弱比较时，结果相等

##### **md5强类型绕过**

**md5值完全相同的字符绕过---&gt;****fastcoll**工具

```text
列如
$data1="\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x06\x98\xaf\xf9\x5c\x2f\xca\xb5\x07\x12\x46\x7e\xab\x40\x04\x58\x3e\xb8\xfb\x7f\x89\x55\xad\x34\x06\x09\xf4\xb3\x02\x83\xe4\x88\x83\x25\xf1\x41\x5a\x08\x51\x25\xe8\xf7\xcd\xc9\x9f\xd9\x1d\xbd\x72\x80\x37\x3c\x5b\xd8\x82\x3e\x31\x56\x34\x8f\x5b\xae\x6d\xac\xd4\x36\xc9\x19\xc6\xdd\x53\xe2\x34\x87\xda\x03\xfd\x02\x39\x63\x06\xd2\x48\xcd\xa0\xe9\x9f\x33\x42\x0f\x57\x7e\xe8\xce\x54\xb6\x70\x80\x28\x0d\x1e\xc6\x98\x21\xbc\xb6\xa8\x83\x93\x96\xf9\x65\xab\x6f\xf7\x2a\x70";
$data2="\xd1\x31\xdd\x02\xc5\xe6\xee\xc4\x69\x3d\x9a\x06\x98\xaf\xf9\x5c\x2f\xca\xb5\x87\x12\x46\x7e\xab\x40\x04\x58\x3e\xb8\xfb\x7f\x89\x55\xad\x34\x06\x09\xf4\xb3\x02\x83\xe4\x88\x83\x25\x71\x41\x5a\x08\x51\x25\xe8\xf7\xcd\xc9\x9f\xd9\x1d\xbd\xf2\x80\x37\x3c\x5b\xd8\x82\x3e\x31\x56\x34\x8f\x5b\xae\x6d\xac\xd4\x36\xc9\x19\xc6\xdd\x53\xe2\xb4\x87\xda\x03\xfd\x02\x39\x63\x06\xd2\x48\xcd\xa0\xe9\x9f\x33\x42\x0f\x57\x7e\xe8\xce\x54\xb6\x70\x80\xa8\x0d\x1e\xc6\x98\x21\xbc\xb6\xa8\x83\x93\x96\xf9\x65\x2b\x6f\xf7\x2a\x70";
```

```text
Param1=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%00%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%55%5d%83%60%fb%5f%07%fe%a2
Param2=%4d%c9%68%ff%0e%e3%5c%20%95%72%d4%77%7b%72%15%87%d3%6f%a7%b2%1b%dc%56%b7%4a%3d%c0%78%3e%7b%95%18%af%bf%a2%02%a8%28%4b%f3%6e%8e%4b%55%b3%5f%42%75%93%d8%49%67%6d%a0%d1%d5%5d%83%60%fb%5f%07%fe%a2
```
