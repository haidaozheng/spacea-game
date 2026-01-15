// 敌机系统

// 敌机类型定义
const EnemyTypes = {
    scout: {
        name: '侦察机',
        health: 1,
        speed: 3,
        score: 100,
        width: 25,
        height: 30,
        weaponType: 'basic',
        fireRate: 2000,
        color: Colors.enemy
    },
    fighter: {
        name: '战斗机',
        health: 3,
        speed: 2,
        score: 200,
        width: 35,
        height: 40,
        weaponType: 'double',
        fireRate: 1500,
        color: Colors.enemy
    },
    heavy: {
        name: '重型机',
        health: 6,
        speed: 1.5,
        score: 300,
        width: 45,
        height: 50,
        weaponType: 'spread',
        fireRate: 2500,
        color: Colors.enemySecondary
    },
    boss: {
        name: 'Boss',
        health: 30,
        speed: 1,
        score: 1000,
        width: 80,
        height: 90,
        weaponType: 'spread',
        fireRate: 1000,
        color: '#ff0000'
    }
};

// 敌机类
class Enemy {
    constructor(x, y, type = 'scout') {
        const data = EnemyTypes[type] || EnemyTypes.scout;
        const difficulty = DifficultySettings[Config.difficulty] || DifficultySettings.normal;
        
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = data.width;
        this.height = data.height;
        
        // 根据难度调整属性
        this.health = Math.ceil(data.health * difficulty.enemyHealthMultiplier);
        this.maxHealth = this.health;
        this.speed = data.speed * difficulty.enemySpeedMultiplier;
        this.score = Math.ceil(data.score * difficulty.scoreMultiplier);
        this.color = data.color;
        this.isDead = false;
        this.expValue = Math.ceil(data.score * 0.5); // 经验值为分数的一半
        
        // 武器 - 根据难度调整
        this.weapon = new Weapon(data.weaponType);
        this.weapon.fireRate = Math.ceil(data.fireRate * difficulty.enemyFireRateMultiplier);
        this.weapon.damage = Math.ceil(this.weapon.damage * difficulty.enemyDamageMultiplier);
        this.weapon.color = data.color;
        
        // 移动模式
        this.movePattern = type === 'boss' ? 'boss' : Utils.randomChoice(['straight', 'zigzag', 'sine']);
        this.movePhase = Math.random() * Math.PI * 2;
        this.baseX = x;
        
        // Boss特殊属性
        if (type === 'boss') {
            this.bossPhase = 0;
            this.attackPattern = 0;
        }
    }

    update(currentTime, canvasWidth) {
        this.movePhase += 0.03;

        switch (this.movePattern) {
            case 'straight':
                this.y += this.speed;
                break;
            case 'zigzag':
                this.y += this.speed;
                this.x += Math.sin(this.movePhase * 3) * 2;
                break;
            case 'sine':
                this.y += this.speed;
                this.x = this.baseX + Math.sin(this.movePhase) * 50;
                break;
            case 'boss':
                // Boss停在屏幕上方，左右移动
                if (this.y < 100) {
                    this.y += this.speed;
                } else {
                    this.x = canvasWidth / 2 + Math.sin(this.movePhase) * (canvasWidth / 3);
                }
                break;
        }

        // 边界限制
        this.x = Utils.clamp(this.x, this.width / 2, canvasWidth - this.width / 2);
    }

    shoot(currentTime, playerX, playerY) {
        if (!this.weapon.canFire(currentTime)) return [];

        // Boss有多种攻击模式
        if (this.type === 'boss') {
            this.attackPattern = (this.attackPattern + 1) % 3;
            
            if (this.attackPattern === 0) {
                // 散弹
                this.weapon.setType('spread');
            } else if (this.attackPattern === 1) {
                // 瞄准玩家
                this.weapon.setType('basic');
            } else {
                // 双发
                this.weapon.setType('double');
            }
        }

        const bullets = this.weapon.fire(this.x, this.y + this.height / 2, currentTime, true);
        return bullets;
    }

    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;

        switch (this.type) {
            case 'scout':
                this.drawScout(ctx);
                break;
            case 'fighter':
                this.drawFighter(ctx);
                break;
            case 'heavy':
                this.drawHeavy(ctx);
                break;
            case 'boss':
                this.drawBoss(ctx);
                break;
        }

        // 血量条 (Boss和重型机显示)
        if ((this.type === 'boss' || this.type === 'heavy') && this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }

        ctx.restore();
    }

    drawScout(ctx) {
        // 小三角形
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(0, -this.height / 2 + 10);
        ctx.lineTo(this.width / 2, -this.height / 2);
        ctx.closePath();
        ctx.stroke();
    }

    drawFighter(ctx) {
        // 菱形
        ctx.beginPath();
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(0, -this.height / 3);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.closePath();
        ctx.stroke();

        // 内部线条
        ctx.beginPath();
        ctx.moveTo(0, this.height / 3);
        ctx.lineTo(0, -this.height / 4);
        ctx.stroke();
    }

    drawHeavy(ctx) {
        // 六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = Math.cos(angle) * this.width / 2;
            const y = Math.sin(angle) * this.height / 2;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();

        // 内部六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2;
            const x = Math.cos(angle) * this.width / 4;
            const y = Math.sin(angle) * this.height / 4;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.stroke();
    }

    drawBoss(ctx) {
        const pulse = 1 + Math.sin(Date.now() / 300) * 0.05;
        ctx.scale(pulse, pulse);

        // 复杂的Boss外形
        ctx.beginPath();
        // 主体
        ctx.moveTo(0, this.height / 2);
        ctx.lineTo(-this.width / 3, this.height / 4);
        ctx.lineTo(-this.width / 2, 0);
        ctx.lineTo(-this.width / 3, -this.height / 4);
        ctx.lineTo(-this.width / 4, -this.height / 2);
        ctx.lineTo(0, -this.height / 3);
        ctx.lineTo(this.width / 4, -this.height / 2);
        ctx.lineTo(this.width / 3, -this.height / 4);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(this.width / 3, this.height / 4);
        ctx.closePath();
        ctx.stroke();

        // 核心
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.stroke();

        // 装饰线条
        ctx.beginPath();
        ctx.moveTo(-20, -10);
        ctx.lineTo(-10, -5);
        ctx.moveTo(20, -10);
        ctx.lineTo(10, -5);
        ctx.moveTo(-20, 10);
        ctx.lineTo(-10, 5);
        ctx.moveTo(20, 10);
        ctx.lineTo(10, 5);
        ctx.stroke();
    }

    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const y = -this.height / 2 - 15;
        const healthPercent = this.health / this.maxHealth;

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;

        // 背景
        ctx.strokeRect(-barWidth / 2, y, barWidth, barHeight);

        // 血量
        ctx.fillStyle = this.color;
        ctx.fillRect(-barWidth / 2, y, barWidth * healthPercent, barHeight);
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
        return this.y > canvasHeight + this.height;
    }
}

// 敌机管理器
class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    spawn(x, y, type) {
        this.enemies.push(new Enemy(x, y, type));
    }

    update(currentTime, canvasWidth, canvasHeight) {
        this.enemies.forEach(enemy => {
            enemy.update(currentTime, canvasWidth);
        });

        // 移除出界的敌机
        this.enemies = this.enemies.filter(e => !e.isOutOfBounds(canvasHeight) && !e.isDead);
    }

    draw(ctx) {
        this.enemies.forEach(enemy => enemy.draw(ctx));
    }

    // 获取所有敌机的子弹
    shootAll(currentTime, playerX, playerY) {
        let allBullets = [];
        this.enemies.forEach(enemy => {
            const bullets = enemy.shoot(currentTime, playerX, playerY);
            allBullets = allBullets.concat(bullets);
        });
        return allBullets;
    }

    clear() {
        this.enemies = [];
    }

    get count() {
        return this.enemies.length;
    }

    get hasBoss() {
        return this.enemies.some(e => e.type === 'boss');
    }
}

// 全局敌机管理器
const enemyManager = new EnemyManager();
