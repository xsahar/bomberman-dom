import { h, store } from '../../framework/index.js';

const TILE_SIZE = 40; // Pixels

export function renderMap(mapData) {
  // 1. Draw the Static Grid (Walls & Grass)
  // This is your existing code
  const rowNodes = mapData.map((row, rowIndex) =>
    h.div(
      { className: 'map-row', 'data-row': rowIndex },
      row.map((cell, colIndex) =>
        h.div(
          {
            className: `map-cell map-cell-${cell.type}`,
            'data-row': rowIndex,
            'data-col': colIndex
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