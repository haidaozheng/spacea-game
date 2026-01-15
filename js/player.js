// 玩家飞机系统

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 50;
        this.speed = Config.playerSpeed;
        this.health = Config.playerMaxHealth;
        this.maxHealth = Config.playerMaxHealth;
        this.weapon = new Weapon('basic');
        this.isDead = false;
        
        // 状态
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.hasShield = false;
        this.shieldTimer = 0;
        this.scoreMultiplier = 1;
        this.scoreMultiplierTimer = 0;
        this.autoFire = false; // 自动射击开关
        
        // 输入状态
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
        
        // 视觉效果
        this.enginePhase = 0;
    }

    handleKeyDown(key) {
        switch(key) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.shoot = true;
                break;
        }
    }

    handleKeyUp(key) {
        switch(key) {
            case 'ArrowUp':
            case 'KeyW':
                this.keys.up = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.shoot = false;
                break;
        }
    }

    update(currentTime, canvasWidth, canvasHeight) {
        // 移动
        if (this.keys.up) this.y -= this.speed;
        if (this.keys.down) this.y += this.speed;
        if (this.keys.left) this.x -= this.speed;
        if (this.keys.right) this.x += this.speed;

        // 边界限制
        this.x = Utils.clamp(this.x, this.width / 2, canvasWidth - this.width / 2);
        this.y = Utils.clamp(this.y, this.height / 2, canvasHeight - this.height / 2);

        // 更新无敌状态
        if (this.isInvincible && currentTime > this.invincibleTimer) {
            this.isInvincible = false;
        }

        // 更新护盾状态
        if (this.hasShield && currentTime > this.shieldTimer) {
            this.hasShield = false;
        }

        // 更新分数倍率
        if (this.scoreMultiplier > 1 && currentTime > this.scoreMultiplierTimer) {
            this.scoreMultiplier = 1;
        }

        // 引擎动画
        this.enginePhase += 0.2;

        // 引擎尾焰粒子
        if (Math.random() < 0.5) {
            particleSystem.createEngineTrail(
                this.x + Utils.random(-5, 5),
                this.y + this.height / 2 - 5,
                Colors.primary
            );
        }
    }

    shoot(currentTime, enemies) {
        if (!this.keys.shoot && !this.autoFire) return [];
        
        // 找到最近的敌人作为导弹目标
        let target = null;
        if (this.weapon.homing && enemies.length > 0) {
            let minDist = Infinity;
            enemies.forEach(enemy => {
                const dist = Utils.distance(this.x, this.y, enemy.x, enemy.y);
                if (dist < minDist) {
                    minDist = dist;
                    target = enemy;
                }
            });
        }

        const bullets = this.weapon.fire(this.x, this.y - this.height / 2, currentTime, false, target);
        
        if (bullets.length > 0) {
            if (this.weapon.type === 'laser') {
                audioManager.playLaser();
            } else {
                audioManager.playShoot();
            }
        }
        
        return bullets;
    }

    takeDamage(damage, currentTime) {
        if (this.isInvincible || this.hasShield) {
            if (this.hasShield) {
                // 护盾吸收伤害，但会减少持续时间
                this.shieldTimer -= 1000;
                particleSystem.createHitEffect(this.x, this.y, Colors.shield);
            }
            return false;
        }

        this.health -= damage;
        this.isInvincible = true;
        this.invincibleTimer = currentTime + Config.invincibleTime;
        
        audioManager.playHit();
        particleSystem.createHitEffect(this.x, this.y, Colors.enemy);

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            audioManager.playExplosion();
            particleSystem.createExplosion(this.x, this.y, Colors.primary, 30);
        }

        return true;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    setWeapon(weaponType) {
        this.weapon.setType(weaponType);
    }

    activateShield(duration, currentTime) {
        this.hasShield = true;
        this.shieldTimer = currentTime + duration;
    }

    activateScoreMultiplier(multiplier, duration, currentTime) {
        this.scoreMultiplier = multiplier;
        this.scoreMultiplierTimer = currentTime + duration;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 无敌闪烁效果
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.strokeStyle = Colors.primary;
        ctx.shadowColor = Colors.primary;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;

        // 主体 - 三角形
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 2, this.height / 2 - 10);
        ctx.lineTo(-this.width / 4, this.height / 2 - 15);
        ctx.lineTo(0, this.height / 2 - 5);
        ctx.lineTo(this.width / 4, this.height / 2 - 15);
        ctx.lineTo(this.width / 2, this.height / 2 - 10);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2 + 15);
        ctx.lineTo(-8, 5);
        ctx.lineTo(8, 5);
        ctx.closePath();
        ctx.stroke();

        // 引擎发光
        const engineGlow = 0.5 + Math.sin(this.enginePhase) * 0.3;
        ctx.globalAlpha = engineGlow;
        ctx.beginPath();
        ctx.moveTo(-8, this.height / 2 - 15);
        ctx.lineTo(0, this.height / 2 + 5);
        ctx.lineTo(8, this.height / 2 - 15);
        ctx.stroke();

        ctx.restore();

        // 绘制护盾
        if (this.hasShield) {
            this.drawShield(ctx);
        }
    }

    drawShield(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const pulse = 1 + Math.sin(Date.now() / 200) * 0.05;
        ctx.strokeStyle = Colors.shield;
        ctx.shadowColor = Colors.shield;
        ctx.shadowBlur = 20;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.ellipse(0, 0, (this.width / 2 + 15) * pulse, (this.height / 2 + 10) * pulse, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2 + 5,
            y: this.y - this.height / 2 + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }

    toggleAutoFire() {
        this.autoFire = !this.autoFire;
        return this.autoFire;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.health = this.maxHealth;
        this.isDead = false;
        this.isInvincible = false;
        this.hasShield = false;
        this.scoreMultiplier = 1;
        this.autoFire = false;
        this.weapon.setType('basic');
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
    }
}
