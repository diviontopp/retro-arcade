/**
 * ═══════════════════════════════════════════════════════════════
 * AUDIOBUS — Web Audio API Sound Synthesizer
 * ═══════════════════════════════════════════════════════════════
 * 
 * Synthesizes arcade sounds using Web Audio API (no MP3s).
 * Exposes window.triggerSFX(type) for Python scripts to call.
 */

type SFXType = 'startup' | 'click' | 'jump' | 'crash' | 'game_over';

class AudioBus {
    private ctx: AudioContext | null = null;

    constructor() {
        // Initialize AudioContext on first user interaction
        if (typeof window !== 'undefined') {
            this.initAudioContext();
        }
    }

    private initAudioContext() {
        try {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Ensure AudioContext is running (required after user interaction)
     */
    private async ensureContext(): Promise<AudioContext | null> {
        if (!this.ctx) {
            this.initAudioContext();
        }

        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        return this.ctx;
    }

    /**
     * STARTUP SOUND: Dial-up modem handshake
     * Simulates the classic modem connection sound with noise + sine waves
     */
    private async playStartup() {
        const ctx = await this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 2.5;

        // White noise for modem static
        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Sine wave sweeps (modem tones)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1200, now);
        osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.5);
        osc1.frequency.setValueAtTime(1800, now + 0.5);
        osc1.frequency.exponentialRampToValueAtTime(1000, now + 1.5);

        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(800, now);
        osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.8);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.setValueAtTime(0.15, now + 1.5);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        noise.connect(noiseGain);
        osc1.connect(oscGain);
        osc2.connect(oscGain);
        noiseGain.connect(ctx.destination);
        oscGain.connect(ctx.destination);

        // Start and stop
        noise.start(now);
        osc1.start(now);
        osc2.start(now);
        noise.stop(now + duration);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    /**
     * CLICK SOUND: Very short high-frequency square wave
     * Duration: 0.05s
     */
    private async playClick() {
        const ctx = await this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.05;

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * JUMP SOUND: Slide-whistle effect
     * Sine wave frequency ramping up
     */
    private async playJump() {
        const ctx = await this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.15;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * CRASH SOUND: White noise burst
     */
    private async playCrash() {
        const ctx = await this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.3;

        const bufferSize = ctx.sampleRate * duration;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Low-pass filter for more "thud" effect
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
    }

    /**
     * GAME OVER SOUND: Descending tone
     */
    private async playGameOver() {
        const ctx = await this.ensureContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const duration = 0.5;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
    }

    /**
     * Main trigger function exposed to window
     */
    public trigger(type: SFXType | string) {
        switch (type) {
            case 'startup':
                this.playStartup();
                break;
            case 'click':
            case 'move': // reusing click for move
                this.playClick();
                break;
            case 'jump':
                this.playJump();
                break;
            case 'crash':
                this.playCrash();
                break;
            case 'game_over':
                this.playGameOver();
                break;
            case 'rotate':
                // Higher pitch click for rotate
                this.playRotate();
                break;
            case 'lock':
                // Thud for lock
                this.playLock();
                break;
            default:
                console.warn(`Unknown SFX type: ${type}`);
        }
    }

    private async playRotate() {
        const ctx = await this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const duration = 0.05;

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1200, now);
        // Quick subtle pitch shift
        osc.frequency.linearRampToValueAtTime(1400, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    private async playLock() {
        const ctx = await this.ensureContext();
        if (!ctx) return;
        const now = ctx.currentTime;
        const duration = 0.1;

        // Low frequency noise or square wave
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

// Create singleton instance
const audioBus = new AudioBus();

// Expose to window for Python scripts
declare global {
    interface Window {
        triggerSFX: (type: SFXType) => void;
    }
}

if (typeof window !== 'undefined') {
    window.triggerSFX = (type: SFXType) => audioBus.trigger(type);
}

export default audioBus;
