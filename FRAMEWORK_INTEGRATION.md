# Framework Integration Guide

## Overview
This project uses the custom mini-framework that was created in a previous project. The framework is located in the `/framework` folder and provides core functionality for DOM manipulation, event handling, routing, and state management.

## Framework Structure
```
framework/
├── index.js          # Main framework entry point and exports
├── types.js          # Type definitions and constants
└── core/
    ├── dom.js         # DOM manipulation utilities
    ├── events.js      # Event handling system
    ├── router.js      # Client-side routing (if needed)
    └── state.js       # State management system
```

## How to Use the Framework

### 1. DOM Manipulation (`framework/core/dom.js`)
The framework provides DOM utilities that should be used instead of direct DOM manipulation:

```javascript
// Example usage in your game files:
// Use framework methods like:
// - createElement()
// - appendChild()
// - removeElement()
// - updateElement()
// - querySelector()
```

**Teams that need this:**
- **Person 1:** For rendering players, UI elements, lobby
- **Person 2:** For rendering map, walls, blocks, power-ups  
- **Person 3:** For rendering bombs and explosions
- **All teams:** For any DOM updates

### 2. Event Handling (`framework/core/events.js`)
Use the framework's event system for consistent event management:

```javascript
// Example usage:
// - addEventListener()
// - removeEventListener()
// - dispatchEvent()
// - handleKeyboard()
```

**Teams that need this:**
- **Person 1:** For keyboard input (movement, bomb placement)
- **Person 4:** For chat input and UI interactions
- **All teams:** For any user interactions

### 3. State Management (`framework/core/state.js`)
Use the framework's state system to manage game state:

```javascript
// Example usage:
// - setState()
// - getState()
// - subscribe()
// - updateState()
```

**Teams that need this:**
- **Person 1:** For player states, game flow states
- **Person 2:** For map state, power-up states
- **Person 3:** For bomb states, explosion states
- **Person 4:** For multiplayer sync and chat state
- **Person 5:** For performance state monitoring

### 4. Main Framework Entry (`framework/index.js`)
This file exports all framework functionality. Import it in your files:

```javascript
// In your game files, use:
// The framework is already loaded in index.html
// Access framework methods through the global framework object
```

## Integration Points

### 1. HTML Structure (`public/index.html`)
The framework is already included in the HTML:
```html
<!-- Framework files -->
<script src="../framework/index.js"></script>
```

### 2. Game Initialization (`src/main.js`)
Initialize the framework before starting the game:
```javascript
// TODO: Initialize framework
// TODO: Set up framework state
// TODO: Initialize DOM structure
// TODO: Start game systems
```

### 3. Performance Considerations (`src/game/performance.js`)
The framework should be integrated with the performance system:
```javascript
// TODO: Use framework's requestAnimationFrame utilities
// TODO: Optimize framework DOM operations
// TODO: Monitor framework performance
```

## Framework Requirements for Each Team

### Person 1 (Player & UI):
- **DOM:** Rendering players, UI elements, lobby interface
- **Events:** Keyboard input for movement
- **State:** Player states, game flow states

### Person 2 (Map & Power-ups):
- **DOM:** Rendering map tiles, walls, blocks, power-ups
- **State:** Map data, power-up locations

### Person 3 (Bombs & Explosions):
- **DOM:** Rendering bombs and explosion effects
- **Events:** Bomb placement input
- **State:** Active bombs, explosion states

### Person 4 (Multiplayer & Chat):
- **DOM:** Chat interface rendering
- **Events:** Chat input handling
- **State:** Multiplayer state synchronization

### Person 5 (Performance):
- **All framework features:** Optimization and monitoring
- **Focus on:** requestAnimationFrame integration, DOM performance

## Key Framework Features to Utilize

1. **Efficient DOM Updates:** Use framework's batching for better performance
2. **Event Delegation:** Use framework's efficient event handling
3. **State Synchronization:** Keep game state in framework's state system
4. **Component System:** Create reusable components for game elements

## Important Notes

⚠️ **DO NOT use direct DOM APIs** - Always use the framework methods
⚠️ **State should be centralized** - Use the framework's state management
⚠️ **Performance critical** - Framework must support 60fps requirement
⚠️ **Consistent patterns** - All teams should follow the same framework patterns

## Getting Started Checklist

- [ ] **Person 1:** Study framework DOM and Event APIs for player/UI systems
- [ ] **Person 2:** Study framework DOM API for map rendering
- [ ] **Person 3:** Study framework DOM and State APIs for bomb systems  
- [ ] **Person 4:** Study framework State API for multiplayer synchronization
- [ ] **Person 5:** Study all framework APIs for optimization opportunities

## Need Help?
If you need to understand specific framework features:
1. Check the framework files in `/framework/`
2. Look at the `types.js` file for available methods
3. Coordinate with other team members using similar features