# Bug Fix Recommendations

## Problem Summary

Agents move through obstacles because of a fallback-to-BUG logic flaw in the pathfinding system. When ASTAR pathfinding fails to find a route (returns empty array), the system falls back to BUG mode and directs the agent toward the goal, completely ignoring the obstacle that triggered the ASTAR attempt.

## Root Cause

**File**: `js/Pathfinding.js`  
**Lines**: 145-158

When BUG mode detects an obstacle:
1. Switches to ASTAR mode (line 145)
2. Calls `findBoundedPath()` to find route (line 146)
3. If path is empty, immediately switches back to BUG (lines 153-158)
4. Returns goal position in BUG mode, causing agent to move through obstacle

## Recommended Fixes

### Option 1: Stop Agent When No Path Found (Safest)

When ASTAR fails to find a path, stop the agent instead of falling back to BUG mode.

```javascript
// At line 153-158, replace with:
if (agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
    // No valid path found - stop agent at current position instead of moving through obstacle
    agentPathState.mode = 'astar'; // Stay in ASTAR to prevent BUG mode from taking over
    agentPathState.path = [];
    agentPathState.pathIndex = 0;
    return { x: currentX, y: currentY, mode: 'blocked' }; // Return current position as waypoint
}
```

**Pros**:
- Safest option - prevents agents from ever walking through obstacles
- Clear visual indication that agent is stuck
- Easy to implement

**Cons**:
- Agents can get permanently stuck
- May need UI indicator for "blocked" state
- Doesn't actually solve the navigation problem

### Option 2: Increase ASTAR Search Limit (Quick Fix)

Increase the bounded A* expansion limit from 300 to a higher value.

```javascript
// In findBoundedPath(), line 200:
const MAX_EXPANSIONS = 300; // Current value

// Change to:
const MAX_EXPANSIONS = 1000; // or 1500, 2000, etc.
```

**Pros**:
- Simple one-line change
- May solve most cases
- Allows more complex paths to be found

**Cons**:
- Performance impact (more CPU per pathfinding call)
- May still fail in very complex scenarios
- Doesn't address fundamental issue

### Option 3: Incremental Waypoints When Path Not Found (Best)

When ASTAR can't find complete path, generate intermediate waypoint that moves away from obstacle.

```javascript
// At line 153-158, replace with:
if (agentPathState.path.length === 0 || agentPathState.pathIndex >= agentPathState.path.length) {
    // No complete path found - try to move in a direction away from obstacles
    
    // Try 8 directions to find the best move
    const directions = [
        { dx: 10, dy: 0 }, { dx: -10, dy: 0 },
        { dx: 0, dy: 10 }, { dx: 0, dy: -10 },
        { dx: 7, dy: 7 }, { dx: 7, dy: -7 },
        { dx: -7, dy: 7 }, { dx: -7, dy: -7 }
    ];
    
    let bestWaypoint = null;
    let bestScore = -Infinity;
    
    for (const dir of directions) {
        const testX = currentX + dir.dx;
        const testY = currentY + dir.dy;
        
        // Check if position is valid
        if (isPositionValid(testX, testY, obstacles, agentRadius)) {
            // Score based on: distance to goal (higher is better), clear line to waypoint
            const distToGoal = calculateDistance(testX, testY, goalX, goalY);
            const hasLOS = hasLineOfSight(currentX, currentY, testX, testY, obstacles, agentRadius);
            const score = -distToGoal + (hasLOS ? 100 : 0); // Prefer positions with LOS
            
            if (score > bestScore) {
                bestScore = score;
                bestWaypoint = { x: testX, y: testY };
            }
        }
    }
    
    if (bestWaypoint) {
        // Found a valid nearby position - use it as waypoint
        agentPathState.mode = 'bug';
        return { x: bestWaypoint.x, y: bestWaypoint.y, mode: 'bug' };
    } else {
        // Completely surrounded - stop agent
        agentPathState.mode = 'blocked';
        return { x: currentX, y: currentY, mode: 'blocked' };
    }
}
```

**Pros**:
- Agents make incremental progress even when full path can't be found
- More natural behavior (agents "feel their way" around obstacles)
- Prevents walking through obstacles
- May eventually find path by moving to better position

**Cons**:
- More complex to implement
- Agents may take inefficient routes
- May still get stuck in corners/dead ends

### Option 4: Hybrid - Try Simpler Goal First (Balanced)

When ASTAR fails with distant goal, try pathfinding to intermediate positions.

```javascript
// At line 146, replace single findBoundedPath call with:
let path = findBoundedPath(currentX, currentY, goalX, goalY, obstacles, agentRadius);

if (path.length === 0) {
    // Full path failed - try intermediate waypoints
    // Try pathfinding to point 1/4 of the way to goal
    const intermediateX = currentX + (goalX - currentX) * 0.25;
    const intermediateY = currentY + (goalY - currentY) * 0.25;
    path = findBoundedPath(currentX, currentY, intermediateX, intermediateY, obstacles, agentRadius);
}

if (path.length === 0) {
    // Still failed - try even closer (1/8)
    const nearX = currentX + (goalX - currentX) * 0.125;
    const nearY = currentY + (goalY - currentY) * 0.125;
    path = findBoundedPath(currentX, currentY, nearX, nearY, obstacles, agentRadius);
}

agentPathState.path = path;
```

**Pros**:
- Makes progress even with complex obstacles
- No changes to fallback logic needed
- Balances between full pathfinding and local navigation

**Cons**:
- Multiple pathfinding calls = higher CPU cost
- May take longer routes
- Intermediate goals might be inside obstacles

### Option 5: Adjust Grid Size and Sampling (Technical)

Make A* pathfinding more flexible by adjusting grid resolution.

```javascript
// In findBoundedPath(), line 201:
const GRID_SIZE = 10; // Current value

// For agents near obstacles, use finer grid:
const distanceFromObstacles = getMinimumDistanceToObstacles(startX, startY, obstacles);
const GRID_SIZE = distanceFromObstacles < 15 ? 5 : 10; // Finer grid when close to obstacles
```

**Pros**:
- Better pathfinding in tight spaces
- Adaptive resolution based on environment

**Cons**:
- More complex
- Higher CPU cost for fine-grid searches
- Requires additional helper function

## Recommended Approach

**Phase 1** (Immediate - Prevent Bug):
1. Implement Option 1 (Stop Agent) as emergency fix
2. This prevents agents from walking through obstacles

**Phase 2** (Short-term - Improve Pathfinding):
1. Implement Option 2 (Increase limit to 1000)
2. This should resolve most cases without major code changes

**Phase 3** (Long-term - Best Solution):
1. Implement Option 3 (Incremental Waypoints)
2. This provides most natural agent behavior
3. Handles complex obstacles gracefully

## Testing Recommendations

For any fix, ensure these tests pass:

1. Agent in tight space (entranceway) with distant goal
2. Agent surrounded by obstacles on multiple sides
3. Agent with goal that requires complex detour
4. Agent with goal directly on other side of thin obstacle
5. Agent in corner or dead-end
6. Performance test: 100+ agents with complex obstacles

Test file `tests/PathfindingBugAnalysis.test.js` already includes scenarios for testing.

## Performance Considerations

- Current A* limit: 300 expansions × 8 neighbors = up to 2,400 collision checks per pathfinding call
- With increased limit to 1000: up to 8,000 collision checks
- Called 60 times per second per agent
- With 100 agents: 60 × 100 = 6,000 pathfinding calls/second

Need to balance pathfinding quality with performance. Consider:
- Caching pathfinding results
- Only recalculating when environment or goal changes
- Spreading pathfinding across multiple frames
- Using spatial partitioning for collision checks

## Additional Notes

The current bug is deterministic and reproducible with the test cases provided. Any fix should be validated against:
- Exact scenario from screenshots (agent at 365,547 → 71,78)
- All test cases in `PathfindingBugAnalysis.test.js`
- Visual inspection of agent behavior in simulation
