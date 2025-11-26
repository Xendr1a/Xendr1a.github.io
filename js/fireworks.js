(function () {
    // ⬇️⬇️⬇️ 在这里自定义你想出现的文字 ⬇️⬇️⬇️
    var text_list = [
        "Xendr1a", "404 Not Found", "200 OK", 
        "Get Shell!", "腻嚎！","欢迎！",
        "谢谢支持！"
    ];
    // ⬆️⬆️⬆️ 在这里自定义你想出现的文字 ⬆️⬆️⬆️

    var element_idx = 0;
    
    // 监听点击事件
    window.addEventListener('click', function (e) {
        // 创建 span 元素
        var span = document.createElement("span");
        
        // 随机选择文字
        var text = text_list[Math.floor(Math.random() * text_list.length)];
        
        span.innerHTML = text;
        
        // 随机选择颜色：你的主题蓝 (#87CEEB) 或 主题粉 (#FFB6C1)
        var colors = ["#87CEEB", "#FFB6C1"];
        var color = colors[Math.floor(Math.random() * colors.length)];

        // 设置样式
        span.style.zIndex = "999999999999999999999999";
        span.style.top = (e.clientY - 20) + "px";
        span.style.left = e.clientX + "px";
        span.style.position = "fixed";
        span.style.fontWeight = "bold";
        span.style.color = color;
        span.style.fontSize = "16px"; // 字体大小
        span.style.userSelect = "none";
        span.style.pointerEvents = "none"; // 穿透点击，不影响操作
        
        document.body.appendChild(span);

        // 动画效果
        var y = e.clientY - 20;
        var opacity = 1;
        
        var timer = setInterval(function () {
            // 向上浮动
            y--;
            // 逐渐透明
            opacity -= 0.02;
            
            span.style.top = y + "px";
            span.style.opacity = opacity;

            // 消失后移除元素
            if (opacity <= 0) {
                clearInterval(timer);
                document.body.removeChild(span);
            }
        }, 15); // 动画速度，数字越小越快
    });
})();