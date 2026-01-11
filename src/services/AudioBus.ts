/**
 * ═══════════════════════════════════════════════════════════════
 * AUDIOBUS — Hybrid Audio Engine
 * ═══════════════════════════════════════════════════════════════
 * 
 * Manages Background Music (BGM) playlist and Sound Effects (SFX).
 * Uses Web Audio API for low-latency SFX and HTML5 Audio for streaming BGM.
 */

type SFXType = 'startup' | 'click' | 'jump' | 'crash' | 'game_over' | 'rotate' | 'lock' | 'score' | 'shoot' | 'enemy_hit' | 'bounce';

// Configuration for file-based SFX
const SFX_FILES: Record<string, string> = {
    'jump': '/audio/jumpsound.wav',
    'game_over': '/audio/gameover.wav',
    'crash': '/audio/losesound.wav',
    'score': '/audio/mixkit-unlock-game-notification-253.wav',
    'startup': '/audio/gamenotif.wav',
    // Fallbacks or additional mappings
    'enemy_hit': '/audio/arcade-space-shooter-dead-notification-272.wav',
    'bonus': '/audio/bonusalert.wav'
};

const BGM_PLAYLIST = [
    '/audio/mainmusic.mp3',
    '/audio/chip-mode-danijel-zambo-main-version-1431-02-05.mp3',
    '/audio/arcadevocals.mp3',
    '/audio/collectionofarcadesounds.mp3'
];

class AudioBus {
    private ctx: AudioContext | null = null;
    private bgm: HTMLAudioElement | null = null;
    private sfxBuffers: Map<string, AudioBuffer> = new Map();
    private currentTrackIndex = 0;
    private isMuted = false;
    private volume = 0.5;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initAudioContext();
            this.preloadSFX();
            this.playBGM(); // Attempt autoplay
        }
    }

    private initAudioContext() {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.ctx = new AudioContextClass();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    private async preloadSFX() {
        if (!this.ctx) return;

        for (const [key, path] of Object.entries(SFX_FILES)) {
            try {
                const response = await fetch(path);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.sfxBuffers.set(key, audioBuffer);
            } catch (e) {
                console.warn(`Failed to load SFX ${path}:`, e);
            }
        }
    }

    /**
     * Start Background Music Playlist
     */
    public playBGM() {
        if (this.bgm) return;

        this.bgm = new Audio(BGM_PLAYLIST[this.currentTrackIndex]);
        this.bgm.volume = this.volume;
        this.bgm.loop = false; // We handle loop manually to go to next track

        // Playlist logic
        this.bgm.addEventListener('ended', () => {
            this.currentTrackIndex = (this.currentTrackIndex + 1) % BGM_PLAYLIST.length;
            if (this.bgm) {
                this.bgm.src = BGM_PLAYLIST[this.currentTrackIndex];
                this.bgm.play().catch(e => console.log("Autoplay blocked/waiting:", e));
            }
        });

        // Try to play (will fail without interaction usually)
        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Audio autoplay prevented. Waiting for interaction.", error);
                // Add one-time click listener to start audio
                const startAudio = () => {
                    if (this.bgm) this.bgm.play();
                    this.initAudioContext();
                    if (this.ctx?.state === 'suspended') this.ctx.resume();
                    document.removeEventListener('click', startAudio);
                    document.removeEventListener('keydown', startAudio);
                };
                document.addEventListener('click', startAudio);
                document.addEventListener('keydown', startAudio);
            });
        }
    }

    public setVolume(val: number) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.bgm) this.bgm.volume = this.volume;
    }

    private async ensureContext() {
        if (!this.ctx) this.initAudioContext();
        if (this.ctx?.state === 'suspended') await this.ctx.resume();
        return this.ctx;
    }

    /**
     * Trigger a sound effect
     */
    public async trigger(type: SFXType | string) {
        if (this.isMuted) return;
        const ctx = await this.ensureContext();
        if (!ctx) return;

        // Check if we have a file loaded for this type
        if (this.sfxBuffers.has(type)) {
            const source = ctx.createBufferSource();
            source.buffer = this.sfxBuffers.get(type)!;

            const gainNode = ctx.createGain();
            // slightly louder for critical events
            gainNode.gain.value = (type === 'game_over' || type === 'score') ? 0.8 : 0.6;

            source.connect(gainNode);
            gainNode.connect(ctx.destination);
            source.start(0);
        } else {
            // Fallback to synthesis for missing files
            this.synthesizeSFX(type);
        }
    }

    /**
     * Fallback Synthesizer (kept from original)
     */
    private synthesizeSFX(type: string) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        switch (type) {
            case 'click':
            case 'move':
            case 'type':
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'rotate':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            case 'shoot':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(200, now + 0.2);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;
            case 'bounce':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'lock':
                osc.type = 'square';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            default:
                // Generic beep
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
        }
    }
}

// Singleton
const audioBus = new AudioBus();

// Global Access
declare global {
    interface Window {
        triggerSFX: (type: SFXType | string) => void;
    }
}
if (typeof window !== 'undefined') {
    window.triggerSFX = (type) => audioBus.trigger(type);
}

export default audioBus;
