// 粒子效果系统

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || Utils.random(-3, 3);
        this.vy = options.vy || Utils.random(-3, 3);
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.color = options.color || Colors.primary;
        this.size = options.size || 2;
        this.type = options.type || 'dot'; // dot, line, spark
        this.angle = options.angle || Math.random() * Math.PI * 2;
        this.length = options.length || 10;
        this.decay = options.decay || 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        
        // 减速
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;

        if (this.type === 'dot') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'line') {
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(this.angle) * this.length * alpha,
                this.y + Math.sin(this.angle) * this.length * alpha
            );
            ctx.stroke();
        } else if (this.type === 'spark') {
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 粒子系统管理器
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update() {
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => !p.isDead());
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }

    // 爆炸效果
    createExplosion(x, y, color = Colors.primary, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Utils.random(-0.3, 0.3);
            const speed = Utils.random(2, 6);
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                type: 'line',
                angle: angle,
                length: Utils.random(10, 25),
                life: Utils.random(0.5, 1),
                decay: 0.02
            }));
        }

        // 添加一些火花
        for (let i = 0; i < count / 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(3, 8);
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                type: 'spark',
                life: Utils.random(0.3, 0.6),
                decay: 0.03
            }));
        }
    }

    // 小型爆炸(击中效果)
    createHitEffect(x, y, color = Colors.primary) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Utils.random(1, 3);
            
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                type: 'spark',
                life: 0.3,
                decay: 0.03
            }));
        }
    }

    // 引擎尾焰
    createEngineTrail(x, y, color = Colors.primary) {
        this.particles.push(new Particle(x, y, {
            vx: Utils.random(-0.5, 0.5),
            vy: Utils.random(2, 4),
            color: color,
            type: 'dot',
            size: Utils.random(1, 3),
            life: 0.3,
            decay: 0.03
        }));
    }

    // 星空背景粒子
    createStar(canvasWidth, canvasHeight) {
        this.particles.push(new Particle(
            Utils.random(0, canvasWidth),
            -5,
            {
                vx: 0,
                vy: Utils.random(1, 3),
                color: Colors.star,
                type: 'dot',
                size: Utils.random(0.5, 2),
                life: 5,
                decay: 0.005
            }
        ));
    }

    clear() {
        this.particles = [];
    }
}

// 全局粒子系统
const particleSystem = new ParticleSystem();
