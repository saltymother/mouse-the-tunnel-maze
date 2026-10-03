// Web Audio API Sound Synthesizer for "Mouse: The Tunnel Maze"
// 100% self-contained, no external audio files required.

class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
        this.lastFootstepTime = 0;
    }

    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.initialized = true;
            }
        } catch (e) {
            console.warn('AudioContext initialization failed:', e);
        }
    }

    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    // Footstep scurry: light, soft, unobtrusive tap
    playFootstep() {
        if (this.muted || !this.ctx) return;
        const now = performance.now();
        if (now - this.lastFootstepTime < 140) return; // limit frequency
        this.lastFootstepTime = now;

        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            const pitch = 220 + Math.random() * 80;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pitch, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, t);

            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.05);
        } catch (e) {}
    }

    // Small jump sound: light upward spring / chirp
    playJump() {
        if (this.muted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, t);
            osc.frequency.exponentialRampToValueAtTime(540, t + 0.12);

            gain.gain.setValueAtTime(0.09, t);
            gain.gain.linearRampToValueAtTime(0.07, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.15);
        } catch (e) {}
    }

    // Sit squeak: adorable, soft cartoon mouse chirp
    playSit() {
        if (this.muted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, t);
            osc.frequency.linearRampToValueAtTime(2200, t + 0.06);
            osc.frequency.exponentialRampToValueAtTime(1700, t + 0.14);

            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.17);
        } catch (e) {}
    }

    // Spring bounce sound: cheerful boing
    playBounce() {
        if (this.muted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(580, t + 0.12);
            osc.frequency.exponentialRampToValueAtTime(320, t + 0.25);

            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.3);
        } catch (e) {}
    }

    // Tunnel entry sound: subterranean wind whoosh
    playTunnelEntry() {
        if (this.muted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // Noise generator for wind whoosh
            const bufferSize = this.ctx.sampleRate * 0.4;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(250, t);
            filter.frequency.exponentialRampToValueAtTime(800, t + 0.2);
            filter.frequency.exponentialRampToValueAtTime(180, t + 0.4);
            filter.Q.value = 3.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.01, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(t);
            noise.stop(t + 0.42);
        } catch (e) {}
    }

    // Correct choice: subtle, pleasant harmonious chime arpeggio
    playCorrect() {
        if (this.muted || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            const baseTime = this.ctx.currentTime;

            notes.forEach((freq, idx) => {
                const noteTime = baseTime + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.12, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.38);
            });
        } catch (e) {}
    }

    // Incorrect choice: harmless, playful hollow descending thud
    playWrong() {
        if (this.muted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, t);
            osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);

            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.3);

            // Follow-up soft bonk
            setTimeout(() => {
                if (this.muted || !this.ctx) return;
                const t2 = this.ctx.currentTime;
                const osc2 = this.ctx.createOscillator();
                const gain2 = this.ctx.createGain();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(140, t2);
                osc2.frequency.exponentialRampToValueAtTime(80, t2 + 0.2);
                gain2.gain.setValueAtTime(0.09, t2);
                gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22);
                osc2.connect(gain2);
                gain2.connect(this.ctx.destination);
                osc2.start(t2);
                osc2.stop(t2 + 0.24);
            }, 120);
        } catch (e) {}
    }

    // Win Fanfare: joyful celebratory melody
    playVictory() {
        if (this.muted || !this.ctx) return;
        try {
            const melody = [
                { f: 523.25, d: 0.15 }, // C5
                { f: 659.25, d: 0.15 }, // E5
                { f: 783.99, d: 0.15 }, // G5
                { f: 1046.50, d: 0.25 }, // C6
                { f: 880.00, d: 0.15 },  // A5
                { f: 1046.50, d: 0.45 }  // C6 long
            ];

            let curr = this.ctx.currentTime;
            melody.forEach(m => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(m.f, curr);

                gain.gain.setValueAtTime(0.15, curr);
                gain.gain.exponentialRampToValueAtTime(0.001, curr + m.d + 0.1);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(curr);
                osc.stop(curr + m.d + 0.15);
                curr += m.d + 0.05;
            });
        } catch (e) {}
    }
}

window.soundEffects = new SoundEffects();
