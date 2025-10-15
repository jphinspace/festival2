# Dynamic Obstacles Implementation

## Overview
This implementation adds a hierarchical obstacle system where agents can now act as obstacles for pathfinding purposes, allowing them to intelligently route around each other.

## Architecture

### Class Hierarchy
```
Obstacle (base class)
├── StaticObstacle
│   ├── FoodStall (food stalls with red/white striped awning)
│   └── Wall (pale blue outline)
└── DynamicObstacle
    └── Agent (festival attendees)
```

### Key Components

#### Base Obstacle Class (`js/Obstacle.js`)
- Provides core collision detection methods:
  - `getBounds()` - Returns bounding box
  - `collidesWith(x, y, radius)` - Checks circular collision
  - `containsPoint(x, y, margin)` - Checks if point is inside

#### StaticObstacle Class (`js/StaticObstacle.js`)
- Extends `Obstacle`
- Represents immovable obstacles
- Used for:
  - Pathfinding collision avoidance
  - Spawn location checking
  - Destination selection

#### DynamicObstacle Class (`js/DynamicObstacle.js`)
- Extends `Obstacle`
- Represents movable obstacles (agents)
- Used for:
  - Pathfinding collision avoidance ONLY
  - NOT used for spawn location checking
  - NOT used for destination selection

#### Agent Class (`js/Agent.js`)
- Now extends `DynamicObstacle`
- Agents have proper obstacle properties:
  - Width: `radius * 2` (10 pixels)
  - Height: `radius * 2` (10 pixels)
- `chooseRandomDestination()` filters out dynamic obstacles

#### Simulation Class (`js/Simulation.js`)
- Maintains separate lists:
  - `obstacles[]` - Static obstacles only (FoodStalls, Walls)
  - `agents[]` - All agents
- During update, passes combined list to each agent:
  - `allObstacles = [...this.obstacles, ...otherAgents]`
- Each agent receives all other agents as dynamic obstacles

## Behavior

### Pathfinding (MovingState)
- Agents receive ALL obstacles (static + dynamic)
- Uses existing hybrid Bug + Bounded A* pathfinding algorithm
- Agents intelligently route around other agents in their path

### Destination Selection
- Agents receive ONLY static obstacles
- Dynamic obstacles (other agents) are filtered out
- Allows agents to choose overlapping destinations
- Agents will navigate to destination regardless of other agents

### Spawn Location
- Checks ONLY static obstacles
- Agents can spawn near each other
- Cannot spawn inside walls or food stalls

## Testing

### Test Coverage
- 273 total tests passing
- New test files:
  - `tests/StaticObstacle.test.js` (17 tests)
  - `tests/DynamicObstacle.test.js` (23 tests)
  - `tests/AgentPathfindingWithDynamicObstacles.test.js` (13 tests)
  - `tests/IntegrationAgentRouting.test.js` (20 tests)

### Key Test Scenarios
1. Obstacle hierarchy and type checking
2. Agent collision detection as obstacles
3. Filtering static vs dynamic obstacles
4. Pathfinding with dynamic obstacles
5. Destination selection ignores dynamic obstacles
6. Multiple agents navigating around each other
7. Integration with existing simulation

## Example Usage

```javascript
// Agents automatically route around each other
const agent1 = new Agent(100, 100);
const agent2 = new Agent(300, 100); // Blocking agent1's path

// During simulation update
const allObstacles = [...staticObstacles, ...otherAgents];
agent1.update(deltaTime, width, height, allObstacles);
// agent1 uses pathfinding to navigate around agent2

// Destination selection ignores other agents
const staticObstacles = obstacles.filter(obs => !(obs instanceof DynamicObstacle));
agent1.chooseRandomDestination(width, height, staticObstacles);
// Can choose destination even if another agent is there
```

## Backward Compatibility
- Existing tests remain unchanged and passing
- Base `Obstacle` class unchanged
- No breaking changes to public APIs
- FoodStall replaces direct Obstacle usage in Simulation
