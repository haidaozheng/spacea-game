// 音效系统 - 使用 Web Audio API 程序化生成音效

class AudioManager {
    constructor() {
        this.context = null;
        this.masterVolume = 0.3;
        this.enabled = true;
    }

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    // 创建音调
    playTone(frequency, duration, type = 'square', volume = 0.3) {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    // 射击音效
    playShoot() {
        if (!this.enabled || !this.context) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15 * this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.1);

        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }

    // 激光音效
    playLaser() {
        if (!this.enabled || !this.context) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.context.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1 * this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    }

    // 爆炸音效
    playExplosion() {
        if (!this.enabled || !this.context) return;

        // 使用噪音生成爆炸效果
        const bufferSize = this.context.sampleRate * 0.3;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }

        const noise = this.context.createBufferSource();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.context.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);

        gain.gain.setValueAtTime(0.4 * this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);

        noise.start();
    }

    // 小爆炸(敌人死亡)
    playSmallExplosion() {
        if (!this.enabled || !this.context) return;

        const bufferSize = this.context.sampleRate * 0.15;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }

        const noise = this.context.createBufferSource();
        const gain = this.context.createGain();

        noise.buffer = buffer;
        noise.connect(gain);
        gain.connect(this.context.destination);

        gain.gain.setValueAtTime(0.25 * this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.15);

        noise.start();
    }

    // 道具拾取音效
    playPowerup() {
        if (!this.enabled || !this.context) return;

        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.1, 'sine', 0.2);
            }, i * 50);
        });
    }

    // 受伤音效
    playHit() {
        if (!this.enabled || !this.context) return;

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.2);

        gain.gain.setValueAtTime(0.3 * this.masterVolume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);

        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    }

    // 新波次提示音
    playWaveStart() {
        if (!this.enabled || !this.context) return;

        const notes = [440, 554, 659]; // A4, C#5, E5
        
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.2, 'triangle', 0.25);
            }, i * 150);
        });
    }
}

// 全局音效管理器
const audioManager = new AudioManager();
