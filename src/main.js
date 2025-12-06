

import { createApp, h } from '../framework/index.js';
import { MapGenerator } from './map/mapGenerator.js';
import { renderMap } from './ui/mapRenderer.js';

function RootComponent() {
  console.log('🎮 RootComponent rendering...');
  
  const generator = new MapGenerator();
  const mapData = generator.generateMap();
  
  console.log('📊 Map data generated:', mapData);

  return h.div({ className: 'game-root' }, [
    h.h1({}, 'Bomberman Game'),
    renderMap(mapData)
  ]);
}

window.addEventListener('load', () => {
  console.log('✅ Page loaded');
  
  const container = document.getElementById('app');
  if (!container) {
    console.error('❌ Container #app not found!');
    return;
  }
  
  console.log('📦 Creating app...');
  const app = createApp(RootComponent, container);
  app.render();
  
  console.log('✅ App rendered');
});
