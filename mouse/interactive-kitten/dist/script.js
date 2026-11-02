const canvas = document.getElementById('kitten-canvas');
const ctx = canvas.getContext('2d');

let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
});

const mouse = { x: w / 2, y: h / 2 };

// State definitions: 'CHASING', 'SITTING', 'SLEEPING', 'GROOMING', 'GOING_OFFSCREEN', 'RETURNING_WITH_FISH', 'CELEBRATING'
class Kitten {
  constructor() {
    this.x = w / 2;
    this.y = h - 120;
    this.targetX = mouse.x;
    this.targetY = mouse.y;
    this.scale = 1.0;
    this.facing = 'right';
    this.state = 'CHASING';
    this.speed = 0.055;
    
    // Drag offsets
    this.grabOffsetX = 0;
    this.grabOffsetY = 0;
    
    // Animation cycles
    this.walkCycle = 0;
    this.idleTime = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    
    // Jump mechanics (General leaping during chase)
    this.jumpY = 0;
    this.jumpVy = 0;
    this.gravity = 0.35;
    this.jumpTimer = 0;
    
    // Grooming variables
    this.groomTimer = 0;
    
    // States and items
    this.fishInMouth = false;
    this.droppedFish = null;
    this.zzzParticles = [];
    this.hearts = [];
    
    // Timers
    this.lastFishingTime = Date.now();
    this.fishingCooldown = 25000 + Math.random() * 15000; // Fish trip every 25-40s
    this.celebrateTimer = 0;
  }

  update() {
    const time = Date.now() * 0.001;

    // Head world position for Zzz and Hearts spawning
    const hx = this.x + 20 * (this.facing === 'left' ? -1 : 1);
    const hy = this.y - 12 + this.jumpY;

    // Blink timer
    this.blinkTimer++;
    if (this.blinkTimer > 180) {
      this.isBlinking = true;
      if (this.blinkTimer > 192) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    // Drop fish update
    if (this.droppedFish) {
      const f = this.droppedFish;
      f.vy += f.gravity;
      f.x += f.vx;
      f.y += f.vy;
      f.rotation += f.vrot;
      if (f.y >= f.groundY) {
        f.y = f.groundY;
        f.vy = -f.vy * f.bounce;
        f.vx *= 0.7;
        f.vrot *= 0.5;
        if (Math.abs(f.vy) < 0.5) f.vy = 0;
      }
      if (Math.abs(f.vx) < 0.2) {
        f.alpha -= 0.015;
        if (f.alpha <= 0) {
          this.droppedFish = null;
        }
      }
    }

    // Zzz Particles update (Sleeping Zzzs spawn right at the head)
    if (this.state === 'SLEEPING') {
      if (Math.random() < 0.03) {
        this.zzzParticles.push({
          x: hx + (this.facing === 'left' ? -10 : 10),
          y: hy - 15,
          text: Math.random() > 0.4 ? 'z' : 'Z',
          size: 10 + Math.random() * 10,
          alpha: 1.0,
          vx: (Math.random() - 0.3) * 0.5,
          vy: -0.4 - Math.random() * 0.4
        });
      }
    }
    this.zzzParticles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.008;
      if (p.alpha <= 0) this.zzzParticles.splice(idx, 1);
    });

    // Hearts update (Hearts spawn right at the head)
    // 1. Spawning during CELEBRATING state (fish catch)
    // 2. Or randomly at other active times (CHASING, SITTING, GROOMING)
    const shouldSpawnHeart = (this.state === 'CELEBRATING' && Math.random() < 0.1) || 
                             (this.state !== 'DRAGGED' && this.state !== 'SLEEPING' && this.state !== 'GOING_OFFSCREEN' && Math.random() < 0.0035);
    
    if (shouldSpawnHeart) {
      this.hearts.push({
        x: hx + (Math.random() - 0.5) * 15,
        y: hy - 10,
        size: 8 + Math.random() * 8,
        alpha: 1.0,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random() * 1.5
      });
    }
    this.hearts.forEach((h, idx) => {
      h.x += h.vx;
      h.y += h.vy;
      h.alpha -= 0.015;
      if (h.alpha <= 0) this.hearts.splice(idx, 1);
    });

    // Physics for Jump
    if (this.state === 'DRAGGED') {
      this.jumpY = 0;
      this.jumpVy = 0;
    } else if (this.jumpVy !== 0 || this.jumpY !== 0) {
      this.jumpVy += this.gravity;
      this.jumpY += this.jumpVy;
      if (this.jumpY >= 0) {
        this.jumpY = 0;
        this.jumpVy = 0;
      }
    }

    // Main AI State Machine
    const distToMouse = Math.hypot(mouse.x - this.x, mouse.y - this.y);
    const now = Date.now();

    // Trigger fishing routine
    if ((this.state === 'CHASING' || this.state === 'SITTING') && this.jumpY === 0) {
      if (now - this.lastFishingTime > this.fishingCooldown) {
        this.state = 'GOING_OFFSCREEN';
        this.targetX = this.x < w / 2 ? -100 : w + 100;
        this.targetY = h - 60;
      }
    }

    switch (this.state) {
      case 'CHASING':
        this.targetX = mouse.x;
        this.targetY = mouse.y;
        
        // Randomly leap while chasing if mouse is far
        this.jumpTimer++;
        if (distToMouse > 220 && this.jumpY === 0 && this.jumpTimer > 120 && Math.random() < 0.02) {
          this.jumpVy = -6 - Math.random() * 4;
          this.jumpTimer = 0;
        }

        if (distToMouse > 50) {
          this.x += (this.targetX - this.x) * this.speed;
          this.y += (this.targetY - this.y) * this.speed;
          this.walkCycle += 0.16 + (distToMouse > 200 ? 0.06 : 0); // Walk faster if far
          this.facing = (this.targetX > this.x) ? 'right' : 'left';
          this.idleTime = 0;
        } else {
          this.state = 'SITTING';
          this.idleTime = 0;
        }
        break;

      case 'SITTING':
        this.walkCycle *= 0.8;
        if (distToMouse > 70) {
          this.state = 'CHASING';
          this.idleTime = 0;
        } else {
          this.idleTime++;
          // Grooming transition (sitting up, licking paw)
          if (this.idleTime > 80 && Math.random() < 0.015) {
            this.state = 'GROOMING';
            this.groomTimer = 160; // Groom for 2.6 seconds
          } else if (this.idleTime > 240) {
            this.state = 'SLEEPING';
          }
        }
        break;

      case 'GROOMING':
        this.walkCycle = 0;
        this.groomTimer--;
        if (distToMouse > 80) {
          this.state = 'CHASING';
          this.idleTime = 0;
        } else if (this.groomTimer <= 0) {
          this.state = 'SITTING';
          this.idleTime = 0;
        }
        break;

      case 'SLEEPING':
        this.walkCycle = 0;
        if (distToMouse > 90) {
          this.state = 'CHASING';
          this.idleTime = 0;
        }
        break;

      case 'GOING_OFFSCREEN':
        const distOffscreen = Math.abs(this.x - this.targetX);
        if (distOffscreen > 10) {
          this.x += (this.targetX - this.x) * 0.07;
          this.y += (this.targetY - this.y) * 0.07;
          this.walkCycle += 0.22;
          this.facing = (this.targetX > this.x) ? 'right' : 'left';
        } else {
          this.fishInMouth = true;
          this.state = 'RETURNING_WITH_FISH';
        }
        break;

      case 'RETURNING_WITH_FISH':
        this.targetX = mouse.x;
        this.targetY = mouse.y;
        if (distToMouse > 70) {
          this.x += (this.targetX - this.x) * 0.055;
          this.y += (this.targetY - this.y) * 0.055;
          this.walkCycle += 0.15;
          this.facing = (this.targetX > this.x) ? 'right' : 'left';
        } else {
          this.fishInMouth = false;
          this.droppedFish = {
            x: this.x + (this.facing === 'left' ? -25 : 25),
            y: this.y - 5,
            vx: this.facing === 'left' ? -3 : 3,
            vy: -4,
            gravity: 0.25,
            bounce: 0.55,
            groundY: this.y + 15,
            rotation: 0,
            vrot: 0.15,
            alpha: 1.0
          };
          this.state = 'CELEBRATING';
          this.celebrateTimer = 110;
          this.lastFishingTime = Date.now();
          this.fishingCooldown = 25000 + Math.random() * 20000;
        }
        break;

      case 'CELEBRATING':
        // Continue chasing mouse while celebrating!
        if (distToMouse > 50) {
          this.x += (mouse.x - this.x) * this.speed;
          this.y += (mouse.y - this.y) * this.speed;
          this.walkCycle += 0.16;
          this.facing = (mouse.x > this.x) ? 'right' : 'left';
        } else {
          this.walkCycle *= 0.8;
        }
        this.celebrateTimer--;
        if (this.celebrateTimer <= 0) {
          this.state = 'CHASING';
        }
        break;

      case 'DRAGGED':
        // Calculate drag delta to set facing direction smoothly
        const dx = mouse.x - this.x - this.grabOffsetX;
        if (Math.abs(dx) > 1.5) {
          this.facing = (dx > 0) ? 'right' : 'left';
        }
        // Pinned exactly to the cursor using the grab offset
        this.x = mouse.x - this.grabOffsetX;
        this.y = mouse.y - this.grabOffsetY;
        this.walkCycle += 0.32; // Annoyed leg movement
        this.idleTime = 0;
        break;
    }
  }

  draw() {
    ctx.save();
    
    // Draw dropped fish
    if (this.droppedFish) {
      this.drawFishObject(this.droppedFish);
    }

    // Translate to cat position (incorporating jump Y axis)
    ctx.translate(this.x, this.y + this.jumpY);
    
    if (this.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const time = Date.now() * 0.001;

    // Body bounce when running or walking
    const bodyY = (this.state === 'SLEEPING') ? 5 : (this.state === 'CHASING' ? Math.abs(Math.sin(this.walkCycle)) * 4 : 0);

    // Sitting Grooming Posture / Rotation
    if (this.state === 'GROOMING') {
      ctx.rotate(-Math.PI / 8); // sit upright
    }

    // 1. Draw Tail (Cute Orange Tabby Tail)
    ctx.save();
    // Shifted start position inside the body (at -18, -4) to prevent any segment sticking out underneath
    ctx.translate(-18, -4 + bodyY);
    const tailWag = (this.state === 'CELEBRATING') 
      ? Math.sin(Date.now() * 0.02) * 0.6 
      : (this.state === 'DRAGGED')
        ? Math.sin(Date.now() * 0.015) * 0.35 // Slower swing under gravity when carried
        : (this.state === 'SLEEPING' ? -0.2 : Math.sin(this.walkCycle * 0.5) * 0.25);
    ctx.rotate(-0.5 + tailWag);
    
    // Beautiful 3D shaded tail (Orange)
    const tailGrad = ctx.createLinearGradient(0, -10, 0, 30);
    tailGrad.addColorStop(0, '#f97316');
    tailGrad.addColorStop(1, '#c2410c');
    ctx.strokeStyle = tailGrad;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); // Start inside the body at 0, 0
    ctx.quadraticCurveTo(-15, -15, -10, -35);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Back Legs
    if (this.state === 'SLEEPING') {
      // Folded completely flat (Y = 7 to lay lower on ground)
      this.drawLeg(-12, 7, 0, true);
      this.drawLeg(-3, 7, 0, true);
    } else if (this.state === 'SITTING' || this.state === 'GROOMING') {
      // Folded horizontally (drawn with thigh volume and horizontal paw)
      this.drawLeg(-12, 7, 0, true);
      this.drawLeg(-3, 7, 0, true);
    } else if (this.state === 'DRAGGED') {
      // Dangling back legs, slightly offset downwards to represent stretching
      this.drawLeg(-12, 12, Math.sin(this.walkCycle) * 0.6);
      this.drawLeg(-3, 12, Math.sin(this.walkCycle + Math.PI) * 0.6);
    } else {
      // Running legs cycle
      this.drawLeg(-12, 10, Math.sin(this.walkCycle) * 0.45);
      this.drawLeg(-3, 10, Math.sin(this.walkCycle + Math.PI) * 0.45);
    }

    // 3. Draw Body (Orange clay look with 3D gradient)
    ctx.save();
    ctx.translate(0, bodyY);
    const bodyGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, 30);
    bodyGrad.addColorStop(0, '#fdba74'); // bright soft orange center
    bodyGrad.addColorStop(0.7, '#f97316'); // rich orange
    bodyGrad.addColorStop(1, '#c2410c'); // warm 3D shadow bottom
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    if (this.state === 'DRAGGED') {
      // Arched body shape (scruff-carry pose)
      ctx.moveTo(-25, 12); // bottom-left
      ctx.quadraticCurveTo(-27, -5, -23, -18); // back rear curve
      // Arching the back upwards: curve from -23,-18 to 21,-18 via (0, -34)
      ctx.quadraticCurveTo(0, -34, 21, -18); // top arched back
      ctx.quadraticCurveTo(25, -5, 23, 12); // front curve
      ctx.quadraticCurveTo(0, 5, -25, 12); // belly curves inwards (upwards) in the middle!
    } else {
      ctx.roundRect(-25, -18, 48, 30, 12);
    }
    ctx.fill();
    ctx.restore();

    // 4. Draw Front Legs
    if (this.state === 'SLEEPING') {
      // Folded flat
      this.drawLeg(8, 7, 0, true);
      this.drawLeg(16, 7, 0, true);
    } else if (this.state === 'SITTING') {
      // Standing upright
      this.drawLeg(8, 8, 0, false);
      this.drawLeg(16, 8, 0, false);
    } else if (this.state === 'GROOMING') {
      // One leg standing, one leg raised licking face!
      this.drawLeg(8, 8, 0, false); // stand
      
      // Raised licking paw
      const lickOffset = Math.sin(Date.now() * 0.015) * 5;
      ctx.save();
      ctx.translate(18, 3 + lickOffset);
      ctx.rotate(-Math.PI / 3);
      this.drawLeg(0, 0, 0, false);
      ctx.restore();
    } else if (this.state === 'DRAGGED') {
      // Dangling front legs, slightly offset downwards
      this.drawLeg(8, 12, Math.sin(this.walkCycle + Math.PI) * 0.55);
      this.drawLeg(16, 12, Math.sin(this.walkCycle) * 0.55);
    } else {
      // Running legs
      this.drawLeg(8, 10, Math.sin(this.walkCycle + Math.PI) * 0.4);
      this.drawLeg(16, 10, Math.sin(this.walkCycle) * 0.4);
    }

    // 5. Draw Collar & Golden Bell
    ctx.save();
    ctx.translate(0, bodyY);
    ctx.strokeStyle = '#f43f5e'; // red collar
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(14, -8);
    ctx.lineTo(24, 0);
    ctx.stroke();
    // Golden Bell with highlight
    const bellGrad = ctx.createRadialGradient(22, 2, 1, 22, 2, 4);
    bellGrad.addColorStop(0, '#fef08a');
    bellGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.arc(22, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Draw Head (Orange circle design)
    ctx.save();
    const headX = 20;
    const headY = -12 + (this.state === 'SLEEPING' ? 3 : bodyY * 0.5);
    const headShakeX = (this.state === 'DRAGGED') ? Math.sin(Date.now() * 0.05) * 5 : 0;
    ctx.translate(headX + headShakeX, headY);
    
    const headGrad = ctx.createRadialGradient(-4, -4, 3, 0, 0, 22);
    headGrad.addColorStop(0, '#fdba74');
    headGrad.addColorStop(0.7, '#f97316');
    headGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = headGrad;

    // Draw round head shape
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Draw Ears
    // Left Ear
    ctx.beginPath();
    ctx.moveTo(-14, -8);
    ctx.lineTo(-22, -26);
    ctx.lineTo(-4, -16);
    ctx.closePath();
    ctx.fill();
    // Inner pink left
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.moveTo(-12, -10);
    ctx.lineTo(-18, -22);
    ctx.lineTo(-5, -15);
    ctx.closePath();
    ctx.fill();

    // Right Ear
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(-2, -17);
    ctx.lineTo(8, -27);
    ctx.lineTo(13, -9);
    ctx.closePath();
    ctx.fill();
    // Inner pink right
    ctx.fillStyle = '#fda4af';
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(7, -23);
    ctx.lineTo(10, -9);
    ctx.closePath();
    ctx.fill();

    // Blush cheeks
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)'; // rosy cheeks
    ctx.beginPath();
    ctx.arc(5, 5, 4, 0, Math.PI * 2);
    ctx.arc(14, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(9, 1);
    ctx.lineTo(11, 1);
    ctx.lineTo(10, 2.5);
    ctx.closePath();
    ctx.fill();

    // Eyes
    if (this.state === 'SLEEPING') {
      // Closed curved eyes
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(2, 0, 3, 0, Math.PI, false); ctx.stroke();
      ctx.beginPath(); ctx.arc(11, 0, 3, 0, Math.PI, false); ctx.stroke();
    } else if (this.state === 'GROOMING') {
      // Happy closed winking eyes (^)
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-1, 2); ctx.lineTo(2, -1); ctx.lineTo(5, 2);
      ctx.moveTo(8, 2); ctx.lineTo(11, -1); ctx.lineTo(14, 2);
      ctx.stroke();
    } else {
      // Round emerald green eyes tracking cursor
      this.drawEye(2, -1);
      this.drawEye(11, -1);
    }

    // Mouth
    if (this.state === 'DRAGGED') {
      // Annoyed/surprised open mouth
      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(10, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(8.5, 4, 2, 0, Math.PI);
      ctx.arc(11.5, 4, 2, 0, Math.PI);
      ctx.stroke();
    }

    // Whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(16, 3); ctx.lineTo(28, 1);
    ctx.moveTo(16, 5); ctx.lineTo(27, 5);
    ctx.moveTo(16, 7); ctx.lineTo(26, 9);
    ctx.stroke();

    // Tongue (Licking paw during grooming)
    if (this.state === 'GROOMING') {
      const tongueIn = Math.abs(Math.sin(Date.now() * 0.015)) * 2;
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.arc(8.5, 5 + tongueIn, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fish in mouth
    if (this.fishInMouth) {
      ctx.save();
      ctx.translate(10, 3);
      ctx.rotate(0.18);
      this.drawMouthFish();
      ctx.restore();
    }

    ctx.restore(); // restore head
    ctx.restore(); // restore body/face flip

    // Draw Zzz particles (world coordinates, correct head offset)
    this.zzzParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#a5b4fc';
      ctx.font = `bold ${p.size}px 'Arial'`;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    });

    // Draw Hearts (world coordinates, correct head offset)
    this.hearts.forEach(h => {
      ctx.save();
      ctx.globalAlpha = h.alpha;
      ctx.fillStyle = '#f43f5e';
      ctx.font = `${h.size}px 'Arial'`;
      ctx.fillText('❤️', h.x, h.y);
      ctx.restore();
    });

    ctx.restore();
  }

  drawLeg(ox, oy, angle, isFolded = false) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(angle);
    
    // Leg gradient (Orange)
    const legGrad = ctx.createLinearGradient(0, 0, 0, 15);
    legGrad.addColorStop(0, '#f97316');
    legGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = legGrad;

    if (isFolded) {
      // Draw a round thigh to give it realistic sitting volume
      ctx.beginPath();
      ctx.arc(-2, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw horizontal foot/paw
      ctx.beginPath();
      ctx.roundRect(-8, 5, 14, 6, 3);
      ctx.fill();

      // White paw tips with manual shadow (avoiding Chrome scale/rotate bugs)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.roundRect(-1, 5.8, 6, 6, 2.5);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-1, 5, 6, 6, 2.5);
      ctx.fill();
    } else {
      // Standard vertical leg
      ctx.beginPath();
      ctx.roundRect(-3.5, 0, 7, 13, [0, 0, 3, 3]);
      ctx.fill();
      
      // White paw tips with manual shadow (avoiding Chrome scale/rotate bugs)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.roundRect(-4, 9.8, 8, 4, 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(-4, 9, 8, 4, 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawEye(cx, cy) {
    if (this.isBlinking) {
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 2.5, cy);
      ctx.lineTo(cx + 2.5, cy);
      ctx.stroke();
      return;
    }

    ctx.save();
    // Eye white base
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 4.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Track mouse direction
    const localMouseX = (mouse.x - (this.x + cx * (this.facing === 'left' ? -1 : 1))) * (this.facing === 'left' ? -1 : 1);
    const localMouseY = mouse.y - (this.y + cy + this.jumpY);
    const angleToMouse = Math.atan2(localMouseY, localMouseX);
    const pupilOffX = Math.cos(angleToMouse) * 1.5;
    const pupilOffY = Math.sin(angleToMouse) * 2.0;

    // Iris (Glossy Emerald Green)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(cx + pupilOffX, cy + pupilOffY, 3, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil (Black core)
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx + pupilOffX, cy + pupilOffY, 1.8, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Highlights
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + pupilOffX - 0.8, cy + pupilOffY - 1.2, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + pupilOffX + 0.8, cy + pupilOffY + 1.0, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyebrows when grabbed/dragged
    if (this.state === 'DRAGGED') {
      ctx.save();
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (cx < 6) { // Left eye eyebrow: slant \
        ctx.moveTo(cx - 3.5, cy - 6);
        ctx.lineTo(cx + 2.5, cy - 4);
      } else { // Right eye eyebrow: slant /
        ctx.moveTo(cx - 2.5, cy - 4);
        ctx.lineTo(cx + 3.5, cy - 6);
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawMouthFish() {
    ctx.save();
    const fishGrad = ctx.createLinearGradient(0, -5, 20, 5);
    fishGrad.addColorStop(0, '#a5f3fc'); // bright shiny blue
    fishGrad.addColorStop(1, '#0284c7'); // cyan blue
    ctx.fillStyle = fishGrad;
    ctx.beginPath();
    ctx.ellipse(8, 0, 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(24, -5);
    ctx.lineTo(22, 0);
    ctx.lineTo(24, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(4, -1.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFishObject(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.rotation);
    ctx.globalAlpha = f.alpha;

    const fishGrad = ctx.createLinearGradient(-12, -6, 12, 6);
    fishGrad.addColorStop(0, '#f97316'); // orange fish
    fishGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = fishGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(22, -8);
    ctx.lineTo(19, 0);
    ctx.lineTo(22, 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-7, -2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-7.5, -2, 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Fins
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.quadraticCurveTo(2, -12, 4, -6);
    ctx.fill();

    ctx.restore();
  }
}

const kitten = new Kitten();

function loop() {
  ctx.clearRect(0, 0, w, h);
  
  kitten.update();
  kitten.draw();

  requestAnimationFrame(loop);
}
loop();

// Listen to messages from the parent window
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'mousemove' || data.type === 'touchmove') {
    mouse.x = data.clientX;
    mouse.y = data.clientY;
  } else if (data.type === 'mousedown' || data.type === 'touchstart') {
    // Precise body bounding box check (excludes head and tail)
    const localX = (data.clientX - kitten.x) * (kitten.facing === 'left' ? -1 : 1);
    const localY = data.clientY - kitten.y;
    if (localX >= -22 && localX <= 5 && localY >= -15 && localY <= 12) {
      kitten.state = 'DRAGGED';
      // Record exact pixel offset where the cat was grabbed to keep it perfectly aligned with the cursor
      kitten.grabOffsetX = data.clientX - kitten.x;
      kitten.grabOffsetY = data.clientY - kitten.y;
      
      // Notify parent whiteboard that the kitten was grabbed to prevent drawing lines
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'kitten_grabbed' }, '*');
      }
    } else {
      // Normal click outside kitten
      if (kitten.state === 'SLEEPING') {
        kitten.state = 'CHASING';
        kitten.idleTime = 0;
      }
    }
  } else if (data.type === 'mouseup' || data.type === 'touchend') {
    if (kitten.state === 'DRAGGED') {
      kitten.state = 'CHASING';
      kitten.idleTime = 0;
      kitten.jumpVy = 2.5; // drop with a tiny bounce!
      
      // Notify parent whiteboard that the kitten was released
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'kitten_released' }, '*');
      }
    }
  }
});