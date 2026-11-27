// Gobble's Great Escape — obstacles, pickups and the haystack hideouts.
// Everything Gobble must jump, slide under, dodge or eat, spawned ahead of
// him by distance and drawn in the world as it scrolls past.

import { GROUND_Y, PALETTE, CORN_POINTS, GOLDEN_CORN_POINTS } from './config.js';
import { pickFrom, rangeBetween } from './random.js';

export const OBSTACLE_KIND = {
  FENCE: 'fence',
  HAY_BALE: 'hayBale',
  OVEN: 'oven',
  KNIFE: 'knife',
  HAYSTACK: 'haystack',
  CORN: 'corn',
  GOLDEN_CORN: 'goldenCorn',
};

const SPAWN_PLANS = {
  farmyard: ['fence', 'fence', 'hayBale', 'corn', 'corn', 'haystack', 'fence', 'corn'],
  barn: ['hayBale', 'knife', 'fence', 'corn', 'knife', 'haystack', 'hayBale', 'corn'],
  kitchen: ['oven', 'knife', 'oven', 'corn', 'knife', 'oven', 'hayBale', 'goldenCorn'],
  forest: ['fence', 'corn', 'hayBale', 'corn', 'fence', 'goldenCorn'],
};

export class ObstacleField {
  constructor(rng) {
    this.rng = rng;
    this.items = [];
    this.nextSpawnX = 900;
    this.distanceM = 0;
  }

  reset() {
    this.items = [];
    this.nextSpawnX = 900;
  }

  planFor(stageId) {
    return SPAWN_PLANS[stageId] || SPAWN_PLANS.farmyard;
  }

  spawnAhead(worldX, stageId, distanceM) {
    const plan = this.planFor(stageId);
    const kind = pickFrom(this.rng, plan);
    const gap = rangeBetween(this.rng, 340, 520) + (distanceM > 700 ? 40 : 0);
    this.nextSpawnX = worldX + gap;
    this.addItem(kind, this.nextSpawnX, distanceM);
  }

  addItem(kind, x, distanceM) {
    if (kind === 'corn' || kind === 'goldenCorn') {
      const count = 3 + Math.floor(this.rng() * 3);
      for (let i = 0; i < count; i++) {
        this.items.push({
          kind: kind === 'goldenCorn' ? OBSTACLE_KIND.GOLDEN_CORN : OBSTACLE_KIND.CORN,
          x: x + i * 46,
          y: GROUND_Y - 120 - (i % 2) * 40,
          width: 30,
          height: 30,
          taken: false,
        });
      }
      return;
    }
    if (kind === 'knife') {
      this.items.push({
        kind: OBSTACLE_KIND.KNIFE,
        x,
        y: -40,
        width: 44,
        height: 120,
        fallSpeed: 0,
        falling: false,
        warned: false,
        warnTimer: 0.55,
        landed: false,
      });
      return;
    }
    const sizes = {
      fence: { width: 46, height: 74 },
      hayBale: { width: 84, height: 62 },
      oven: { width: 130, height: 110 },
      haystack: { width: 110, height: 96 },
    };
    const size = sizes[kind];
    this.items.push({
      kind: OBSTACLE_KIND[kind === 'hayBale' ? 'HAY_BALE' : kind === 'haystack' ? 'HAYSTACK' : kind.toUpperCase()],
      x,
      y: GROUND_Y,
      width: size.width,
      height: size.height,
      taken: false,
    });
    void distanceM;
  }

  nearestHaystack(turkeyX) {
    let best = null;
    let bestDistance = 130;
    for (const item of this.items) {
      if (item.kind !== OBSTACLE_KIND.HAYSTACK) continue;
      const distance = Math.abs(item.x - turkeyX);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = item;
      }
    }
    return best;
  }

  update(dt, speed, turkey, sounds) {
    for (const item of this.items) {
      item.x -= speed * dt;
      if (item.kind === OBSTACLE_KIND.KNIFE) {
        if (!item.falling) {
          item.warnTimer -= dt;
          if (item.warnTimer <= 0) {
            item.falling = true;
            item.fallSpeed = 60;
            if (sounds) sounds.knifeWhistle();
          }
        } else if (!item.landed) {
          item.fallSpeed += 2600 * dt;
          item.y += item.fallSpeed * dt;
          if (item.y + item.height >= GROUND_Y) {
            item.y = GROUND_Y - item.height;
            item.landed = true;
            if (sounds) sounds.thud();
          }
        }
      }
    }
    this.items = this.items.filter((item) => item.x + item.width > -200);
  }

  collectCorn(turkey) {
    let points = 0;
    let golden = false;
    for (const item of this.items) {
      if (item.taken) continue;
      if (item.kind !== OBSTACLE_KIND.CORN && item.kind !== OBSTACLE_KIND.GOLDEN_CORN) continue;
      const cx = item.x;
      const cy = item.y;
      if (cx > turkey.left - 10 && cx < turkey.right + 10 && cy > turkey.top - 10 && cy < turkey.bottom + 10) {
        item.taken = true;
        points += item.kind === OBSTACLE_KIND.GOLDEN_CORN ? GOLDEN_CORN_POINTS : CORN_POINTS;
        if (item.kind === OBSTACLE_KIND.GOLDEN_CORN) golden = true;
      }
    }
    this.items = this.items.filter((item) => !item.taken);
    return { points, golden };
  }

  hitObstacle(turkey) {
    for (const item of this.items) {
      if (item.kind === OBSTACLE_KIND.CORN || item.kind === OBSTACLE_KIND.GOLDEN_CORN) continue;
      if (item.kind === OBSTACLE_KIND.HAYSTACK) continue;
      if (item.kind === OBSTACLE_KIND.KNIFE && !item.landed) {
        // A falling knife only hurts while it is still in the air above you.
        if (item.y + item.height < turkey.top) continue;
      }
      const itemLeft = item.x - item.width / 2;
      const itemRight = item.x + item.width / 2;
      const itemTop = item.kind === OBSTACLE_KIND.KNIFE ? item.y : item.y - item.height;
      const itemBottom = item.kind === OBSTACLE_KIND.KNIFE ? item.y + item.height : item.y;
      const overlapX = turkey.right - 8 > itemLeft && turkey.left + 8 < itemRight;
      const overlapY = turkey.bottom - 4 > itemTop && turkey.top + 6 < itemBottom;
      if (overlapX && overlapY) return item;
    }
    return null;
  }

  draw(ctx) {
    for (const item of this.items) {
      if (item.kind === OBSTACLE_KIND.FENCE) this.drawFence(ctx, item);
      if (item.kind === OBSTACLE_KIND.HAY_BALE) this.drawHayBale(ctx, item);
      if (item.kind === OBSTACLE_KIND.OVEN) this.drawOven(ctx, item);
      if (item.kind === OBSTACLE_KIND.KNIFE) this.drawKnife(ctx, item);
      if (item.kind === OBSTACLE_KIND.HAYSTACK) this.drawHaystack(ctx, item);
      if (item.kind === OBSTACLE_KIND.CORN) this.drawCorn(ctx, item, false);
      if (item.kind === OBSTACLE_KIND.GOLDEN_CORN) this.drawCorn(ctx, item, true);
    }
  }

  drawFence(ctx, item) {
    const top = item.y - item.height;
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(item.x - 23, top, 8, item.height);
    ctx.fillRect(item.x + 15, top, 8, item.height);
    ctx.fillStyle = '#96683e';
    ctx.fillRect(item.x - 28, top + 12, 56, 9);
    ctx.fillRect(item.x - 28, top + 38, 56, 9);
    ctx.fillStyle = '#b98a52';
    ctx.fillRect(item.x - 28, top + 12, 56, 3);
  }

  drawHayBale(ctx, item) {
    const top = item.y - item.height;
    ctx.fillStyle = PALETTE.hay;
    ctx.beginPath();
    ctx.ellipse(item.x, item.y - 30, 42, 31, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8933a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(item.x, item.y - 30, 30, 21, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(item.x, item.y - 30, 16, 11, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawOven(ctx, item) {
    const top = item.y - item.height;
    ctx.fillStyle = PALETTE.ovenBody;
    ctx.beginPath();
    ctx.roundRect(item.x - 65, top, 130, item.height, 8);
    ctx.fill();
    // Fire glow in the open oven door.
    const flicker = 0.7 + Math.random() * 0.3;
    ctx.fillStyle = `rgba(255, 123, 36, ${0.55 * flicker})`;
    ctx.beginPath();
    ctx.ellipse(item.x, item.y - 42, 52, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.ovenFire;
    ctx.beginPath();
    ctx.moveTo(item.x - 30, item.y - 18);
    ctx.quadraticCurveTo(item.x - 18, item.y - 62, item.x, item.y - 34);
    ctx.quadraticCurveTo(item.x + 18, item.y - 62, item.x + 30, item.y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1e';
    ctx.beginPath();
    ctx.roundRect(item.x - 48, top + 8, 96, 22, 4);
    ctx.fill();
    ctx.fillStyle = '#ff5a3c';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT! HOT!', item.x, top + 24);
    ctx.textAlign = 'left';
    // Stovetop knobs and a very suspicious roasting pan.
    ctx.fillStyle = '#c9c9c9';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(item.x + i * 26, top + 40, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawKnife(ctx, item) {
    if (!item.falling && !item.landed) {
      // Telegraph: a red shadow and a glint where it will land.
      ctx.fillStyle = 'rgba(192, 57, 43, 0.35)';
      ctx.beginPath();
      ctx.ellipse(item.x, GROUND_Y + 4, 34, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c0392b';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', item.x, GROUND_Y - 130);
      ctx.textAlign = 'left';
      return;
    }
    const top = item.y;
    ctx.save();
    ctx.translate(item.x, top);
    ctx.rotate(item.landed ? 0.12 : 0);
    ctx.fillStyle = PALETTE.knifeBlade;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 88);
    ctx.lineTo(0, 104);
    ctx.lineTo(-8, 88);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.knifeHandle;
    ctx.beginPath();
    ctx.roundRect(-12, -26, 24, 28, 5);
    ctx.fill();
    ctx.restore();
  }

  drawHaystack(ctx, item) {
    const top = item.y - item.height;
    ctx.fillStyle = '#d9a93f';
    ctx.beginPath();
    ctx.moveTo(item.x - 55, item.y);
    ctx.quadraticCurveTo(item.x - 48, top + 10, item.x, top);
    ctx.quadraticCurveTo(item.x + 48, top + 10, item.x + 55, item.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#b8933a';
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(item.x + i * 18, item.y - 8);
      ctx.quadraticCurveTo(item.x + i * 18 + 6, top + 34, item.x + i * 10, top + 8);
      ctx.stroke();
    }
    ctx.fillStyle = '#2b1a0e';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDE — press H', item.x, top - 10);
    ctx.textAlign = 'left';
  }

  drawCorn(ctx, item, golden) {
    ctx.save();
    ctx.translate(item.x, item.y);
    const bob = Math.sin(item.x * 0.02) * 3;
    ctx.translate(0, bob);
    ctx.fillStyle = golden ? '#ffe066' : PALETTE.corn;
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(180, 120, 20, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-3, -4, 3, 8, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.cornHusk;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-14, 22);
    ctx.lineTo(-2, 14);
    ctx.closePath();
    ctx.fill();
    if (golden) {
      ctx.strokeStyle = '#fff3d6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
