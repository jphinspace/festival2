import { describe, it, expect, beforeEach } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { Wall } from '../js/Wall.js';
import { MovingState } from '../js/AgentState.js';

describe('Agent Movement Collision Detection', () => {
    let agent;
    let obstacles;
    let wall;

    beforeEach(() => {
        // Create a wall obstacle
        wall = new Wall(50, 50, 20, 20);
        obstacles = [wall];
    });

    describe('MovingState collision prevention', () => {
        it('should not move agent through obstacle with normal deltaTime', () => {
            // Create agent outside the wall
            agent = new Agent(30, 50, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination on the other side of wall (would require going through)
            agent.destinationX = 65;
            agent.destinationY = 50;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Update with normal frame time (16ms for 60fps)
            const deltaTime = 0.016;
            
            // Run multiple updates
            for (let i = 0; i < 20; i++) {
                agent.update(deltaTime, 800, 600, obstacles);
                
                // Agent should never be inside the obstacle
                const inObstacle = wall.collidesWith(agent.x, agent.y, agent.radius);
                expect(inObstacle).toBe(false);
            }
        });

        it('should not move agent through obstacle with large deltaTime', () => {
            // Create agent outside the wall
            agent = new Agent(30, 50, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination on the other side of wall
            agent.destinationX = 65;
            agent.destinationY = 50;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Update with large frame time (100ms)
            const deltaTime = 0.1;
            
            // Run multiple updates
            for (let i = 0; i < 10; i++) {
                agent.update(deltaTime, 800, 600, obstacles);
                
                // Agent should never be inside the obstacle
                const inObstacle = wall.collidesWith(agent.x, agent.y, agent.radius);
                expect(inObstacle).toBe(false);
            }
        });

        it('should not move agent through obstacle with very large deltaTime', () => {
            // Create agent outside the wall
            agent = new Agent(30, 50, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination on the other side of wall
            agent.destinationX = 65;
            agent.destinationY = 50;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Update with huge frame time (500ms) that would cause agent to jump far
            const deltaTime = 0.5;
            
            // Run multiple updates
            for (let i = 0; i < 5; i++) {
                agent.update(deltaTime, 800, 600, obstacles);
                
                // Agent should never be inside the obstacle
                const inObstacle = wall.collidesWith(agent.x, agent.y, agent.radius);
                expect(inObstacle).toBe(false);
            }
        });

        it('should allow agent to move when no obstacles block the path', () => {
            // Create agent in open space
            agent = new Agent(10, 10, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination in open space (not blocked by wall)
            agent.destinationX = 20;
            agent.destinationY = 10;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            const initialX = agent.x;
            
            // Update with normal frame time
            agent.update(0.016, 800, 600, obstacles);
            
            // Agent should have moved
            expect(agent.x).not.toBe(initialX);
        });

        it('should allow agent to navigate around obstacle', () => {
            // Create agent on one side of wall
            agent = new Agent(30, 30, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination on the other side (will require pathfinding around)
            agent.destinationX = 70;
            agent.destinationY = 70;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Run many updates to allow agent to navigate around
            for (let i = 0; i < 100; i++) {
                const beforeX = agent.x;
                const beforeY = agent.y;
                
                agent.update(0.016, 800, 600, obstacles);
                
                // Agent should never be inside the obstacle
                const inObstacle = wall.collidesWith(agent.x, agent.y, agent.radius);
                expect(inObstacle).toBe(false);
                
                // Check if reached destination
                const dx = agent.destinationX - agent.x;
                const dy = agent.destinationY - agent.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 5) {
                    // Reached destination successfully
                    break;
                }
            }
        });

        it('should prevent movement when agent would collide at any frame rate', () => {
            // Create agent very close to wall edge
            agent = new Agent(34, 50, 'fan');
            agent.obstacles = obstacles;
            
            // Set destination inside or through the wall
            agent.destinationX = 50;
            agent.destinationY = 50;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Test with various frame times
            const deltaTimes = [0.001, 0.016, 0.033, 0.1, 0.5];
            
            for (const dt of deltaTimes) {
                const testAgent = new Agent(34, 50, 'fan');
                testAgent.obstacles = obstacles;
                testAgent.destinationX = 50;
                testAgent.destinationY = 50;
                testAgent.transitionTo(new MovingState(), 800, 600);
                
                // Single update
                testAgent.update(dt, 800, 600, obstacles);
                
                // Agent should not be inside obstacle
                const inObstacle = wall.collidesWith(testAgent.x, testAgent.y, testAgent.radius);
                expect(inObstacle).toBe(false);
            }
        });

        it('should handle multiple obstacles correctly', () => {
            // Create multiple obstacles
            const wall1 = new Wall(30, 30, 20, 20);
            const wall2 = new Wall(70, 70, 20, 20);
            const multiObstacles = [wall1, wall2];
            
            // Create agent between obstacles
            agent = new Agent(50, 50, 'fan');
            agent.obstacles = multiObstacles;
            
            // Set destination that requires navigating around both
            agent.destinationX = 90;
            agent.destinationY = 90;
            
            // Transition to moving state
            agent.transitionTo(new MovingState(), 800, 600);
            
            // Run updates
            for (let i = 0; i < 50; i++) {
                agent.update(0.016, 800, 600, multiObstacles);
                
                // Agent should not be inside any obstacle
                for (const obstacle of multiObstacles) {
                    const inObstacle = obstacle.collidesWith(agent.x, agent.y, agent.radius);
                    expect(inObstacle).toBe(false);
                }
            }
        });
    });
});
