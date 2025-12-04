# Bomberman DOM - Setup Instructions

## Project Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the WebSocket Server
```bash
npm start
```
This will start the WebSocket server on port 3000 (Person 4's responsibility)

### 3. Serve the Game Files
```bash
npm run serve
```
This will serve the game files on http://localhost:8080

### 4. Development Workflow

Each person should:
1. Read their assigned files in `TEAM_ASSIGNMENTS.md`
2. Study the framework integration guide in `FRAMEWORK_INTEGRATION.md`
3. Implement their assigned functionality
4. Test their code with the framework
5. Coordinate with other team members for integration

### 5. File Structure
```
bomberman-dom/
├── framework/           # Custom framework (already provided)
├── src/                 # Game source code
│   ├── player/         # Person 1: Player mechanics
│   ├── map/            # Person 2: Map and power-ups
│   ├── bombs/          # Person 3: Bombs and explosions  
│   ├── multiplayer/    # Person 4: WebSocket and chat
│   ├── game/           # Person 1 & 5: Game flow and performance
│   ├── ui/             # Person 1: User interface
│   └── utils/          # Shared utilities
├── public/             # Static files (HTML, CSS)
├── server/             # Person 4: WebSocket server
└── docs/               # Documentation files
```

### 6. Important Notes
- **DO NOT** implement everything in one file
- **DO NOT** write full implementations immediately  
- **DO** create skeleton functions first
- **DO** coordinate with your team members
- **DO** use the provided framework consistently
- **DO** test for 60fps performance requirement

### 7. Testing
- Test individual components first
- Integrate gradually
- Test multiplayer functionality with multiple browser tabs
- Monitor performance with browser dev tools