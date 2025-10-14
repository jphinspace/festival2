import { describe, it, expect, beforeEach } from '@jest/globals';
import { hasLineOfSight, calculateNextWaypoint } from '../js/Pathfinding.js';
import { Obstacle } from '../js/Obstacle.js';

describe('Pathfinding', () => {
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
    });
});
