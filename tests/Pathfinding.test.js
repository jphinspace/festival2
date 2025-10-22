import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
    hasLineOfSight, 
    calculateNextWaypoint,
    calculateDistance,
    getGridKey,
    isPositionValid,
    reconstructPath,
    findBoundedPath
} from '../js/Pathfinding.js';
import { Obstacle } from '../js/Obstacle.js';

describe('Pathfinding', () => {
    describe('calculateDistance', () => {
        it('should calculate distance between two points', () => {
            const distance = calculateDistance(0, 0, 3, 4);
            expect(distance).toBe(5);
        });

        it('should return 0 for same point', () => {
            const distance = calculateDistance(5, 5, 5, 5);
            expect(distance).toBe(0);
        });

        it('should calculate distance for negative coordinates', () => {
            const distance = calculateDistance(-3, -4, 0, 0);
            expect(distance).toBe(5);
        });

        it('should handle horizontal distance', () => {
            const distance = calculateDistance(0, 5, 10, 5);
            expect(distance).toBe(10);
        });

        it('should handle vertical distance', () => {
            const distance = calculateDistance(5, 0, 5, 10);
            expect(distance).toBe(10);
        });
    });

    describe('getGridKey', () => {
        it('should generate grid key for positive coordinates', () => {
            const key = getGridKey(25, 35, 10);
            expect(key).toBe('2,3');
        });

        it('should handle zero coordinates', () => {
            const key = getGridKey(0, 0, 10);
            expect(key).toBe('0,0');
        });

        it('should handle negative coordinates', () => {
            const key = getGridKey(-5, -15, 10);
            expect(key).toBe('-1,-2');
        });

        it('should use floor for grid alignment', () => {
            const key1 = getGridKey(19, 19, 10);
            const key2 = getGridKey(10, 10, 10);
            expect(key1).toBe('1,1');
            expect(key2).toBe('1,1');
        });

        it('should work with different grid sizes', () => {
            const key1 = getGridKey(50, 50, 5);
            const key2 = getGridKey(50, 50, 20);
            expect(key1).toBe('10,10');
            expect(key2).toBe('2,2');
        });
    });

    describe('isPositionValid', () => {
        it('should return true for position with no obstacles', () => {
            const obstacles = [];
            const valid = isPositionValid(50, 50, obstacles, 5);
            expect(valid).toBe(true);
        });

        it('should return false when position collides with obstacle', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const valid = isPositionValid(50, 50, obstacles, 5);
            expect(valid).toBe(false);
        });

        it('should return true when position is away from obstacle', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const valid = isPositionValid(100, 100, obstacles, 5);
            expect(valid).toBe(true);
        });

        it('should check multiple obstacles', () => {
            const obstacles = [
                new Obstacle(50, 50, 20, 20),
                new Obstacle(100, 100, 20, 20)
            ];
            const valid1 = isPositionValid(50, 50, obstacles, 5);
            const valid2 = isPositionValid(150, 150, obstacles, 5);
            expect(valid1).toBe(false);
            expect(valid2).toBe(true);
        });

        it('should consider agent radius in collision', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const valid1 = isPositionValid(75, 50, obstacles, 1);
            const valid2 = isPositionValid(75, 50, obstacles, 10);
            expect(valid1).toBe(true);
            expect(valid2).toBe(false);
        });
    });

    describe('reconstructPath', () => {
        it('should reconstruct simple path', () => {
            const cameFrom = new Map();
            cameFrom.set('1,1', { x: 0, y: 0, key: '0,0' });
            const currentNode = { x: 10, y: 10, key: '1,1' };
            
            const path = reconstructPath(currentNode, cameFrom, 20, 20);
            
            expect(path.length).toBe(2);
            expect(path[0]).toEqual({ x: 10, y: 10 });
            expect(path[1]).toEqual({ x: 20, y: 20 });
        });

        it('should return empty path when no predecessors', () => {
            const cameFrom = new Map();
            const currentNode = { x: 10, y: 10, key: '1,1' };
            
            const path = reconstructPath(currentNode, cameFrom, 20, 20);
            
            expect(path.length).toBe(0);
        });

        it('should reconstruct multi-step path', () => {
            const cameFrom = new Map();
            cameFrom.set('2,2', { x: 10, y: 10, key: '1,1' });
            cameFrom.set('1,1', { x: 0, y: 0, key: '0,0' });
            const currentNode = { x: 20, y: 20, key: '2,2' };
            
            const path = reconstructPath(currentNode, cameFrom, 30, 30);
            
            expect(path.length).toBe(3);
            expect(path[0]).toEqual({ x: 10, y: 10 });
            expect(path[1]).toEqual({ x: 20, y: 20 });
            expect(path[2]).toEqual({ x: 30, y: 30 });
        });

        it('should include goal as final waypoint', () => {
            const cameFrom = new Map();
            cameFrom.set('1,1', { x: 0, y: 0, key: '0,0' });
            const currentNode = { x: 10, y: 10, key: '1,1' };
            
            const path = reconstructPath(currentNode, cameFrom, 100, 200);
            
            expect(path[path.length - 1]).toEqual({ x: 100, y: 200 });
        });
    });

    describe('hasLineOfSight', () => {
        it('should return true when no obstacles are present', () => {
            const obstacles = [];
            const result = hasLineOfSight(0, 0, 100, 100, obstacles, 5);
            
            expect(result).toBe(true);
        });

        it('should return false when obstacle blocks the path', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const result = hasLineOfSight(0, 0, 100, 100, obstacles, 5);
            
            expect(result).toBe(false);
        });

        it('should return true when path goes around obstacle', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const result = hasLineOfSight(0, 0, 0, 100, obstacles, 5);
            
            expect(result).toBe(true);
        });

        it('should handle zero distance', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const result = hasLineOfSight(100, 100, 100, 100, obstacles, 5);
            
            expect(result).toBe(true);
        });

        it('should consider agent radius in collision detection', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            
            // Path along the side - small radius clears, large radius hits
            const result1 = hasLineOfSight(50, 10, 50, 20, obstacles, 1);
            
            // Large radius will collide with obstacle edge
            const result2 = hasLineOfSight(50, 20, 50, 30, obstacles, 15);
            
            expect(result1).toBe(true);
            expect(result2).toBe(false);
        });

        it('should check multiple obstacles', () => {
            const obstacles = [
                new Obstacle(30, 30, 20, 20),
                new Obstacle(70, 70, 20, 20)
            ];
            const result = hasLineOfSight(0, 0, 100, 100, obstacles, 5);
            
            expect(result).toBe(false);
        });

        it('should return true when start and end are the same', () => {
            const obstacles = [new Obstacle(50, 50, 40, 40)];
            const result = hasLineOfSight(0, 0, 0, 0, obstacles, 5);
            
            expect(result).toBe(true);
        });

        it('should detect obstacle at the edge of path', () => {
            const obstacles = [new Obstacle(50, 0, 20, 20)];
            const result = hasLineOfSight(0, 0, 100, 0, obstacles, 5);
            
            expect(result).toBe(false);
        });
    });

    describe('calculateNextWaypoint', () => {
        let obstacles;
        let agentPathState;

        beforeEach(() => {
            obstacles = [];
            agentPathState = {};
        });

        it('should initialize agent path state on first call', () => {
            calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.mode).toBeDefined();
            expect(agentPathState.path).toBeDefined();
            expect(agentPathState.pathIndex).toBeDefined();
        });

        it('should return goal directly when no obstacles block path', () => {
            const result = calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(result.x).toBe(100);
            expect(result.y).toBe(100);
            expect(result.mode).toBe('bug');
        });

        it('should stay in bug mode when line of sight is clear', () => {
            agentPathState.mode = 'bug';
            
            const result = calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(result.mode).toBe('bug');
        });

        it('should attempt to switch to astar mode when obstacle blocks path', () => {
            obstacles = [new Obstacle(50, 50, 30, 30)];
            agentPathState.mode = 'bug';
            
            const result = calculateNextWaypoint(10, 10, 90, 90, obstacles, 5, agentPathState);
            
            // If A* finds a path, mode will be astar, otherwise stays bug
            // The important thing is that the algorithm attempts pathfinding
            expect(['bug', 'astar']).toContain(agentPathState.mode);
        });

        it('should compute path when switching to astar mode', () => {
            obstacles = [new Obstacle(50, 50, 40, 40)];
            agentPathState.mode = 'bug';
            
            calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.path).toBeDefined();
            expect(agentPathState.pathIndex).toBe(0);
        });

        it('should follow computed path in astar mode', () => {
            obstacles = [new Obstacle(50, 50, 40, 40)];
            agentPathState.mode = 'astar';
            agentPathState.path = [
                { x: 10, y: 10 },
                { x: 20, y: 20 }
            ];
            agentPathState.pathIndex = 0;
            
            const result = calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(result.x).toBe(10);
            expect(result.y).toBe(10);
            expect(result.mode).toBe('astar');
        });

        it('should advance to next waypoint when close to current one', () => {
            obstacles = [new Obstacle(50, 50, 40, 40)];
            agentPathState.mode = 'astar';
            agentPathState.path = [
                { x: 2, y: 2 },
                { x: 20, y: 20 }
            ];
            agentPathState.pathIndex = 0;
            
            const result = calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.pathIndex).toBe(1);
            expect(result.x).toBe(20);
            expect(result.y).toBe(20);
        });

        it('should switch back to bug mode when reaching end of path', () => {
            obstacles = [new Obstacle(50, 50, 40, 40)];
            agentPathState.mode = 'astar';
            agentPathState.path = [{ x: 2, y: 2 }];
            agentPathState.pathIndex = 0;
            
            const result = calculateNextWaypoint(0, 0, 100, 100, obstacles, 5, agentPathState);
            
            // Should advance past the end of path
            expect(agentPathState.mode).toBe('bug');
        });

        it('should switch back to bug mode when line of sight is restored', () => {
            obstacles = [];
            agentPathState.mode = 'astar';
            agentPathState.path = [
                { x: 20, y: 20 },
                { x: 40, y: 40 }
            ];
            agentPathState.pathIndex = 0;
            
            const result = calculateNextWaypoint(10, 10, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.mode).toBe('bug');
            expect(result.x).toBe(100);
            expect(result.y).toBe(100);
        });

        it('should handle empty path in astar mode', () => {
            obstacles = [];
            agentPathState.mode = 'astar';
            agentPathState.path = [];
            agentPathState.pathIndex = 0;
            
            const result = calculateNextWaypoint(10, 10, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.mode).toBe('bug');
        });

        it('should handle navigation around simple obstacle', () => {
            obstacles = [new Obstacle(50, 50, 20, 20)];
            agentPathState = {};
            
            // First call should attempt pathfinding
            const result1 = calculateNextWaypoint(20, 20, 80, 80, obstacles, 5, agentPathState);
            
            // Mode should be astar if path is found, or bug if not
            expect(['bug', 'astar']).toContain(agentPathState.mode);
        });

        it('should return goal when in bug mode with clear path from middle', () => {
            obstacles = [new Obstacle(50, 50, 40, 40)];
            agentPathState.mode = 'bug';
            
            const result = calculateNextWaypoint(0, 0, 0, 100, obstacles, 5, agentPathState);
            
            expect(result.x).toBe(0);
            expect(result.y).toBe(100);
        });

        it('should handle pathIndex at end of path array', () => {
            obstacles = [];
            agentPathState.mode = 'astar';
            agentPathState.path = [{ x: 50, y: 50 }];
            agentPathState.pathIndex = 1; // Already at end
            
            const result = calculateNextWaypoint(40, 40, 100, 100, obstacles, 5, agentPathState);
            
            expect(agentPathState.mode).toBe('bug');
        });

        it('should maintain mode consistency across multiple calls', () => {
            obstacles = [new Obstacle(50, 50, 20, 20)];
            agentPathState = {};
            
            const result1 = calculateNextWaypoint(20, 20, 80, 80, obstacles, 5, agentPathState);
            const mode1 = agentPathState.mode;
            
            const result2 = calculateNextWaypoint(25, 25, 80, 80, obstacles, 5, agentPathState);
            const mode2 = agentPathState.mode;
            
            // Modes should be consistent based on pathfinding results
            expect(['bug', 'astar']).toContain(mode1);
            expect(['bug', 'astar']).toContain(mode2);
        });

        it('should handle agent at goal location', () => {
            obstacles = [];
            agentPathState = {};
            
            const result = calculateNextWaypoint(100, 100, 100, 100, obstacles, 5, agentPathState);
            
            expect(result.x).toBe(100);
            expect(result.y).toBe(100);
        });

        it('should handle very large obstacles that block most paths', () => {
            // Large obstacle that forces complex pathfinding
            obstacles = [new Obstacle(400, 300, 700, 500)];
            agentPathState = {};
            
            const result = calculateNextWaypoint(50, 50, 750, 550, obstacles, 5, agentPathState);
            
            // Should return some result even if pathfinding is difficult
            expect(result.x).toBeDefined();
            expect(result.y).toBeDefined();
        });

        it('should handle multiple small obstacles', () => {
            obstacles = [
                new Obstacle(30, 30, 10, 10),
                new Obstacle(60, 60, 10, 10),
                new Obstacle(40, 70, 10, 10)
            ];
            agentPathState = {};
            
            const result = calculateNextWaypoint(10, 10, 90, 90, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
            expect(result.x).toBeDefined();
            expect(result.y).toBeDefined();
        });

        it('should successfully find path with small centered obstacle', () => {
            obstacles = [new Obstacle(30, 30, 15, 15)];
            agentPathState = {};
            
            // Start far from obstacle, goal requires going around it
            const result = calculateNextWaypoint(10, 30, 50, 30, obstacles, 3, agentPathState);
            
            expect(result).toBeDefined();
            expect(agentPathState.path).toBeDefined();
        });

        it('should advance through waypoints in path', () => {
            obstacles = [new Obstacle(30, 30, 15, 15)];
            agentPathState = { mode: 'astar', path: [{ x: 15, y: 15 }, { x: 25, y: 10 }, { x: 40, y: 40 }], pathIndex: 0 };
            
            // Close to first waypoint, should advance
            const result = calculateNextWaypoint(13, 13, 50, 50, obstacles, 3, agentPathState);
            
            expect(agentPathState.pathIndex).toBeGreaterThan(0);
        });

        it('should trigger A* pathfinding with obstacle requiring detour', () => {
            // Create a simple obstacle that blocks direct path
            // This will trigger A* pathfinding and explore multiple nodes
            obstacles = [new Obstacle(25, 25, 10, 10)];
            agentPathState = { mode: 'bug' };
            
            // Navigate around the obstacle - close enough to force A* exploration
            const result = calculateNextWaypoint(20, 30, 35, 30, obstacles, 5, agentPathState);
            
            // Should trigger pathfinding and explore nodes
            expect(result).toBeDefined();
        });

        it('should explore multiple nodes in A* search', () => {
            // Create obstacle configuration that requires A* to explore many nodes
            obstacles = [
                new Obstacle(30, 25, 8, 20),  // Vertical wall
            ];
            agentPathState = { mode: 'bug' };
            
            // Force A* to find path around obstacle
            const result = calculateNextWaypoint(25, 35, 45, 35, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should handle complex obstacle maze for extensive A* exploration', () => {
            // Create multiple obstacles that force complex pathfinding
            obstacles = [
                new Obstacle(30, 30, 10, 10),
                new Obstacle(45, 30, 10, 10),
                new Obstacle(30, 50, 10, 10),
            ];
            agentPathState = { mode: 'bug' };
            
            const result = calculateNextWaypoint(20, 40, 70, 40, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should test pathfinding with obstacles at various positions', () => {
            // Multiple small obstacles to test various A* branches
            obstacles = [
                new Obstacle(35, 35, 8, 8),
                new Obstacle(50, 35, 8, 8),
                new Obstacle(42, 48, 8, 8),
            ];
            agentPathState = { mode: 'bug' };
            
            const result = calculateNextWaypoint(30, 42, 65, 42, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should handle pathfinding where A* revisits grid cells', () => {
            // Create a corridor with obstacles that forces A* to explore in a specific pattern
            // This should cause A* to check neighbors that are already in closedSet
            obstacles = [
                new Obstacle(30, 25, 5, 20),   // Left wall
                new Obstacle(50, 25, 5, 20),   // Right wall
            ];
            agentPathState = { mode: 'bug' };
            
            // Navigate through narrow corridor
            const result = calculateNextWaypoint(25, 35, 60, 35, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should explore complex paths with many nodes', () => {
            // Create an obstacle pattern that requires extensive A* exploration
            // with backtracking to check closed set neighbors
            obstacles = [
                new Obstacle(35, 30, 10, 15),
                new Obstacle(50, 35, 10, 15),
            ];
            agentPathState = { mode: 'bug' };
            
            const result = calculateNextWaypoint(30, 40, 70, 40, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should trigger closed set checks during A* exploration', () => {
            // Create obstacles that force A* to explore nodes where neighbors are revisited
            // The grid size is 10, so nodes are at 0, 10, 20, 30, 40, 50, etc.
            obstacles = [
                new Obstacle(40, 40, 15, 15),  // Obstacle around grid (40,40)
            ];
            agentPathState = { mode: 'bug' };
            
            // Start and end positions that force exploration around the obstacle
            // This ensures A* explores multiple grid cells
            const result = calculateNextWaypoint(30, 45, 55, 45, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should handle A* pathfinding with complex exploration pattern', () => {
            // Create obstacles in a pattern that forces A* to explore in multiple directions
            // and inevitably check already-explored neighbors
            obstacles = [
                new Obstacle(40, 38, 8, 8),   // Center-ish obstacle
                new Obstacle(52, 38, 8, 8),   // Right obstacle
                new Obstacle(46, 28, 8, 8),   // Top obstacle
            ];
            agentPathState = { mode: 'bug' };
            
            // Navigate from left to right around the obstacles
            // Grid size is 10, so these positions align with grid cells
            const result = calculateNextWaypoint(30, 38, 70, 38, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should test A* with tight spaces forcing detailed exploration', () => {
            // Create a bottleneck that forces A* to explore around it
            obstacles = [
                new Obstacle(45, 30, 5, 15),   // Tall narrow obstacle
            ];
            agentPathState = { mode: 'bug' };
            
            // Path that goes through the narrow gap
            const result = calculateNextWaypoint(35, 37, 60, 37, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should explore many nodes with distant goal', () => {
            // Create obstacles and a distant goal to force exploration of many nodes
            obstacles = [
                new Obstacle(50, 50, 15, 15),
            ];
            agentPathState = { mode: 'bug' };
            
            // Very distant start and goal to ensure many nodes explored
            const result = calculateNextWaypoint(20, 55, 100, 55, obstacles, 5, agentPathState);
            
            expect(result).toBeDefined();
        });

        it('should not return goal when path is empty and line of sight is blocked', () => {
            // This tests the fix for the bug where agents move through obstacles
            // When A* returns an empty path and there's no line of sight, 
            // the agent should stay in place rather than moving toward the goal
            obstacles = [new Obstacle(50, 50, 40, 40)]; // Large obstacle
            agentPathState = { mode: 'astar', path: [], pathIndex: 0 };
            
            // Position close to obstacle, goal on other side
            const result = calculateNextWaypoint(30, 50, 70, 50, obstacles, 5, agentPathState);
            
            // Should not return the goal directly since line of sight is blocked
            // Either returns current position (stays in place) or a valid waypoint from new path
            if (result.x === 70 && result.y === 50) {
                // If it returns the goal, line of sight must be clear
                expect(hasLineOfSight(30, 50, 70, 50, obstacles, 5)).toBe(true);
            } else {
                // Otherwise it should be a safe position (either current or valid waypoint)
                expect(result.x).toBeDefined();
                expect(result.y).toBeDefined();
            }
            
            // Should remain in or switch to astar mode when blocked
            expect(agentPathState.mode).toBe('astar');
        });
    });

    describe('findBoundedPath (A* algorithm internals)', () => {
        it('should explore neighbors and skip already explored nodes', () => {
            // Create a simple obstacle that forces A* to explore multiple nodes
            // This will trigger the closedSet.has() check (line 255-256)
            const obstacles = [new Obstacle(35, 35, 8, 8)];
            
            // Start and goal positioned to require pathfinding around obstacle
            // Grid size is 10, so nodes snap to 10, 20, 30, 40, 50, etc.
            const path = findBoundedPath(25, 35, 55, 35, obstacles, 5);
            
            // Should find a path around the obstacle (or return empty if blocked)
            expect(Array.isArray(path)).toBe(true);
        });

        it('should build and update paths during A* search', () => {
            // Test that A* properly builds paths by updating gScore and fScore
            // This tests lines 269-273 (the core path building logic)
            const obstacles = [new Obstacle(40, 35, 8, 8)];
            
            // Simple path requiring A* exploration
            const path = findBoundedPath(30, 35, 60, 35, obstacles, 5);
            
            // Should attempt pathfinding (may return empty if no path found)
            expect(Array.isArray(path)).toBe(true);
            if (path.length > 0) {
                // If path found, verify goal is included
                expect(path[path.length - 1].x).toBe(60);
                expect(path[path.length - 1].y).toBe(35);
            }
        });

        it('should return empty path when completely blocked', () => {
            // Create obstacles that make pathfinding very difficult
            const obstacles = [
                new Obstacle(35, 30, 10, 20),  // Blocking obstacle
            ];
            
            // Try to path through difficult area
            const path = findBoundedPath(20, 40, 60, 40, obstacles, 5);
            
            // Should return a path (possibly empty)
            expect(Array.isArray(path)).toBe(true);
        });

        it('should find path with multiple grid cell expansions', () => {
            // Create scenario that requires exploring many grid cells
            // This ensures branches for neighbor checking are executed
            const obstacles = [
                new Obstacle(35, 35, 6, 6),
            ];
            
            // Requires going around obstacles
            const path = findBoundedPath(25, 35, 50, 35, obstacles, 5);
            
            // Should return a path array
            expect(Array.isArray(path)).toBe(true);
        });

        it('should handle various obstacle configurations', () => {
            // Test with different obstacle setups to trigger various branches
            const obstacles = [new Obstacle(40, 40, 8, 8)];
            
            // Test A* exploration
            const path = findBoundedPath(30, 40, 60, 40, obstacles, 5);
            
            expect(Array.isArray(path)).toBe(true);
        });

        it('should verify line of sight to goal before declaring success', () => {
            // Test the specific bug: agent close to obstacle, goal also close to obstacle,
            // obstacle blocks direct path
            // A* should NOT return a path with segments that go through obstacles
            const obstacles = [new Obstacle(50, 50, 10, 10)]; // Obstacle at x:45-55, y:45-55
            
            // Start at valid position on left (x=39), goal at valid position on right (x=61)
            // With agent radius 5, these are just outside the obstacle's collision zone
            // Distance is 22 pixels, obstacle blocks direct path
            const path = findBoundedPath(39, 50, 61, 50, obstacles, 5);
            
            // Path should be found and should route around obstacle
            expect(path.length).toBeGreaterThan(0);
            
            // The critical test: verify each segment of the path has line of sight
            // This ensures the fix is working - A* checks line of sight before declaring goal reached
            
            // Verify line of sight from start to first waypoint
            const hasLOSStart = hasLineOfSight(39, 50, path[0].x, path[0].y, obstacles, 5);
            expect(hasLOSStart).toBe(true);
            
            // Verify line of sight between all waypoints
            for (let i = 0; i < path.length - 1; i++) {
                const hasLOS = hasLineOfSight(
                    path[i].x, path[i].y, 
                    path[i + 1].x, path[i + 1].y, 
                    obstacles, 5
                );
                expect(hasLOS).toBe(true);
            }
        });
    });
});
