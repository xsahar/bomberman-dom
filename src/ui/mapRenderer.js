import { h } from '../../framework/index.js';

export function renderMap(mapData) {
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

  return h.div({ className: 'map' }, rowNodes || []);
}
