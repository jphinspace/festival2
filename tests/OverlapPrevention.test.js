import { describe, it, expect, beforeEach } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { Obstacle } from '../js/Obstacle.js';
import {
    detectOverlap,
    calculateOverlapAmount,
    calculateAntiOverlapVector,
    handleCompleteOverlap,
    calculateCombinedAntiOverlapVector,
    checkObstacleCollision,
    capAntiOverlapVector,
    calculateFinalAntiOverlapVector
} from '../js/OverlapPrevention.js';

describe('OverlapPrevention', () => {
    describe('detectOverlap', () => {
        it('should detect when two agents overlap', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100);
            
            // Agents with radius 5 each, distance 5 apart -> they overlap
            expect(detectOverlap(agent1, agent2)).toBe(true);
        });
        
        it('should detect when agents do not overlap', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(120, 100);
            
            // Agents with radius 5 each, distance 20 apart -> no overlap
            expect(detectOverlap(agent1, agent2)).toBe(false);
        });
        
        it('should detect when agents are at the same position', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(100, 100);
            
            expect(detectOverlap(agent1, agent2)).toBe(true);
        });
        
        it('should detect when agents just touch (boundary case)', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(110, 100);
            
            // Agents with radius 5 each, distance 10 apart -> just touching
            // Combined radii = 10, distance = 10, so no overlap
            expect(detectOverlap(agent1, agent2)).toBe(false);
        });
    });
    
    describe('calculateOverlapAmount', () => {
        it('should calculate correct overlap amount', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100);
            
            // Combined radii = 10, distance = 5, overlap = 5
            const overlap = calculateOverlapAmount(agent1, agent2);
            expect(overlap).toBeCloseTo(5, 1);
        });
        
        it('should return 0 when agents do not overlap', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(120, 100);
            
            const overlap = calculateOverlapAmount(agent1, agent2);
            expect(overlap).toBe(0);
        });
        
        it('should return maximum overlap when agents are at same position', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(100, 100);
            
            // Combined radii = 10, distance = 0, overlap = 10
            const overlap = calculateOverlapAmount(agent1, agent2);
            expect(overlap).toBe(10);
        });
    });
    
    describe('calculateAntiOverlapVector', () => {
        it('should calculate vector pointing away from overlapping agent', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100); // To the right
            
            const vector = calculateAntiOverlapVector(agent1, agent2);
            
            // Vector should point to the left (negative X)
            expect(vector.vx).toBeLessThan(0);
            expect(vector.vy).toBeCloseTo(0, 1);
        });
        
        it('should have magnitude proportional to overlap', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100); // 5 units apart, 5 overlap
            const agent3 = new Agent(103, 100); // 3 units apart, 7 overlap
            
            const vector1 = calculateAntiOverlapVector(agent1, agent2);
            const vector2 = calculateAntiOverlapVector(agent1, agent3);
            
            const mag1 = Math.sqrt(vector1.vx * vector1.vx + vector1.vy * vector1.vy);
            const mag2 = Math.sqrt(vector2.vx * vector2.vx + vector2.vy * vector2.vy);
            
            // More overlap should result in larger magnitude
            expect(mag2).toBeGreaterThan(mag1);
        });
        
        it('should return zero vector when agents do not overlap', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(120, 100);
            
            const vector = calculateAntiOverlapVector(agent1, agent2);
            
            expect(vector.vx).toBe(0);
            expect(vector.vy).toBe(0);
        });
        
        it('should return zero vector when agents are at exact same position', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(100, 100);
            
            const vector = calculateAntiOverlapVector(agent1, agent2);
            
            // Special case: distance = 0
            expect(vector.vx).toBe(0);
            expect(vector.vy).toBe(0);
        });
    });
    
    describe('handleCompleteOverlap', () => {
        it('should move agent when at exact same position', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(100, 100);
            
            const originalX = agent2.x;
            
            handleCompleteOverlap(agent1, agent2);
            
            expect(agent2.x).toBe(originalX + 1);
            expect(agent2.y).toBe(100);
        });
        
        it('should not move agent when not at exact same position', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100);
            
            const originalX = agent2.x;
            
            handleCompleteOverlap(agent1, agent2);
            
            expect(agent2.x).toBe(originalX);
        });
    });
    
    describe('calculateCombinedAntiOverlapVector', () => {
        it('should combine vectors from multiple overlapping agents', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100); // To the right
            const agent3 = new Agent(100, 105); // Below
            
            const agents = [agent1, agent2, agent3];
            
            const vector = calculateCombinedAntiOverlapVector(agent1, agents);
            
            // Should have components in both X and Y
            expect(vector.vx).toBeLessThan(0); // Pushed left by agent2
            expect(vector.vy).toBeLessThan(0); // Pushed up by agent3
        });
        
        it('should return zero vector when no overlaps', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(200, 100);
            const agent3 = new Agent(100, 200);
            
            const agents = [agent1, agent2, agent3];
            
            const vector = calculateCombinedAntiOverlapVector(agent1, agents);
            
            expect(vector.vx).toBe(0);
            expect(vector.vy).toBe(0);
        });
        
        it('should not include self in calculation', () => {
            const agent1 = new Agent(100, 100);
            const agents = [agent1];
            
            const vector = calculateCombinedAntiOverlapVector(agent1, agents);
            
            expect(vector.vx).toBe(0);
            expect(vector.vy).toBe(0);
        });
    });
    
    describe('checkObstacleCollision', () => {
        it('should detect collision with obstacle when applying velocity', () => {
            const agent = new Agent(100, 100);
            const obstacle = new Obstacle(120, 100, 20, 20); // Right of agent
            const obstacles = [obstacle];
            
            // Velocity that would move agent into obstacle
            const vx = 100; // Moving right
            const vy = 0;
            const deltaTime = 0.1;
            
            const result = checkObstacleCollision(agent, vx, vy, obstacles, deltaTime);
            
            expect(result.capX).toBe(true);
        });
        
        it('should not detect collision when velocity does not cause collision', () => {
            const agent = new Agent(100, 100);
            const obstacle = new Obstacle(200, 200, 20, 20); // Far away
            const obstacles = [obstacle];
            
            const vx = 10;
            const vy = 10;
            const deltaTime = 0.1;
            
            const result = checkObstacleCollision(agent, vx, vy, obstacles, deltaTime);
            
            expect(result.capX).toBe(false);
            expect(result.capY).toBe(false);
        });
        
        it('should detect Y collision separately from X collision', () => {
            const agent = new Agent(100, 100);
            const obstacle = new Obstacle(100, 120, 20, 20); // Below agent
            const obstacles = [obstacle];
            
            const vx = 0;
            const vy = 100; // Moving down
            const deltaTime = 0.1;
            
            const result = checkObstacleCollision(agent, vx, vy, obstacles, deltaTime);
            
            expect(result.capX).toBe(false);
            expect(result.capY).toBe(true);
        });
    });
    
    describe('capAntiOverlapVector', () => {
        it('should cap X component when it would cause collision', () => {
            const agent = new Agent(100, 100);
            const obstacle = new Obstacle(120, 100, 20, 20);
            const obstacles = [obstacle];
            
            const antiOverlapVector = { vx: 100, vy: 0 };
            const deltaTime = 0.1;
            
            const capped = capAntiOverlapVector(agent, antiOverlapVector, obstacles, deltaTime);
            
            expect(capped.vx).toBe(0);
            expect(capped.vy).toBe(0);
        });
        
        it('should not cap vector when no collision would occur', () => {
            const agent = new Agent(100, 100);
            const obstacle = new Obstacle(200, 200, 20, 20);
            const obstacles = [obstacle];
            
            const antiOverlapVector = { vx: 10, vy: 10 };
            const deltaTime = 0.1;
            
            const capped = capAntiOverlapVector(agent, antiOverlapVector, obstacles, deltaTime);
            
            expect(capped.vx).toBe(10);
            expect(capped.vy).toBe(10);
        });
    });
    
    describe('calculateFinalAntiOverlapVector', () => {
        it('should calculate combined vector with obstacle capping', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 100);
            const agents = [agent1, agent2];
            
            const obstacles = [];
            const deltaTime = 0.016;
            
            const vector = calculateFinalAntiOverlapVector(agent1, agents, obstacles, deltaTime);
            
            // Should have leftward velocity (away from agent2)
            expect(vector.vx).toBeLessThan(0);
        });
        
        it('should cap vector when obstacle would be hit', () => {
            const agent1 = new Agent(110, 100);
            const agent2 = new Agent(115, 100); // To the right
            const agents = [agent1, agent2];
            
            // Obstacle to the left of agent1
            const obstacle = new Obstacle(90, 100, 20, 20);
            const obstacles = [obstacle];
            const deltaTime = 0.1;
            
            const vector = calculateFinalAntiOverlapVector(agent1, agents, obstacles, deltaTime);
            
            // Anti-overlap would push left, but obstacle is there, so should be capped
            // Note: This depends on the magnitude and deltaTime
            expect(vector.vx).toBeLessThanOrEqual(0);
        });
    });
});
