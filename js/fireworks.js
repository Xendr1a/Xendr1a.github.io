(function () {
    if ('ontouchstart' in window || window.innerWidth < 768) {
        return;
    }

    var text_list = [
        "Xendr1a", "404 Not Found", "200 OK",
        "Get Shell!", "腻嚎！", "欢迎！",
        "谢谢支持！"
    ];

    window.addEventListener('click', function (e) {
        var span = document.createElement("span");
        var text = text_list[Math.floor(Math.random() * text_list.length)];
        span.innerHTML = text;

        var colors = ["#87CEEB", "#FFB6C1"];
        var color = colors[Math.floor(Math.random() * colors.length)];

        span.style.zIndex = "999999999999999999999999";
        span.style.top = (e.clientY - 20) + "px";
        span.style.left = e.clientX + "px";
        span.style.position = "fixed";
        span.style.fontWeight = "bold";
        span.style.color = color;
        span.style.fontSize = "16px";
        span.style.userSelect = "none";
        span.style.pointerEvents = "none";

        document.body.appendChild(span);

        var y = e.clientY - 20;
        var opacity = 1;

        var timer = setInterval(function () {
            y--;
            opacity -= 0.02;

            span.style.top = y + "px";
            span.style.opacity = opacity;

            if (opacity <= 0) {
                clearInterval(timer);
                if (span.parentNode) {
                    document.body.removeChild(span);
                }
            }
        }, 15);
    }, { passive: true });
})();
