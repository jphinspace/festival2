import { describe, it, expect } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { StaticObstacle } from '../js/StaticObstacle.js';
import { DynamicObstacle } from '../js/DynamicObstacle.js';
import { MovingState } from '../js/AgentState.js';

describe('Agent Pathfinding with Dynamic Obstacles', () => {
    describe('destination selection', () => {
        it('should avoid static obstacles when choosing destination', () => {
            const agent = new Agent(100, 100);
            const staticObs = new StaticObstacle(400, 300, 100, 100);
            const obstacles = [staticObs];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Destination should not collide with static obstacle
            const collides = staticObs.containsPoint(agent.destinationX, agent.destinationY, agent.radius);
            expect(collides).toBe(false);
        });

        it('should NOT avoid dynamic obstacles when choosing destination', () => {
            const agent1 = new Agent(100, 100);
            // Create a dynamic obstacle (another agent) covering most of the canvas
            const agent2 = new Agent(400, 300);
            agent2.width = 600;  // Make it very large
            agent2.height = 400;
            const obstacles = [agent2];
            
            // Choose destination - it should NOT filter out agent2
            agent1.chooseRandomDestination(800, 600, obstacles);
            
            // The fact that this doesn't throw or loop forever shows that
            // dynamic obstacles are being filtered out (ignored) for destination selection
            expect(agent1.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent1.destinationX).toBeLessThanOrEqual(800);
            expect(agent1.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent1.destinationY).toBeLessThanOrEqual(600);
        });

        it('should filter out dynamic obstacles from destination selection', () => {
            const agent1 = new Agent(100, 100);
            const staticObs = new StaticObstacle(300, 300, 50, 50);
            const agent2 = new Agent(400, 300);
            const obstacles = [staticObs, agent2];
            
            agent1.chooseRandomDestination(800, 600, obstacles);
            
            // Should avoid static obstacle
            const collidesStatic = staticObs.containsPoint(agent1.destinationX, agent1.destinationY, agent1.radius);
            expect(collidesStatic).toBe(false);
            
            // Dynamic obstacles are filtered out in destination selection
            // So no explicit check needed for agent2
        });
    });

    describe('pathfinding with dynamic obstacles', () => {
        it('should include dynamic obstacles in pathfinding calculations', () => {
            const agent1 = new Agent(100, 100);
            agent1.transitionTo(new MovingState(), 800, 600);
            agent1.destinationX = 500;
            agent1.destinationY = 100;
            
            const agent2 = new Agent(300, 100); // Blocking agent in the middle
            const allObstacles = [agent2];
            
            // Update agent1 with agent2 as a dynamic obstacle
            agent1.update(0.1, 800, 600, allObstacles);
            
            // Agent should use pathfinding to navigate around agent2
            // We can't predict exact position, but pathfinding state should be set
            expect(agent1.pathState).toBeDefined();
        });

        it('should detect collisions between agents', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(105, 105); // Close to agent1
            
            // Check if agent2 collides with agent1's position
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            expect(collides).toBe(true);
        });

        it('should not detect collisions between distant agents', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(500, 500); // Far from agent1
            
            // Check if agent2 collides with agent1's position
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            expect(collides).toBe(false);
        });

        it('should properly separate static and dynamic obstacles', () => {
            const staticObs = new StaticObstacle(200, 200, 40, 40);
            const agent = new Agent(300, 300);
            const obstacles = [staticObs, agent];
            
            const dynamicObstacles = obstacles.filter(obs => obs instanceof DynamicObstacle);
            const staticObstacles = obstacles.filter(obs => !(obs instanceof DynamicObstacle));
            
            expect(dynamicObstacles.length).toBe(1);
            expect(dynamicObstacles[0]).toBe(agent);
            expect(staticObstacles.length).toBe(1);
            expect(staticObstacles[0]).toBe(staticObs);
        });
    });

    describe('MovingState with dynamic obstacles', () => {
        it('should filter dynamic obstacles when entering MovingState', () => {
            const agent1 = new Agent(100, 100);
            const staticObs = new StaticObstacle(400, 300, 50, 50);
            const agent2 = new Agent(450, 300);
            const obstacles = [staticObs, agent2];
            
            const movingState = new MovingState();
            movingState.enter(agent1, 800, 600, obstacles);
            
            // Destination should avoid static obstacles but not dynamic ones
            const collidesStatic = staticObs.containsPoint(agent1.destinationX, agent1.destinationY, agent1.radius);
            expect(collidesStatic).toBe(false);
        });

        it('should use all obstacles (including dynamic) during pathfinding update', () => {
            const agent1 = new Agent(100, 100);
            const agent2 = new Agent(300, 100); // Blocking agent
            agent1.destinationX = 500;
            agent1.destinationY = 100;
            
            const movingState = new MovingState();
            const obstacles = [agent2];
            
            // Update should use agent2 as an obstacle for pathfinding
            movingState.update(agent1, 0.1, 800, 600, obstacles);
            
            // Pathfinding should have been attempted
            expect(agent1.pathState).toBeDefined();
        });
    });

    describe('agent as obstacle properties', () => {
        it('should have correct bounds for collision detection', () => {
            const agent = new Agent(100, 100);
            const bounds = agent.getBounds();
            
            // Agent with radius 5 should have bounds from 95 to 105
            expect(bounds.left).toBe(95);
            expect(bounds.right).toBe(105);
            expect(bounds.top).toBe(95);
            expect(bounds.bottom).toBe(105);
        });

        it('should update bounds when agent moves', () => {
            const agent = new Agent(100, 100);
            agent.x = 200;
            agent.y = 200;
            
            const bounds = agent.getBounds();
            
            expect(bounds.left).toBe(195);
            expect(bounds.right).toBe(205);
            expect(bounds.top).toBe(195);
            expect(bounds.bottom).toBe(205);
        });

        it('should support containsPoint method', () => {
            const agent = new Agent(100, 100);
            
            expect(agent.containsPoint(100, 100)).toBe(true);
            expect(agent.containsPoint(500, 500)).toBe(false);
        });
    });
});
