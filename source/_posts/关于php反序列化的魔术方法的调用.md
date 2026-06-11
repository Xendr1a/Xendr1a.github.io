---

title: 关于php反序列化的魔术方法的调用
date: 2025-09-02 21:24:57
updated: 2025-09-02 21:29:11
author: Xebdria
categories:
  - php反序列化
  - 知识


---

老早就想总结一下魔术方法了，每次单独找还是太吃操作了，所以就有了这个

## 魔术方法

| magicMethods | attribute |
| --- | --- |
| __construct | 当一个对象被创建时自动调用这个方法，可以用来初始化对象的属性。 |
| __destruct | 当一个对象被销毁时自动调用这个方法，可以用来释放对象占用的资源。 |
| __call | 在对象中调用一个不存在的方法时自动调用这个方法，可以用来实现动态方法调用。 |
| __callStatic | 在静态上下文中调用一个不存在的方法时自动调用这个方法，可以用来实现动态静态方法调用。 |
| __get | 当一个对象的属性被读取时自动调用这个方法，可以用来实现属性的访问控制。 |
| __set | 当一个对象的属性被设置时自动调用这个方法，可以用来实现属性的访问控制。 |
| __isset | 当使用 isset() 或 empty() 测试一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __unset | 当使用 unset() 删除一个对象的属性时自动调用这个方法，可以用来实现属性的访问控制。 |
| __toString | 当一个对象被转换为字符串时自动调用这个方法，可以用来实现对象的字符串表示。 |
| __invoke | 当一个对象被作为函数调用时自动调用这个方法，可以用来实现对象的可调用性。 |
| __set_state | 当使用 var_export() 导出一个对象时自动调用这个方法，可以用来实现对象的序列化和反序列化。 |
| __clone | 当一个对象被克隆时自动调用这个方法，可以用来实现对象的克隆。 |
| __sleep | 在对象被序列化之前自动调用这个方法，可以用来控制哪些属性被序列化。 |
| __wakeup | 在对象被反序列化之后自动调用这个方法，可以用来重新初始化对象的属性。 |

## __construct

创建对象时被调用，其中的初始化赋值会直接覆盖最初的值

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用";
    }
}
$a=new Xendria();
echo serialize($a);

#构造函数被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __destruct

当一个对象被销毁时自动调用这个方法，一般是两种情况吧**主动销毁**：如当使用unset时，__destruct会立刻触发**脚本执行结束时：**PHP 会自动销毁所有对象，触发__destruct

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __destruct(){
        echo "destruct被调用";
    }
}
$a=new Xendria();
echo serialize($a);
/*
构造函数被调用
O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
destruct被调用
```

## __call

在对象中调用一个不存在的方法时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用";
    }
    public function __call($method, $args){
        echo "__call被调用";
    }
}
$a=new Xendria();
$a->ohye();
echo serialize($a);

#构造函数被调用
#__call被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __callStatic

在静态上下文中调用一个不存在的静态方法时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public static function __callStatic($method, $args){
        echo "__call被调用\n";
    }
}
$a=new Xendria();
$result = Xendria::nosee('1', '1');
echo serialize($a);
Xendria::nosee(123, 'test');

#构造函数被调用
#__call被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
#__call被调用
```

## __get

当一个不可访问或者是不存在的属性被读取时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
        public function __get($name){
        echo "get被调用\n";
    }
}
$a=new Xendria();
$a->nosee;
echo serialize($a);

#构造函数被调用
#get被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __set

当一个对象的属性被设置时自动调用这个方法，就是赋值时

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
        public function __set($name, $value){
        echo "set被调用\n";
    }
}
$a=new Xendria();
$a->nosee="";
echo serialize($a);
#构造函数被调用
#set被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __isset

当使用 isset() 或 empty() 测试一个对象的属性时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __isset($name){
        echo "isset被调用\n";
    }
}
$a=new Xendria();
isset($a->nosee);
echo serialize($a);

#构造函数被调用
#isset被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __unset

当使用 unset() 删除一个不存在或不可访问的属性时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __unset($name){
        echo "unset被调用\n";
    }
}
$a=new Xendria();
unset($a->nosee);
echo serialize($a);

#构造函数被调用
#unset被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __toString

对象被当成字符串处理时会触发

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "已被调用\n";
    }
    public function __toString(){
        return "toString被调用\n";
    }
}
$a=new Xendria();
echo $a;
echo serialize($a);

#已被调用
#toString被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __invoke

当一个对象被作为函数调用时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public  function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public  function __invoke(){
        echo "invoke被调用\n";
    }
}
$a=new Xendria();
$a("1");
echo serialize($a);

#构造函数被调用
#invoke被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __set_state

当使用 var_export() 导出一个对象时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public static function __set_state($properties) {
        echo "__set_state已被调用\n";
    }
}
$a = new Xendria();
$exported_code = var_export($a, true);
eval('$b = ' . $exported_code . ';');
echo serialize($a) . "\n";

#构造函数被调用
#__set_state已被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __clone

当一个对象被克隆时自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __clone() {
        echo "\n__clone已被调用\n";
    }
}

$a = new Xendria();
echo serialize($a);
$b = clone $a;
echo $b->user;
/*
构造函数被调用
O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
__clone已被调用
admin
```

## __sleep

在对象被序列化之前自动调用这个方法

```php
<?php
class Xendria{
    public $user="user";
    public function __construct(){
        $this->user="admin";
        echo "构造函数被调用\n";
    }
    public function __sleep() {
        echo "sleep魔术方法被调用\n";
        // 返回需要序列化的属性名数组
        return array('user');
    }
}
$a = new Xendria();
echo serialize($a);

#构造函数被调用
#sleep魔术方法被调用
#O:7:"Xendria":1:{s:4:"user";s:5:"admin";}
```

## __wakeup

在对象被反序列化之后自动调用这个方法（这个有点特殊，后面有时间单独出一篇琢磨