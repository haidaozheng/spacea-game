// 玩家飞机系统

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseWidth = 40;
        this.baseHeight = 50;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.speed = Config.playerSpeed;
        this.health = Config.playerMaxHealth;
        this.maxHealth = Config.playerMaxHealth;
        this.weapon = new Weapon('basic');
        this.isDead = false;
        
        // 升级系统
        this.level = 1;
        this.exp = 0;
        this.sizeScale = 1.0;
        this.damageMultiplier = 1.0;
        this.shipColor = '#00ffff';
        
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
        this.levelUpEffect = 0; // 升级特效计时器
    }

    // 添加经验值
    addExp(amount) {
        this.exp += amount;
        
        // 检查是否可以升级
        const nextLevel = this.level + 1;
        if (nextLevel <= PlayerLevels.length) {
            const nextLevelData = PlayerLevels[nextLevel - 1];
            if (this.exp >= nextLevelData.expRequired) {
                this.levelUp();
                return true;
            }
        }
        return false;
    }

    // 升级
    levelUp() {
        if (this.level >= PlayerLevels.length) return;
        
        this.level++;
        const levelData = PlayerLevels[this.level - 1];
        
        // 应用升级属性
        const healthPercent = this.health / this.maxHealth;
        this.maxHealth = levelData.maxHealth;
        this.health = Math.ceil(this.maxHealth * healthPercent); // 保持血量百分比
        this.sizeScale = levelData.size;
        this.speed = levelData.speed;
        this.damageMultiplier = levelData.damageMultiplier;
        this.shipColor = levelData.color;
        
        // 更新实际尺寸
        this.width = this.baseWidth * this.sizeScale;
        this.height = this.baseHeight * this.sizeScale;
        
        // 触发升级特效
        this.levelUpEffect = 60; // 60帧特效
        audioManager.playPowerup();
        particleSystem.createExplosion(this.x, this.y, this.shipColor, 25);
    }

    // 获取升级进度百分比
    getExpProgress() {
        if (this.level >= PlayerLevels.length) return 1;
        
        const currentLevelExp = PlayerLevels[this.level - 1].expRequired;
        const nextLevelExp = PlayerLevels[this.level].expRequired;
        const expInLevel = this.exp - currentLevelExp;
        const expNeeded = nextLevelExp - currentLevelExp;
        
        return expInLevel / expNeeded;
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
        
        // 应用等级伤害倍率
        bullets.forEach(bullet => {
            bullet.damage *= this.damageMultiplier;
            bullet.color = this.shipColor; // 子弹颜色跟随飞机
        });
        
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
        
        // 应用缩放
        ctx.scale(this.sizeScale, this.sizeScale);

        // 无敌闪烁效果
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 升级特效 - 金色光环
        if (this.levelUpEffect > 0) {
            this.levelUpEffect--;
            ctx.strokeStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20 + (this.levelUpEffect / 2);
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = this.shipColor;
            ctx.shadowColor = this.shipColor;
            ctx.shadowBlur = 10;
            ctx.lineWidth = 2;
        }

        // 根据等级绘制不同样式
        if (this.level <= 2) {
            this.drawShipLevel1(ctx);
        } else if (this.level <= 4) {
            this.drawShipLevel3(ctx);
        } else if (this.level <= 6) {
            this.drawShipLevel5(ctx);
        } else if (this.level <= 8) {
            this.drawShipLevel7(ctx);
        } else {
            this.drawShipLevel9(ctx);
        }

        // 引擎发光
        const engineGlow = 0.5 + Math.sin(this.enginePhase) * 0.3;
        ctx.globalAlpha = engineGlow;
        this.drawEngine(ctx);

        ctx.restore();

        // 绘制护盾
        if (this.hasShield) {
            this.drawShield(ctx);
        }
    }

    // 等级1-2: 基础战机
    drawShipLevel1(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;
        
        // 主体
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(-w / 2, h / 2 - 10);
        ctx.lineTo(-w / 4, h / 2 - 15);
        ctx.lineTo(0, h / 2 - 5);
        ctx.lineTo(w / 4, h / 2 - 15);
        ctx.lineTo(w / 2, h / 2 - 10);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 + 15);
        ctx.lineTo(-6, 5);
        ctx.lineTo(6, 5);
        ctx.closePath();
        ctx.stroke();
    }

    // 等级3-4: 增加翼尖
    drawShipLevel3(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;
        
        // 主体
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(-w / 2 - 5, h / 2 - 5);
        ctx.lineTo(-w / 2, h / 2 - 15);
        ctx.lineTo(-w / 4, h / 2 - 18);
        ctx.lineTo(0, h / 2 - 8);
        ctx.lineTo(w / 4, h / 2 - 18);
        ctx.lineTo(w / 2, h / 2 - 15);
        ctx.lineTo(w / 2 + 5, h / 2 - 5);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 + 12);
        ctx.lineTo(-8, 3);
        ctx.lineTo(8, 3);
        ctx.closePath();
        ctx.stroke();

        // 翼尖装饰
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 5, h / 2 - 5);
        ctx.lineTo(-w / 2 - 8, h / 2 + 5);
        ctx.moveTo(w / 2 + 5, h / 2 - 5);
        ctx.lineTo(w / 2 + 8, h / 2 + 5);
        ctx.stroke();
    }

    // 等级5-6: 双翼设计
    drawShipLevel5(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;
        
        // 主体
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(-w / 3, -h / 4);
        ctx.lineTo(-w / 2 - 8, h / 4);
        ctx.lineTo(-w / 2, h / 2 - 10);
        ctx.lineTo(-w / 4, h / 2 - 15);
        ctx.lineTo(0, h / 2 - 8);
        ctx.lineTo(w / 4, h / 2 - 15);
        ctx.lineTo(w / 2, h / 2 - 10);
        ctx.lineTo(w / 2 + 8, h / 4);
        ctx.lineTo(w / 3, -h / 4);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 + 10);
        ctx.lineTo(-10, 0);
        ctx.lineTo(0, 8);
        ctx.lineTo(10, 0);
        ctx.closePath();
        ctx.stroke();

        // 副翼
        ctx.beginPath();
        ctx.moveTo(-w / 3, 0);
        ctx.lineTo(-w / 2 - 12, h / 6);
        ctx.moveTo(w / 3, 0);
        ctx.lineTo(w / 2 + 12, h / 6);
        ctx.stroke();
    }

    // 等级7-8: 战斗机造型
    drawShipLevel7(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;
        
        // 主体 - 更复杂的形状
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.lineTo(-w / 4, -h / 3);
        ctx.lineTo(-w / 2 - 10, 0);
        ctx.lineTo(-w / 2 - 5, h / 3);
        ctx.lineTo(-w / 2, h / 2 - 8);
        ctx.lineTo(-w / 4, h / 2 - 12);
        ctx.lineTo(0, h / 2 - 5);
        ctx.lineTo(w / 4, h / 2 - 12);
        ctx.lineTo(w / 2, h / 2 - 8);
        ctx.lineTo(w / 2 + 5, h / 3);
        ctx.lineTo(w / 2 + 10, 0);
        ctx.lineTo(w / 4, -h / 3);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱
        ctx.beginPath();
        ctx.arc(0, -h / 6, 8, 0, Math.PI * 2);
        ctx.stroke();

        // 武器挂载点
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 10, 0);
        ctx.lineTo(-w / 2 - 15, -5);
        ctx.lineTo(-w / 2 - 15, 10);
        ctx.moveTo(w / 2 + 10, 0);
        ctx.lineTo(w / 2 + 15, -5);
        ctx.lineTo(w / 2 + 15, 10);
        ctx.stroke();

        // 尾翼
        ctx.beginPath();
        ctx.moveTo(-w / 4, h / 2 - 12);
        ctx.lineTo(-w / 4 - 5, h / 2 + 5);
        ctx.moveTo(w / 4, h / 2 - 12);
        ctx.lineTo(w / 4 + 5, h / 2 + 5);
        ctx.stroke();
    }

    // 等级9-10: 高级战机
    drawShipLevel9(ctx) {
        const w = this.baseWidth;
        const h = this.baseHeight;
        
        // 主体 - 最复杂的形状
        ctx.beginPath();
        ctx.moveTo(0, -h / 2 - 5);
        ctx.lineTo(-w / 5, -h / 3);
        ctx.lineTo(-w / 3, -h / 4);
        ctx.lineTo(-w / 2 - 12, h / 6);
        ctx.lineTo(-w / 2 - 8, h / 3);
        ctx.lineTo(-w / 2, h / 2 - 5);
        ctx.lineTo(-w / 3, h / 2 - 10);
        ctx.lineTo(-w / 6, h / 2 - 8);
        ctx.lineTo(0, h / 2);
        ctx.lineTo(w / 6, h / 2 - 8);
        ctx.lineTo(w / 3, h / 2 - 10);
        ctx.lineTo(w / 2, h / 2 - 5);
        ctx.lineTo(w / 2 + 8, h / 3);
        ctx.lineTo(w / 2 + 12, h / 6);
        ctx.lineTo(w / 3, -h / 4);
        ctx.lineTo(w / 5, -h / 3);
        ctx.closePath();
        ctx.stroke();

        // 驾驶舱 - 菱形
        ctx.beginPath();
        ctx.moveTo(0, -h / 3);
        ctx.lineTo(-10, -h / 6);
        ctx.lineTo(0, 5);
        ctx.lineTo(10, -h / 6);
        ctx.closePath();
        ctx.stroke();

        // 双武器挂载点
        ctx.beginPath();
        ctx.moveTo(-w / 2 - 12, h / 6);
        ctx.lineTo(-w / 2 - 18, 0);
        ctx.lineTo(-w / 2 - 18, h / 4);
        ctx.moveTo(w / 2 + 12, h / 6);
        ctx.lineTo(w / 2 + 18, 0);
        ctx.lineTo(w / 2 + 18, h / 4);
        ctx.stroke();

        // 前翼
        ctx.beginPath();
        ctx.moveTo(-w / 5, -h / 3);
        ctx.lineTo(-w / 3 - 8, -h / 4);
        ctx.moveTo(w / 5, -h / 3);
        ctx.lineTo(w / 3 + 8, -h / 4);
        ctx.stroke();

        // 核心发光
        ctx.globalAlpha = 0.5 + Math.sin(this.enginePhase * 2) * 0.3;
        ctx.beginPath();
        ctx.arc(0, -h / 6, 4, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 引擎绘制
    drawEngine(ctx) {
        const h = this.baseHeight;
        
        if (this.level <= 4) {
            // 单引擎
            ctx.beginPath();
            ctx.moveTo(-8, h / 2 - 15);
            ctx.lineTo(0, h / 2 + 8);
            ctx.lineTo(8, h / 2 - 15);
            ctx.stroke();
        } else if (this.level <= 6) {
            // 双引擎
            ctx.beginPath();
            ctx.moveTo(-12, h / 2 - 12);
            ctx.lineTo(-8, h / 2 + 6);
            ctx.lineTo(-4, h / 2 - 12);
            ctx.moveTo(4, h / 2 - 12);
            ctx.lineTo(8, h / 2 + 6);
            ctx.lineTo(12, h / 2 - 12);
            ctx.stroke();
        } else {
            // 三引擎
            ctx.beginPath();
            ctx.moveTo(-15, h / 2 - 10);
            ctx.lineTo(-12, h / 2 + 5);
            ctx.lineTo(-9, h / 2 - 10);
            ctx.moveTo(-3, h / 2 - 8);
            ctx.lineTo(0, h / 2 + 10);
            ctx.lineTo(3, h / 2 - 8);
            ctx.moveTo(9, h / 2 - 10);
            ctx.lineTo(12, h / 2 + 5);
            ctx.lineTo(15, h / 2 - 10);
            ctx.stroke();
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
        
        // 重置升级系统
        this.level = 1;
        this.exp = 0;
        this.sizeScale = 1.0;
        this.damageMultiplier = 1.0;
        this.shipColor = '#00ffff';
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.speed = Config.playerSpeed;
        this.maxHealth = Config.playerMaxHealth;
        this.health = this.maxHealth;
        
        this.isDead = false;
        this.isInvincible = false;
        this.hasShield = false;
        this.scoreMultiplier = 1;
        this.autoFire = false;
        this.levelUpEffect = 0;
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
