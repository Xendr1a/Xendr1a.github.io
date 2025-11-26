(function() {
    var possibleColors = ["#87CEEB", "#FFB6C1"]; // 淡蓝 #87CEEB 和 淡粉 #FFB6C1
    var width = window.innerWidth;
    var height = window.innerHeight;
    var cursor = { x: width / 2, y: width / 2 };
    var particles = [];
  
    function init() {
      bindEvents();
      loop();
    }
  
    function bindEvents() {
      document.addEventListener('mousemove', onMouseMove);
      window.addEventListener('resize', onWindowResize);
    }
  
    function onWindowResize(e) {
      width = window.innerWidth;
      height = window.innerHeight;
    }
  
    function onMouseMove(e) {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      addParticle(cursor.x, cursor.y, possibleColors[Math.floor(Math.random() * possibleColors.length)]);
    }
  
    function addParticle(x, y, color) {
      var particle = new Particle();
      particle.init(x, y, color);
      particles.push(particle);
    }
  
    function updateParticles() {
      for (var i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      for (var i = particles.length - 1; i >= 0; i--) {
        if (particles[i].lifeSpan < 0) {
          particles[i].die();
          particles.splice(i, 1);
        }
      }
    }
  
    function loop() {
      requestAnimationFrame(loop);
      updateParticles();
    }
  
    function Particle() {
      this.character = "*"; // 随机掉落蓝心或粉心
      this.lifeSpan = 180; // 粒子消失时间，越小越快
      this.initialStyles = {
        "position": "fixed",
        "display": "inline-block",
        "top": "0px",
        "left": "0px",
        "pointerEvents": "none",
        "touch-action": "none",
        "z-index": "10000000",
        "fontSize": "21px", // 粒子大小
        "will-change": "transform"
      };
  
      this.init = function(x, y, color) {
        this.velocity = {
          x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 2),
          y: 1
        };
        this.position = { x: x - 10, y: y - 20 };
        this.element = document.createElement('span');
        this.element.innerHTML = this.character;
        applyProperties(this.element, this.initialStyles);
        this.update();
        this.element.style.color = color;
        document.body.appendChild(this.element);
      };
  
      this.update = function() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.lifeSpan--;
        this.element.style.transform = "translate3d(" + this.position.x + "px," + this.position.y + "px, 0) scale(" + (this.lifeSpan / 120) + ")";
      };
  
      this.die = function() {
        this.element.parentNode.removeChild(this.element);
      };
    }
  
    function applyProperties(target, properties) {
      for (var key in properties) {
        target.style[key] = properties[key];
      }
    }
  
    // 仅在电脑端运行，手机端不运行以节省性能
    if (!('ontouchstart' in window)) {
      init();
    }
  })();