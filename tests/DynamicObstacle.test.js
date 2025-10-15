import { describe, it, expect } from '@jest/globals';
import { DynamicObstacle } from '../js/DynamicObstacle.js';
import { StaticObstacle } from '../js/StaticObstacle.js';
import { Obstacle } from '../js/Obstacle.js';
import { Agent } from '../js/Agent.js';

describe('DynamicObstacle', () => {
    describe('constructor', () => {
        it('should create a dynamic obstacle with given position and size', () => {
            const obstacle = new DynamicObstacle(100, 150, 40, 40);
            
            expect(obstacle.x).toBe(100);
            expect(obstacle.y).toBe(150);
            expect(obstacle.width).toBe(40);
            expect(obstacle.height).toBe(40);
        });

        it('should extend Obstacle base class', () => {
            const obstacle = new DynamicObstacle(50, 75, 30, 60);
            
            expect(obstacle instanceof Obstacle).toBe(true);
        });
    });

    describe('inherited methods', () => {
        let obstacle;

        beforeEach(() => {
            obstacle = new DynamicObstacle(100, 100, 40, 40);
        });

        it('should inherit getBounds from Obstacle', () => {
            const bounds = obstacle.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should inherit collidesWith from Obstacle', () => {
            const result = obstacle.collidesWith(100, 100, 5);
            
            expect(result).toBe(true);
        });

        it('should inherit containsPoint from Obstacle', () => {
            const result = obstacle.containsPoint(100, 100);
            
            expect(result).toBe(true);
        });
    });

    describe('type checking', () => {
        it('should be identifiable as DynamicObstacle', () => {
            const obstacle = new DynamicObstacle(100, 100, 40, 40);
            
            expect(obstacle instanceof DynamicObstacle).toBe(true);
        });

        it('should be identifiable as Obstacle', () => {
            const obstacle = new DynamicObstacle(100, 100, 40, 40);
            
            expect(obstacle instanceof Obstacle).toBe(true);
        });

        it('should NOT be a StaticObstacle', () => {
            const obstacle = new DynamicObstacle(100, 100, 40, 40);
            
            expect(obstacle instanceof StaticObstacle).toBe(false);
        });
    });

    describe('Agent as DynamicObstacle', () => {
        it('should allow Agent to be a DynamicObstacle', () => {
            const agent = new Agent(100, 100);
            
            expect(agent instanceof DynamicObstacle).toBe(true);
        });

        it('should allow Agent to be an Obstacle', () => {
            const agent = new Agent(100, 100);
            
            expect(agent instanceof Obstacle).toBe(true);
        });

        it('should allow Agent collision detection as an obstacle', () => {
            const agent = new Agent(100, 100);
            
            // Agent should collide with itself
            const result = agent.collidesWith(100, 100, 5);
            expect(result).toBe(true);
        });

        it('should allow Agent bounds calculation', () => {
            const agent = new Agent(100, 100);
            const bounds = agent.getBounds();
            
            // Agent with radius 5 has width/height of 10
            expect(bounds.left).toBe(95);
            expect(bounds.right).toBe(105);
            expect(bounds.top).toBe(95);
            expect(bounds.bottom).toBe(105);
        });
    });

    describe('filtering', () => {
        it('should be filterable from mixed obstacle arrays', () => {
            const staticObs = new StaticObstacle(100, 100, 40, 40);
            const dynamicObs = new DynamicObstacle(200, 200, 40, 40);
            const obstacles = [staticObs, dynamicObs];
            
            const dynamicObstacles = obstacles.filter(obs => obs instanceof DynamicObstacle);
            const staticObstacles = obstacles.filter(obs => !(obs instanceof DynamicObstacle));
            
            expect(dynamicObstacles.length).toBe(1);
            expect(dynamicObstacles[0]).toBe(dynamicObs);
            expect(staticObstacles.length).toBe(1);
            expect(staticObstacles[0]).toBe(staticObs);
        });

        it('should filter agents from obstacle arrays', () => {
            const staticObs = new StaticObstacle(100, 100, 40, 40);
            const agent1 = new Agent(200, 200);
            const agent2 = new Agent(300, 300);
            const obstacles = [staticObs, agent1, agent2];
            
            const dynamicObstacles = obstacles.filter(obs => obs instanceof DynamicObstacle);
            const staticObstacles = obstacles.filter(obs => !(obs instanceof DynamicObstacle));
            
            expect(dynamicObstacles.length).toBe(2);
            expect(staticObstacles.length).toBe(1);
            expect(staticObstacles[0]).toBe(staticObs);
        });
    });

    describe('pathfinding with dynamic obstacles', () => {
        it('should allow dynamic obstacles to be used in pathfinding', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(150, 100);
            
            // Test that agent2 can act as an obstacle for collision detection
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            // Agents are too far apart to collide in this case
            expect(collides).toBe(false);
        });

        it('should detect collision between nearby agents', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(102, 102); // Very close
            
            // Test that agents can collide with each other
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            expect(collides).toBe(true);
        });
    });
});
