// 波次系统

class WaveManager {
    constructor() {
        this.currentWave = 0;
        this.enemiesSpawned = 0;
        this.enemiesPerWave = 0;
        this.spawnInterval = 0;
        this.lastSpawnTime = 0;
        this.waveStartTime = 0;
        this.isWaveActive = false;
        this.isBossWave = false;
        this.restTime = 3000; // 波次间隔休息时间
        this.isResting = false;
        this.restStartTime = 0;
    }

    // 开始新波次
    startWave(waveNumber, currentTime) {
        this.currentWave = waveNumber;
        this.enemiesSpawned = 0;
        this.waveStartTime = currentTime;
        this.lastSpawnTime = currentTime;
        this.isWaveActive = true;
        this.isResting = false;

        // 每5波一个Boss
        this.isBossWave = waveNumber % 5 === 0;

        if (this.isBossWave) {
            this.enemiesPerWave = 1;
            this.spawnInterval = 0;
        } else {
            // 敌机数量随波次增加
            this.enemiesPerWave = Math.min(5 + Math.floor(waveNumber * 1.5), 20);
            // 生成间隔随波次减少
            this.spawnInterval = Math.max(2000 - waveNumber * 100, 800);
        }

        audioManager.playWaveStart();
    }

    // 更新波次状态
    update(currentTime, canvasWidth) {
        // 休息阶段
        if (this.isResting) {
            if (currentTime - this.restStartTime >= this.restTime) {
                this.startWave(this.currentWave + 1, currentTime);
            }
            return;
        }

        if (!this.isWaveActive) return;

        // 检查是否该生成新敌机
        if (this.enemiesSpawned < this.enemiesPerWave) {
            if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
                this.spawnEnemy(canvasWidth);
                this.lastSpawnTime = currentTime;
            }
        }

        // 检查波次是否完成（所有敌机已生成且场上无敌机）
        if (this.enemiesSpawned >= this.enemiesPerWave && enemyManager.count === 0) {
            this.endWave(currentTime);
        }
    }

    // 生成敌机
    spawnEnemy(canvasWidth) {
        if (this.isBossWave) {
            // Boss出现在中间
            enemyManager.spawn(canvasWidth / 2, -50, 'boss');
        } else {
            // 随机选择敌机类型
            const types = this.getEnemyTypes();
            const type = Utils.randomChoice(types);
            const x = Utils.random(50, canvasWidth - 50);
            enemyManager.spawn(x, -50, type);
        }

        this.enemiesSpawned++;
    }

    // 根据波次获取可生成的敌机类型
    getEnemyTypes() {
        const wave = this.currentWave;
        const types = ['scout'];

        if (wave >= 2) {
            types.push('scout'); // 增加侦察机权重
        }
        if (wave >= 3) {
            types.push('fighter');
        }
        if (wave >= 5) {
            types.push('fighter');
        }
        if (wave >= 7) {
            types.push('heavy');
        }
        if (wave >= 10) {
            types.push('heavy');
        }

        return types;
    }

    // 结束当前波次
    endWave(currentTime) {
        this.isWaveActive = false;
        this.isResting = true;
        this.restStartTime = currentTime;
    }

    // 重置
    reset() {
        this.currentWave = 0;
        this.enemiesSpawned = 0;
        this.isWaveActive = false;
        this.isResting = false;
        this.isBossWave = false;
    }

    // 开始游戏
    start(currentTime) {
        this.reset();
        this.startWave(1, currentTime);
    }

    // 获取波次显示文本
    getWaveText() {
        if (this.isResting) {
            return `波次 ${this.currentWave + 1} 准备中...`;
        }
        if (this.isBossWave) {
            return `Boss 战 - 波次 ${this.currentWave}`;
        }
        return `波次 ${this.currentWave}`;
    }
}

// 全局波次管理器
const waveManager = new WaveManager();
