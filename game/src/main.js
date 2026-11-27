// Gobble's Great Escape — the game itself: state machine, loop, spawning,
// collisions, scoring and the deterministic screenshot mode (?shot=).
// This file wires the other modules together; it holds no art and no sound.

import {
  BASE_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, ESCAPE_DISTANCE_M, GROUND_Y,
  MAX_SPEED, PIXELS_PER_METER, SPRINT_SPEED, STAGE_BONUS, START_LIVES,
  stageAt,
} from './config.js';
import { makeRng } from './random.js';
import { SoundBank } from './audio.js';
import { InputState } from './input.js';
import { Turkey } from './turkey.js';
import { Farmer } from './farmer.js';
import { ObstacleField } from './obstacles.js';
import { Scenery } from './stages.js';
import {
  drawEndScreen, drawHud, drawPausedOverlay, drawTitleScreen,
  END_RESTART_BUTTON, TITLE_START_BUTTON,
} from './hud.js';

const GAME_STATE = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CAUGHT: 'caught',
  ESCAPED: 'escaped',
};

export class GobbleGame {
  constructor(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sounds = new SoundBank();
    this.input = new InputState(canvas);
    this.turkey = new Turkey();
    this.farmer = new Farmer();
    this.scenery = new Scenery();
    this.rng = makeRng((options && options.seed) || (Date.now() % 2147483647));
    this.field = new ObstacleField(this.rng);
    this.state = GAME_STATE.TITLE;
    this.score = 0;
    this.distanceM = 0;
    this.lives = START_LIVES;
    this.cornCollected = 0;
    this.speed = BASE_SPEED;
    this.stage = stageAt(0);
    this.stageBannerTimer = 0;
    this.bestDistance = 0;
    this.hideHintTimer = 0;
    this.lastTime = 0;
    this.shotMode = (options && options.shot) || null;
  }

  reset() {
    this.turkey.reset();
    this.farmer.reset();
    this.field.reset();
    this.rng = makeRng((Date.now() % 2147483647) || 1);
    this.field.rng = this.rng;
    // A gentle opening: corn far ahead, then the first fence, so a new
    // player gets about two seconds before the first thing to jump.
    this.field.addItem('corn', 980, 0);
    this.field.addItem('fence', 1350, 0);
    this.score = 0;
    this.distanceM = 0;
    this.lives = START_LIVES;
    this.cornCollected = 0;
    this.speed = BASE_SPEED;
    this.stage = stageAt(0);
    this.stageBannerTimer = 0;
    this.state = GAME_STATE.PLAYING;
    this.sounds.stopOvenSizzle();
  }

  resetForShot(shot, seed) {
    this.rng = makeRng(seed || 1);
    this.field = new ObstacleField(this.rng);
    this.turkey.reset();
    this.farmer.reset();
    this.scenery = new Scenery();
    this.score = 0;
    this.distanceM = 0;
    this.lives = START_LIVES;
    this.cornCollected = 0;
    this.bestDistance = 1234;
    if (shot === 'start') {
      this.state = GAME_STATE.TITLE;
      this.seedTitleScene();
    } else if (shot === 'play') {
      this.state = GAME_STATE.PLAYING;
      this.distanceM = 132;
      this.score = 1480;
      this.stage = stageAt(this.distanceM);
      this.seedPlayScene();
      this.simulate(1.15);
    } else if (shot === 'kitchen') {
      this.state = GAME_STATE.PLAYING;
      this.distanceM = 1050;
      this.score = 9310;
      this.lives = 2;
      this.stage = stageAt(this.distanceM);
      this.seedKitchenScene();
      this.simulate(0.75, 0.28);
    } else if (shot === 'end') {
      this.state = GAME_STATE.ESCAPED;
      this.distanceM = ESCAPE_DISTANCE_M;
      this.score = 18420;
      this.cornCollected = 47;
      this.stage = stageAt(this.distanceM);
      this.seedTitleScene();
    }
  }

  seedTitleScene() {
    this.field.addItem('fence', 820, 0);
    this.field.addItem('hayBale', 1060, 0);
    this.field.addItem('corn', 620, 0);
    this.field.addItem('haystack', 1180, 0);
  }

  seedPlayScene() {
    this.field.addItem('fence', 640, 132);
    this.field.addItem('corn', 520, 132);
    this.field.addItem('hayBale', 980, 132);
    this.field.addItem('haystack', 1160, 132);
  }

  seedKitchenScene() {
    this.field.addItem('oven', 700, 1050);
    this.field.addItem('corn', 560, 1050);
    this.field.addItem('knife', 980, 1050);
    this.field.addItem('oven', 1180, 1050);
    this.farmer.gap = 150;
  }

  simulate(seconds, jumpAt) {
    const step = 1 / 60;
    let elapsed = 0;
    let jumped = false;
    const jumpTime = jumpAt === undefined ? 0.55 : jumpAt;
    while (elapsed < seconds) {
      if (!jumped && elapsed > jumpTime) {
        this.turkey.tryJump(null);
        jumped = true;
      }
      this.updatePlaying(step, true);
      elapsed += step;
    }
  }

  start() {
    if (this.shotMode) {
      const params = new URLSearchParams(window.location.search);
      const seed = parseInt(params.get('seed') || '1', 10);
      this.resetForShot(this.shotMode, seed);
      this.render();
      return;
    }
    const loop = (time) => {
      const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0.016);
      this.lastTime = time;
      this.update(dt);
      this.render();
      this.input.endFrame();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.input.mutePressed) this.sounds.toggleMute();
    if (this.state === GAME_STATE.TITLE) {
      this.scenery.update(dt, 60);
      if (this.input.startPressed || this.input.clickedInside(
        TITLE_START_BUTTON.x, TITLE_START_BUTTON.y,
        TITLE_START_BUTTON.width, TITLE_START_BUTTON.height,
      )) {
        this.sounds.unlock();
        this.sounds.gobble();
        this.reset();
      }
      return;
    }
    if (this.state === GAME_STATE.PLAYING) {
      if (this.input.pausePressed) {
        this.state = GAME_STATE.PAUSED;
        return;
      }
      this.updatePlaying(dt, false);
      return;
    }
    if (this.state === GAME_STATE.PAUSED) {
      if (this.input.pausePressed || this.input.mouseJustClicked) {
        this.state = GAME_STATE.PLAYING;
      }
      return;
    }
    if (this.state === GAME_STATE.CAUGHT || this.state === GAME_STATE.ESCAPED) {
      if (this.input.restartPressed || this.input.clickedInside(
        END_RESTART_BUTTON.x, END_RESTART_BUTTON.y,
        END_RESTART_BUTTON.width, END_RESTART_BUTTON.height,
      )) {
        this.sounds.gobble();
        this.reset();
      }
    }
  }

  updatePlaying(dt, silent) {
    const sprinting = this.input.sprintHeld && !this.turkey.hidden;
    const targetSpeed = sprinting
      ? SPRINT_SPEED
      : Math.min(MAX_SPEED, BASE_SPEED + this.distanceM * 0.12);
    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 2);
    this.distanceM += (this.speed * dt) / PIXELS_PER_METER;
    this.score += this.speed * dt * 0.02;
    this.scenery.update(dt, this.speed);
    if (this.input.jumpPressed) this.turkey.tryJump(silent ? null : this.sounds);
    if (this.input.hidePressed) {
      const haystack = this.field.nearestHaystack(this.turkey.x);
      if (haystack && this.turkey.tryHide()) {
        if (!silent) this.sounds.gobble();
      }
    }
    this.turkey.update(dt, this.input.slideHeld);
    this.farmer.update(dt, this.turkey.hidden, this.speed, silent ? null : this.sounds, sprinting);
    const furthestX = this.field.items.reduce((max, item) => Math.max(max, item.x), 0);
    if (furthestX < CANVAS_WIDTH + 200) {
      this.field.spawnAhead(Math.max(furthestX, this.turkey.x), this.stage.id, this.distanceM);
    }
    this.field.update(dt, this.speed, this.turkey, silent ? null : this.sounds);
    const corn = this.field.collectCorn(this.turkey);
    if (corn.points > 0) {
      this.score += corn.points;
      this.cornCollected += corn.points >= 50 ? 1 : Math.round(corn.points / 10);
      this.farmer.pushBack(corn.golden ? 20 : 8);
      if (!silent) this.sounds.cornDing(corn.golden);
    }
    const hit = this.turkey.invulnerableTimer > 0 ? null : this.field.hitObstacle(this.turkey);
    if (hit) {
      this.field.items = this.field.items.filter((item) => item !== hit);
      this.lives -= 1;
      this.turkey.stumble();
      this.farmer.pullCloser(70);
      if (!silent) this.sounds.thud();
    }
    const newStage = stageAt(this.distanceM);
    if (newStage.id !== this.stage.id) {
      this.stage = newStage;
      this.score += STAGE_BONUS;
      this.stageBannerTimer = 2.2;
      if (!silent) this.sounds.gobble();
    }
    if (this.stageBannerTimer > 0) this.stageBannerTimer -= dt;
    if (this.stage.id === 'kitchen' && !silent) {
      this.sounds.startOvenSizzle();
    } else {
      this.sounds.stopOvenSizzle();
    }
    if (this.distanceM >= ESCAPE_DISTANCE_M) {
      this.endRun(true);
      return;
    }
    if (this.lives <= 0 || this.farmer.caughtTurkey) {
      this.endRun(false);
    }
  }

  endRun(escaped) {
    this.state = escaped ? GAME_STATE.ESCAPED : GAME_STATE.CAUGHT;
    this.bestDistance = Math.max(this.bestDistance, this.distanceM);
    this.sounds.stopOvenSizzle();
    if (escaped) this.sounds.escapedFanfare();
    else this.sounds.caughtSting();
  }

  render() {
    const ctx = this.ctx;
    this.scenery.draw(ctx, this.stage);
    this.field.draw(ctx);
    this.turkey.draw(ctx);
    if (this.state !== GAME_STATE.TITLE) this.farmer.draw(ctx);
    if (this.turkey.hidden) {
      ctx.fillStyle = '#fff3d6';
      ctx.font = 'bold 22px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Shhh... hiding in the hay!', this.turkey.x, GROUND_Y - 130);
      ctx.textAlign = 'left';
    }
    if (this.state === GAME_STATE.PLAYING || this.state === GAME_STATE.PAUSED) {
      drawHud(ctx, {
        score: Math.floor(this.score),
        distanceM: this.distanceM,
        lives: this.lives,
        farmerGap: this.farmer.gap,
        stage: this.stage,
        muted: this.sounds.muted,
        paused: this.state === GAME_STATE.PAUSED,
      });
      if (this.stageBannerTimer > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.stageBannerTimer);
        ctx.fillStyle = '#fff3d6';
        ctx.font = 'bold 54px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.stage.name.toUpperCase(), CANVAS_WIDTH / 2, 220);
        ctx.font = 'italic 22px Georgia, serif';
        ctx.fillText(this.stage.id === 'kitchen'
          ? 'Mind the oven. Mind the knives.'
          : this.stage.id === 'forest' ? 'Almost free — keep running!' : 'The chase is on!',
        CANVAS_WIDTH / 2, 256);
        ctx.restore();
        ctx.textAlign = 'left';
      }
      if (this.state === GAME_STATE.PAUSED) drawPausedOverlay(ctx);
    }
    if (this.state === GAME_STATE.TITLE) {
      drawTitleScreen(ctx, this.bestDistance);
    }
    if (this.state === GAME_STATE.CAUGHT || this.state === GAME_STATE.ESCAPED) {
      drawEndScreen(ctx, {
        escaped: this.state === GAME_STATE.ESCAPED,
        score: Math.floor(this.score),
        distanceM: this.distanceM,
        corn: this.cornCollected,
        stageName: this.stage.name,
        bestDistance: this.bestDistance,
      });
    }
  }
}

export function bootGame(canvas) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const game = new GobbleGame(canvas, { shot });
  // Exposed for play-testing and debugging only; the game never reads it.
  window.__gobbleGame = game;
  game.start();
  return game;
}
