(function() {
    var possibleColors = ["#87CEEB", "#FFB6C1"];
    var width = window.innerWidth;
    var height = window.innerHeight;
    var cursor = { x: width / 2, y: width / 2 };
    var particles = [];
    var maxParticles = 80;
    var lastMoveTime = 0;
    var moveInterval = 24;

    function init() {
      bindEvents();
      loop();
    }

    function bindEvents() {
      document.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('resize', onWindowResize, { passive: true });
    }

    function onWindowResize() {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    function onMouseMove(e) {
      var now = Date.now();
      if (now - lastMoveTime < moveInterval) return;
      lastMoveTime = now;

      cursor.x = e.clientX;
      cursor.y = e.clientY;
      addParticle(cursor.x, cursor.y, possibleColors[Math.floor(Math.random() * possibleColors.length)]);
    }

    function addParticle(x, y, color) {
      if (particles.length >= maxParticles) {
        var expired = particles.shift();
        if (expired) expired.die();
      }

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
      this.character = "*";
      this.lifeSpan = 180;
      this.initialStyles = {
        "position": "fixed",
        "display": "inline-block",
        "top": "0px",
        "left": "0px",
        "pointerEvents": "none",
        "touch-action": "none",
        "z-index": "10000000",
        "fontSize": "21px",
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
        if (this.element && this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
      };
    }

    function applyProperties(target, properties) {
      for (var key in properties) {
        target.style[key] = properties[key];
      }
    }

    if (!('ontouchstart' in window)) {
      init();
    }
})();
