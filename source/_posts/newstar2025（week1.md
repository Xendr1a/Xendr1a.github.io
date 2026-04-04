---
description: '记录 NewStar 2025 Week1 部分题目的思路、做题过程和收获。'
title: newstar2025（week1
date: 2025-10-15T09:00:54Z
lastmod: 2025-10-16T21:04:30Z
top_img: /img/2abc3f959e3c1983556049fa213be07c.jpg
tags: [CTF,WP]
categories: [CTF,WP]
toc: true
toc_number: true
mathjax: false
katex: false
comments: true
---

# newstar2025（week1

## multi-headach3

hint：什么叫机器人控制了我的头？

一眼robots协议

{% asset_img 6072fc0e-c1fc-4b83-86fc-6bd4f0099c3a-20251015090210-0ymg8fz.png 6072fc0e-c1fc-4b83-86fc-6bd4f0099c3a %}

事实证明也是!{% asset_img 27f31a73-8719-4962-ac98-d1672e1161db-20251015090225-b7qnh0f.png 27f31a73-8719-4962-ac98-d1672e1161db %}

进入/hidden.php路由回重定向到主页，换bp抓包

{% asset_img 40dc4c9e-07a1-475d-80bd-1920f42dcf3c-20251015090311-85d61by.png 40dc4c9e-07a1-475d-80bd-1920f42dcf3c %}

## strange_login

hint：我当然知道1=1了！？

进入是登入界面，万能密码秒了

```curl
username:admin' or 1=1#
password:随便填
```

## 宇宙的中心是php

进入网页发现禁用了F12，那我们在更多工具那边打开开发者工具看到个路由s3kret.php

{% asset_img 34b54820-2667-4e83-99e5-069cf2192340-20251015090937-4kd0vaj.png 34b54820-2667-4e83-99e5-069cf2192340 %}

得到题目

```curl
<?php
highlight_file(__FILE__);
include "flag.php";
if(isset($_POST['newstar2025'])){
    $answer = $_POST['newstar2025'];
    if(intval($answer)!=47&&intval($answer,0)==47){
        echo $flag;
    }else{
        echo "你还未参透奥秘";
    }
}
```

16进制绕过

POST：`newstar2025=0x2f`

## 我真得控制你了

依旧更多工具那边打开开发者工具

删除这个然后就可以按启动了

{% asset_img db21b202-efdf-4e10-bf36-5eabbee4923f-20251015092504-4fqohb4.png db21b202-efdf-4e10-bf36-5eabbee4923f %}

进入一个登入页面弱密码 admin/111111

然后获得

```php
<?php
error_reporting(0);

function generate_dynamic_flag($secret) {
    return getenv("ICQ_FLAG") ?: 'default_flag';
}


if (isset($_GET['newstar'])) {
    $input = $_GET['newstar'];
    
    if (is_array($input)) {
        die("恭喜掌握新姿势");
    }
    

    if (preg_match('/[^\d*\/~()\s]/', $input)) {
        die("老套路了，行不行啊");
    }
    

    if (preg_match('/^[\d\s]+$/', $input)) {
        die("请输入有效的表达式");
    }
    
    $test = 0;
    try {
        @eval("\$test = $input;");
    } catch (Error $e) {
        die("表达式错误");
    }
    
    if ($test == 2025) {
        $flag = generate_dynamic_flag($flag_secret);
        echo "<div class='success'>拿下flag！</div>";
        echo "<div class='flag-container'><div class='flag'>FLAG: {$flag}</div></div>";
    } else {
        echo "<div class='error'>大哥哥泥把数字算错了: $test ≠ 2025</div>";
    }
} else {
    ?>
<?php } ?>
```

可以取反绕过

​`/portal.php?newstar=~(~2025)`

## 别笑，你也过不了第二关

一个游戏界面依旧f12观察

```javascript
    const game = document.getElementById("game");
    const player = document.getElementById("player");
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level");

    let score = 0;
    let steps = 0;
    let maxSteps = 10; // 每关掉落数量
    let targetScores = [30, 1000000]; // 每关目标分数
    let currentLevel = 0; // 0 表示第一关
    let gameEnded = false;
    let finishSpawned = false;
    let playerX = 180;
    let gateInterval = null;

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") movePlayer(-100);
      if (e.key === "ArrowRight") movePlayer(100);
    });

    function movePlayer(offset) {
      let newX = playerX + offset;
      if (newX < 0 || newX > 340) return;
      playerX = newX;
      player.style.left = playerX + "px";
    }

    function spawnGate() {
      if (steps >= maxSteps || gameEnded || finishSpawned) return;
      steps++;
      const gate = document.createElement("div");
      gate.className = "gate";

      let x = Math.random() < 0.5 ? 60 : 260;
      gate.style.left = x + "px";

      let isAdd = Math.random() < 0.5;
      if (isAdd) {
        gate.dataset.value = 10;
        gate.style.backgroundImage = "url('2.jpg')";
      } else {
        gate.dataset.value = -10;
        gate.style.backgroundImage = "url('1.jpg')";
      }

      game.appendChild(gate);

      let y = 0;
      const fall = setInterval(() => {
        y += 5;
        gate.style.top = y + "px";

        const playerRect = player.getBoundingClientRect();
        const gateRect = gate.getBoundingClientRect();

        if (!(playerRect.right < gateRect.left ||
              playerRect.left > gateRect.right ||
              playerRect.bottom < gateRect.top ||
              playerRect.top > gateRect.bottom)) {
          score += parseInt(gate.dataset.value);
          scoreEl.innerText = "分数: " + score;
          clearInterval(fall);
          gate.remove();

          if (steps >= maxSteps && !finishSpawned) spawnFinishLine();
        }

        if (y > 600) {
          clearInterval(fall);
          gate.remove();
          if (steps >= maxSteps && !finishSpawned) spawnFinishLine();
        }
      }, 50);
    }

    function spawnFinishLine() {
      finishSpawned = true;
      const finish = document.createElement("div");
      finish.className = "finish-line";
      finish.style.left = "0px";
      game.appendChild(finish);

      let y = 0;
      const fall = setInterval(() => {
        y += 5;
        finish.style.top = y + "px";

        const playerRect = player.getBoundingClientRect();
        const finishRect = finish.getBoundingClientRect();

        if (!(playerRect.right < finishRect.left ||
              playerRect.left > finishRect.right ||
              playerRect.bottom < finishRect.top ||
              playerRect.top > finishRect.bottom)) {
          clearInterval(fall);
          finish.remove();
          endLevel();
        }

        if (y > 600) {
          clearInterval(fall);
          finish.remove();
          endLevel();
        }
      }, 50);
    }

    function endLevel() {
  if (gameEnded) return;

  clearInterval(gateInterval);
  gateInterval = null;

  if (score >= targetScores[currentLevel]) {
    alert(`恭喜通过第 ${currentLevel + 1} 关！得分: ${score}`);
    currentLevel++;
    if (currentLevel < targetScores.length) {
      // 下一关
      resetLevel(currentLevel);
      startGame();
    } else {
      // 全部通关
      gameEnded = true;
      const formData = new URLSearchParams();
formData.append("score", score);

      fetch("/flag.php", {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: formData.toString()
})
.then(res => res.text())
.then(data => {
  alert("服务器返回:\n" + data);
})
.catch(err => {
  alert("请求失败: " + err);
});
    }
  } else {
    alert(`第 ${currentLevel + 1} 关未达成目标分数 (目标: ${targetScores[currentLevel]})，将重新开始本关！`);
    resetLevel(currentLevel);
    startGame();
  }
}


    function resetLevel(levelIndex) {
      score = 0;
      scoreEl.innerText = "分数: " + score;
      steps = 0;
      finishSpawned = false;
      levelEl.innerText = "关卡: " + (levelIndex + 1);
      [...game.querySelectorAll('.gate, .finish-line')].forEach(e => e.remove());
    }

    function startGame() {
      gateInterval = setInterval(spawnGate, 1500);
    }
    startGame();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        if (gateInterval) {
          clearInterval(gateInterval);
          gateInterval = null;
        }
      } else {
        if (!gameEnded && !gateInterval) {
          gateInterval = setInterval(spawnGate, 1500);
        }
      }
    });
```

分析代码，我们发现主要是score记录分数，endLevel()结束

那我们可以先手动过第一关

然后第二关时候{% asset_img 8046f41e-d46d-453f-b8d2-a8569621a0b4-20251015093947-y80uu42.png 8046f41e-d46d-453f-b8d2-a8569621a0b4 %}
{% asset_img 154819e2-6d5e-4300-8529-467b8400e1d5-20251015093950-hgrp814.png 154819e2-6d5e-4300-8529-467b8400e1d5 %}

获得flag

或者利用它向/flag.php发POST请求

{% asset_img 02c331ba-d0eb-4476-be24-73422f9e11af-20251015094128-w9nsajy.png 02c331ba-d0eb-4476-be24-73422f9e11af %}

## 黑客小W的故事（1）

第一关抓包有个count我们把值改大发包就过了

{% asset_img 11ef2f44-a718-451f-bae9-56daa8c953c9-20251016205937-rx8ak4w.png 11ef2f44-a718-451f-bae9-56daa8c953c9 %}

然后是第二关，根据提示

```http
GET:shipin=mogubaozi
POST: guding
```

然后蘑菇先生就让我们干活了

{% asset_img 6732a2c8-446c-4494-86a9-6311d2089047-20251016210150-t93aplh.png 6732a2c8-446c-4494-86a9-6311d2089047 %}

```http
DELETE /talkToMushroom?shipin=mogubaozi HTTP/2
Host: eci-2zedlhm2pgyz7chpwq8n.cloudeci1.ichunqiu.com:8000
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJOYW1lIjoiVHJ1ZSIsImxldmVsIjoyfQ.ZkyNOnNCPlMO55mZygnPyKHJxb1quNG5ebBDRsCTwlk
Sec-Ch-Ua: "Not;A=Brand";v="24", "Chromium";v="128"
Sec-Ch-Ua-Mobile: ?0
Sec-Ch-Ua-Platform: "Windows"
Accept-Language: zh-CN,zh;q=0.9
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.120 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Priority: u=0, i
Content-Type: application/x-www-form-urlencoded
Content-Length: 15

chongzi
```

然后进入下一关

身份验证，说了是User-Agent

```http
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) CycloneSlash/128.0.6613.120 DashSlash/537.36
```

然后获得flag

‍

