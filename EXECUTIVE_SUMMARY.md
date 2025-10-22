# Executive Summary: Pathfinding Bug Analysis

## Problem Statement

Agents in the festival simulation are walking directly through Wall obstacles instead of navigating around them. The agent's tooltip displays "Pathfinding: BUG" throughout the journey, even as the agent moves from a valid location (outside obstacle) into an invalid location (inside obstacle).

## Root Cause

**File**: `js/Pathfinding.js`  
**Lines**: 153-158  
**Severity**: Critical - breaks core simulation behavior

The pathfinding system has a fatal flaw in its fallback logic:

1. When BUG mode detects an obstacle, it switches to ASTAR mode
2. ASTAR calls `findBoundedPath()` to compute a route around the obstacle
3. If `findBoundedPath()` returns an empty array (no path found within 300-node expansion limit)
4. The system **immediately switches back to BUG mode** and returns the goal position
5. The agent moves toward the goal, **ignoring the obstacle** that triggered ASTAR in the first place

This creates an infinite loop:
```
BUG detects obstacle → Switch to ASTAR → Path not found → 
Fall back to BUG → Move through obstacle → [REPEAT]
```

## Why It Happens

The bounded A* search is limited to 300 node expansions for performance reasons. In the observed scenario:

- Agent spawns in tight entranceway (365, 547)
- Destination is outside walls (71, 78)
- Complex obstacle layout + tight space + 300-node limit = path not found
- Empty path triggers buggy fallback logic
- Agent walks through wall

## Evidence

### Test Reproduction
Created comprehensive test suite (`tests/PathfindingBugAnalysis.test.js`) with 20 tests that:
- Reproduce exact scenario from screenshots
- Confirm line-of-sight detection works correctly
- Verify ASTAR returns empty array
- Prove fallback-to-BUG causes the bug

### Test Results
```
Agent position: 365, 547
Destination: 71, 78
Line of sight: false (correctly blocked by wall)
findBoundedPath result: [] (empty - no path found)
Pathfinding mode: bug (WRONG - should be astar or blocked)
Next waypoint: {x: 71, y: 78, mode: 'bug'} (agent directed through wall!)
```

### All Tests Pass
- 300 tests total ✅
- 99.49% code coverage maintained ✅
- Bug successfully reproduced ✅
- Root cause definitively proven ✅

## Impact

**User Experience**:
- Agents visibly walk through walls
- Breaks simulation realism and immersion
- Makes pathfinding appear completely broken

**Technical Impact**:
- Affects all agents in complex obstacle environments
- Particularly impacts tight spaces (entranceways, corridors)
- Reproducible and consistent behavior

**Performance Impact**:
- None - bug is logic error, not performance issue

## Recommended Fixes

### Option 1: Stop Agent (Immediate - 5 min)
**Change**: Return current position instead of goal when path not found  
**Pros**: Prevents walking through obstacles immediately  
**Cons**: Agents get stuck, need visual indicator  

### Option 2: Increase Limit (Short-term - 1 min)
**Change**: Increase MAX_EXPANSIONS from 300 to 1000  
**Pros**: One-line fix, solves most cases  
**Cons**: Higher CPU cost, may still fail in complex cases  

### Option 3: Incremental Waypoints (Long-term - 2 hours)
**Change**: Generate nearby valid waypoints when full path unavailable  
**Pros**: Natural behavior, makes progress toward goal  
**Cons**: More complex to implement  

### Recommended Approach
1. **Phase 1** (now): Implement Option 1 to stop the bleeding
2. **Phase 2** (today): Implement Option 2 to improve success rate
3. **Phase 3** (this week): Implement Option 3 for best solution

## Documentation Provided

1. **RCA_PATHFINDING_BUG.md** (20KB)
   - Complete technical analysis
   - Code flow traces
   - Line-by-line breakdown

2. **QUESTIONS_ANSWERED.md** (20KB)
   - Direct answers to all 16 questions from issue
   - Step-by-step behavior trace
   - Frame-by-frame analysis

3. **BUG_FIX_RECOMMENDATIONS.md** (8KB)
   - 5 detailed fix options
   - Implementation guidance
   - Testing recommendations

4. **tests/PathfindingBugAnalysis.test.js** (23KB)
   - 20 comprehensive test cases
   - Exact scenario reproduction
   - Edge case coverage

## Questions Answered

All 16 questions from the issue have been answered with:
- Specific code locations and line numbers
- Exact conditions that trigger behavior
- Complete execution traces
- Test evidence

### Question Highlights

**1a. What causes BUG→ASTAR transition?**  
Only one condition: Agent in BUG mode AND hasLineOfSight() returns false

**1c. Is there fallback logic to BUG?**  
YES - this is the root cause. Lines 153-158 fall back to BUG when path is empty.

**2a. How is line-of-sight calculated?**  
Ray-casting with 2-pixel sampling, checking collision at each sample point.

**3a. When does ASTAR fail?**  
When 300-node expansion limit exceeded, or goal unreachable.

**4. Complete behavior trace?**  
Full frame-by-frame trace provided showing exact conditions at each step.

## Verification Steps

To verify any fix:

1. Run test suite: `npm test`
2. Check specific bug test: `npm test -- -t "should reproduce exact scenario"`
3. Visual verification in simulation:
   - Spawn agent in entranceway
   - Set destination requiring navigation around walls
   - Verify agent navigates around (not through) obstacles
   - Check tooltip shows ASTAR or appropriate mode

## Timeline

- **Analysis Duration**: ~2 hours
- **Tests Created**: 20 comprehensive test cases
- **Documentation**: 70KB across 4 documents
- **Code Coverage**: 99.49% maintained
- **Root Cause**: Definitively identified
- **Fix Options**: 5 detailed recommendations provided

## Next Steps

1. Review this analysis and choose fix option
2. Implement selected fix
3. Run test suite to verify
4. Visual verification in simulation
5. Consider performance impact if Option 2 or 3 chosen
6. Update documentation if behavior changes

## Conclusion

The bug is **definitively identified** with comprehensive test evidence. The root cause is a fallback-to-BUG logic flaw at lines 153-158 of Pathfinding.js. Multiple fix options are provided with implementation guidance. All original questions have been answered in detail.

**Status**: Analysis complete, ready for fix implementation.
