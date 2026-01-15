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
    dropRate: 0.3 // 道具掉落率
};
