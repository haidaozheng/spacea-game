// 游戏主循环

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI元素
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.hud = document.getElementById('hud');
        this.weaponIndicator = document.getElementById('weapon-indicator');
        this.levelIndicator = document.getElementById('level-indicator');
        this.touchControls = document.getElementById('touch-controls');
        
        // 触摸控制相关
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        this.joystick = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            maxDistance: 40
        };
        
        // 设置画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // 游戏状态
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.player = null;
        this.playerBullets = [];
        this.enemyBullets = [];
        this.pausedTime = 0; // 记录暂停时的时间
        
        // 背景星空
        this.stars = [];
        this.initStars();
        
        // 绑定事件
        this.bindEvents();
        
        // 开始渲染循环
        this.lastTime = 0;
        this.animate(0);
    }

    resize() {
        // 保持宽高比
        const maxWidth = Math.min(window.innerWidth - 40, Config.canvasWidth);
        const maxHeight = Math.min(window.innerHeight - 40, Config.canvasHeight);
        
        const ratio = Math.min(maxWidth / Config.canvasWidth, maxHeight / Config.canvasHeight);
        
        this.canvas.width = Config.canvasWidth;
        this.canvas.height = Config.canvasHeight;
        this.canvas.style.width = `${Config.canvasWidth * ratio}px`;
        this.canvas.style.height = `${Config.canvasHeight * ratio}px`;
    }

    initStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Utils.random(0, Config.canvasWidth),
                y: Utils.random(0, Config.canvasHeight),
                size: Utils.random(0.5, 2),
                speed: Utils.random(0.5, 2)
            });
        }
    }

    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > Config.canvasHeight) {
                star.y = 0;
                star.x = Utils.random(0, Config.canvasWidth);
            }
        });
    }

    drawStars() {
        this.ctx.fillStyle = Colors.star;
        this.stars.forEach(star => {
            this.ctx.globalAlpha = 0.3 + Math.random() * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.state === 'playing' && this.player) {
                this.player.handleKeyDown(e.code);
            }
            // 空格键在菜单状态下开始游戏
            if (e.code === 'Space' && this.state === 'menu') {
                this.startGame();
            }
            // ESC或P键暂停/恢复
            if ((e.code === 'Escape' || e.code === 'KeyP') && 
                (this.state === 'playing' || this.state === 'paused')) {
                this.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (this.player) {
                this.player.handleKeyUp(e.code);
                
                // Q键切换自动射击
                if (e.code === 'KeyQ' && this.state === 'playing') {
                    this.player.toggleAutoFire();
                    this.updateAutoFireUI();
                }
            }
        });

        // 按钮事件
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });

        // 难度选择按钮
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的active状态
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                // 添加当前按钮的active状态
                btn.classList.add('active');
                // 设置难度
                Config.difficulty = btn.dataset.difficulty;
            });
        });

        // 触摸控制事件
        this.bindTouchEvents();
    }

    bindTouchEvents() {
        const joystickZone = document.getElementById('joystick-zone');
        const joystickStick = document.getElementById('joystick-stick');
        const fireBtn = document.getElementById('touch-fire');
        const autoBtn = document.getElementById('touch-auto');
        const pauseBtn = document.getElementById('touch-pause');

        if (!joystickZone) return;

        // 摇杆触摸开始
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickZone.getBoundingClientRect();
            this.joystick.active = true;
            this.joystick.startX = rect.left + rect.width / 2;
            this.joystick.startY = rect.top + rect.height / 2;
            this.updateJoystick(touch.clientX, touch.clientY, joystickStick);
        });

        // 摇杆触摸移动
        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.joystick.active) {
                const touch = e.touches[0];
                this.updateJoystick(touch.clientX, touch.clientY, joystickStick);
            }
        });

        // 摇杆触摸结束
        joystickZone.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.joystick.active = false;
            joystickStick.style.transform = 'translate(0px, 0px)';
            if (this.player) {
                this.player.keys.up = false;
                this.player.keys.down = false;
                this.player.keys.left = false;
                this.player.keys.right = false;
            }
        });

        // 射击按钮
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && this.state === 'playing') {
                this.player.keys.shoot = true;
            }
        });

        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.player) {
                this.player.keys.shoot = false;
            }
        });

        // 自动射击按钮
        autoBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.player && this.state === 'playing') {
                this.player.toggleAutoFire();
                this.updateAutoFireUI();
                autoBtn.classList.toggle('active', this.player.autoFire);
            }
        });

        // 暂停按钮
        pauseBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing' || this.state === 'paused') {
                this.togglePause();
            }
        });
    }

    updateJoystick(touchX, touchY, stickElement) {
        const dx = touchX - this.joystick.startX;
        const dy = touchY - this.joystick.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = this.joystick.maxDistance;
        
        let limitedX = dx;
        let limitedY = dy;
        
        if (distance > maxDist) {
            limitedX = (dx / distance) * maxDist;
            limitedY = (dy / distance) * maxDist;
        }
        
        stickElement.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
        
        // 更新玩家移动
        if (this.player && this.state === 'playing') {
            const threshold = 10;
            this.player.keys.left = dx < -threshold;
            this.player.keys.right = dx > threshold;
            this.player.keys.up = dy < -threshold;
            this.player.keys.down = dy > threshold;
        }
    }

    updateAutoFireUI() {
        const autoFireStatus = document.getElementById('auto-fire-status');
        if (this.player.autoFire) {
            autoFireStatus.textContent = '自动: 开';
            autoFireStatus.classList.add('active');
        } else {
            autoFireStatus.textContent = '自动: 关';
            autoFireStatus.classList.remove('active');
        }
    }

    startGame() {
        // 初始化音频
        audioManager.init();
        audioManager.resume();

        // 重置游戏状态
        this.state = 'playing';
        this.score = 0;
        this.playerBullets = [];
        this.enemyBullets = [];

        // 创建玩家
        this.player = new Player(
            Config.canvasWidth / 2,
            Config.canvasHeight - 80
        );

        // 清空管理器
        enemyManager.clear();
        powerupManager.clear();
        particleSystem.clear();

        // 开始波次 - 使用 performance.now() 与 requestAnimationFrame 时间基准一致
        waveManager.start(performance.now());

        // 更新UI
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.pauseScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.weaponIndicator.classList.remove('hidden');
        this.levelIndicator.classList.remove('hidden');
        
        // 显示触摸控制（如果是触屏设备）
        if (this.isTouchDevice && this.touchControls) {
            this.touchControls.classList.remove('hidden');
            this.touchControls.classList.add('visible');
            // 重置自动射击按钮状态
            const autoBtn = document.getElementById('touch-auto');
            if (autoBtn) autoBtn.classList.remove('active');
        }

        this.updateHUD();
        this.updateLevelUI();
        this.updateAutoFireUI();
    }

    togglePause() {
        if (this.state === 'playing') {
            this.pauseGame();
        } else if (this.state === 'paused') {
            this.resumeGame();
        }
    }

    pauseGame() {
        this.state = 'paused';
        this.pausedTime = performance.now();
        this.pauseScreen.classList.remove('hidden');
    }

    resumeGame() {
        // 计算暂停时长，调整时间相关的计时器
        const pauseDuration = performance.now() - this.pausedTime;
        
        // 调整波次管理器的时间
        waveManager.lastSpawnTime += pauseDuration;
        waveManager.waveStartTime += pauseDuration;
        if (waveManager.isResting) {
            waveManager.restStartTime += pauseDuration;
        }
        
        // 调整玩家的计时器
        if (this.player.isInvincible) {
            this.player.invincibleTimer += pauseDuration;
        }
        if (this.player.hasShield) {
            this.player.shieldTimer += pauseDuration;
        }
        if (this.player.scoreMultiplier > 1) {
            this.player.scoreMultiplierTimer += pauseDuration;
        }
        
        // 调整武器射击计时器
        this.player.weapon.lastFireTime += pauseDuration;
        enemyManager.enemies.forEach(enemy => {
            enemy.weapon.lastFireTime += pauseDuration;
        });

        this.state = 'playing';
        this.pauseScreen.classList.add('hidden');
    }

    quitToMenu() {
        this.state = 'menu';
        this.pauseScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.weaponIndicator.classList.add('hidden');
        this.levelIndicator.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        
        // 隐藏触摸控制
        if (this.touchControls) {
            this.touchControls.classList.add('hidden');
            this.touchControls.classList.remove('visible');
        }
        
        // 清空游戏状态
        enemyManager.clear();
        powerupManager.clear();
        particleSystem.clear();
        this.playerBullets = [];
        this.enemyBullets = [];
    }

    gameOver() {
        this.state = 'gameover';
        
        // 显示结算画面
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('final-wave').textContent = waveManager.currentWave;
        document.getElementById('final-level').textContent = this.player.level;
        
        this.hud.classList.add('hidden');
        this.weaponIndicator.classList.add('hidden');
        this.levelIndicator.classList.add('hidden');
        this.gameOverScreen.classList.remove('hidden');
        
        // 隐藏触摸控制
        if (this.touchControls) {
            this.touchControls.classList.add('hidden');
            this.touchControls.classList.remove('visible');
        }
    }

    update(currentTime) {
        if (this.state !== 'playing') return;

        // 更新波次
        waveManager.update(currentTime, Config.canvasWidth);

        // 更新玩家
        this.player.update(currentTime, Config.canvasWidth, Config.canvasHeight);

        // 玩家射击
        const newPlayerBullets = this.player.shoot(currentTime, enemyManager.enemies);
        this.playerBullets = this.playerBullets.concat(newPlayerBullets);

        // 更新玩家子弹
        this.playerBullets.forEach(bullet => bullet.update());
        this.playerBullets = this.playerBullets.filter(
            b => !b.isOutOfBounds(Config.canvasHeight, Config.canvasWidth)
        );

        // 更新敌机
        enemyManager.update(currentTime, Config.canvasWidth, Config.canvasHeight);

        // 敌机射击
        const newEnemyBullets = enemyManager.shootAll(currentTime, this.player.x, this.player.y);
        this.enemyBullets = this.enemyBullets.concat(newEnemyBullets);

        // 更新敌机子弹
        this.enemyBullets.forEach(bullet => bullet.update());
        this.enemyBullets = this.enemyBullets.filter(
            b => !b.isOutOfBounds(Config.canvasHeight, Config.canvasWidth)
        );

        // 更新道具
        powerupManager.update();

        // 更新粒子
        particleSystem.update();

        // 碰撞检测
        this.checkCollisions(currentTime);

        // 检查玩家死亡
        if (this.player.isDead) {
            this.gameOver();
        }

        // 更新HUD
        this.updateHUD();
    }

    checkCollisions(currentTime) {
        const playerHitbox = this.player.getHitbox();

        // 玩家子弹 vs 敌机
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            const bullet = this.playerBullets[i];
            const bulletHitbox = bullet.getHitbox();

            for (let j = enemyManager.enemies.length - 1; j >= 0; j--) {
                const enemy = enemyManager.enemies[j];
                
                if (Utils.rectCollision(bulletHitbox, enemy.getHitbox())) {
                    // 造成伤害
                    const killed = enemy.takeDamage(bullet.damage);
                    
                    // 击中效果
                    particleSystem.createHitEffect(bullet.x, bullet.y, Colors.primary);

                    if (killed) {
                        // 敌机死亡
                        audioManager.playSmallExplosion();
                        particleSystem.createExplosion(enemy.x, enemy.y, enemy.color, 15);
                        
                        // 加分
                        this.score += enemy.score * this.player.scoreMultiplier;
                        
                        // 获得经验值
                        if (this.player.addExp(enemy.expValue)) {
                            // 升级了，更新UI
                            this.updateLevelUI();
                        }
                        
                        // 掉落道具
                        powerupManager.spawnRandom(enemy.x, enemy.y);

                        enemyManager.enemies.splice(j, 1);
                    }

                    // 非穿透子弹消失
                    if (!bullet.piercing) {
                        this.playerBullets.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // 敌机子弹 vs 玩家
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];
            
            if (Utils.rectCollision(bullet.getHitbox(), playerHitbox)) {
                this.player.takeDamage(bullet.damage, currentTime);
                this.enemyBullets.splice(i, 1);
            }
        }

        // 敌机 vs 玩家
        enemyManager.enemies.forEach(enemy => {
            if (Utils.rectCollision(enemy.getHitbox(), playerHitbox)) {
                this.player.takeDamage(20, currentTime);
            }
        });

        // 玩家 vs 道具
        const powerup = powerupManager.checkCollision(this.player);
        if (powerup) {
            this.applyPowerup(powerup, currentTime);
        }
    }

    applyPowerup(powerup, currentTime) {
        audioManager.playPowerup();
        
        switch (powerup.data.type) {
            case 'weapon':
                this.player.setWeapon(powerup.data.weaponType);
                break;
            case 'health':
                this.player.heal(powerup.data.value);
                break;
            case 'shield':
                this.player.activateShield(powerup.data.duration, currentTime);
                break;
            case 'score':
                this.player.activateScoreMultiplier(
                    powerup.data.multiplier,
                    powerup.data.duration,
                    currentTime
                );
                break;
        }
    }

    updateHUD() {
        // 血量
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('health-fill').style.width = `${healthPercent}%`;
        document.getElementById('health-text').textContent = 
            `${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        // 波次
        document.getElementById('wave-text').textContent = waveManager.getWaveText();

        // 分数
        let scoreText = this.score.toString();
        if (this.player.scoreMultiplier > 1) {
            scoreText += ` x${this.player.scoreMultiplier}`;
        }
        document.getElementById('score-text').textContent = scoreText;

        // 武器
        document.getElementById('weapon-name').textContent = this.player.weapon.name;
        
        // 更新经验条
        this.updateLevelUI();
    }

    updateLevelUI() {
        document.getElementById('level-text').textContent = `Lv.${this.player.level}`;
        const expPercent = this.player.getExpProgress() * 100;
        document.getElementById('exp-fill').style.width = `${expPercent}%`;
    }

    draw() {
        // 清空画布
        this.ctx.fillStyle = Colors.background;
        this.ctx.fillRect(0, 0, Config.canvasWidth, Config.canvasHeight);

        // 绘制星空背景
        if (this.state !== 'paused') {
            this.updateStars();
        }
        this.drawStars();

        if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
            // 绘制道具
            powerupManager.draw(this.ctx);

            // 绘制子弹
            this.playerBullets.forEach(bullet => bullet.draw(this.ctx));
            this.enemyBullets.forEach(bullet => bullet.draw(this.ctx));

            // 绘制敌机
            enemyManager.draw(this.ctx);

            // 绘制玩家
            if (!this.player.isDead) {
                this.player.draw(this.ctx);
            }

            // 绘制粒子效果
            particleSystem.draw(this.ctx);
        }
    }

    animate(currentTime) {
        this.update(currentTime);
        this.draw();
        requestAnimationFrame((time) => this.animate(time));
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
