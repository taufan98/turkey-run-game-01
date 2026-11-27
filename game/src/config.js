// Gobble's Great Escape — game configuration: tuning, stages and palette.
// One file, one job: every number the rest of the game shares lives here.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const GROUND_Y = 620;
export const TURKEY_X = 300;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = -980;
export const BASE_SPEED = 430;
export const SPRINT_SPEED = 620;
export const MAX_SPEED = 700;

export const ESCAPE_DISTANCE_M = 1500;
export const PIXELS_PER_METER = 50;
export const START_LIVES = 3;
export const START_FARMER_GAP = 260;
export const CAUGHT_GAP = 0;
export const MAX_FARMER_GAP = 420;

export const STAGE_BONUS = 250;
export const CORN_POINTS = 10;
export const GOLDEN_CORN_POINTS = 50;

// Distance (metres) where each stage of the escape begins.
export const STAGES = [
  {
    id: 'farmyard',
    name: 'The Farmyard',
    fromM: 0,
    skyTop: '#f7b267',
    skyBottom: '#f4845f',
    ground: '#8a5a2b',
    groundTop: '#a9713a',
    accent: '#e07a2f',
  },
  {
    id: 'barn',
    name: 'The Old Barn',
    fromM: 400,
    skyTop: '#e07856',
    skyBottom: '#b8452f',
    ground: '#6b4423',
    groundTop: '#8a5a2b',
    accent: '#c94f2e',
  },
  {
    id: 'kitchen',
    name: 'The Kitchen',
    fromM: 900,
    skyTop: '#7a4a3a',
    skyBottom: '#4a2c22',
    ground: '#5d3a24',
    groundTop: '#7a4e30',
    accent: '#ff9d3c',
  },
  {
    id: 'forest',
    name: 'The Forest Gate',
    fromM: 1400,
    skyTop: '#3f6b4f',
    skyBottom: '#274a33',
    ground: '#4a3d22',
    groundTop: '#6b5a34',
    accent: '#7fb069',
  },
];

export function stageAt(distanceM) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (distanceM >= stage.fromM) current = stage;
  }
  return current;
}

export const PALETTE = {
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4423',
  turkeyLight: '#b07a3e',
  turkeyHead: '#d97b6c',
  wattle: '#c0392b',
  beak: '#e67e22',
  featherFan: '#a0522d',
  featherTip: '#e8b04b',
  farmerShirt: '#4a6fa5',
  farmerOveralls: '#3b5a7a',
  farmerSkin: '#e8b88a',
  farmerHat: '#8a6d3b',
  knifeBlade: '#d7dee8',
  knifeHandle: '#5d3a24',
  ovenBody: '#2f2f38',
  ovenFire: '#ff7b24',
  corn: '#ffd23f',
  cornHusk: '#7fb069',
  hay: '#e8c15a',
  textDark: '#2b1a0e',
  textLight: '#fff3d6',
};
