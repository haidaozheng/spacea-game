// 道具系统

// 道具类型定义
const PowerupTypes = {
    weapon_double: {
        name: '双发弹',
        color: Colors.primary,
        weaponType: 'double',
        duration: 0, // 永久
        type: 'weapon'
    },
    weapon_spread: {
        name: '散弹',
        color: Colors.secondary,
        weaponType: 'spread',
        duration: 0,
        type: 'weapon'
    },
    weapon_laser: {
        name: '激光',
        color: '#ff00ff',
        weaponType: 'laser',
        duration: 0,
        type: 'weapon'
    },
    weapon_missile: {
        name: '导弹',
        color: '#ffaa00',
        weaponType: 'missile',
        duration: 0,
        type: 'weapon'
    },
    health: {
        name: '血量恢复',
        color: Colors.health,
        value: 30,
        type: 'health'
    },
    shield: {
        name: '护盾',
        color: Colors.shield,
        duration: 5000, // 5秒
        type: 'shield'
    },
    score: {
        name: '分数加倍',
        color: Colors.powerup,
        multiplier: 2,
        duration: 10000, // 10秒
        type: 'score'
    }
};

// 道具类
class Powerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.data = PowerupTypes[type];
        this.width = 30;
        this.height = 30;
        this.vy = 2;
        this.rotation = 0;
        this.pulsePhase = 0;
    }

    update() {
        this.y += this.vy;
        this.rotation += 0.05;
        this.pulsePhase += 0.1;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        ctx.scale(pulse, pulse);

        ctx.strokeStyle = this.data.color;
        ctx.shadowColor = this.data.color;
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2;

        // 外框 - 菱形
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(15, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-15, 0);
        ctx.closePath();
        ctx.stroke();

        // 内部图标
        ctx.shadowBlur = 5;
        if (this.data.type === 'weapon') {
            // 武器图标 - 子弹形状
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(0, 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(0, -8);
            ctx.lineTo(4, -4);
            ctx.stroke();
        } else if (this.data.type === 'health') {
            // 血量图标 - 十字
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(0, 6);
            ctx.moveTo(-6, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
        } else if (this.data.type === 'shield') {
            // 护盾图标 - 盾牌
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI, true);
            ctx.lineTo(-6, 5);
            ctx.lineTo(0, 9);
            ctx.lineTo(6, 5);
            ctx.lineTo(6, 0);
            ctx.stroke();
        } else if (this.data.type === 'score') {
            // 分数图标 - 星星
            this.drawStar(ctx, 0, 0, 5, 8, 4);
        }

        ctx.restore();
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.stroke();
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    isOutOfBounds(canvasHeight) {
        return this.y > canvasHeight + 30;
    }
}

// 道具管理器
class PowerupManager {
    constructor() {
        this.powerups = [];
    }

    // 随机生成道具
    spawnRandom(x, y) {
        if (Math.random() > Config.dropRate) return;

        const types = Object.keys(PowerupTypes);
        const weights = [3, 2, 1, 1, 4, 2, 2]; // 权重
        const type = Utils.weightedRandom(types, weights);

        this.powerups.push(new Powerup(x, y, type));
    }

    update() {
        this.powerups.forEach(p => p.update());
        this.powerups = this.powerups.filter(p => !p.isOutOfBounds(Config.canvasHeight));
    }

    draw(ctx) {
        this.powerups.forEach(p => p.draw(ctx));
    }

    // 检测与玩家碰撞
    checkCollision(player) {
        const playerHitbox = player.getHitbox();
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (Utils.rectCollision(playerHitbox, powerup.getHitbox())) {
                this.powerups.splice(i, 1);
                return powerup;
            }
        }
        return null;
    }

    clear() {
        this.powerups = [];
    }
}

// 全局道具管理器
const powerupManager = new PowerupManager();
