// Underground Tunnel Scene Renderer and Camera for "Mouse: The Tunnel Maze"

class TunnelScene {
    constructor(worldWidth = 1040, worldHeight = 540) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Camera
        this.cameraX = 0;
        this.cameraTargetX = 0;

        // Geometry heights
        this.groundY = 460;
        this.upperPlatformY = 285;
        this.stepPlatformY = 375;

        // Platforms for mouse collision (semi-solid / jump-through)
        this.platforms = [
            // 1. Lower main cavern floor (solid bedrock)
            { x: 40, y: this.groundY, w: this.worldWidth - 40, h: 80, isGround: true },
            // 2. Stepping stone ledge
            { x: 330, y: this.stepPlatformY, w: 95, h: 25, isGround: false, isStep: true },
            // 3. Upper walkway platform
            { x: 450, y: this.upperPlatformY, w: 470, h: 22, isGround: false }
        ];

        // Bouncy Spring Mushroom (launches mouse to upper walkway)
        this.springMushroom = {
            x: 275,
            y: this.groundY,
            scaleY: 1.0,
            springTimer: 0
        };

        // Tunnel Entrance bounds
        this.upperTunnel = {
            x: 820,
            y: this.upperPlatformY - 110,
            w: 120,
            h: 110,
            floorY: this.upperPlatformY,
            color: 'blue' // set dynamically
        };

        this.lowerTunnel = {
            x: 820,
            y: this.groundY - 110,
            w: 120,
            h: 110,
            floorY: this.groundY,
            color: 'red' // set dynamically
        };

        // Left starting tunnel (exit of previous stage)
        this.startTunnel = {
            x: 45,
            y: this.groundY - 110,
            w: 110,
            h: 110,
            floorY: this.groundY
        };

        // Ambient particles (floating dust motes)
        this.dustMotes = [];
        for (let i = 0; i < 35; i++) {
            this.dustMotes.push({
                x: Math.random() * this.worldWidth,
                y: 80 + Math.random() * (this.worldHeight - 120),
                radius: 1 + Math.random() * 2,
                speedX: (Math.random() - 0.5) * 0.35,
                speedY: -0.15 - Math.random() * 0.25,
                alpha: 0.15 + Math.random() * 0.35,
                baseAlpha: 0.2 + Math.random() * 0.3,
                pulse: Math.random() * Math.PI * 2
            });
        }

        // Hanging lanterns
        this.lanterns = [
            { x: 190, y: 150, ropeLen: 120, swing: 0, speed: 0.02 },
            { x: 450, y: 120, ropeLen: 140, swing: 1.2, speed: 0.025 },
            { x: 730, y: 110, ropeLen: 130, swing: 2.4, speed: 0.018 }
        ];

        // Glowing mushrooms
        this.mushrooms = [
            { x: 210, y: this.groundY, scale: 0.8, color: '#38bdf8' },
            { x: 570, y: this.groundY, scale: 0.9, color: '#a78bfa' },
            { x: 610, y: this.upperPlatformY, scale: 0.75, color: '#38bdf8' },
            { x: 740, y: this.upperPlatformY, scale: 0.85, color: '#f472b6' }
        ];

        // Background stalactites
        this.stalactites = [];
        for (let i = 0; i < 22; i++) {
            this.stalactites.push({
                x: 20 + i * 48 + (Math.sin(i) * 15),
                w: 24 + (i % 4) * 8,
                h: 45 + ((i * 37) % 75)
            });
        }

        this.animTime = 0;
        this.highlightedTunnel = null; // 'upper' or 'lower'
    }

    setTunnelLayout(topColor, bottomColor) {
        this.upperTunnel.color = topColor;
        this.lowerTunnel.color = bottomColor;
    }

    update(mouse, viewWidth, viewHeight) {
        this.animTime += 1;

        // Camera smoothly follows mouse
        const targetX = mouse.x - viewWidth * 0.42;
        const maxCamX = Math.max(0, this.worldWidth - viewWidth);
        this.cameraTargetX = Math.max(0, Math.min(maxCamX, targetX));
        this.cameraX += (this.cameraTargetX - this.cameraX) * 0.08;

        // Update ambient dust motes
        for (const mote of this.dustMotes) {
            mote.x += mote.speedX;
            mote.y += mote.speedY;
            mote.pulse += 0.03;
            mote.alpha = mote.baseAlpha + Math.sin(mote.pulse) * 0.15;

            if (mote.y < 50) {
                mote.y = this.worldHeight - 80;
                mote.x = Math.random() * this.worldWidth;
            }
            if (mote.x < 0) mote.x = this.worldWidth;
            if (mote.x > this.worldWidth) mote.x = 0;
        }

        // Spring Mushroom interaction: launches mouse up to upper walkway
        const sm = this.springMushroom;
        if (sm.springTimer > 0) {
            sm.springTimer--;
            sm.scaleY = 1.0 + Math.sin(sm.springTimer * 0.4) * 0.35;
        } else {
            sm.scaleY = 1.0;
        }

        // If mouse steps on the spring mushroom
        if (Math.abs(mouse.x - sm.x) < 22 && mouse.y >= sm.y - 12 && mouse.y <= sm.y + 10 && mouse.vy >= 0) {
            mouse.vy = -13.5; // Big bouncy jump straight to upper walkway!
            mouse.isGrounded = false;
            mouse.squash = 1.4;
            sm.springTimer = 16;
            if (window.soundEffects && window.soundEffects.playBounce) {
                window.soundEffects.playBounce();
            } else {
                window.soundEffects.playJump();
            }
        }

        // Determine which tunnel the mouse is aligned with
        if (mouse.x >= 650) {
            if (mouse.y < 360) {
                this.highlightedTunnel = 'upper';
            } else {
                this.highlightedTunnel = 'lower';
            }
        } else {
            this.highlightedTunnel = null;
        }
    }

    // Render entire environment
    render(ctx, viewWidth, viewHeight, mouse) {
        ctx.save();
        // Camera translation
        ctx.translate(-Math.round(this.cameraX), 0);

        // 1. Deep Cavern Wall Background
        this.renderCaveBackground(ctx);

        // 2. Ceiling Stalactites & Rock Outcrops
        this.renderCeiling(ctx);

        // 3. Hanging Lanterns & Warm Light Halos
        this.renderLanterns(ctx);

        // 4. Starting Tunnel on the Left
        this.renderStartTunnel(ctx);

        // 5. Wooden Support Scaffolding & Walkway Platforms
        this.renderPlatforms(ctx);

        // 6. Navigation Signs and Spring Mushroom
        this.renderNavHelpers(ctx);

        // 7. Glowing Bioluminescent Mushrooms
        this.renderMushrooms(ctx);

        // 8. The Two Tunnel Entrances (Upper & Lower)
        this.renderTunnelEntrance(ctx, this.upperTunnel, 'upper', this.highlightedTunnel === 'upper');
        this.renderTunnelEntrance(ctx, this.lowerTunnel, 'lower', this.highlightedTunnel === 'lower');

        // 9. Visual Entrance Prompt when aligned
        if (this.highlightedTunnel) {
            this.renderAlignmentPrompt(ctx, mouse);
        }

        // 10. Floating Dust Particles
        this.renderDustMotes(ctx);

        ctx.restore();
    }

    renderCaveBackground(ctx) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.worldHeight);
        bgGrad.addColorStop(0, '#0a0d14');
        bgGrad.addColorStop(0.4, '#111622');
        bgGrad.addColorStop(0.7, '#151d2c');
        bgGrad.addColorStop(1, '#0c111a');

        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

        // Background rock texture bands
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        for (let i = 0; i < 7; i++) {
            ctx.beginPath();
            const y = 80 + i * 65;
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(300, y + 25, 700, y - 20, this.worldWidth, y + 10);
            ctx.lineTo(this.worldWidth, y + 28);
            ctx.bezierCurveTo(700, y + 10, 300, y + 50, 0, y + 28);
            ctx.closePath();
            ctx.fill();
        }

        // Subtle glowing mineral veins
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(120, 110);
        ctx.lineTo(190, 130);
        ctx.lineTo(240, 120);
        ctx.lineTo(310, 150);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(244, 114, 182, 0.07)';
        ctx.beginPath();
        ctx.moveTo(560, 180);
        ctx.lineTo(620, 170);
        ctx.lineTo(670, 200);
        ctx.lineTo(730, 195);
        ctx.stroke();

        ctx.restore();
    }

    renderCeiling(ctx) {
        ctx.save();
        ctx.fillStyle = '#0f1420';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.worldWidth, 0);
        ctx.lineTo(this.worldWidth, 45);

        for (let i = this.stalactites.length - 1; i >= 0; i--) {
            const st = this.stalactites[i];
            ctx.lineTo(st.x + st.w, 45);
            ctx.lineTo(st.x + st.w / 2, 45 + st.h);
            ctx.lineTo(st.x, 45);
        }
        ctx.lineTo(0, 45);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#080a10';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
    }

    renderLanterns(ctx) {
        for (const lantern of this.lanterns) {
            ctx.save();
            const swingAngle = Math.sin(this.animTime * lantern.speed + lantern.swing) * 0.04;
            ctx.translate(lantern.x, lantern.y);
            ctx.rotate(swingAngle);

            // Chain
            ctx.strokeStyle = '#4a423a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -lantern.ropeLen);
            ctx.lineTo(0, 0);
            ctx.stroke();

            // Light halo
            const flicker = Math.sin(this.animTime * 0.1 + lantern.swing) * 6;
            const haloRadius = 140 + flicker;
            const haloGrad = ctx.createRadialGradient(0, 14, 8, 0, 14, haloRadius);
            haloGrad.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
            haloGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.12)');
            haloGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.03)');
            haloGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');

            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(0, 14, haloRadius, 0, Math.PI * 2);
            ctx.fill();

            // Iron cap
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.lineTo(9, 0);
            ctx.lineTo(6, -7);
            ctx.lineTo(-6, -7);
            ctx.closePath();
            ctx.fill();

            // Glass housing
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(-7, 1, 14, 18);

            // Glowing flame core
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(0, 10, 4, 0, Math.PI * 2);
            ctx.fill();

            // Iron cage
            ctx.strokeStyle = '#1c1917';
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-7.5, 0.5, 15, 19);
            ctx.beginPath();
            ctx.moveTo(0, 1);
            ctx.lineTo(0, 19);
            ctx.stroke();

            // Bottom knob
            ctx.fillStyle = '#292524';
            ctx.beginPath();
            ctx.arc(0, 22, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    renderStartTunnel(ctx) {
        ctx.save();
        const t = this.startTunnel;

        const depthGrad = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y);
        depthGrad.addColorStop(0, '#000000');
        depthGrad.addColorStop(0.7, '#070a10');
        depthGrad.addColorStop(1, '#101726');

        ctx.fillStyle = depthGrad;
        ctx.beginPath();
        ctx.arc(t.x + 35, t.y + 40, 45, Math.PI, 0);
        ctx.lineTo(t.x + 80, t.floorY);
        ctx.lineTo(t.x - 10, t.floorY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#4a3328';
        ctx.fillRect(t.x - 14, t.y + 15, 14, t.floorY - (t.y + 15));
        ctx.fillRect(t.x + 76, t.y + 15, 14, t.floorY - (t.y + 15));

        // Plaque
        ctx.fillStyle = '#362419';
        ctx.fillRect(t.x + 6, t.y - 12, 58, 16);
        ctx.strokeStyle = '#6e4c36';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(t.x + 6, t.y - 12, 58, 16);

        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CHECKPOINT', t.x + 35, t.y);

        ctx.restore();
    }

    renderPlatforms(ctx) {
        ctx.save();

        // 1. Lower Cavern Floor
        const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, this.worldHeight);
        floorGrad.addColorStop(0, '#241e1a');
        floorGrad.addColorStop(0.1, '#1b1613');
        floorGrad.addColorStop(1, '#0e0a08');

        ctx.fillStyle = floorGrad;
        ctx.fillRect(40, this.groundY, this.worldWidth - 50, this.worldHeight - this.groundY);

        ctx.strokeStyle = '#423730';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(40, this.groundY);
        ctx.lineTo(this.worldWidth - 10, this.groundY);
        ctx.stroke();

        // 2. Vertical Scaffolding Posts
        const pillarXPositions = [480, 600, 720, 840];
        for (const px of pillarXPositions) {
            ctx.fillStyle = '#453226';
            ctx.fillRect(px, this.upperPlatformY + 16, 16, this.groundY - (this.upperPlatformY + 16));

            ctx.fillStyle = '#5a4233';
            ctx.fillRect(px + 3, this.upperPlatformY + 16, 4, this.groundY - (this.upperPlatformY + 16));

            // Cross diagonal bracing
            ctx.strokeStyle = '#38281e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(px + 8, this.upperPlatformY + 25);
            ctx.lineTo(px + (px === 840 ? -60 : 60), this.groundY - 15);
            ctx.stroke();

            // Bolts
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(px + 8, this.upperPlatformY + 28, 2.5, 0, Math.PI * 2);
            ctx.arc(px + 8, this.groundY - 12, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Stepping Stone Ledge (X=330 to 425, Y=375)
        const step = this.platforms[1];
        ctx.fillStyle = '#3a322c';
        ctx.beginPath();
        ctx.roundRect(step.x, step.y, step.w, step.h, 6);
        ctx.fill();

        ctx.fillStyle = '#5a4e46';
        ctx.fillRect(step.x + 2, step.y, step.w - 4, 4);

        ctx.strokeStyle = '#27211d';
        ctx.lineWidth = 2;
        ctx.strokeRect(step.x, step.y, step.w, step.h);

        // 4. Upper Walkway Deck (X=450 to 920, Y=285)
        const plat = this.platforms[2];
        ctx.fillStyle = '#4a3528';
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        ctx.fillStyle = '#6d4e3b';
        ctx.fillRect(plat.x, plat.y, plat.w, 4);

        // Plank joint lines
        ctx.fillStyle = '#261b14';
        for (let x = plat.x; x < plat.x + plat.w; x += 32) {
            ctx.fillRect(x, plat.y, 2, plat.h);
        }

        // Rope railing along back
        ctx.strokeStyle = '#645445';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(plat.x + 10, plat.y - 18);
        ctx.lineTo(plat.x + plat.w - 50, plat.y - 18);
        ctx.stroke();

        for (let x = plat.x + 30; x < plat.x + plat.w - 40; x += 75) {
            ctx.fillStyle = '#423730';
            ctx.fillRect(x - 2, plat.y - 22, 5, 22);
        }

        ctx.restore();
    }

    renderNavHelpers(ctx) {
        ctx.save();

        // 1. Wooden Directional Signpost at X=230
        const sx = 230;
        const sy = this.groundY;

        // Post
        ctx.fillStyle = '#453226';
        ctx.fillRect(sx - 3, sy - 55, 6, 55);

        // Upper sign pointing to Jump / Upper tunnel
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(sx - 35, sy - 52, 70, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8.5px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⬆ JUMP / BOUNCE', sx, sy - 40);

        // Lower sign pointing forward
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(sx - 35, sy - 30, 70, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.fillText('➡ LOWER FLOOR', sx, sy - 18);

        // 2. Bouncy Spring Mushroom at X=275
        const sm = this.springMushroom;
        ctx.save();
        ctx.translate(sm.x, sm.y);
        ctx.scale(1, sm.scaleY);

        // Pulsing glow around spring mushroom
        const glow = ctx.createRadialGradient(0, -14, 2, 0, -14, 26);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        glow.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, -14, 26, 0, Math.PI * 2);
        ctx.fill();

        // Mushroom Stem
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(-2, -14);
        ctx.lineTo(2, -14);
        ctx.lineTo(4, 0);
        ctx.closePath();
        ctx.fill();

        // Mushroom Cap (Bright Cyan / Spring)
        ctx.fillStyle = '#0ea5e9';
        ctx.beginPath();
        ctx.arc(0, -14, 15, Math.PI, 0);
        ctx.closePath();
        ctx.fill();

        // White spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-5, -20, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -21, 2, 0, Math.PI * 2);
        ctx.arc(0, -16, 2, 0, Math.PI * 2);
        ctx.fill();

        // Tiny floating upward arrows above mushroom
        const floatY = -30 + Math.sin(this.animTime * 0.15) * 4;
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ BOUNCE', 0, floatY);

        ctx.restore();
        ctx.restore();
    }

    renderMushrooms(ctx) {
        for (const shroom of this.mushrooms) {
            ctx.save();
            ctx.translate(shroom.x, shroom.y);
            ctx.scale(shroom.scale, shroom.scale);

            const glow = ctx.createRadialGradient(0, -12, 2, 0, -12, 28);
            glow.addColorStop(0, shroom.color);
            glow.addColorStop(0.3, shroom.color);
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.globalAlpha = 0.28 + Math.sin(this.animTime * 0.05 + shroom.x) * 0.1;
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, -12, 28, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1.0;

            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(-3, 0);
            ctx.quadraticCurveTo(-1, -12, -2, -18);
            ctx.lineTo(2, -18);
            ctx.quadraticCurveTo(1, -12, 3, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = shroom.color;
            ctx.beginPath();
            ctx.arc(0, -18, 12, Math.PI, 0);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-4, -23, 1.8, 0, Math.PI * 2);
            ctx.arc(3, -24, 1.5, 0, Math.PI * 2);
            ctx.arc(0, -20, 1.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    renderTunnelEntrance(ctx, tunnel, type, isHighlighted) {
        ctx.save();
        const isRed = tunnel.color === 'red';
        const mainColor = isRed ? '#ef4444' : '#3b82f6';
        const glowColor = isRed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)';
        const deepColor = isRed ? '#1f0909' : '#07162b';
        const labelText = isRed ? 'RED TUNNEL' : 'BLUE TUNNEL';
        const badgeIcon = isRed ? '🔴' : '🔵';

        const cx = tunnel.x + 45;
        const cy = tunnel.y + 45;
        const radius = 50;

        // 1. Arch Glow
        const pulse = Math.sin(this.animTime * 0.08) * 6;
        const haloR = radius + 22 + (isHighlighted ? 18 + pulse : 0);
        const archGlow = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, haloR);
        archGlow.addColorStop(0, glowColor);
        archGlow.addColorStop(0.5, isHighlighted ? glowColor : 'rgba(0,0,0,0.1)');
        archGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = archGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();

        // 2. Portal Interior
        const portalGrad = ctx.createRadialGradient(cx + 25, cy + 10, 8, cx, cy, radius);
        portalGrad.addColorStop(0, '#000000');
        portalGrad.addColorStop(0.5, deepColor);
        portalGrad.addColorStop(1, isRed ? '#3f1111' : '#0e2444');

        ctx.fillStyle = portalGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, 0);
        ctx.lineTo(cx + radius, tunnel.floorY);
        ctx.lineTo(cx - radius, tunnel.floorY);
        ctx.closePath();
        ctx.fill();

        // 3. Glowing Arch Rim
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = isHighlighted ? 8 : 5;
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = isHighlighted ? 24 : 12;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, Math.PI, 0);
        ctx.lineTo(cx + radius, tunnel.floorY);
        ctx.lineTo(cx - radius, tunnel.floorY);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 4. Keystone
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy - radius, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(cx, cy - radius, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // 5. Plaque
        const signW = 120;
        const signH = 24;
        const signX = cx - signW / 2;
        const signY = cy - radius - 30;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = isHighlighted ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.roundRect(signX, signY, signW, signH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${badgeIcon} ${labelText}`, cx, signY + signH / 2);

        // Highlight indicator dots
        if (isHighlighted) {
            ctx.fillStyle = mainColor;
            ctx.beginPath();
            const dotPulse = Math.sin(this.animTime * 0.15) * 2.5;
            ctx.arc(signX - 9, signY + signH / 2, 4 + dotPulse, 0, Math.PI * 2);
            ctx.arc(signX + signW + 9, signY + signH / 2, 4 + dotPulse, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    renderAlignmentPrompt(ctx, mouse) {
        ctx.save();
        const targetTunnel = this.highlightedTunnel === 'upper' ? this.upperTunnel : this.lowerTunnel;
        const isRed = targetTunnel.color === 'red';
        const color = isRed ? '#ef4444' : '#38bdf8';

        const promptX = mouse.x + 10;
        const promptY = mouse.y - 48 + Math.sin(this.animTime * 0.1) * 3;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        const txt = `ENTER ${isRed ? 'RED' : 'BLUE'} TUNNEL [ ↑ FORWARD ]`;

        ctx.font = 'bold 10px system-ui, sans-serif';
        const metrics = ctx.measureText(txt);
        const padX = 10;
        const boxW = metrics.width + padX * 2;
        const boxH = 20;

        ctx.beginPath();
        ctx.roundRect(promptX - boxW / 2, promptY - boxH / 2, boxW, boxH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, promptX, promptY);

        ctx.restore();
    }

    renderDustMotes(ctx) {
        ctx.save();
        for (const m of this.dustMotes) {
            ctx.fillStyle = `rgba(254, 240, 138, ${m.alpha})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

window.TunnelScene = TunnelScene;
