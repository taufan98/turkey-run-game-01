// Gobble's Great Escape — the HUD and the screens around the run.
// Title screen, in-play HUD (score, distance, lives, farmer gap, stage)
// and the two end screens: caught, and escaped. All canvas-drawn.

import { CANVAS_WIDTH, CANVAS_HEIGHT, ESCAPE_DISTANCE_M, PALETTE } from './config.js';

export function drawHud(ctx, state) {
  const { score, distanceM, lives, farmerGap, stage, paused } = state;
  // Top bar.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.72)';
  ctx.beginPath();
  ctx.roundRect(0, 0, CANVAS_WIDTH, 64, 0);
  ctx.fill();
  ctx.fillStyle = PALETTE.textLight;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${score}`, 24, 42);
  ctx.fillText(`DISTANCE ${Math.floor(distanceM)} m`, 300, 42);
  ctx.fillText(`STAGE  ${stage.name.toUpperCase()}`, 620, 42);
  // Lives as drumsticks.
  for (let i = 0; i < 3; i++) {
    drawDrumstick(ctx, 1060 + i * 40, 32, i < lives);
  }
  // Left meter cluster sits over bright stage art: back it with a dark pill.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.45)';
  ctx.beginPath();
  ctx.roundRect(12, 70, 300, 96, 12);
  ctx.fill();
  // Farmer gap meter: how close the farmer is behind Gobble.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  ctx.beginPath();
  ctx.roundRect(24, 98, 260, 20, 10);
  ctx.fill();
  const gapFraction = Math.max(0, Math.min(1, farmerGap / 420));
  ctx.fillStyle = gapFraction > 0.45 ? '#7fb069' : gapFraction > 0.22 ? '#e8a13c' : '#c0392b';
  ctx.beginPath();
  ctx.roundRect(24, 98, 260 * gapFraction, 20, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.textLight;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('FARMER GAP', 24, 92);
  ctx.fillText(gapFraction > 0.22 ? 'SAFE' : 'RUN!', 292, 114);
  // Escape progress: a thin bar to the forest gate.
  const progress = Math.min(1, distanceM / ESCAPE_DISTANCE_M);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.25)';
  ctx.beginPath();
  ctx.roundRect(24, 148, 260, 10, 5);
  ctx.fill();
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.roundRect(24, 148, 260 * progress, 10, 5);
  ctx.fill();
  ctx.fillStyle = PALETTE.textLight;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`ESCAPE ${Math.floor(progress * 100)}%`, 24, 142);
  // Controls reminder at the bottom while playing.
  ctx.fillStyle = 'rgba(43, 26, 14, 0.55)';
  ctx.beginPath();
  ctx.roundRect(24, CANVAS_HEIGHT - 40, 640, 28, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.textLight;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('SPACE jump  •  ↓ slide  •  H hide in hay  •  SHIFT sprint  •  P pause  •  M mute', 36, CANVAS_HEIGHT - 21);
  if (paused) {
    ctx.fillStyle = PALETTE.textLight;
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('PAUSED (P)', CANVAS_WIDTH - 24, 92);
    ctx.textAlign = 'left';
  }
}

function drawDrumstick(ctx, x, y, alive) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alive ? 1 : 0.25;
  ctx.fillStyle = '#b07a3e';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8dcc3';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(8, 4);
  ctx.lineTo(16, 12);
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(17, 13, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTitleScreen(ctx, bestDistance) {
  ctx.fillStyle = 'rgba(43, 26, 14, 0.45)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Title panel.
  ctx.fillStyle = 'rgba(255, 243, 214, 0.96)';
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(190, 120, 900, 460, 24);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText("GOBBLE'S GREAT ESCAPE", 640, 210);
  ctx.fillStyle = '#2b1a0e';
  ctx.font = 'italic 28px Georgia, serif';
  ctx.fillText('A turkey\'s dash from Thanksgiving dinner', 640, 256);
  ctx.font = '20px Georgia, serif';
  ctx.fillText('The farmer is behind you. The oven is ahead of you.', 640, 300);
  ctx.fillText('Jump the fences, slide under the carving knives,', 640, 332);
  ctx.fillText('dodge the oven, hide in the hay — and reach the forest.', 640, 364);
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('SPACE / CLICK — jump & start      ↓ — slide      H — hide      SHIFT — sprint', 640, 416);
  // Start button.
  drawButton(ctx, 490, 440, 300, 64, 'START THE RUN');
  ctx.fillStyle = '#2b1a0e';
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Collect corn for points. Three stumbles and the farmer catches you.', 640, 528);
  if (bestDistance > 0) {
    ctx.fillText(`Best escape so far: ${Math.floor(bestDistance)} m`, 640, 556);
  }
  ctx.textAlign = 'left';
}

export function drawEndScreen(ctx, result) {
  const escaped = result.escaped;
  ctx.fillStyle = escaped ? 'rgba(39, 74, 51, 0.55)' : 'rgba(90, 20, 10, 0.55)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = 'rgba(255, 243, 214, 0.96)';
  ctx.strokeStyle = escaped ? '#7fb069' : '#c0392b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(240, 130, 800, 430, 24);
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#2c5238' : '#c0392b';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', 640, 220);
  ctx.fillStyle = '#2b1a0e';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(
    escaped
      ? 'Gobble made it to the Freedom Woods. No turkey dinner tonight!'
      : 'The farmer got you... but a turkey never stops dreaming of the woods.',
    640, 264,
  );
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(`SCORE  ${result.score}`, 640, 330);
  ctx.font = '24px Georgia, serif';
  ctx.fillText(`Distance  ${Math.floor(result.distanceM)} m   •   Corn  ${result.corn}   •   Stage  ${result.stageName}`, 640, 374);
  ctx.fillText(`Best escape: ${Math.floor(result.bestDistance)} m`, 640, 408);
  drawButton(ctx, 490, 440, 300, 64, 'RUN AGAIN  (R)');
  ctx.font = '17px Georgia, serif';
  ctx.fillText('Tip: hide in a haystack (H) when the farmer closes in.', 640, 548);
  ctx.textAlign = 'left';
}

export function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(43, 26, 14, 0.5)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = PALETTE.textLight;
  ctx.font = 'bold 48px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', 640, 360);
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Press P or click to keep running', 640, 400);
  ctx.textAlign = 'left';
}

export function drawButton(ctx, x, y, width, height, label) {
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();
  ctx.strokeStyle = '#8a2a1e';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + width / 2, y + 41);
  ctx.textAlign = 'left';
}

export const TITLE_START_BUTTON = { x: 490, y: 440, width: 300, height: 64 };
export const END_RESTART_BUTTON = { x: 490, y: 440, width: 300, height: 64 };
