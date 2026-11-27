// Gobble's Great Escape — the farmer: a chaser with three moods.
// He chases from behind, sprints when Gobble pulls away, and stops to
// search, baffled, whenever the turkey vanishes into a haystack.

import { GROUND_Y, MAX_FARMER_GAP, PALETTE, START_FARMER_GAP } from './config.js';

export const FARMER_STATE = {
  CHASE: 'chase',
  SPRINT: 'sprint',
  SEARCH: 'search',
};

export class Farmer {
  constructor() {
    this.reset();
  }

  reset() {
    this.gap = START_FARMER_GAP;
    this.state = FARMER_STATE.CHASE;
    this.searchTimer = 0;
    this.runCycle = 0;
    this.shoutTimer = 4;
    this.y = GROUND_Y;
  }

  get x() {
    return 300 - this.gap;
  }

  get caughtTurkey() {
    return this.gap <= 0;
  }

  pushBack(amount) {
    this.gap = Math.min(MAX_FARMER_GAP, this.gap + amount);
  }

  pullCloser(amount) {
    this.gap = Math.max(0, this.gap - amount);
  }

  startSearching() {
    this.state = FARMER_STATE.SEARCH;
    this.searchTimer = 2.6;
  }

  update(dt, turkeyHidden, turkeySpeed, sounds, sprinting) {
    this.runCycle += dt * 9;
    this.shoutTimer -= dt;
    if (this.state === FARMER_STATE.SEARCH) {
      this.searchTimer -= dt;
      if (this.searchTimer <= 0) {
        this.state = FARMER_STATE.CHASE;
        // He lost the trail while Gobble hid: the gap opens right up.
        this.gap = Math.min(MAX_FARMER_GAP, this.gap + 100);
      }
      return;
    }
    if (turkeyHidden) {
      this.startSearching();
      if (sounds) sounds.farmerShout();
      return;
    }
    // He never quite gives up, but he tires: the gap only creeps closed
    // while Gobble runs clean, and a sprinting turkey pulls away.
    // (2 px/s: a clean 150-second run costs 300 px against a 260 start,
    // so the corn and the haystacks have to do the rest — as they should.)
    if (this.gap > 330) {
      this.state = FARMER_STATE.SPRINT;
      this.gap -= 40 * dt;
    } else {
      this.state = FARMER_STATE.CHASE;
      this.gap -= 2 * dt;
      if (sprinting) this.gap += 15 * dt;
    }
    if (this.shoutTimer <= 0) {
      this.shoutTimer = 5 + Math.random() * 4;
      if (sounds && this.gap < 300) sounds.farmerShout();
    }
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    ctx.save();
    ctx.translate(x, y);
    const bob = Math.sin(this.runCycle) * 3;
    const searching = this.state === FARMER_STATE.SEARCH;
    // Legs, pounding after the turkey.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    const swing = searching ? 0 : Math.sin(this.runCycle) * 14;
    ctx.beginPath();
    ctx.moveTo(-6, -34);
    ctx.lineTo(-6 + swing, 0);
    ctx.moveTo(8, -34);
    ctx.lineTo(8 - swing, 0);
    ctx.stroke();
    // Overalls and shirt.
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(-18, -72 + bob, 38, 40);
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(-18, -78 + bob, 38, 16);
    ctx.fillStyle = '#d8c25a';
    ctx.fillRect(-4, -72 + bob, 4, 40);
    ctx.fillRect(8, -72 + bob, 4, 40);
    // Pitchfork, held high while he runs.
    ctx.strokeStyle = '#7a5a30';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(24, -80 + bob);
    ctx.lineTo(34, 4);
    ctx.stroke();
    ctx.strokeStyle = '#c9c9c9';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(24 + i * 6, -80 + bob);
      ctx.lineTo(24 + i * 6, -96 + bob);
      ctx.stroke();
    }
    // Head, red-faced and determined.
    ctx.fillStyle = PALETTE.farmerSkin;
    ctx.beginPath();
    ctx.arc(2, -92 + bob, 15, 0, Math.PI * 2);
    ctx.fill();
    // Straw hat.
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(2, -100 + bob, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(2, -104 + bob, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    // Moustache and angry eyes.
    ctx.fillStyle = '#5d3a24';
    ctx.fillRect(-8, -88 + bob, 20, 4);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-3, -96 + bob, 2, 0, Math.PI * 2);
    ctx.arc(8, -96 + bob, 2, 0, Math.PI * 2);
    ctx.fill();
    if (searching) {
      this.drawSearchBubble(ctx, bob);
    } else if (this.state === FARMER_STATE.SPRINT) {
      this.drawShoutBubble(ctx, bob, 'COME BACK!');
    }
    ctx.restore();
  }

  drawSearchBubble(ctx, bob) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2b1a0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-6, -168 + bob, 84, 40, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2b1a0e';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('? ? ?', 36, -140 + bob);
    ctx.textAlign = 'left';
  }

  drawShoutBubble(ctx, bob, text) {
    ctx.fillStyle = '#fff3d6';
    ctx.strokeStyle = '#2b1a0e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -168 + bob, 150, 40, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 61, -141 + bob);
    ctx.textAlign = 'left';
  }
}
