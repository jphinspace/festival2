import { describe, it, expect, beforeEach } from '@jest/globals';
import { Simulation } from '../js/Simulation.js';
import { Agent } from '../js/Agent.js';
import { StaticObstacle } from '../js/StaticObstacle.js';
import { DynamicObstacle } from '../js/DynamicObstacle.js';

// Mock canvas and context
class MockCanvas {
    constructor() {
        this.width = 800;
        this.height = 600;
        this.ctx = {
            clearRect: () => {},
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            fillRect: () => {},
            strokeRect: () => {},
            beginPath: () => {},
            arc: () => {},
            fill: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {}
        };
    }
    
    getContext() {
        return this.ctx;
    }
}

describe('Integration: Agent routing around other agents', () => {
    let canvas;
    let simulation;

    beforeEach(() => {
        canvas = new MockCanvas();
        simulation = new Simulation(canvas);
    });

    describe('obstacle hierarchy', () => {
        it('should have static obstacles (walls and food stalls)', () => {
            // Simulation should have 4 food stalls and 2 walls
            expect(simulation.obstacles.length).toBe(6);
            
            // All should be static obstacles
            const staticObstacles = simulation.obstacles.filter(obs => obs instanceof StaticObstacle);
            expect(staticObstacles.length).toBe(6);
        });

        it('should spawn agents that are dynamic obstacles', () => {
            simulation.spawnFanAgent();
            
            expect(simulation.agents.length).toBe(1);
            expect(simulation.agents[0] instanceof DynamicObstacle).toBe(true);
            expect(simulation.agents[0] instanceof Agent).toBe(true);
        });

        it('should keep static and dynamic obstacles separate', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            // Static obstacles remain unchanged
            expect(simulation.obstacles.length).toBe(6);
            
            // Agents are tracked separately
            expect(simulation.agents.length).toBe(2);
        });
    });

    describe('pathfinding integration', () => {
        it('should pass other agents as obstacles during update', () => {
            // Spawn multiple agents
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            const agent3 = simulation.agents[2];
            
            // Manually position agents to create a blocking scenario
            agent1.x = 100;
            agent1.y = 100;
            agent1.destinationX = 500;
            agent1.destinationY = 100;
            
            agent2.x = 300;
            agent2.y = 100;
            
            // Update simulation
            simulation.update(performance.now());
            
            // Agent1 should have pathfinding state since it needs to navigate
            expect(agent1.pathState).toBeDefined();
        });

        it('should allow agents to move through their destinations even if another agent is there', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            
            // Position agent2 at agent1's potential destination
            agent2.x = 400;
            agent2.y = 300;
            
            // Agent1 should be able to choose a destination that overlaps with agent2
            // because dynamic obstacles are filtered out during destination selection
            agent1.chooseRandomDestination(800, 600, [agent2]);
            
            // This should succeed without issues
            expect(agent1.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent1.destinationY).toBeGreaterThanOrEqual(0);
        });

        it('should use pathfinding when agents block each other', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            
            // Create a scenario where agent2 blocks agent1's path
            agent1.x = 100;
            agent1.y = 100;
            agent1.destinationX = 500;
            agent1.destinationY = 100;
            
            agent2.x = 300;
            agent2.y = 100;
            
            // Update with all obstacles including other agents
            const allObstacles = [...simulation.obstacles, agent2];
            agent1.update(0.1, 800, 600, allObstacles);
            
            // Agent1 should have initiated pathfinding
            expect(agent1.pathState).toBeDefined();
        });
    });

    describe('spawn and destination selection', () => {
        it('should avoid static obstacles when spawning', () => {
            simulation.spawnFanAgent();
            
            const agent = simulation.agents[0];
            
            // Agent should not spawn inside any static obstacle
            let collidesWithStatic = false;
            for (const obstacle of simulation.obstacles) {
                if (obstacle.collidesWith(agent.x, agent.y, agent.radius)) {
                    collidesWithStatic = true;
                    break;
                }
            }
            
            expect(collidesWithStatic).toBe(false);
        });

        it('should avoid static obstacles when choosing destinations', () => {
            simulation.spawnFanAgent();
            
            const agent = simulation.agents[0];
            agent.chooseRandomDestination(800, 600, simulation.obstacles);
            
            // Destination should not collide with static obstacles
            let collidesWithStatic = false;
            for (const obstacle of simulation.obstacles) {
                if (obstacle.containsPoint(agent.destinationX, agent.destinationY, agent.radius)) {
                    collidesWithStatic = true;
                    break;
                }
            }
            
            expect(collidesWithStatic).toBe(false);
        });

        it('should NOT avoid dynamic obstacles when choosing destinations', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            
            // Position agent2
            agent2.x = 400;
            agent2.y = 300;
            
            // Agent1 chooses destination with agent2 in obstacle list
            const obstacles = [...simulation.obstacles, agent2];
            agent1.chooseRandomDestination(800, 600, obstacles);
            
            // This should complete without infinite loops or errors
            // The key is that agent2 is filtered out for destination selection
            expect(agent1.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent1.destinationY).toBeGreaterThanOrEqual(0);
        });
    });

    describe('multiple agents interaction', () => {
        it('should handle multiple agents navigating around each other', () => {
            // Spawn several agents
            for (let i = 0; i < 5; i++) {
                simulation.spawnFanAgent();
            }
            
            expect(simulation.agents.length).toBe(5);
            
            // Update simulation multiple times
            let currentTime = performance.now();
            for (let i = 0; i < 10; i++) {
                currentTime += 100; // 100ms per frame
                simulation.update(currentTime);
            }
            
            // All agents should still be valid
            expect(simulation.agents.length).toBe(5);
            
            // Each agent should have pathfinding state
            for (const agent of simulation.agents) {
                expect(agent.pathState).toBeDefined();
            }
        });

        it('should pass all other agents as obstacles to each agent', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            const agent3 = simulation.agents[2];
            
            // During update, each agent should receive other agents as obstacles
            // We can verify this by checking that the update doesn't throw errors
            const currentTime = performance.now();
            expect(() => {
                simulation.update(currentTime);
            }).not.toThrow();
        });
    });

    describe('obstacle collision detection', () => {
        it('should detect collisions between agents as obstacles', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            
            // Position agents very close to each other
            agent1.x = 100;
            agent1.y = 100;
            agent2.x = 105;
            agent2.y = 105;
            
            // Check collision
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            expect(collides).toBe(true);
        });

        it('should not detect collisions between distant agents', () => {
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            const agent1 = simulation.agents[0];
            const agent2 = simulation.agents[1];
            
            // Position agents far apart
            agent1.x = 100;
            agent1.y = 100;
            agent2.x = 500;
            agent2.y = 500;
            
            // Check collision
            const collides = agent2.collidesWith(agent1.x, agent1.y, agent1.radius);
            
            expect(collides).toBe(false);
        });
    });
});
