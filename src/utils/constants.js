export const TILE_SIZE = 40;
export const PLAYER_SIZE = 32;
export const OFFSET = (TILE_SIZE - PLAYER_SIZE) / 2;

export const DIRECTION_MAP = {
  0: { x: 0, y: 0 },
  1: { x: 100, y: 0 },
  2: { x: 100, y: 100 },
  3: { x: 0, y: 100 }
};