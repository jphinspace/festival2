# Pathfinding Bug - All Questions Answered

This document provides direct answers to all questions from the issue.

---

## 1. BUG→ASTAR Transition Logic

### 1a. What conditions cause an agent to transition from BUG to ASTAR?

**Answer**: Only ONE condition triggers BUG → ASTAR transition:

- Agent is in BUG mode (pathState.mode === 'bug')
- AND `hasLineOfSight()` returns `false` (obstacle blocks direct path to goal)

**Code Location**: `js/Pathfinding.js`, lines 139-148

**Code**:
```javascript
if (agentPathState.mode === 'bug') {
    if (hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)) {
        return { x: goalX, y: goalY, mode: 'bug' };
    }
    // Blocked - switch to A* mode to find detour
    agentPathState.mode = 'astar';
    ...
}
```

**Frequency**: Checked every frame (60 FPS) when agent is moving

---

### 1b. What conditions cause an agent to transition from ASTAR to BUG?

**Answer**: THREE conditions trigger ASTAR → BUG transition:

**Condition 1**: Path is empty or fully traversed  
**Location**: Lines 153-158  
**Trigger**: `agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length`

**Condition 2**: Line of sight to goal restored  
**Location**: Lines 161-166  
**Trigger**: `hasLineOfSight(currentX, currentY, goalX, goalY, obstacles, agentRadius)` returns `true`

**Condition 3**: Agent reaches final waypoint  
**Location**: Lines 176-182  
**Trigger**: `agentPathState.pathIndex >= agentPathState.path.length` after advancing waypoint

---

### 1c. Is there any fallback logic that results in BUG being used as default? What conditions would trigger fallback logic?

**Answer**: YES - This is the ROOT CAUSE of the bug.

**Fallback 1**: Initialization default (lines 132-136)
- **When**: First call to `calculateNextWaypoint()` with empty pathState
- **Result**: `pathState.mode = 'bug'`
- **This is normal behavior**

**Fallback 2**: Empty path after ASTAR (lines 153-158) ← **THE BUG**
- **When**: Agent switches to ASTAR mode but `findBoundedPath()` returns empty array
- **Result**: Immediately switches back to `mode = 'bug'`
- **Problem**: Returns goal position in BUG mode, causing agent to move through obstacle
- **This is the bug causing agents to walk through walls**

**Triggering Conditions**:
1. Agent encounters obstacle (no line of sight)
2. Switches to ASTAR mode
3. `findBoundedPath()` fails (returns `[]`)
4. Empty path triggers fallback to BUG
5. Agent moves toward goal ignoring obstacle

**Why findBoundedPath() Returns Empty**:
- Bounded search limited to 300 node expansions
- Complex obstacle layouts or tight spaces exceed this limit
- No path found within expansion budget
- Returns empty array

---

### 1d. Is there any movement or pathfinding logic performed specifically when an agent is transitioning their state (eg IDLE/MOVING) that would override the standard pathfinding behavior?

**Answer**: NO, there is no special override logic during state transitions.

**What DOES happen during IDLE → MOVING**:
- `MovingState.enter()` is called (AgentState.js line 87-92)
- `agent.pathState = {}` (line 91) - resets pathfinding state
- `chooseRandomDestination()` is called (line 89)
- This reset causes pathState.mode to be undefined
- Next `calculateNextWaypoint()` call re-initializes to BUG mode

**What DOES NOT happen**:
- No special movement rules during transitions
- No pathfinding bypass or override
- Standard pathfinding logic (`calculateNextWaypoint()`) is always used
- State transitions don't affect obstacle detection or avoidance

**Movement Logic**: 
- `MovingState.update()` (lines 94-130) calls `calculateNextWaypoint()` every frame
- Uses returned waypoint as movement target
- No difference in behavior during vs. after state transitions

---

## 2. Line-of-Sight Calculation

### 2a. How is line-of-sight calculated?

**Answer**: Ray-casting with discrete sampling

**Algorithm** (`js/Pathfinding.js`, lines 90-117):

1. Calculate total distance between start (x1, y1) and end (x2, y2)
2. If distance is 0, return `true` immediately
3. Divide path into segments of 2 pixels each: `steps = Math.ceil(distance / 2)`
4. For each sample point along the line:
   - Calculate position: `x = x1 + dx * (i/steps)`, `y = y1 + dy * (i/steps)`
   - Check collision with ALL obstacles using `obstacle.collidesWith(x, y, agentRadius)`
   - If ANY collision detected, return `false`
5. If all samples pass, return `true`

**Example**: 
- Distance 100 pixels → 50 sample points
- Distance 553 pixels → 277 sample points (actual bug scenario)

**Collision Check**:
- Uses `Obstacle.collidesWith()` (Obstacle.js lines 37-51)
- Circle-rectangle collision using closest-point algorithm
- Accounts for agent radius

---

### 2b. Under what circumstances might an obstacle be ignored while computing line of sight?

**Answer**: Several theoretical scenarios, but NONE are the cause of this bug.

**Theoretical Scenarios**:

1. **Empty obstacles array**
   - If `obstacles = []`, no collisions detected
   - NOT the cause: Test confirms obstacles array is populated

2. **Sampling gaps** (very unlikely)
   - 2-pixel sampling might miss extremely thin obstacles
   - NOT the cause: Walls are 120 pixels tall, impossible to miss

3. **Floating-point precision**
   - Rounding errors in sample positions
   - NOT the cause: 2-pixel resolution is more than adequate

4. **Obstacle collision bug**
   - If `collidesWith()` had a bug
   - NOT the cause: Collision detection tested and working correctly

5. **Start position inside obstacle**
   - Line-of-sight doesn't validate starting position
   - Could contribute to issue but NOT root cause

**ACTUAL BUG**: Line-of-sight works CORRECTLY. The bug occurs in the fallback logic AFTER line-of-sight correctly detects the obstacle.

**Test Evidence**: 
```
Test: "should fail line-of-sight check through wall obstacle"
Line of sight result: false  ← CORRECTLY detects obstacle
Expected: false (obstacle blocks path)  ← PASSES
```

---

### 2c. When is this line-of-sight calculation performed?

**Answer**: Line-of-sight is calculated in THREE places:

**Location 1**: BUG mode check (Pathfinding.js line 140)
- **When**: Every frame while agent is in BUG mode
- **Purpose**: Determine if obstacle blocks path
- **Result**: If blocked, switch to ASTAR mode

**Location 2**: ASTAR mode check (Pathfinding.js line 161)
- **When**: Every frame while agent is in ASTAR mode
- **Purpose**: Check if line-of-sight restored (can switch back to BUG)
- **Result**: If clear, switch to BUG mode

**Location 3**: A* goal check (Pathfinding.js line 230)
- **When**: During A* search when node is close to goal
- **Purpose**: Verify goal is reachable before declaring path complete
- **Result**: If clear, reconstruct and return path

**Frequency**: 
- 60 times per second per moving agent (assuming 60 FPS)
- With 100 agents: 6,000 line-of-sight checks per second
- At 1.0x speed: 1000 ticks/second = ~1000 checks/sec per agent

**Performance**:
- Each check samples distance/2 points
- Average distance 500px = 250 samples
- Each sample checks all obstacles
- With 6 obstacles: 250 × 6 = 1,500 collision checks per line-of-sight

---

## 3. ASTAR Failure Conditions

### 3a. Under what conditions can ASTAR fail to find a route?

**Answer**: FOUR failure conditions:

**Condition 1**: Expansion limit exceeded
- **Limit**: 300 node expansions (Pathfinding.js line 200)
- **Occurs**: Complex obstacle layouts requiring > 300 nodes to explore
- **Result**: Returns empty array (line 285)
- **Example**: Tight spaces, mazes, distant goals through narrow gaps

**Condition 2**: Goal completely unreachable
- **Occurs**: Goal surrounded by obstacles with no valid path
- **Result**: Open set becomes empty, returns empty array
- **Example**: Goal inside wall, island blocked by obstacles

**Condition 3**: All neighbors invalid
- **Occurs**: Every neighboring grid cell collides with obstacles
- **Result**: Current node has no valid successors, search terminates
- **Example**: Agent in corner, dead-end

**Condition 4**: Start position invalid
- **Occurs**: Start position itself is inside obstacle
- **Result**: May find no valid neighbors, or find invalid path
- **Example**: Agent spawned inside obstacle, agent moved into obstacle

**In the Bug Scenario**:
- Agent at (365, 547) - very close to left wall edge at x=360
- Destination at (71, 78) - requires complex navigation around walls
- Tight entranceway space + 300 expansion limit = Condition 1 triggered
- A* returns empty array
- System falls back to BUG mode (THE BUG)

---

### 3b. Under what conditions can ASTAR pathfinding be bypassed/skipped?

**Answer**: THREE bypass scenarios:

**Bypass 1**: Clear line of sight
- **When**: Agent in BUG mode with no obstacles blocking goal
- **Result**: Stays in BUG mode, ASTAR never invoked
- **Code**: Pathfinding.js lines 140-143

**Bypass 2**: Existing valid path
- **When**: Agent already in ASTAR mode following computed path
- **Result**: Continues following path, no new search
- **Code**: Pathfinding.js lines 169-186

**Bypass 3**: Initial state
- **When**: First call with empty pathState
- **Result**: Initializes to BUG mode, ASTAR not yet needed
- **Code**: Pathfinding.js lines 132-136

**ASTAR is NOT bypassed when**:
- Obstacle blocks path (triggers BUG → ASTAR)
- Path is exhausted (triggers new search)
- Line of sight is restored (switches to BUG but doesn't skip ASTAR logic)

---

### 3c. Under what conditions can ASTAR pathfinding encounter an unrecoverable situation?

**Answer**: THREE unrecoverable situations:

**Situation 1**: Completely surrounded by obstacles
- **State**: No valid neighboring positions exist
- **Result**: Returns empty array
- **System Response**: Falls back to BUG mode (BUG!)
- **Correct Response**: Should stop agent or mark as blocked

**Situation 2**: Expansion budget exhausted
- **State**: 300 nodes explored, goal not found
- **Result**: Returns empty array
- **System Response**: Falls back to BUG mode (BUG!)
- **Correct Response**: Should try larger budget or stop agent

**Situation 3**: Invalid goal position
- **State**: Goal itself is inside obstacle
- **Result**: Can never reach goal, returns empty array
- **System Response**: Falls back to BUG mode (BUG!)
- **Correct Response**: Should validate goal during destination selection

**CRITICAL ISSUE**: 
All three unrecoverable situations trigger the SAME buggy behavior:
1. ASTAR returns empty array
2. System switches back to BUG mode
3. Returns goal position as waypoint
4. Agent moves toward goal through obstacles

**What SHOULD happen**:
- Stop agent at current position
- Mark agent as "blocked"
- Try alternative strategies (incremental waypoints, replanning)
- Never fall back to moving through obstacles

---

## 4. Complete Trace of Observed Behavior

### Question: Provide a complete trace of this behavior through the codebase, identifying which conditions are met at each step, that results in this behavior taking place.

**Answer**: Complete step-by-step trace:

---

#### Initial State (Before Screenshot 1)

**Agent Spawns**:
- `Simulation.spawnFanAgent()` called
- `getSpawnLocation()` returns position in entranceway: (365, 547)
- Agent created: `new Agent(365, 547, 'fan')`
- `agent.obstacles = this.obstacles` (Simulation.js line 208)
  - obstacles = [4 FoodStalls, 2 Walls]
- `agent.specialMovementZones = this.specialMovementZones` (line 209)
- Agent added to simulation

**Transition to MOVING**:
- After idle period, `transitionTo(new MovingState(), 800, 600)` called
- `MovingState.enter()` executes:
  - Line 88: `agent.idleTimer = 0`
  - Line 89: `chooseRandomDestination(800, 600, obstacles)` 
    - Selects destination: (71, 78)
    - Destination IS valid (not inside obstacle)
  - Line 91: `agent.pathState = {}` ← **RESETS pathfinding state**

---

#### Frame 1: Screenshot 1 - Agent at (365, 547)

**Simulation.update()**:
- Line 226: `agent.update(deltaTime, 800, 600, this.obstacles)`

**Agent.update()**:
- Line 105: `this.obstacles = obstacles` ← obstacles array updated
- Line 108: `this.state.update(this, deltaTime, 800, 600, obstacles)`

**MovingState.update()**:
- Line 95-98: Calculate distance to destination
  - dx = 71 - 365 = -294
  - dy = 78 - 547 = -469  
  - distance = √(294² + 469²) = √(86436 + 219961) = √306397 ≈ 553.6
- Line 100: Check if reached destination: 553.6 > 5 → NO
- Line 106: Call `calculateNextWaypoint(365, 547, 71, 78, obstacles, 5, agent.pathState)`

**calculateNextWaypoint() - First Call**:
- Line 132: `if (!agentPathState.mode)` → TRUE (pathState is {})
- Line 133: `agentPathState.mode = 'bug'` ← **Initialize to BUG mode**
- Line 134: `agentPathState.path = []`
- Line 135: `agentPathState.pathIndex = 0`

- Line 139: `if (agentPathState.mode === 'bug')` → TRUE
- Line 140: `hasLineOfSight(365, 547, 71, 78, obstacles, 5)`

**hasLineOfSight() Execution**:
- Line 92: distance = 553.6
- Line 94: distance !== 0 → continue
- Line 99: steps = ceil(553.6 / 2) = 277 sample points
- Line 103-113: For each of 277 sample points:
  - Sample points along line from (365, 547) to (71, 78)
  - Each sample checks collision with 6 obstacles (4 FoodStalls, 2 Walls)
  - **Critical samples**: Points passing through left wall area
    - Wall bounds: x: 0-360, y: 480-600
    - Line passes through wall's Y bounds (547 is within 480-600)
    - Multiple samples detect collision with left wall
  - Line 110: `obstacle.collidesWith(x, y, 5)` → **TRUE** for wall samples
  - Line 111: `return false` ← **LINE OF SIGHT BLOCKED**

**Back to calculateNextWaypoint()**:
- Line 140: `hasLineOfSight()` returned `false` → obstacle blocks
- Line 144: Skip the return statement (line 142)
- Line 145: `agentPathState.mode = 'astar'` ← **Switch to ASTAR mode**
- Line 146: `agentPathState.path = findBoundedPath(365, 547, 71, 78, obstacles, 5)`

**findBoundedPath() Execution**:
- Line 214: Start node: key = '36,54' (x=365→36, y=547→54 with grid size 10)
- Line 215-216: Initialize open set with start node
- Line 220-226: A* main loop (max 300 expansions)
  
  **Expansion 1-50**: Explore nodes around start position
  - Many nodes collide with left wall (x: 0-360)
  - Valid nodes added to open set
  - Sorted by f-score (g + heuristic)
  
  **Expansion 51-150**: Continue exploration
  - Trying to find path around left wall
  - Nodes far from wall have better f-scores
  - But still need to navigate around wall to reach goal
  
  **Expansion 151-300**: Reaching expansion limit
  - Goal at (7, 7) still not reached (grid coordinates)
  - Current best node still far from goal
  - Expansion limit prevents further search
  
- Line 220: `expansions < MAX_EXPANSIONS` → becomes FALSE at 300
- Loop exits
- Line 285: `return []` ← **RETURNS EMPTY ARRAY** (no path found)

**Back to calculateNextWaypoint()**:
- Line 146: `agentPathState.path = []` ← **PATH IS EMPTY**
- Line 147: `agentPathState.pathIndex = 0`
- Line 148: Fall through to next section

- Line 153: `if (agentPathState.path.length === 0 ...)` → **TRUE** ← **THE BUG TRIGGERS HERE**
- Line 154: `agentPathState.mode = 'bug'` ← **SWITCHES BACK TO BUG MODE** 
- Line 155: `agentPathState.path = []`
- Line 156: `agentPathState.pathIndex = 0`
- Line 157: `return { x: 71, y: 78, mode: 'bug' }` ← **RETURNS GOAL IN BUG MODE**

**Back to MovingState.update()**:
- Line 106: waypoint = `{ x: 71, y: 78, mode: 'bug' }`
- Line 117-119: Calculate direction to waypoint
  - waypointDx = 71 - 365 = -294
  - waypointDy = 78 - 547 = -469
  - waypointDist = 553.6
- Line 122: speed = 8.32 (from agent velocity)
- Line 124-128: Move toward waypoint
  - dirX = -294 / 553.6 = -0.531
  - dirY = -469 / 553.6 = -0.847
  - agent.x += -0.531 × 8.32 × deltaTime
  - agent.y += -0.847 × 8.32 × deltaTime
  
**Result**: Agent moves toward (71, 78) in BUG mode, **moving INTO the left wall obstacle**

---

#### Frames 2-N: Agent Continues Through Wall

**Each subsequent frame**:
- `calculateNextWaypoint()` called again
- Line 139: Agent in BUG mode
- Line 140: `hasLineOfSight()` checks current position to goal
  - Agent now DEEPER inside wall (e.g., x=349, y=522)
  - Still no line of sight (wall blocks)
- Line 145: Switches to ASTAR
- Line 146: `findBoundedPath()` still returns empty array
- Line 153: Empty path detected
- Line 154: **Switches back to BUG mode**
- Line 157: Returns goal in BUG mode
- Agent continues moving toward goal through wall

**The Cycle Repeats**:
```
BUG mode → No LOS → Switch to ASTAR → Empty path → 
Fall back to BUG → Move toward goal → [REPEAT]
```

**Why Agent Appears Stuck in BUG Mode**:
- Agent DOES switch to ASTAR every frame
- But IMMEDIATELY falls back to BUG due to empty path
- From tooltip perspective: `agent.getPathfindingMode()` returns `pathState.mode`
- `pathState.mode` is 'bug' after the fallback
- Tooltip displays "Pathfinding: BUG" throughout

---

#### Frame N: Screenshot 2 - Agent at (349, 522)

**Same logic repeats**:
- Agent position now (349, 522) - deeper into wall
- Destination still (71, 78)
- Line-of-sight still blocked (wall still in the way)
- A* still returns empty path (same conditions)
- Falls back to BUG mode
- Continues moving toward goal through wall

**Agent has moved**:
- From (365, 547) to (349, 522)
- Δx = -16 pixels
- Δy = -25 pixels
- Distance moved = √(16² + 25²) = √881 ≈ 29.7 pixels
- Time between screenshots: ~2 seconds (based on "few seconds later")
- Speed: 29.7 / 2 ≈ 14.85 px/s average
- Screenshot shows 8.32 px/s (instantaneous speed, varies per frame)

---

### Summary of Complete Trace

**Root Cause Conditions Met**:

1. ✅ Agent encounters obstacle blocking path to goal
2. ✅ `hasLineOfSight()` correctly returns `false`
3. ✅ System switches to ASTAR mode (line 145)
4. ✅ `findBoundedPath()` fails due to 300-expansion limit
5. ✅ Returns empty path array
6. ✅ Empty path triggers fallback to BUG (lines 153-154) ← **THE BUG**
7. ✅ System returns goal position in BUG mode (line 157)
8. ✅ Agent moves toward goal, ignoring obstacle
9. ✅ Cycle repeats every frame
10. ✅ Agent walks through wall

**The Precise Bug**:
Lines 153-158 implement a fallback that switches back to BUG mode when path is empty. This fallback assumes that if no path is found, the agent should try moving directly to the goal. However, this is exactly what was JUST determined to be blocked by an obstacle. The fallback defeats the purpose of the obstacle detection.

---

## Additional Findings

### Why A* Returns Empty Array

**Specific to this scenario**:
- Agent at (365, 547) is at grid position (36, 54) with GRID_SIZE=10
- Agent is immediately adjacent to left wall (bounds: 0-360)
- With agent radius 5, positions x < 365 are too close to wall
- Goal at (71, 78) is at grid position (7, 7)
- Required path must navigate UP and LEFT around wall
- A* explores nodes but 300 expansions insufficient for this complex path
- Returns empty array

### Why Bug Is Consistent

**Reproducible because**:
- Entranceway spawn location is deterministic region
- Wall obstacles are fixed at simulation start
- A* expansion limit is constant (300)
- Fallback logic is deterministic
- Every agent spawning in this region with destination above walls will trigger bug

### Why Bug Appears Gradual

**Agent moves slowly because**:
- Agent speed is based on velocity (vx, vy) set at creation
- Random velocities average around 8-12 px/s
- This is normal agent speed, not related to bug
- Makes bug more visible (agent slowly phases through wall)
- Faster agents would zip through wall quickly

---

## Conclusion

All questions have been answered with specific code locations, line numbers, conditions, and trace details. The root cause is definitively identified as the fallback-to-BUG logic at lines 153-158 of Pathfinding.js. Comprehensive test cases in `tests/PathfindingBugAnalysis.test.js` reproduce and confirm the bug.
