// Animated Procedural Cartoon Mouse for "Mouse: The Tunnel Maze"

class MousePlayer {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 = right (forward), -1 = left (backward)
        this.targetFacing = 1;

        // Visual dimensions
        this.width = 46;
        this.height = 28;

        // Animation states: 'idle', 'walk', 'jump', 'sit', 'travel', 'retreat'
        this.state = 'idle';
        this.isSitting = false;
        this.sitLerp = 0; // 0 = standing/walking, 1 = fully sitting
        this.isGrounded = true;

        // Animation counters
        this.animTime = 0;
        this.walkCycle = 0;
        this.blinkTimer = 100 + Math.random() * 150;
        this.isBlinking = false;
        this.sniffTimer = 0;
        this.earWiggle = 0;
        this.squash = 1; // vertical stretch/squash

        // Physics constants
        this.speed = 3.8;
        this.jumpForce = -12.4;
        this.gravity = 0.52;
        this.dropThroughTimer = 0;

        // Tail segments for dynamic trailing physics
        this.numTailPoints = 8;
        this.tailLength = 40;
        this.tailPoints = [];
        for (let i = 0; i < this.numTailPoints; i++) {
            this.tailPoints.push({ x: this.x - i * 4, y: this.y - 10 });
        }

        // Current platform bounds
        this.currentPlatform = null;
    }

    reset(x, y, facing = 1) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.targetFacing = facing;
        this.state = 'idle';
        this.isSitting = false;
        this.sitLerp = 0;
        this.isGrounded = true;
        this.squash = 1;
        this.dropThroughTimer = 0;
        this.currentPlatform = null;

        for (let i = 0; i < this.numTailPoints; i++) {
            this.tailPoints[i] = { x: this.x - this.facing * i * 4, y: this.y - 10 };
        }
    }

    // Input handlers
    moveForward() {
        if (this.state === 'travel' || this.state === 'retreat') return;
        if (this.isSitting) {
            this.standUp();
        }
        this.vx = this.speed;
        this.targetFacing = 1;
        if (this.isGrounded) {
            this.state = 'walk';
            window.soundEffects.playFootstep();
        }
    }

    moveBackward() {
        if (this.state === 'travel' || this.state === 'retreat') return;
        if (this.isSitting) {
            this.standUp();
        }
        this.vx = -this.speed;
        this.targetFacing = -1;
        if (this.isGrounded) {
            this.state = 'walk';
            window.soundEffects.playFootstep();
        }
    }

    stopHorizontal() {
        this.vx = 0;
        if (this.isGrounded && !this.isSitting && this.state !== 'travel' && this.state !== 'retreat') {
            this.state = 'idle';
        }
    }

    jump() {
        if (this.state === 'travel' || this.state === 'retreat') return;
        if (this.isSitting) {
            this.standUp();
        }
        if (this.isGrounded) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
            this.state = 'jump';
            this.squash = 1.35; // stretch on leap
            window.soundEffects.playJump();
        }
    }

    toggleSit() {
        if (this.state === 'travel' || this.state === 'retreat') return;

        // If on an elevated platform, sitting allows dropping down!
        if (this.currentPlatform && !this.currentPlatform.isGround) {
            if (this.isSitting) {
                // Drop down through the platform to the lower level
                this.dropThroughTimer = 18;
                this.isGrounded = false;
                this.vy = 2;
                this.standUp();
                return;
            } else {
                this.sitDown();
                return;
            }
        }

        if (!this.isGrounded) return; // can only sit on ground

        if (this.isSitting) {
            this.standUp();
        } else {
            this.sitDown();
        }
    }

    sitDown() {
        this.isSitting = true;
        this.state = 'sit';
        this.vx = 0;
        window.soundEffects.playSit();
    }

    standUp() {
        this.isSitting = false;
        if (this.isGrounded) {
            this.state = 'idle';
        }
    }

    // Main update loop
    update(platforms, ramps, worldWidth) {
        this.animTime += 1;

        // Facing direction smooth transition
        this.facing = this.targetFacing;

        // Sitting animation interpolation
        if (this.isSitting) {
            this.sitLerp = Math.min(1, this.sitLerp + 0.15);
        } else {
            this.sitLerp = Math.max(0, this.sitLerp - 0.2);
        }

        // Apply horizontal movement if not sitting
        if (this.isSitting) {
            this.vx = 0;
        }

        if (this.state === 'travel' || this.state === 'retreat') {
            // Handled externally by scene animation
            this.updateTail();
            return;
        }

        // Apply gravity
        this.vy += this.gravity;
        if (this.vy > 12) this.vy = 12; // Terminal velocity

        // Horizontal velocity dampening/recovery
        this.x += this.vx;

        // Walk cycle increment
        if (Math.abs(this.vx) > 0.1 && this.isGrounded) {
            this.walkCycle += 0.35;
        }

        // Squash/stretch recovery
        this.squash += (1 - this.squash) * 0.18;

        if (this.dropThroughTimer > 0) {
            this.dropThroughTimer--;
        }

        // Vertical movement and platform collision
        const prevY = this.y;
        this.y += this.vy;

        let landed = false;
        let onAnyPlatform = false;

        if (platforms && platforms.length > 0) {
            for (const plat of platforms) {
                // If drop through active, skip elevated platforms
                if (this.dropThroughTimer > 0 && !plat.isGround) continue;

                // Check horizontal overlap with forgiving margins
                if (this.x >= plat.x - 10 && this.x <= plat.x + plat.w + 10) {
                    // Check if mouse passed through platform top moving downwards
                    if (prevY <= plat.y + 2 && this.y >= plat.y && this.vy >= 0) {
                        this.y = plat.y;
                        this.vy = 0;
                        landed = true;
                        onAnyPlatform = true;
                        this.isGrounded = true;
                        this.currentPlatform = plat;
                        break;
                    } else if (Math.abs(this.y - plat.y) < 2 && this.vy === 0) {
                        onAnyPlatform = true;
                        this.currentPlatform = plat;
                        break;
                    }
                }
            }
        }

        if (!onAnyPlatform && this.vy !== 0) {
            this.isGrounded = false;
            this.currentPlatform = null;
        }

        if (landed && !this.isSitting) {
            this.state = Math.abs(this.vx) > 0.1 ? 'walk' : 'idle';
            this.squash = 0.72; // Squash on impact
        }

        // Clamp to cavern boundaries
        const minX = 70;
        const maxX = worldWidth - 60;
        if (this.x < minX) {
            this.x = minX;
            if (this.vx < 0) this.vx = 0;
        }
        if (this.x > maxX) {
            this.x = maxX;
            if (this.vx > 0) this.vx = 0;
        }

        // Natural eye blinking & whisker sniffing
        this.blinkTimer--;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            if (this.blinkTimer <= -6) {
                this.isBlinking = false;
                this.blinkTimer = 120 + Math.random() * 180;
            }
        }

        // Tail physics
        this.updateTail();
    }

    updateTail() {
        // Base of tail anchor point on mouse body
        const tailAnchorX = this.x - this.facing * (14 + (1 - this.sitLerp) * 6);
        const tailAnchorY = this.y - 10 - this.sitLerp * 6;

        this.tailPoints[0] = { x: tailAnchorX, y: tailAnchorY };

        // Segments follow like an articulated chain with springiness
        const segDist = 5.2;
        for (let i = 1; i < this.numTailPoints; i++) {
            const prev = this.tailPoints[i - 1];
            const curr = this.tailPoints[i];

            let dx = curr.x - prev.x;
            let dy = curr.y - prev.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) dist = 0.001;

            // Rest position has natural arch/sway
            let sway = 0;
            if (this.state === 'walk') {
                sway = Math.sin(this.walkCycle - i * 0.4) * 3;
            } else if (this.isSitting) {
                // Curled neatly behind mouse
                sway = Math.sin(this.animTime * 0.05 + i * 0.5) * 1.5;
            }

            const targetX = prev.x - this.facing * segDist;
            const targetY = prev.y + (i < 4 ? -2 : 2) + sway;

            curr.x += (targetX - curr.x) * 0.45;
            curr.y += (targetY - curr.y) * 0.45;

            // Re-enforce distance
            dx = curr.x - prev.x;
            dy = curr.y - prev.y;
            dist = Math.hypot(dx, dy) || 1;
            curr.x = prev.x + (dx / dist) * segDist;
            curr.y = prev.y + (dy / dist) * segDist;
        }
    }

    // Render mouse character
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.facing, 1);

        // Body bobbing and squash
        const bobY = (this.state === 'walk' && this.isGrounded) ? Math.abs(Math.sin(this.walkCycle)) * 3 : 0;
        const sitLift = this.sitLerp * 12; // sits up higher on haunches

        ctx.translate(0, -bobY);

        // Apply squash & stretch around base
        ctx.scale(1 / Math.sqrt(this.squash), this.squash);

        // 1. Draw Tail (drawn behind body)
        this.renderTail(ctx);

        // 2. Draw Back Feet (furthest away)
        this.renderBackFeet(ctx);

        // 3. Draw Main Body
        this.renderBody(ctx, sitLift);

        // 4. Draw Front Feet
        this.renderFrontFeet(ctx, sitLift);

        // 5. Draw Head, Ears, Face, Eyes, Whiskers
        this.renderHeadAndFace(ctx, sitLift);

        ctx.restore();
    }

    renderTail(ctx) {
        ctx.save();
        // Undo the flip for world coordinates of tail
        // Or render relative to base
        ctx.beginPath();
        const base = this.tailPoints[0];
        ctx.moveTo(0 - this.facing * 18, -8 - this.sitLerp * 6);

        // Draw segmented curve
        for (let i = 1; i < this.tailPoints.length; i++) {
            const p = this.tailPoints[i];
            // Convert world tail point into local mouse coords
            const localX = (p.x - this.x) * this.facing;
            const localY = p.y - this.y;
            ctx.lineTo(localX, localY);
        }

        ctx.strokeStyle = '#e8989e';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Subtle shadow/highlight on tail
        ctx.strokeStyle = '#f5b5b9';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
    }

    renderBackFeet(ctx) {
        ctx.fillStyle = '#e8989e';
        if (this.isSitting) {
            // Hind paw tucked beside sitting rump
            ctx.beginPath();
            ctx.ellipse(-12, -4, 9, 5, 0.1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Animated walking back foot
            const backFootCycle = Math.sin(this.walkCycle + Math.PI);
            const footX = -12 + (this.state === 'walk' ? backFootCycle * 7 : 0);
            const footY = -3 - (this.state === 'walk' ? Math.max(0, backFootCycle) * 5 : 0);

            ctx.beginPath();
            ctx.ellipse(footX, footY, 7, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderBody(ctx, sitLift) {
        ctx.save();
        const bodyGrad = ctx.createLinearGradient(-18, -30, 16, 0);
        bodyGrad.addColorStop(0, '#6d655f'); // darker top
        bodyGrad.addColorStop(0.5, '#8c827a'); // warm mouse gray
        bodyGrad.addColorStop(1, '#b4aaa2'); // soft belly

        ctx.fillStyle = bodyGrad;

        if (this.sitLerp > 0.05) {
            // Interpolate to sitting posture: more upright egg/pear shape
            ctx.beginPath();
            const sitH = 34 + this.sitLerp * 6;
            ctx.ellipse(-4, -18 - this.sitLerp * 4, 15, sitH / 2, 0.15 * this.sitLerp, 0, Math.PI * 2);
            ctx.fill();

            // Light belly patch
            ctx.fillStyle = '#dcd4ce';
            ctx.beginPath();
            ctx.ellipse(3, -16 - this.sitLerp * 3, 9, (sitH / 2) * 0.75, 0.15 * this.sitLerp, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Standing / running horizontal teardrop body
            ctx.beginPath();
            ctx.ellipse(-4, -14, 18, 12, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Light belly patch
            ctx.fillStyle = '#dcd4ce';
            ctx.beginPath();
            ctx.ellipse(0, -10, 12, 7, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    renderFrontFeet(ctx, sitLift) {
        ctx.fillStyle = '#e8989e';

        if (this.isSitting) {
            // Front paws held politely together against chest
            const pawY = -22 - this.sitLerp * 4 + Math.sin(this.animTime * 0.08) * 1;
            ctx.beginPath();
            ctx.ellipse(8, pawY, 5, 3.5, -0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.ellipse(11, pawY - 1, 4.5, 3, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Front paws scampering
            const frontFootCycle = Math.sin(this.walkCycle);
            const frontFootX = 10 + (this.state === 'walk' ? frontFootCycle * 7 : 0);
            const frontFootY = -3 - (this.state === 'walk' ? Math.max(0, frontFootCycle) * 4 : 0);

            ctx.beginPath();
            ctx.ellipse(frontFootX, frontFootY, 6, 3.5, -0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderHeadAndFace(ctx, sitLift) {
        ctx.save();
        // Head position shifts slightly higher when sitting
        const headX = 14;
        const headY = this.isSitting ? -28 - this.sitLerp * 4 : -17;

        ctx.translate(headX, headY);

        // 1. Far Ear (behind head)
        ctx.save();
        ctx.translate(-5, -10);
        const earBounce = (this.state === 'walk') ? Math.sin(this.walkCycle * 2) * 0.15 : 0;
        ctx.rotate(-0.25 + earBounce);

        // Outer ear
        ctx.fillStyle = '#7a7069';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 13, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear pink
        ctx.fillStyle = '#e89ca4';
        ctx.beginPath();
        ctx.ellipse(1, 1, 6, 9.5, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Head Shape (cute tapered snout)
        ctx.fillStyle = '#8c827a';
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.quadraticCurveTo(8, -10, 14, -1); // snout top
        ctx.quadraticCurveTo(8, 7, -6, 6);   // chin
        ctx.quadraticCurveTo(-11, -1, -6, -8); // cheek
        ctx.closePath();
        ctx.fill();

        // 3. Near Ear (in front of head)
        ctx.save();
        ctx.translate(-2, -9);
        const nearEarBounce = (this.state === 'walk') ? Math.sin(this.walkCycle * 2 + 0.5) * 0.18 : 0;
        ctx.rotate(-0.1 + nearEarBounce);

        // Outer ear
        ctx.fillStyle = '#948a82';
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 15, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Inner ear pink
        ctx.fillStyle = '#f8a5ad';
        ctx.beginPath();
        ctx.ellipse(1, 2, 7.5, 11, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Little Cute Pink Nose
        ctx.fillStyle = '#ff758f';
        ctx.beginPath();
        ctx.arc(14.5, -1, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // 5. Shiny Bead Eye
        if (this.isBlinking) {
            // Blinking closed eye arc
            ctx.strokeStyle = '#2b231d';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(3, -4, 4, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
            // Open glossy eye
            ctx.fillStyle = '#1c1714';
            ctx.beginPath();
            ctx.ellipse(3, -4, 3.8, 4.2, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Catchlight sparkle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(4.2, -5.5, 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Tiny secondary specular
            ctx.beginPath();
            ctx.arc(2.0, -3.2, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // 6. Whiskers (fine vibrating lines)
        ctx.strokeStyle = 'rgba(235, 230, 225, 0.85)';
        ctx.lineWidth = 0.9;
        const whiskerTwitch = Math.sin(this.animTime * 0.4) * 1.5;

        // Top whisker
        ctx.beginPath();
        ctx.moveTo(11, -2);
        ctx.quadraticCurveTo(18, -7 + whiskerTwitch, 27, -9 + whiskerTwitch);
        ctx.stroke();

        // Middle whisker
        ctx.beginPath();
        ctx.moveTo(12, -0.5);
        ctx.quadraticCurveTo(20, -1, 29, 0 + whiskerTwitch * 0.7);
        ctx.stroke();

        // Bottom whisker
        ctx.beginPath();
        ctx.moveTo(11, 1.5);
        ctx.quadraticCurveTo(18, 5 - whiskerTwitch, 26, 8 - whiskerTwitch);
        ctx.stroke();

        ctx.restore();
    }
}

window.MousePlayer = MousePlayer;
