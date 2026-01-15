// 工具函数

const Utils = {
    // 随机数范围
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // 随机整数
    randomInt(min, max) {
        return Math.floor(this.random(min, max + 1));
    },

    // 距离计算
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    // 角度转弧度
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    // 弧度转角度
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    // 限制值范围
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // 矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    },

    // 圆形碰撞检测
    circleCollision(c1, c2) {
        const dist = this.distance(c1.x, c1.y, c2.x, c2.y);
        return dist < c1.radius + c2.radius;
    },

    // 点与矩形碰撞
    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.width &&
               py >= rect.y && py <= rect.y + rect.height;
    },

    // 线性插值
    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    // 从数组随机选择
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // 带权重的随机选择
    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (let i = 0; i < items.length; i++) {
            random -= weights[i];
            if (random <= 0) return items[i];
        }
        return items[items.length - 1];
    }
};

// 颜色配置
const Colors = {
    primary: '#00ffff',
    secondary: '#66ffff',
    enemy: '#ff3366',
    enemySecondary: '#ff6699',
    powerup: '#ffff00',
    health: '#00ff00',
    shield: '#9966ff',
    background: '#0a0a1a',
    star: '#ffffff'
};

// 游戏配置
const Config = {
    canvasWidth: 800,
    canvasHeight: 600,
    playerSpeed: 5,
    playerMaxHealth: 100,
    invincibleTime: 1500, // 受伤后无敌时间(ms)
    dropRate: 0.3, // 道具掉落率
    difficulty: 'normal' // 当前难度
};

// 难度配置
const DifficultySettings = {
    easy: {
        name: '简单',
        enemySpeedMultiplier: 0.7,
        enemyDamageMultiplier: 0.5,
        enemyHealthMultiplier: 0.8,
        enemyFireRateMultiplier: 1.5, // 越大射击越慢
        spawnIntervalMultiplier: 1.3,
        scoreMultiplier: 0.8
    },
    normal: {
        name: '中等',
        enemySpeedMultiplier: 1.0,
        enemyDamageMultiplier: 1.0,
        enemyHealthMultiplier: 1.0,
        enemyFireRateMultiplier: 1.0,
        spawnIntervalMultiplier: 1.0,
        scoreMultiplier: 1.0
    },
    hard: {
        name: '困难',
        enemySpeedMultiplier: 1.3,
        enemyDamageMultiplier: 1.5,
        enemyHealthMultiplier: 1.2,
        enemyFireRateMultiplier: 0.7, // 越小射击越快
        spawnIntervalMultiplier: 0.7,
        scoreMultiplier: 1.5
    }
};

// 玩家升级配置
const PlayerLevels = [
    { level: 1, expRequired: 0, maxHealth: 100, size: 1.0, speed: 5, damageMultiplier: 1.0, color: '#00ffff' },
    { level: 2, expRequired: 500, maxHealth: 120, size: 1.05, speed: 5.2, damageMultiplier: 1.1, color: '#00ffff' },
    { level: 3, expRequired: 1200, maxHealth: 150, size: 1.1, speed: 5.4, damageMultiplier: 1.25, color: '#00ff99' },
    { level: 4, expRequired: 2000, maxHealth: 180, size: 1.15, speed: 5.6, damageMultiplier: 1.4, color: '#00ff99' },
    { level: 5, expRequired: 3000, maxHealth: 220, size: 1.2, speed: 5.8, damageMultiplier: 1.6, color: '#ffff00' },
    { level: 6, expRequired: 4500, maxHealth: 260, size: 1.25, speed: 6.0, damageMultiplier: 1.8, color: '#ffff00' },
    { level: 7, expRequired: 6500, maxHealth: 300, size: 1.3, speed: 6.2, damageMultiplier: 2.0, color: '#ff9900' },
    { level: 8, expRequired: 9000, maxHealth: 350, size: 1.35, speed: 6.4, damageMultiplier: 2.3, color: '#ff9900' },
    { level: 9, expRequired: 12000, maxHealth: 400, size: 1.4, speed: 6.6, damageMultiplier: 2.6, color: '#ff00ff' },
    { level: 10, expRequired: 16000, maxHealth: 500, size: 1.5, speed: 7.0, damageMultiplier: 3.0, color: '#ff00ff' }
];
