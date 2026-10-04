// Main Game Controller for "Mouse: The Tunnel Maze"

class MouseTunnelGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Virtual internal resolution
        this.virtualWidth = 1080;
        this.virtualHeight = 540;

        // Stage progress
        this.totalStages = 10;
        this.currentStage = 1;
        this.stages = [];

        // Game state machine: 'START', 'PLAYING', 'ENTERING', 'REVEALING', 'RETREATING', 'WIN'
        this.state = 'START';

        // Components
        this.scene = new TunnelScene(this.virtualWidth, this.virtualHeight);
        this.mouse = new MousePlayer(160, this.scene.groundY);

        // Input state tracking
        this.keys = {
            forward: false,
            backward: false,
            jump: false,
            sit: false
        };

        // Transition & Effect variables
        this.transitionTimer = 0;
        this.chosenTunnel = null; // 'upper' or 'lower'
        this.chosenColor = null;  // 'red' or 'blue'
        this.isChoiceCorrect = false;
        this.transitionProgress = 0;
        this.particles = [];
        this.bannerMessage = null;
        this.bannerColor = '#ffffff';
        this.bannerTimer = 0;

        // Bind event listeners
        this.initDOM();
        this.initInput();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start render loop
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    // Generate 10 randomized stages
    generateStages() {
        this.stages = [];
        for (let i = 0; i < this.totalStages; i++) {
            // 50% chance Red top, 50% chance Blue top
            const topIsRed = Math.random() < 0.5;
            const topColor = topIsRed ? 'red' : 'blue';
            const bottomColor = topIsRed ? 'blue' : 'red';

            // 50% chance Red correct, 50% chance Blue correct (independent of position)
            const correctColor = Math.random() < 0.5 ? 'red' : 'blue';

            this.stages.push({
                topColor,
                bottomColor,
                correctColor
            });
        }
        console.log('Maze initialized with 10 randomized stages.');
    }

    startNewGame() {
        window.soundEffects.resume();
        this.generateStages();
        this.currentStage = 1;
        this.loadStage(1);
        this.state = 'PLAYING';
        this.updateHUD();

        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('winScreen').classList.add('hidden');
        document.getElementById('gameOverlay').classList.remove('hidden');
    }

    loadStage(stageNum) {
        const stageData = this.stages[stageNum - 1];
        this.scene.setTunnelLayout(stageData.topColor, stageData.bottomColor);
        // Position mouse at starting tunnel entrance
        this.mouse.reset(160, this.scene.groundY, 1);
        this.updateHUD();
    }

    updateHUD() {
        const stageEl = document.getElementById('stageCounter');
        if (stageEl) {
            stageEl.textContent = `TUNNEL ${this.currentStage} / ${this.totalStages}`;
        }

        // Update progress checkpoint dots
        const progressEl = document.getElementById('progressDots');
        if (progressEl) {
            progressEl.innerHTML = '';
            for (let i = 1; i <= this.totalStages; i++) {
                const dot = document.createElement('div');
                dot.className = `progress-dot ${i === this.currentStage ? 'current' : (i < this.currentStage ? 'completed' : '')}`;
                dot.title = `Tunnel ${i}`;
                progressEl.appendChild(dot);
            }
        }
    }

    showBanner(text, color = '#ffffff', duration = 90) {
        this.bannerMessage = text;
        this.bannerColor = color;
        this.bannerTimer = duration;
    }

    // Tunnel choice triggered
    chooseTunnel(tunnelType) {
        if (this.state !== 'PLAYING') return;

        const currentStageData = this.stages[this.currentStage - 1];
        this.chosenTunnel = tunnelType;
        this.chosenColor = (tunnelType === 'upper') ? currentStageData.topColor : currentStageData.bottomColor;
        this.isChoiceCorrect = (this.chosenColor === currentStageData.correctColor);

        this.state = 'ENTERING';
        this.transitionTimer = 0;
        this.mouse.state = 'travel';
        window.soundEffects.playTunnelEntry();

        console.log(`Stage ${this.currentStage}: Chose ${tunnelType} (${this.chosenColor.toUpperCase()}). Correct is ${currentStageData.correctColor.toUpperCase()}. Result: ${this.isChoiceCorrect ? 'SUCCESS' : 'WRONG'}`);
    }

    initDOM() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startNewGame());
        }

        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startNewGame());
        }

        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                window.soundEffects.resume();
                const muted = window.soundEffects.toggleMute();
                soundToggleBtn.innerHTML = muted ? '🔈 <span>Sound: OFF</span>' : '🔊 <span>Sound: ON</span>';
                soundToggleBtn.classList.toggle('muted', muted);
            });
        }
    }

    initInput() {
        // Keyboard event listeners
        window.addEventListener('keydown', (e) => {
            window.soundEffects.resume();

            if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyD' || e.code === 'ArrowRight') {
                this.keys.forward = true;
                e.preventDefault();
            } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
                this.keys.backward = true;
                e.preventDefault();
            } else if (e.code === 'Space') {
                this.keys.jump = true;
                if (this.state === 'PLAYING') this.mouse.jump();
                e.preventDefault();
            } else if (e.code === 'KeyC') {
                this.keys.sit = true;
                if (this.state === 'PLAYING') this.mouse.toggleSit();
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyD' || e.code === 'ArrowRight') {
                this.keys.forward = false;
            } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'KeyA' || e.code === 'ArrowLeft') {
                this.keys.backward = false;
            } else if (e.code === 'Space') {
                this.keys.jump = false;
            } else if (e.code === 'KeyC') {
                this.keys.sit = false;
            }
        });

        // Touch & Click Controls for the four visible buttons
        const bindButton = (btnId, onDown, onUp) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const handleDown = (e) => {
                e.preventDefault();
                window.soundEffects.resume();
                btn.classList.add('active');
                onDown();
            };

            const handleUp = (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                if (onUp) onUp();
            };

            btn.addEventListener('pointerdown', handleDown);
            btn.addEventListener('pointerup', handleUp);
            btn.addEventListener('pointerleave', handleUp);
            btn.addEventListener('pointercancel', handleUp);
        };

        // 1. [ ↑ FORWARD ]
        bindButton('btnForward',
            () => { this.keys.forward = true; },
            () => { this.keys.forward = false; }
        );

        // 2. [ ↓ BACKWARD ]
        bindButton('btnBackward',
            () => { this.keys.backward = true; },
            () => { this.keys.backward = false; }
        );

        // 3. [ JUMP ]
        bindButton('btnJump',
            () => {
                if (this.state === 'PLAYING') this.mouse.jump();
            },
            null
        );

        // 4. [ SIT ]
        bindButton('btnSit',
            () => {
                if (this.state === 'PLAYING') this.mouse.toggleSit();
            },
            null
        );

        // Direct Touch & Swipe Gestures on Canvas for Mobile Play
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = performance.now();
            }
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.state !== 'PLAYING') return;
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const dt = performance.now() - touchStartTime;
            const dist = Math.hypot(dx, dy);

            if (dist < 15 && dt < 300) {
                // Quick tap: Jump
                this.mouse.jump();
            } else if (dist >= 30) {
                // Swipe detected
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) {
                        this.keys.forward = true;
                        setTimeout(() => { this.keys.forward = false; }, 350);
                    } else {
                        this.keys.backward = true;
                        setTimeout(() => { this.keys.backward = false; }, 350);
                    }
                } else {
                    if (dy < 0) {
                        this.mouse.jump();
                    } else {
                        this.mouse.toggleSit();
                    }
                }
            }
        }, { passive: true });
    }

    resize() {
        const container = document.getElementById('gameContainer');
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Maintain 16:9 or 2:1 aspect ratio cleanly
        const targetRatio = this.virtualWidth / this.virtualHeight;
        let w = containerWidth;
        let h = containerWidth / targetRatio;

        if (h > containerHeight) {
            h = containerHeight;
            w = containerHeight * targetRatio;
        }

        // Set display dimensions
        this.canvas.style.width = `${Math.floor(w)}px`;
        this.canvas.style.height = `${Math.floor(h)}px`;

        // Internal pixel crispness (HiDPI / Retina)
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.floor(this.virtualWidth * dpr);
        this.canvas.height = Math.floor(this.virtualHeight * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    gameLoop(timestamp) {
        const dt = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.update();
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        if (this.bannerTimer > 0) {
            this.bannerTimer--;
        }

        // Update active particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.life--;
            p.alpha = p.life / p.maxLife;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        if (this.state === 'PLAYING') {
            // Apply movement inputs
            if (this.keys.forward && !this.keys.backward) {
                this.mouse.moveForward();
            } else if (this.keys.backward && !this.keys.forward) {
                this.mouse.moveBackward();
            } else {
                this.mouse.stopHorizontal();
            }

            // Mouse physics & collisions with scene
            this.mouse.update(this.scene.platforms, this.scene.ramps, this.virtualWidth);
            this.scene.update(this.mouse, this.virtualWidth, this.virtualHeight);

            // Check if mouse reaches the tunnel threshold
            // Forgiving detection: if mouse is in the tunnel alignment zone (x >= 720)
            // and moves forward, or walks into x >= 810
            if (this.mouse.x >= 720) {
                const targetType = (this.mouse.y < 360) ? 'upper' : 'lower';
                if (this.mouse.x >= 810 || (this.mouse.x >= 740 && this.keys.forward)) {
                    this.chooseTunnel(targetType);
                }
            }
        } else if (this.state === 'ENTERING') {
            this.updateEnteringState();
        } else if (this.state === 'REVEALING') {
            this.updateRevealingState();
        } else if (this.state === 'RETREATING') {
            this.updateRetreatingState();
        } else if (this.state === 'START') {
            // Mouse idle sniffing on title screen
            this.mouse.update(this.scene.platforms, this.scene.ramps, this.virtualWidth);
            this.scene.update(this.mouse, this.virtualWidth, this.virtualHeight);
        }
    }

    updateEnteringState() {
        this.transitionTimer += 1;
        const targetTunnel = (this.chosenTunnel === 'upper') ? this.scene.upperTunnel : this.scene.lowerTunnel;

        // Smoothly glide mouse into the tunnel portal
        this.mouse.vx = 4.2;
        this.mouse.x += this.mouse.vx;
        this.mouse.y += (targetTunnel.floorY - this.mouse.y) * 0.15;
        this.mouse.facing = 1;
        this.mouse.squash = 0.95;

        // Shrink mouse with perspective into depth
        const depth = Math.max(0.2, 1 - (this.transitionTimer / 45) * 0.7);
        this.mouse.scaleOverride = depth;

        // Spawn speed streaks / dust in tunnel
        if (Math.random() < 0.4) {
            this.particles.push({
                x: this.mouse.x + 20,
                y: this.mouse.y - 10 + (Math.random() - 0.5) * 20,
                vx: -4 - Math.random() * 4,
                vy: (Math.random() - 0.5) * 1.5,
                color: this.chosenColor === 'red' ? '#f87171' : '#60a5fa',
                radius: 1.5 + Math.random() * 2,
                life: 18,
                maxLife: 18,
                alpha: 0.8
            });
        }

        // Camera moves slightly forward
        this.scene.cameraX += 1.2;

        if (this.transitionTimer >= 45) {
            this.state = 'REVEALING';
            this.transitionTimer = 0;
            if (this.isChoiceCorrect) {
                window.soundEffects.playCorrect();
                this.showBanner(`✨ CORRECT CHOICE! ADVANCING... ✨`, '#4ade80', 70);
                this.spawnSuccessParticles(this.mouse.x, this.mouse.y - 20);
            } else {
                window.soundEffects.playWrong();
                this.showBanner(`⚠️ WRONG TUNNEL! RETREATING...`, '#f87171', 70);
                this.spawnWrongParticles(this.mouse.x, this.mouse.y - 20);
            }
        }
    }

    updateRevealingState() {
        this.transitionTimer += 1;

        if (this.transitionTimer >= 55) {
            if (this.isChoiceCorrect) {
                // Correct path! Advance to next stage
                if (this.currentStage >= this.totalStages) {
                    // Completed all 10 stages!
                    this.state = 'WIN';
                    this.showWinScreen();
                } else {
                    this.currentStage++;
                    this.loadStage(this.currentStage);
                    this.mouse.scaleOverride = 1;
                    this.state = 'PLAYING';
                }
            } else {
                // Wrong choice! Mouse retreats back to previous stage
                this.state = 'RETREATING';
                this.transitionTimer = 0;
                this.mouse.facing = -1; // turn around to scurry backward
            }
        }
    }

    updateRetreatingState() {
        this.transitionTimer += 1;

        // Mouse scurries backwards through the tunnel
        this.mouse.x -= 3.8;
        this.scene.cameraX = Math.max(0, this.scene.cameraX - 2.5);

        if (this.transitionTimer >= 40) {
            // Regress back by one stage/checkpoint (per gameplay rule)
            this.currentStage = Math.max(1, this.currentStage - 1);
            this.loadStage(this.currentStage);
            this.mouse.scaleOverride = 1;
            this.state = 'PLAYING';
            this.showBanner(`RETURNED TO TUNNEL ${this.currentStage}`, '#fbbf24', 60);
        }
    }

    showWinScreen() {
        window.soundEffects.playVictory();
        document.getElementById('winScreen').classList.remove('hidden');
        document.getElementById('gameOverlay').classList.add('hidden');

        // Confetti celebration particles
        for (let i = 0; i < 70; i++) {
            const colors = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#ec4899', '#facc15'];
            this.particles.push({
                x: this.virtualWidth / 2 + (Math.random() - 0.5) * 300,
                y: 100 + Math.random() * 150,
                vx: (Math.random() - 0.5) * 8,
                vy: -3 - Math.random() * 6,
                gravity: 0.18,
                color: colors[Math.floor(Math.random() * colors.length)],
                radius: 3 + Math.random() * 3,
                life: 140,
                maxLife: 140,
                alpha: 1
            });
        }
    }

    spawnSuccessParticles(x, y) {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.05,
                color: Math.random() < 0.6 ? '#facc15' : '#4ade80',
                radius: 2 + Math.random() * 2.5,
                life: 45,
                maxLife: 45,
                alpha: 1
            });
        }
    }

    spawnWrongParticles(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.08,
                color: Math.random() < 0.5 ? '#f87171' : '#94a3b8',
                radius: 2 + Math.random() * 2.5,
                life: 35,
                maxLife: 35,
                alpha: 1
            });
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

        // Render tunnel scene & environment
        this.scene.render(this.ctx, this.virtualWidth, this.virtualHeight, this.mouse);

        // Render mouse character
        this.ctx.save();
        this.ctx.translate(-Math.round(this.scene.cameraX), 0);

        if (this.mouse.scaleOverride !== undefined && this.mouse.scaleOverride !== 1) {
            this.ctx.save();
            this.ctx.translate(this.mouse.x, this.mouse.y);
            this.ctx.scale(this.mouse.scaleOverride, this.mouse.scaleOverride);
            this.ctx.translate(-this.mouse.x, -this.mouse.y);
            this.mouse.render(this.ctx);
            this.ctx.restore();
        } else {
            this.mouse.render(this.ctx);
        }

        // Render world particles (sparkles, tunnel speed dust)
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1.0;
        this.ctx.restore();

        // Render Screen Overlay Banner if active
        if (this.bannerTimer > 0 && this.bannerMessage) {
            this.renderBanner();
        }
    }

    renderBanner() {
        this.ctx.save();
        const alpha = Math.min(1, this.bannerTimer / 20);
        this.ctx.globalAlpha = alpha;

        const bannerY = 85;
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        this.ctx.strokeStyle = this.bannerColor;
        this.ctx.lineWidth = 2;

        this.ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        const metrics = this.ctx.measureText(this.bannerMessage);
        const w = metrics.width + 36;
        const h = 40;
        const x = (this.virtualWidth - w) / 2;

        this.ctx.beginPath();
        this.ctx.roundRect(x, bannerY - h / 2, w, h, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.bannerColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.bannerMessage, this.virtualWidth / 2, bannerY);

        this.ctx.restore();
    }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MouseTunnelGame();
});
