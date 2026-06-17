/* ==========================================================================
   6. REMASTERED HIGH-DENSITY DEPTH PARTICLE ENGINE
   ========================================================================== */
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const maxParticles = 60; // Increased particle count for better density
const sporeColors = ['#2f4f43', '#3f6356', '#52796f', '#71978c'];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class SporeParticle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
        // Layering depth logic (Makes some particles huge & blurry, others small & sharp)
        this.depthLayer = Math.random() > 0.6 ? 'foreground' : 'background';
        
        if (this.depthLayer === 'foreground') {
            this.size = Math.random() * 1.5 + 0.5; // Small, sharp dust lines
            this.speedY = -(Math.random() * 0.5 + 0.2);
            this.speedX = Math.random() * 0.4 - 0.2;
            this.maxAlpha = Math.random() * 0.5 + 0.2;
            this.blur = 0;
        } else {
            this.size = Math.random() * 4.5 + 2.0; // Large, glowing distant clouds
            this.speedY = -(Math.random() * 0.2 + 0.05);
            this.speedX = Math.random() * 0.2 - 0.1;
            this.maxAlpha = Math.random() * 0.2 + 0.05;
            this.blur = this.size * 1.5; // Soft focus edge emulation
        }

        this.alpha = 0; // Spawn hidden and smoothly fade them in
        this.fadeSpeed = Math.random() * 0.008 + 0.002;
        this.color = sporeColors[Math.floor(Math.random() * sporeColors.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Loop boundaries naturally
        if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 10;
            this.alpha = 0;
        }

        if (this.alpha < this.maxAlpha) {
            this.alpha += this.fadeSpeed;
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        if (this.blur > 0) {
            ctx.shadowBlur = this.blur;
            ctx.shadowColor = this.color;
        }
        
        ctx.fill();
        ctx.restore();
    }
}

function initParticles() {
    particlesArray = [];
    for (let i = 0; i < maxParticles; i++) {
        let p = new SporeParticle();
        // Distribute them vertically across the screen on load
        p.y = Math.random() * canvas.height;
        p.alpha = Math.random() * p.maxAlpha; // Start at randomized alpha states
        particlesArray.push(p);
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
