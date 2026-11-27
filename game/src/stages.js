// Gobble's Great Escape — scenery: the world behind the run.
// Each stage paints its own backdrop — farmhouse and pumpkins, barn walls
// and haylofts, kitchen tiles and pots, then the trees of the forest gate.

import { CANVAS_WIDTH, GROUND_Y, PALETTE } from './config.js';
import { makeRng } from './random.js';

export class Scenery {
  constructor() {
    this.rng = makeRng(20261127);
    this.pumpkins = [];
    this.trees = [];
    this.clouds = [];
    for (let i = 0; i < 14; i++) {
      this.pumpkins.push({ x: this.rng() * 2600, size: 18 + this.rng() * 22 });
    }
    for (let i = 0; i < 10; i++) {
      this.trees.push({ x: this.rng() * 2600, height: 120 + this.rng() * 90 });
    }
    for (let i = 0; i < 6; i++) {
      this.clouds.push({ x: this.rng() * 1600, y: 50 + this.rng() * 110, size: 40 + this.rng() * 50 });
    }
    this.scroll = 0;
  }

  update(dt, speed) {
    this.scroll += speed * dt;
    for (const cloud of this.clouds) {
      cloud.x -= 12 * dt;
      if (cloud.x < -120) cloud.x = CANVAS_WIDTH + 120;
    }
  }

  draw(ctx, stage) {
    this.drawSky(ctx, stage);
    this.drawClouds(ctx);
    if (stage.id === 'kitchen') {
      this.drawKitchenBackdrop(ctx, stage);
    } else if (stage.id === 'barn') {
      this.drawBarnBackdrop(ctx, stage);
    } else if (stage.id === 'forest') {
      this.drawForestBackdrop(ctx, stage);
    } else {
      this.drawFarmBackdrop(ctx, stage);
    }
    this.drawGround(ctx, stage);
  }

  drawSky(ctx, stage) {
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, stage.skyTop);
    gradient.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);
    // Low autumn sun.
    ctx.fillStyle = 'rgba(255, 236, 170, 0.9)';
    ctx.beginPath();
    ctx.arc(1080, 110, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 236, 170, 0.35)';
    ctx.beginPath();
    ctx.arc(1080, 110, 78, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClouds(ctx) {
    ctx.fillStyle = 'rgba(255, 243, 214, 0.85)';
    for (const cloud of this.clouds) {
      ctx.beginPath();
      ctx.ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.4, 0, 0, Math.PI * 2);
      ctx.ellipse(cloud.x + cloud.size * 0.6, cloud.y + 8, cloud.size * 0.7, cloud.size * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawFarmBackdrop(ctx, stage) {
    // Distant hills.
    ctx.fillStyle = '#c98a4b';
    ctx.beginPath();
    ctx.moveTo(0, 520);
    ctx.quadraticCurveTo(320, 420, 640, 510);
    ctx.quadraticCurveTo(960, 430, CANVAS_WIDTH, 510);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // The farmhouse with its red roof.
    ctx.fillStyle = '#e8dcc3';
    ctx.fillRect(60, 400, 180, 130);
    ctx.fillStyle = '#a63d2f';
    ctx.beginPath();
    ctx.moveTo(40, 402);
    ctx.lineTo(150, 330);
    ctx.lineTo(260, 402);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4a2c22';
    ctx.fillRect(130, 460, 40, 70);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(80, 430, 30, 30);
    ctx.fillRect(190, 430, 30, 30);
    // Autumn trees and pumpkins along the fence line.
    for (const tree of this.trees) {
      const x = this.wrapX(tree.x, 2600);
      this.drawAutumnTree(ctx, x, GROUND_Y - 6, tree.height);
    }
    for (const pumpkin of this.pumpkins) {
      const x = this.wrapX(pumpkin.x, 2600);
      this.drawPumpkin(ctx, x, GROUND_Y - 4, pumpkin.size);
    }
    void stage;
  }

  drawBarnBackdrop(ctx, stage) {
    // Big red barn wall with a hayloft door.
    ctx.fillStyle = '#8a3b2a';
    ctx.fillRect(0, 330, CANVAS_WIDTH, GROUND_Y - 330);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.lineWidth = 3;
    for (let x = 0; x < CANVAS_WIDTH; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 330);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d2a1e';
    ctx.beginPath();
    ctx.moveTo(520, 330);
    ctx.lineTo(640, 250);
    ctx.lineTo(760, 330);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a1c12';
    ctx.fillRect(600, 380, 80, 110);
    ctx.strokeStyle = '#d8c25a';
    ctx.lineWidth = 4;
    ctx.strokeRect(600, 380, 80, 110);
    ctx.beginPath();
    ctx.moveTo(600, 380);
    ctx.lineTo(680, 490);
    ctx.moveTo(680, 380);
    ctx.lineTo(600, 490);
    ctx.stroke();
    // Hanging lanterns.
    for (const x of [180, 420, 900, 1120]) {
      ctx.strokeStyle = '#3a1c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 330);
      ctx.lineTo(x, 372);
      ctx.stroke();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(x, 384, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    void stage;
  }

  drawKitchenBackdrop(ctx, stage) {
    // Tiled kitchen wall, a window, and a shelf of pots.
    ctx.fillStyle = '#e8dcc3';
    ctx.fillRect(0, 120, CANVAS_WIDTH, GROUND_Y - 120);
    ctx.strokeStyle = 'rgba(90, 60, 40, 0.25)';
    ctx.lineWidth = 2;
    for (let y = 120; y < GROUND_Y; y += 46) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }
    for (let x = 0; x < CANVAS_WIDTH; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 120);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
    }
    // Window onto the farmyard, cruelly out of reach.
    ctx.fillStyle = '#7fb069';
    ctx.fillRect(90, 180, 180, 150);
    ctx.fillStyle = '#aee2ff';
    ctx.fillRect(102, 192, 156, 126);
    ctx.fillStyle = '#e8dcc3';
    ctx.fillRect(172, 192, 12, 126);
    ctx.fillRect(102, 248, 156, 12);
    // A little tree outside the window, cruelly out of reach.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(147, 288, 6, 30);
    ctx.fillStyle = '#4a7a2f';
    ctx.beginPath();
    ctx.arc(150, 278, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fb069';
    ctx.beginPath();
    ctx.arc(138, 268, 14, 0, Math.PI * 2);
    ctx.arc(162, 270, 12, 0, Math.PI * 2);
    ctx.fill();
    // Shelf with copper pots.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(760, 250, 420, 14);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#b87333';
      ctx.beginPath();
      ctx.arc(800 + i * 100, 232, 26, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(774 + i * 100, 230, 52, 8);
    }
    // A carving board with a very empty plate.
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(420, 420, 260, 18);
    ctx.fillStyle = '#f5f0e1';
    ctx.beginPath();
    ctx.ellipse(550, 412, 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('TONIGHT: TURKEY', 550, 392);
    ctx.textAlign = 'left';
    void stage;
  }

  drawForestBackdrop(ctx, stage) {
    ctx.fillStyle = '#2c5238';
    for (const tree of this.trees) {
      const x = this.wrapX(tree.x, 2600);
      ctx.fillStyle = '#1e3d28';
      ctx.fillRect(x - 8, GROUND_Y - tree.height, 16, tree.height);
      ctx.fillStyle = '#2c5238';
      ctx.beginPath();
      ctx.moveTo(x - 52, GROUND_Y - tree.height + 40);
      ctx.lineTo(x, GROUND_Y - tree.height - 60);
      ctx.lineTo(x + 52, GROUND_Y - tree.height + 40);
      ctx.closePath();
      ctx.fill();
    }
    // The forest gate: two posts and a hand-painted sign.
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(980, 380, 18, 240);
    ctx.fillRect(1200, 380, 18, 240);
    ctx.fillStyle = '#8a5a2b';
    ctx.fillRect(960, 360, 278, 34);
    ctx.fillStyle = '#fff3d6';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('FREEDOM WOODS', 1099, 384);
    ctx.textAlign = 'left';
    void stage;
  }

  drawGround(ctx, stage) {
    ctx.fillStyle = stage.groundTop;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 14);
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y + 14, CANVAS_WIDTH, 720 - GROUND_Y - 14);
    // Tufts of grass and scattered leaves scrolling with the world.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 24; i++) {
      const x = this.wrapX(i * 173 + 40, 1400);
      ctx.fillRect(x, GROUND_Y + 22 + (i % 5) * 12, 26, 4);
    }
    ctx.fillStyle = PALETTE.featherTip;
    for (let i = 0; i < 10; i++) {
      const x = this.wrapX(i * 251 + 90, 1400);
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 34 + (i % 4) * 14, 7, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawAutumnTree(ctx, x, baseY, height) {
    ctx.fillStyle = '#6b4423';
    ctx.fillRect(x - 7, baseY - height * 0.45, 14, height * 0.45);
    ctx.fillStyle = '#d97b2f';
    ctx.beginPath();
    ctx.arc(x, baseY - height * 0.6, height * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.arc(x - height * 0.2, baseY - height * 0.5, height * 0.2, 0, Math.PI * 2);
    ctx.arc(x + height * 0.2, baseY - height * 0.52, height * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  drawPumpkin(ctx, x, baseY, size) {
    ctx.fillStyle = '#e07a2f';
    ctx.beginPath();
    ctx.ellipse(x, baseY - size * 0.4, size * 0.55, size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b85c1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, baseY - size * 0.4, size * 0.3, size * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4a7a2f';
    ctx.fillRect(x - 2, baseY - size * 0.85, 5, size * 0.2);
  }

  wrapX(x, span) {
    const offset = this.scroll * 0.25;
    let wrapped = (x - offset) % span;
    if (wrapped < -100) wrapped += span;
    return wrapped;
  }
}
