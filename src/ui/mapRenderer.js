import { h, store } from '../../framework/index.js';
import { getPowerupManager } from '../utils/helpers.js';

const TILE_SIZE = 40; // Pixels

export function renderMap(mapData) {
  // 1. Merge powerups into a copy of the map so renderer can draw them
  const state = store.getState();
  const powerups = state.powerups || [];
  const pm = getPowerupManager();
  const renderedMap = pm.renderPowerups(mapData, powerups);

  // 2. Draw the Static Grid (Walls & Grass + powerups)
  const rowNodes = renderedMap.map((row, rowIndex) =>
    h.div(
      { className: 'map-row', 'data-row': rowIndex },
      row.map((cell, colIndex) =>
        h.div(
          {
            className: `map-cell map-cell-${cell.type}` + (cell.type === 'powerup' ? ' map-cell-powerup' : ''),
            'data-row': rowIndex,
            'data-col': colIndex,
            'data-powerup-type': cell.type === 'powerup' ? cell.powerupType : undefined
          },
          []
        )
      ) || []
    )
  );

  // 5. Return Wrapper containing Grid + Bombs + Fire
  return h.div(
    { 
      className: 'map',
      style: { position: 'relative' } // Needed for absolute positioning of children
    }, 
    [
      ...rowNodes        // Layer 1: The Grid
    ]
  );
}