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

  // 2. Fetch Dynamic Data from Store (Bombs & Fire)
  const state = store.getState();
  const bombs = state.bombs || [];
  const explosions = state.explosions || [];

  // 3. Create Bomb Elements
  const bombNodes = bombs.map(bomb => 
    h.div({
      className: 'bomb',
      style: {
        position: 'absolute',
        left: (bomb.col * TILE_SIZE) + 'px',
        top: (bomb.row * TILE_SIZE) + 'px',
        width: TILE_SIZE + 'px',
        height: TILE_SIZE + 'px',
        backgroundColor: 'black',
        borderRadius: '50%',
        zIndex: '10', // Ensure it sits ABOVE the map
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, [
        // Optional: Add a little "fuse" or spark visual inside if you want
        h.div({ style: { width: '10px', height: '10px', background: 'red', borderRadius: '50%' } }, [])
    ])
  );

  // 4. Create Explosion (Fire) Elements
  const explosionNodes = [];
  explosions.forEach(exp => {
    exp.tiles.forEach(tile => {
      explosionNodes.push(
        h.div({
          className: 'explosion',
          style: {
            position: 'absolute',
            left: (tile.col * TILE_SIZE) + 'px',
            top: (tile.row * TILE_SIZE) + 'px',
            width: TILE_SIZE + 'px',
            height: TILE_SIZE + 'px',
            backgroundColor: 'rgba(255, 69, 0, 0.8)', // Red/Orange transparent
            zIndex: '5' // Above map, below bombs/players
          }
        }, [])
      );
    });
  });

  // 5. Return Wrapper containing Grid + Bombs + Fire
  return h.div(
    { 
      className: 'map',
      style: { position: 'relative' } // Needed for absolute positioning of children
    }, 
    [
      ...rowNodes,       // Layer 1: The Grid
      ...explosionNodes, // Layer 2: The Fire
      ...bombNodes       // Layer 3: The Bombs
    ]
  );
}