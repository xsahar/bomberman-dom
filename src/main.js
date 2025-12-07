

import { createApp, h, store } from '../framework/index.js';
import { MapGenerator } from './map/mapGenerator.js';
import { PowerupManager } from './map/powerups.js';
import { renderMap } from './ui/mapRenderer.js';

// Initialize map and powerups on app start
function initializeGame() {
  console.log('🎮 Initializing game...');
  
  // Generate map
  const generator = new MapGenerator();
  const mapData = generator.generateMap();
  
  console.log('📊 Map data generated:', mapData);
  console.log(`   Total cells: ${mapData.length * mapData[0].length}`);
  console.log(`   Walls: ${mapData.flat().filter(c => c.type === 'wall').length}`);
  console.log(`   Blocks: ${mapData.flat().filter(c => c.type === 'block').length}`);
  console.log(`   Empty: ${mapData.flat().filter(c => c.type === 'empty').length}`);

  // Update store with map data
  store.setState({ 
    map: { 
      data: mapData, 
      rows: 13, 
      cols: 15 
    },
    powerups: [],
    bombs: [],
    gameState: 'lobby'
  });

  console.log('✅ Game initialized');
  return mapData;
}

function RootComponent() {
  console.log('🎮 RootComponent rendering...');
  
  const state = store.getState();
  const mapData = state.map?.data || [];

  return h.div({ className: 'game-root' }, [
    h.h1({}, 'Bomberman Game'),
    mapData.length > 0 ? renderMap(mapData) : h.div({}, 'Loading map...')
  ]);
}

window.addEventListener('load', () => {
  console.log('✅ Page loaded');
  
  const container = document.getElementById('app');
  if (!container) {
    console.error('❌ Container #app not found!');
    return;
  }
  
  // Initialize game first
  initializeGame();
  
  console.log('📦 Creating app...');
  const app = createApp(RootComponent, container);
  app.connectToStore(store);
  app.render();
  
  console.log('✅ App rendered');
});
