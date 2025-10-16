# Analysis of Idle Agent Obstacle Issue (as of commit 95d5119)

## Problem Statement
Agents walking through idle agents despite idle agents being DynamicObstacles.

## Code Flow Analysis

### Current Implementation (commit 95d5119)

#### 1. Simulation.update() - Line 165-172
```javascript
for (const agent of this.agents) {
    agent.obstacles = this.obstacles;  // Line 166: Sets to STATIC obstacles only
    agent.specialMovementZones = this.specialMovementZones;
    
    // Line 170: Creates allObstacles including other agents as dynamic obstacles
    const allObstacles = [...this.obstacles, ...this.agents.filter(a => a !== agent)];
    
    // Line 172: Passes allObstacles to agent.update()
    agent.update(deltaTime, this.canvas.width, this.canvas.height, allObstacles);
}
```

#### 2. Agent.update() - Line 109-114
```javascript
update(deltaTime, canvasWidth, canvasHeight, obstacles = []) {
    // Line 111: Updates this.obstacles with the obstacles parameter (includes agents)
    this.obstacles = obstacles;
    
    // Line 114: Delegates to state.update(), passing obstacles (includes agents)
    this.state.update(this, deltaTime, canvasWidth, canvasHeight, obstacles);
    ...
}
```

#### 3. MovingState.update() - Line 97-134
```javascript
update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
    ...
    // Line 109-117: Pathfinding receives obstacles parameter (should include agents)
    const waypoint = calculateNextWaypoint(
        agent.x,
        agent.y,
        agent.destinationX,
        agent.destinationY,
        obstacles,  // <-- This should include idle agents
        agent.radius,
        agent.pathState
    );
    ...
}
```

## Analysis Result

**The code appears correct**: Idle agents ARE being passed as obstacles to the pathfinding algorithm.

### Trace for Moving Agent encountering Idle Agent:
1. Simulation passes `allObstacles = [...this.obstacles, ...agents]` to agent.update()
2. Agent.update() receives obstacles including idle agents
3. Agent.update() passes obstacles to MovingState.update()
4. MovingState.update() passes obstacles to calculateNextWaypoint()
5. Pathfinding algorithm receives idle agents as obstacles

### Trace for Idle->Moving State Transition:
1. Agent in IdleState, Simulation.update() sets `agent.obstacles = this.obstacles` (static only)
2. Simulation.update() calls `agent.update(..., allObstacles)` (includes agents)
3. Agent.update() sets `this.obstacles = obstacles` (now includes agents)
4. IdleState.update() calls `agent.transitionTo(new MovingState(), ...)`
5. transitionTo() calls `this.state.enter(this, ..., this.obstacles)` (includes agents at this point)
6. MovingState.enter() filters to static obstacles for destination selection (correct behavior)

## Hypothesis

The issue may not be with passing obstacles to pathfinding, but could be:

1. **Pathfinding algorithm issue**: The algorithm might not be effective at avoiding dynamic obstacles
2. **Movement implementation**: Agents move directly towards waypoints without checking collisions
3. **Timing issue**: Agents update in sequence, so early agents see old positions of later agents
4. **Missing somewhere**: There might be another code path I haven't identified

## Potential Issue Found

Looking at Line 166 in Simulation.js:
```javascript
agent.obstacles = this.obstacles;
```

This line sets `agent.obstacles` to only static obstacles. While this gets overwritten in Agent.update() line 111, this line seems unnecessary and potentially confusing. However, it shouldn't cause the reported issue since Agent.update() correctly updates it.

## Recommendation

Need to verify if pathfinding is actually receiving and using idle agents as obstacles. The code flow suggests it should be working, so the issue might be:
1. The pathfinding algorithm itself needs improvement
2. Need collision checking before movement (which was in the reverted commit)
3. Some other code path not yet identified
