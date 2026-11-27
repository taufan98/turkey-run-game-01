// Gobble's Great Escape — the turkey: physics, sliding, hiding and drawing.
// Gobble is the player. He runs right, jumps, slides under swinging knives
// and dives into haystacks when the farmer gets too close.

import { GRAVITY, GROUND_Y, JUMP_VELOCITY, TURKEY_X, PALETTE } from './config.js';

export class Turkey {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = TURKEY_X;
    this.y = GROUND_Y;
    this.velocityY = 0;
    this.onGround = true;
    this.sliding = false;
    this.slideTimer = 0;
    this.hidden = false;
    this.hideTimer = 0;
    this.invulnerableTimer = 0;
    this.runCycle = 0;
    this.flapCycle = 0;
    this.stumbleTimer = 0;
  }

  get width() {
    return this.sliding ? 86 : 64;
  }

  get height() {
    return this.sliding ? 34 : 62;
  }

  get left() {
    return this.x - this.width / 2;
  }

  get right() {
    return this.x + this.width / 2;
  }

  get top() {
    return this.y - this.height;
  }

  get bottom() {
    return this.y;
  }

  tryJump(sounds) {
    if (this.hidden) return false;
    if (!this.onGround) return false;
    this.velocityY = JUMP_VELOCITY;
    this.onGround = false;
    this.sliding = false;
    if (sounds) sounds.jumpWhoosh();
    return true;
  }

  trySlide() {
    if (!this.onGround || this.hidden) return;
    this.sliding = true;
    this.slideTimer = 0.55;
  }

  tryHide() {
    if (!this.onGround || this.hidden) return false;
    this.hidden = true;
    this.hideTimer = 2.6;
    this.sliding = false;
    return true;
  }

  stumble() {
    this.stumbleTimer = 0.55;
    this.invulnerableTimer = 1.4;
    this.velocityY = -320;
    this.onGround = false;
  }

  update(dt, slideHeld) {
    this.runCycle += dt * 11;
    this.flapCycle += dt * 6;
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.stumbleTimer > 0) this.stumbleTimer -= dt;
    if (this.hidden) {
      this.hideTimer -= dt;
      if (this.hideTimer <= 0) this.hidden = false;
      return;
    }
    if (slideHeld && this.onGround) {
      this.sliding = true;
      this.slideTimer = 0.2;
    } else if (this.sliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.sliding = false;
    }
    if (!this.onGround) {
      this.velocityY += GRAVITY * dt;
      this.y += this.velocityY * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.velocityY = 0;
        this.onGround = true;
      }
    }
  }

  draw(ctx) {
    if (this.hidden) return;
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 12) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const wobble = this.onGround ? Math.sin(this.runCycle) * 3 : 0;
    const tilt = this.stumbleTimer > 0 ? -0.35 : (this.onGround ? 0 : -0.12);
    ctx.rotate(tilt);
    if (this.sliding) {
      this.drawSlidingTurkey(ctx);
    } else {
      this.drawRunningTurkey(ctx, wobble);
    }
    ctx.restore();
  }

  drawRunningTurkey(ctx, wobble) {
    // Fanned tail feathers, the turkey's proudest feature.
    ctx.fillStyle = PALETTE.featherFan;
    for (let i = -2; i <= 2; i++) {
      ctx.save();
      ctx.translate(-26, -34);
      ctx.rotate(i * 0.32);
      ctx.beginPath();
      ctx.ellipse(0, -20, 9, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.featherTip;
      ctx.beginPath();
      ctx.ellipse(0, -38, 6, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.featherFan;
      ctx.restore();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -30, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyLight;
    ctx.beginPath();
    ctx.ellipse(6, -24, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing, flapping as he runs.
    const flap = Math.sin(this.flapCycle) * 8;
    ctx.fillStyle = PALETTE.turkeyDark;
    ctx.beginPath();
    ctx.ellipse(-6, -32 + flap, 18, 11, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // Neck and head.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(24, -52, 9, 16, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(28, -66, 11, 0, Math.PI * 2);
    ctx.fill();
    // Wattle and beak.
    ctx.fillStyle = PALETTE.wattle;
    ctx.beginPath();
    ctx.ellipse(30, -58, 4, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(36, -68);
    ctx.lineTo(50, -64);
    ctx.lineTo(36, -60);
    ctx.closePath();
    ctx.fill();
    // Eye, wide with panic.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(31, -69, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(32, -69, 2, 0, Math.PI * 2);
    ctx.fill();
    // Legs, mid-stride.
    ctx.strokeStyle = PALETTE.beak;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    const legSwing = Math.sin(this.runCycle) * 10;
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.lineTo(-8 + legSwing, 0);
    ctx.moveTo(8, -8);
    ctx.lineTo(8 - legSwing, 0);
    ctx.stroke();
    void wobble;
  }

  drawSlidingTurkey(ctx) {
    // Low and long: belly on the ground, beak first, under the knives.
    ctx.fillStyle = PALETTE.featherFan;
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(-34, -16);
      ctx.rotate(-1.1 + i * 0.3);
      ctx.beginPath();
      ctx.ellipse(0, -14, 8, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(0, -16, 42, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(38, -22, 8, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(44, -30, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.beak;
    ctx.beginPath();
    ctx.moveTo(50, -32);
    ctx.lineTo(62, -29);
    ctx.lineTo(50, -25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(46, -33, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(47, -33, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
