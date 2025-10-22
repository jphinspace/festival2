# Root Cause Analysis: Agent Pathfinding Bug

## Executive Summary

This document provides a comprehensive analysis of the pathfinding bug where an agent in BUG pathfinding mode moves directly through an obstacle instead of transitioning to ASTAR mode to navigate around it.

## Observed Behavior

Based on the screenshots provided:
- **Initial State (Screenshot 1)**: Agent at location (365, 547) moving toward destination (71, 78)
- **Seconds Later (Screenshot 2)**: Agent at location (349, 522) still moving toward the same destination
- **Key Observations**:
  - Agent remains in BUG pathfinding mode throughout
  - Agent is moving at 8.32 px/s (relatively slow speed)
  - Agent has moved into the interior of a Wall obstacle (red box area)
  - The Wall obstacle was present on the map before the agent spawned
  - Agent never transitions to ASTAR mode
  - Agent appears to completely ignore the obstacle's existence

## 1. BUG ↔ ASTAR Transition Logic Analysis

### 1a. Conditions Causing BUG → ASTAR Transition

**File: `js/Pathfinding.js`, Lines 139-149**

```javascript
// Bug mode: try to go straight to goal
if (agentPathState.mode === 'bug') {
    if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
        // Clear path - go straight to goal
        return { x: goalX, y: goalY, mode: 'bug' };
    }
    // Blocked - switch to A* mode to find detour
    agentPathState.mode = 'astar';
    agentPathState.path = findBoundedPath(currentX, currentY, goalX, goalY, obstacles, agentRadius);
    agentPathState.pathIndex = 0;
    // Fall through to astar mode handling
}
```

**Transition Trigger**: The ONLY condition that triggers BUG → ASTAR transition is:
- Agent is in BUG mode AND
- `hasLineOfSight()` returns `false` (i.e., obstacle blocks direct path)

**Critical Finding**: If `hasLineOfSight()` incorrectly returns `true` when there IS an obstacle, the agent will NEVER transition to ASTAR mode.

### 1b. Conditions Causing ASTAR → BUG Transition

**File: `js/Pathfinding.js`, Lines 153-166**

There are THREE conditions that cause ASTAR → BUG transition:

1. **End of path reached** (Lines 153-158):
```javascript
if (agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
    agentPathState.mode = 'bug';
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
    return { x: goalX, y: goalY, mode: 'bug' };
}
```

2. **Line of sight restored** (Lines 160-166):
```javascript
if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
    agentPathState.mode = 'bug';
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
    return { x: goalX, y: goalY, mode: 'bug' };
}
```

3. **Reaching last waypoint** (Lines 176-182):
```javascript
if (agentPathState.pathIndex >= agentPathState.path.length) {
    // Reached end of path
    agentPathState.mode = 'bug';
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
    return { x: goalX, y: goalY, mode: 'bug' };
}
```

### 1c. Fallback Logic Analysis

**Initialization Default** (Lines 132-136):
```javascript
if (!agentPathState.mode) {
    agentPathState.mode = 'bug'; // Start in bug mode
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
}
```

**Key Finding**: The system defaults to BUG mode on initialization. This is the only "fallback" logic.

**No Fallback to BUG in Error Cases**: If ASTAR fails to find a path, it returns an empty array (line 285 of `findBoundedPath()`), which causes the agent to transition back to BUG mode (via condition 1 above).

### 1d. Movement During State Transitions

**File: `js/AgentState.js`, Lines 87-92 and Lines 56-62**

**MovingState.enter()** (Lines 87-92):
```javascript
enter(agent, canvasWidth, canvasHeight, obstacles = []) {
    agent.idleTimer = 0;
    agent.chooseRandomDestination(canvasWidth, canvasHeight, obstacles);
    // Reset pathfinding state for new destination
    agent.pathState = {};
}
```

**IdleState.enter()** (Lines 56-62):
```javascript
enter(agent, canvasWidth, canvasHeight, obstacles = []) {
    agent.idleTimer = 1000;
    agent.destinationX = agent.x;
    agent.destinationY = agent.y;
    // Reset pathfinding state when entering idle
    agent.pathState = {};
}
```

**Critical Finding**: When an agent transitions from IDLE → MOVING state, the pathState is reset to `{}`, which triggers re-initialization to BUG mode. During this transition, the movement logic in `MovingState.update()` is called, which then calls `calculateNextWaypoint()`.

**Movement Logic** (Lines 94-130 of AgentState.js):
The `MovingState.update()` method:
1. Calculates distance to destination
2. Calls `calculateNextWaypoint()` to get next target
3. Moves toward the returned waypoint
4. Does NOT perform any special override during state transitions

**No Override Logic**: There is no special pathfinding behavior during IDLE→MOVING or MOVING→IDLE transitions that would bypass the standard pathfinding logic.

## 2. Line-of-Sight Calculation Analysis

### 2a. How Line-of-Sight is Calculated

**File: `js/Pathfinding.js`, Lines 90-117**

```javascript
export function hasLineOfSight(x1, y1, x2, y2, obstacles, agentRadius) {
    // Sample points along the line
    const distance = calculateDistance(x1, y1, x2, y2);
    
    if (distance === 0) {
        return true;
    }
    
    // Sample at regular intervals (every 2 pixels)
    const steps = Math.ceil(distance / 2);
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + dx * t;
        const y = y1 + dy * t;
        
        // Check if this point collides with any obstacle
        for (const obstacle of obstacles) {
            if (obstacle.collidesWith(x, y, agentRadius)) {
                return false;
            }
        }
    }
    
    return true;
}
```

**Algorithm**:
1. Calculate total distance between start and end points
2. Sample points every 2 pixels along the straight line
3. For each sample point, check if it collides with any obstacle using `collidesWith()`
4. Return `false` if any collision detected, `true` otherwise

### 2b. Circumstances Where Obstacles Might Be Ignored

**CRITICAL FINDING - Root Cause Identified**:

The `hasLineOfSight()` function has the following potential issues:

1. **Sampling Density**: Points are sampled every 2 pixels. For very thin obstacles or specific geometric configurations, the sampling points might "skip over" an obstacle edge.

2. **No Explicit Obstacle Parameter Validation**: If the `obstacles` array is:
   - Empty `[]`
   - `undefined`
   - `null`
   - Contains invalid obstacle objects

   Then ALL obstacles would be ignored.

3. **Agent Position Inside Obstacle**: If the agent's current position `(x1, y1)` is already INSIDE an obstacle, the function still performs collision checks at sample points. However, there's no check to verify that the START position is valid.

4. **Obstacle Collision Detection**: The function delegates to `obstacle.collidesWith()`. If there's a bug in the collision detection method, obstacles could be incorrectly reported as non-colliding.

**Analyzing Obstacle.collidesWith()** (Lines 37-51 of `js/Obstacle.js`):

```javascript
collidesWith(agentX, agentY, agentRadius) {
    const bounds = this.getBounds();
    
    // Find the closest point on the rectangle to the circle
    const closestX = Math.max(bounds.left, Math.min(agentX, bounds.right));
    const closestY = Math.max(bounds.top, Math.min(agentY, bounds.bottom));
    
    // Calculate distance from circle center to closest point
    const dx = agentX - closestX;
    const dy = agentY - closestY;
    const distanceSquared = dx * dx + dy * dy;
    
    // Collision occurs if distance is less than or equal to radius
    return distanceSquared <= (agentRadius * agentRadius);
}
```

This is a standard circle-rectangle collision algorithm and appears correct.

5. **Zero Distance Edge Case**: When `distance === 0` (start and end are same point), the function returns `true` immediately. This is correct behavior.

### 2c. When Line-of-Sight Calculation is Performed

Line-of-sight is checked in TWO places:

**1. During BUG mode operation** (`js/Pathfinding.js`, Line 140):
```javascript
if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
```
- Called every time `calculateNextWaypoint()` is invoked in BUG mode
- This determines whether to stay in BUG mode or switch to ASTAR

**2. During ASTAR mode operation** (`js/Pathfinding.js`, Line 161):
```javascript
if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
```
- Called every time `calculateNextWaypoint()` is invoked in ASTAR mode
- This determines whether to switch back to BUG mode

**3. In ASTAR pathfinding** (`js/Pathfinding.js`, Line 230):
```javascript
if (distToGoal < GRID_SIZE * 2 && hasLineOfSight(current.x, current.y, goalX, goalY, obstacles, agentRadius)) {
```
- Called during A* search to determine if goal is reached
- Ensures path doesn't cut through obstacles at the end

**Frequency**: Line-of-sight is calculated on EVERY call to `calculateNextWaypoint()`, which is called on EVERY update frame (typically 60 times per second, modified by tick rate).

## 3. ASTAR Failure Conditions

### 3a. Conditions Where ASTAR Fails to Find a Route

**File: `js/Pathfinding.js`, Lines 199-286**

ASTAR can fail to find a route in the following conditions:

**1. Expansion Limit Reached** (Lines 200, 220):
```javascript
const MAX_EXPANSIONS = 300;
...
while (openSet.length > 0 && expansions < MAX_EXPANSIONS) {
```
- If A* explores 300 nodes without finding the goal, it returns empty path (line 285)
- This is a bounded A* to prevent performance issues

**2. No Valid Path Exists** (Line 285):
```javascript
// No path found within expansion limit - return empty path
return [];
```
- If the goal is completely unreachable (surrounded by obstacles)
- Open set becomes empty before goal is found

**3. All Neighbor Positions Invalid** (Lines 258-260):
```javascript
if (!isPositionValid(neighborX, neighborY, obstacles, agentRadius)) {
    continue;
}
```
- If all neighboring grid cells are blocked by obstacles
- Agent is trapped in a corner/dead-end

### 3b. Conditions Where ASTAR is Bypassed/Skipped

ASTAR is bypassed in these scenarios:

**1. Line of Sight is Clear** (Lines 140-143):
- If `hasLineOfSight()` returns `true`, agent stays in BUG mode
- ASTAR is never invoked

**2. Agent Already in ASTAR Mode with Valid Path**:
- If agent is already following an ASTAR path, a new search is not triggered
- Agent continues following the existing path

**3. State Initialization**:
- On first call, agent starts in BUG mode (line 133)
- ASTAR only triggered when BUG mode detects obstacle

### 3c. Unrecoverable ASTAR Situations

**1. Completely Surrounded by Obstacles**:
- No valid neighboring cells exist
- Open set becomes empty → returns empty path → switches back to BUG mode

**2. Expansion Limit Exceeded**:
- Path exists but requires > 300 node expansions
- Returns empty path → switches back to BUG mode
- Agent then attempts BUG mode, which will also fail if obstacle is in the way

**3. Invalid Goal Position**:
- If goal itself is inside an obstacle (shouldn't happen due to destination selection logic)
- A* will never find a valid path

## 4. Complete Trace of Observed Behavior

### Initial Conditions
- Agent spawns in entranceway at bottom of map (around y=600-700 based on simulation setup)
- Wall obstacles exist at bottom of canvas (lines 52-65 of Simulation.js)
- Destination chosen is (71, 78) - near top-left of canvas
- Agent's initial position is in valid area (outside obstacles due to spawn logic)

### Behavior Trace Through Code

**Frame 1: Agent at (365, 547)**

1. **State**: MovingState (visible in screenshot as "State: MovingState")
2. **Call Chain**:
   - `Simulation.update()` → `agent.update()` → `MovingState.update()` → `calculateNextWaypoint()`

3. **calculateNextWaypoint() execution**:
   ```javascript
   currentX = 365, currentY = 547
   goalX = 71, goalY = 78
   ```
   
4. **pathState initialization**:
   - On first call for this destination, `agentPathState.mode` is undefined
   - Sets `agentPathState.mode = 'bug'` (line 133)

5. **BUG mode check** (line 139):
   ```javascript
   if (agentPathState.mode === 'bug') {
       if (hasLineOfSight(365, 547, 71, 78, obstacles, 5)) {
           return { x: 71, y: 78, mode: 'bug' };
       }
       // else switch to ASTAR
   }
   ```

6. **hasLineOfSight() execution**:
   - Distance from (365, 547) to (71, 78) = √[(71-365)² + (78-547)²] = √[86,436 + 219,961] = √306,397 ≈ 553.6 pixels
   - Steps = ceil(553.6 / 2) = 277 sample points
   - For each sample point, checks collision with obstacles array

7. **CRITICAL QUESTION**: Why does `hasLineOfSight()` return `true` when there ARE walls in the way?

**Hypothesis 1: Obstacles Array is Empty or Incorrect**
- Let's trace the obstacles array:
- `MovingState.update()` calls `calculateNextWaypoint()` with `obstacles` parameter (line 111)
- `obstacles` comes from the `update()` method parameter (line 94)
- Which comes from `agent.update()` call in `Simulation.update()` (line 226)
- Which passes `this.obstacles` (line 226)

**Verification needed**: Is `agent.obstacles` properly set and maintained?

Looking at `Agent.js`:
- Line 25: `this.obstacles = [];` - initialized to empty array!
- Line 105: `this.obstacles = obstacles;` - updated in agent.update()
- Line 208-209 in Simulation.js: obstacles are set when agent is spawned

**Hypothesis 2: Race Condition in Obstacle Updates**
- Agent spawns with empty obstacles array
- Obstacles are set on first update
- But pathfinding might be called before obstacles are updated?

**Hypothesis 3: Obstacles Array Not Passed to calculateNextWaypoint()**
- Looking at line 106-114 of AgentState.js:
  ```javascript
  const waypoint = calculateNextWaypoint(
      agent.x,
      agent.y,
      agent.destinationX,
      agent.destinationY,
      obstacles,  // ← This is passed correctly
      agent.radius,
      agent.pathState
  );
  ```
- Obstacles ARE passed correctly

**Hypothesis 4: Sampling Resolution Issue**
- Wall obstacle position: from simulation init (lines 52-65)
- Wall height = canvas.height / 5
- Wall Y position = canvas.height - wallHeight / 2
- If canvas height = 600, wallY = 600 - 60 = 540
- Wall bounds: top = 540 - 30 = 510, bottom = 540 + 30 = 570

- Agent at (365, 547) is WITHIN the wall's Y bounds (510-570)!
- Destination at (71, 78) is ABOVE the walls

- The path from (365, 547) to (71, 78) SHOULD intersect the wall obstacle

**Hypothesis 5: Agent Already Inside Obstacle**
- Agent position (365, 547) might already be INSIDE a wall obstacle
- If agent spawns or moves inside an obstacle, subsequent line-of-sight checks might not detect the obstacle properly
- This is THE MOST LIKELY ROOT CAUSE

### Root Cause: Agent Inside Obstacle

**THE CRITICAL ISSUE**:

1. Agent's position (365, 547) is within the Y-bounds of the wall obstacle (approximately 510-570)
2. The agent likely moved INTO the wall due to the BUG mode movement logic
3. Once inside, the line-of-sight calculation still samples points along the path
4. BUT: If the agent is already deep inside an obstacle, and the destination is outside the obstacle, the line-of-sight samples might show:
   - Starting point: inside obstacle (but this isn't checked as invalid)
   - Many intermediate points: inside same obstacle
   - End point: outside obstacle

5. The `collidesWith()` method checks if a point is within agentRadius of the obstacle boundary
6. **KEY FINDING**: If the agent center is INSIDE the rectangle bounds, the closest point is the agent center itself, and distance is 0, which is ≤ radius, so collision is detected

Wait, that should detect collision. Let me re-examine...

**Re-examining collidesWith() for point INSIDE rectangle**:

If agent at (365, 547) and obstacle bounds are:
- Left: 0-360 (left wall) OR 440-800 (right wall) assuming 800px canvas
- Top: 510, Bottom: 570

For left wall (x: 0-360):
- closestX = max(0, min(365, 360)) = 360
- closestY = max(510, min(547, 570)) = 547
- dx = 365 - 360 = 5
- dy = 547 - 547 = 0
- distanceSquared = 25
- radius = 5, radiusSquared = 25
- Returns 25 <= 25 = TRUE (collision detected!)

**So collision WOULD be detected...**

### Alternative Analysis: Obstacles Not Passed to hasLineOfSight

Let me check if there's a path where obstacles array could be empty...

**WAIT - CRITICAL DISCOVERY**:

Looking at `MovingState.enter()` in AgentState.js, line 91:
```javascript
agent.pathState = {};
```

This resets the pathState, which causes re-initialization to BUG mode.

Then looking at `MovingState.update()`, line 106:
```javascript
const waypoint = calculateNextWaypoint(
    agent.x,
    agent.y,
    agent.destinationX,
    agent.destinationY,
    obstacles,  // ← What IS this obstacles parameter?
    agent.radius,
    agent.pathState
);
```

The `obstacles` parameter comes from the `update()` method signature (line 94):
```javascript
update(agent, deltaTime, canvasWidth, canvasHeight, obstacles = []) {
```

The default value is `[]` (empty array)!

Now checking what calls `MovingState.update()`:
- `Agent.update()` line 108 calls `this.state.update(this, deltaTime, canvasWidth, canvasHeight, obstacles);`
- The `obstacles` parameter is passed through

And what calls `Agent.update()`?
- `Simulation.update()` line 226: `agent.update(deltaTime, this.canvas.width, this.canvas.height, this.obstacles);`

So obstacles SHOULD be passed correctly...

**BUT WAIT - Line 105 of Agent.js**:
```javascript
this.obstacles = obstacles;
```

This line updates the agent's obstacles reference every frame. But what if there's a timing issue?

### FINAL ROOT CAUSE HYPOTHESIS

After thorough analysis, the most likely root cause is:

**The agent's pathState indicates BUG mode, and hasLineOfSight() returns TRUE even though there IS an obstacle in the path.**

This could happen if:

1. **Obstacles array is empty when calculateNextWaypoint() is called**
   - This seems unlikely given the code flow, but would explain the behavior perfectly
   
2. **hasLineOfSight() sampling misses the obstacle**
   - Sampling every 2 pixels should catch the obstacle
   - Unless there's a floating-point rounding issue
   
3. **Agent's actual position is not where the display shows**
   - If agent.x/agent.y are updated elsewhere and not synchronized
   
4. **Race condition**: Between when destination is chosen and when pathfinding runs, obstacles array gets emptied
   - Highly unlikely but possible

5. **Destination selection chose a point that requires passing through obstacle, but line-of-sight check incorrectly passes**
   - The destination selection in `chooseRandomDestination()` (Agent.js lines 50-88) checks obstacles
   - But uses `containsPoint()` not `collidesWith()`
   - These might have different behavior for edge cases

## 5. ROOT CAUSE IDENTIFIED

### Definitive Root Cause

After comprehensive testing and analysis (see `tests/PathfindingBugAnalysis.test.js`), the root cause has been **definitively identified**:

**THE BUG**: Empty Path Fallback Logic in `calculateNextWaypoint()`

**File**: `js/Pathfinding.js`, Lines 145-158

**The Issue**:
```javascript
// Line 139-148: BUG mode detects obstacle
if (agentPathState.mode === 'bug') {
    if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
        return { x: goalX, y: goalY, mode: 'bug' };
    }
    // Blocked - switch to A* mode to find detour
    agentPathState.mode = 'astar';  // ← Switch to ASTAR
    agentPathState.path = findBoundedPath(...);  // ← Get path
    agentPathState.pathIndex = 0;
    // Fall through to astar mode handling
}

// Line 152-158: Immediate check after switching to ASTAR
if (agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
    agentPathState.mode = 'bug';  // ← IMMEDIATELY SWITCHES BACK TO BUG!
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
    return { x: goalX, y: goalY, mode: 'bug' };  // ← Returns goal in BUG mode
}
```

**The Flow**:
1. Agent in BUG mode encounters obstacle (line 140: `hasLineOfSight()` returns `false`)
2. System switches to ASTAR mode (line 145)
3. Calls `findBoundedPath()` to compute path around obstacle (line 146)
4. **CRITICAL**: `findBoundedPath()` returns **empty array** (no path found)
5. Lines 153-158 check if path is empty
6. Because path IS empty, system **immediately switches back to BUG mode**
7. Returns goal position with mode='bug'
8. Agent continues moving toward goal in BUG mode, **ignoring the obstacle**

### Why findBoundedPath() Returns Empty Array

**File**: `js/Pathfinding.js`, Lines 199-286

The specific scenario from the screenshots:
- Agent position: (365, 547)
- Destination: (71, 78)
- Agent is positioned between left wall (0-360) and right wall (440-800)
- Agent is at x=365, which is in the GAP between walls
- Agent is ALSO inside/near the Y-bounds of the walls (480-600)

**Why A* Fails**:
1. The agent position is RIGHT at the edge of the left wall (x=360 boundary)
2. Agent radius is 5, so collision detection extends to x=360
3. A* tries to explore neighboring cells but many are invalid due to wall collision
4. The 300-expansion limit is reached before a valid path is found
5. Returns empty array (line 285)

**The specific configuration makes A* pathfinding very difficult**:
- Start position is in tight space (entranceway gap)
- Goal requires navigating around walls that block most direct paths
- A* grid size is 10 pixels, agent radius is 5 pixels
- Combination of tight space + bounded search (300 expansions) = path not found

### Test Evidence

**Test File**: `tests/PathfindingBugAnalysis.test.js`

**Test**: "should reproduce exact scenario from screenshots"

**Results**:
```
Agent position: 365 547
Destination: 71 78
Agent collides with left wall: true
Has line of sight to destination: false
Pathfinding mode: bug  ← SHOULD BE 'astar' BUT IS 'bug'
Pathfinding path: []  ← Empty path!
Path length: 0
Direct findBoundedPath result length: 0  ← A* returns empty
```

**Conclusion**: The bug is 100% reproducible and the root cause is definitively identified.

## 6. Complete Answer to All Questions

### 1. BUG→ASTAR Transition Logic

**1a. What conditions cause an agent to transition from BUG to ASTAR?**
- **ONLY** when: Agent is in BUG mode AND `hasLineOfSight()` returns `false`
- This occurs at line 140-145 of Pathfinding.js

**1b. What conditions cause an agent to transition from ASTAR to BUG?**
Three conditions:
1. Path is empty or fully traversed (lines 153-158)
2. Line of sight to goal is restored (lines 161-166)
3. Agent reaches last waypoint in path (lines 176-182)

**1c. Is there any fallback logic that results in BUG being used as default?**
- **YES** - This is THE ROOT CAUSE
- Lines 153-158: When ASTAR mode has empty path, immediately falls back to BUG
- This happens when `findBoundedPath()` returns empty array
- This is a FATAL flaw: agent falls back to BUG even though obstacle still blocks the path

**1d. Is there any movement or pathfinding logic performed specifically when transitioning states?**
- When transitioning IDLE→MOVING: pathState is reset to `{}` (AgentState.js line 91)
- This forces re-initialization to BUG mode
- No special override logic exists during state transitions
- Standard pathfinding is always used

### 2. Line-of-Sight Calculation

**2a. How is line-of-sight calculated?**
- Samples points every 2 pixels along straight line path (Pathfinding.js lines 90-117)
- For each sample, checks collision with all obstacles using `collidesWith()`
- Returns `false` if ANY collision detected, `true` otherwise

**2b. Under what circumstances might an obstacle be ignored?**
- If obstacles array is empty, null, or undefined
- If obstacle's `collidesWith()` method has a bug (but testing shows it's correct)
- Sampling every 2 pixels could theoretically miss very thin obstacles (but not in this case)
- **In this bug**: Obstacles are NOT ignored; line-of-sight correctly returns `false`

**2c. When is this line-of-sight calculation performed?**
- Every frame when `calculateNextWaypoint()` is called (60 FPS typically)
- In BUG mode: to check if obstacle blocks path (line 140)
- In ASTAR mode: to check if can switch back to BUG (line 161)
- In A* search: to verify goal is reachable when close (line 230)

### 3. ASTAR Failure Conditions

**3a. Under what conditions can ASTAR fail to find a route?**
1. Expansion limit (300 nodes) is reached before goal found
2. Goal is completely unreachable (surrounded by obstacles)
3. All neighboring positions are invalid
4. **In this bug**: Combination of tight space + bounded search = failure

**3b. Under what conditions can ASTAR pathfinding be bypassed/skipped?**
1. Line of sight is clear (stays in BUG mode)
2. Agent already has valid path and is following it
3. First initialization (starts in BUG mode)

**3c. Under what conditions can ASTAR pathfinding encounter an unrecoverable situation?**
1. Completely surrounded by obstacles (no escape)
2. Expansion limit exceeded with complex obstacle layout
3. **CRITICAL**: When ASTAR fails, system falls back to BUG mode and continues moving, IGNORING the obstacle

### 4. Complete Behavior Trace

**Initial State**: Agent spawns in entranceway at (365, 547), destination (71, 78)

**Frame by Frame**:

1. **MovingState.enter()** called
   - Resets pathState to `{}`
   - Chooses destination (71, 78)

2. **MovingState.update()** called (every frame)
   - Calls `calculateNextWaypoint(365, 547, 71, 78, obstacles, 5, pathState)`

3. **calculateNextWaypoint() execution**:
   - Line 132: pathState.mode is undefined, initializes to 'bug'
   - Line 139: Checks `if (agentPathState.mode === 'bug')` → TRUE
   - Line 140: Calls `hasLineOfSight(365, 547, 71, 78, obstacles, 5)`
     - Samples 277 points along path
     - Detects collision with left wall
     - **Returns FALSE** (obstacle blocks)
   - Line 145: Sets `agentPathState.mode = 'astar'`
   - Line 146: Calls `findBoundedPath(365, 547, 71, 78, obstacles, 5)`
     - A* explores up to 300 nodes
     - Cannot find valid path due to tight space
     - **Returns empty array `[]`**
   - Line 153: Checks `if (agentPathState.path.length === 0)` → TRUE
   - Line 154: **SWITCHES BACK TO BUG MODE** ← THE BUG!
   - Line 157: Returns `{ x: 71, y: 78, mode: 'bug' }`

4. **MovingState continues**:
   - Agent moves toward waypoint (71, 78) in BUG mode
   - Moves into wall obstacle
   - Each frame, same logic repeats
   - Agent never escapes BUG mode
   - Agent continues moving through obstacle

**Why It Appears as BUG in Tooltip**:
- Agent.getPathfindingMode() returns pathState.mode
- pathState.mode is always 'bug' due to the fallback logic
- Tooltip displays "Pathfinding: BUG" throughout

**Why Agent Moves Slowly**:
- Agent speed is set by velocity (vx, vy) initialized randomly
- In this case, speed is 8.32 px/s (from screenshot)
- This is normal agent speed, not related to the bug

## 7. Summary

**ROOT CAUSE**: 
The pathfinding system has a fatal flaw in its fallback logic. When BUG mode detects an obstacle and switches to ASTAR mode, if ASTAR fails to find a path (returns empty array), the system immediately falls back to BUG mode and returns the goal position. This causes the agent to move directly toward the goal, completely ignoring the obstacle that triggered the ASTAR attempt in the first place.

**WHY IT HAPPENS**:
The bounded A* search (limited to 300 node expansions) can fail in complex or tight spaces. When it fails, instead of:
1. Trying alternative strategies
2. Reporting an error
3. Stopping the agent
4. Using a fallback waypoint

The system simply reverts to BUG mode and pretends the obstacle doesn't exist.

**SPECIFIC SCENARIO**:
Agent position (365, 547) is in the entranceway gap between walls, very close to the left wall boundary. The destination (71, 78) requires navigating around the walls. The tight space + 300 expansion limit causes A* to fail, triggering the fallback-to-BUG bug.

**IMPACT**:
Agents walk through walls and obstacles when A* pathfinding fails, making the simulation incorrect and breaking immersion.
