// 武器系统

// 子弹基类
class Bullet {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || 0;
        this.vy = options.vy || -10;
        this.damage = options.damage || 1;
        this.color = options.color || Colors.primary;
        this.width = options.width || 4;
        this.height = options.height || 15;
        this.isEnemy = options.isEnemy || false;
        this.type = options.type || 'basic';
        this.piercing = options.piercing || false; // 穿透
        this.target = options.target || null; // 追踪目标
    }

    update() {
        // 追踪导弹逻辑
        if (this.type === 'missile' && this.target && !this.target.isDead) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const angle = Math.atan2(dy, dx);
            const speed = 6;
            
            this.vx = Utils.lerp(this.vx, Math.cos(angle) * speed, 0.05);
            this.vy = Utils.lerp(this.vy, Math.sin(angle) * speed, 0.05);
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2;

        if (this.type === 'basic' || this.type === 'double') {
            // 基础弹 - 线条
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.height * (this.isEnemy ? 1 : -1));
            ctx.stroke();
        } else if (this.type === 'spread') {
            // 散弹 - 短线
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.vx * 2, this.y + this.vy * 2);
            ctx.stroke();
        } else if (this.type === 'laser') {
            // 激光 - 长线
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.height * (this.isEnemy ? 1 : -1));
            ctx.stroke();
            
            // 发光效果
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x - 3, this.y);
            ctx.lineTo(this.x - 3, this.y + this.height * (this.isEnemy ? 1 : -1));
            ctx.moveTo(this.x + 3, this.y);
            ctx.lineTo(this.x + 3, this.y + this.height * (this.isEnemy ? 1 : -1));
            ctx.stroke();
        } else if (this.type === 'missile') {
            // 导弹 - 带尾迹的三角形
            const angle = Math.atan2(this.vy, this.vx);
            ctx.translate(this.x, this.y);
            ctx.rotate(angle + Math.PI / 2);
            
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(-4, 8);
            ctx.lineTo(4, 8);
            ctx.closePath();
            ctx.stroke();
            
            // 尾迹
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(-2, 8);
            ctx.lineTo(0, 15);
            ctx.lineTo(2, 8);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 获取碰撞盒
    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    isOutOfBounds(canvasHeight, canvasWidth) {
        return this.y < -20 || this.y > canvasHeight + 20 || 
               this.x < -20 || this.x > canvasWidth + 20;
    }
}

// 武器类型定义
const WeaponTypes = {
    basic: {
        name: '基础弹',
        damage: 1,
        fireRate: 200, // ms
        bulletSpeed: 10,
        color: Colors.primary,
        pattern: 'single'
    },
    double: {
        name: '双发弹',
        damage: 1,
        fireRate: 200,
        bulletSpeed: 10,
        color: Colors.primary,
        pattern: 'double'
    },
    spread: {
        name: '散弹',
        damage: 0.5,
        fireRate: 400,
        bulletSpeed: 8,
        color: Colors.secondary,
        pattern: 'spread'
    },
    laser: {
        name: '激光',
        damage: 2,
        fireRate: 100,
        bulletSpeed: 15,
        color: '#ff00ff',
        pattern: 'single',
        piercing: true
    },
    missile: {
        name: '导弹',
        damage: 5,
        fireRate: 800,
        bulletSpeed: 5,
        color: '#ffaa00',
        pattern: 'single',
        homing: true
    }
};

// 武器类
class Weapon {
    constructor(type = 'basic') {
        this.setType(type);
        this.lastFireTime = 0;
    }

    setType(type) {
        const weaponData = WeaponTypes[type] || WeaponTypes.basic;
        this.type = type;
        this.name = weaponData.name;
        this.damage = weaponData.damage;
        this.fireRate = weaponData.fireRate;
        this.bulletSpeed = weaponData.bulletSpeed;
        this.color = weaponData.color;
        this.pattern = weaponData.pattern;
        this.piercing = weaponData.piercing || false;
        this.homing = weaponData.homing || false;
    }

    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    fire(x, y, currentTime, isEnemy = false, target = null) {
        if (!this.canFire(currentTime)) return [];

        this.lastFireTime = currentTime;
        const bullets = [];
        const direction = isEnemy ? 1 : -1;

        switch (this.pattern) {
            case 'single':
                bullets.push(new Bullet(x, y, {
                    vy: this.bulletSpeed * direction,
                    damage: this.damage,
                    color: this.color,
                    isEnemy: isEnemy,
                    type: this.type,
                    piercing: this.piercing,
                    target: this.homing ? target : null,
                    height: this.type === 'laser' ? 30 : 15
                }));
                break;

            case 'double':
                bullets.push(new Bullet(x - 10, y, {
                    vy: this.bulletSpeed * direction,
                    damage: this.damage,
                    color: this.color,
                    isEnemy: isEnemy,
                    type: this.type
                }));
                bullets.push(new Bullet(x + 10, y, {
                    vy: this.bulletSpeed * direction,
                    damage: this.damage,
                    color: this.color,
                    isEnemy: isEnemy,
                    type: this.type
                }));
                break;

            case 'spread':
                const angles = [-30, -15, 0, 15, 30];
                angles.forEach(angle => {
                    const rad = Utils.toRadians(angle + (isEnemy ? 90 : -90));
                    bullets.push(new Bullet(x, y, {
                        vx: Math.cos(rad) * this.bulletSpeed,
                        vy: Math.sin(rad) * this.bulletSpeed,
                        damage: this.damage,
                        color: this.color,
                        isEnemy: isEnemy,
                        type: 'spread',
                        width: 3,
                        height: 8
                    }));
                });
                break;
        }

        return bullets;
    }
}

// 敌人武器类型
const EnemyWeaponTypes = {
    basic: {
        name: '基础',
        damage: 10,
        fireRate: 1500,
        bulletSpeed: 4,
        color: Colors.enemy,
        pattern: 'single'
    },
    double: {
        name: '双发',
        damage: 10,
        fireRate: 1200,
        bulletSpeed: 5,
        color: Colors.enemy,
        pattern: 'double'
    },
    spread: {
        name: '散弹',
        damage: 8,
        fireRate: 2000,
        bulletSpeed: 4,
        color: Colors.enemySecondary,
        pattern: 'spread'
    }
};
