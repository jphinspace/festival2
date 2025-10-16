import { describe, it, expect } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { MovingState, IdleState } from '../js/AgentState.js';

describe('Agent collision with idle agents', () => {
    it('should detect collision between moving agent and idle agent', () => {
        const movingAgent = new Agent(100, 100);
        const idleAgent = new Agent(110, 100); // 10 pixels away
        
        movingAgent.transitionTo(new MovingState(), 800, 600);
        movingAgent.destinationX = 500;
        movingAgent.destinationY = 100;
        
        // Idle agent should be in idle state
        idleAgent.state = new IdleState();
        idleAgent.state.enter(idleAgent, 800, 600, []);
        
        // Check if idleAgent blocks movingAgent's path
        const collides = idleAgent.collidesWith(movingAgent.x, movingAgent.y, movingAgent.radius);
        
        expect(collides).toBe(true);
    });
    
    it('should use pathfinding to route around idle agents', () => {
        const movingAgent = new Agent(100, 100);
        const idleAgent = new Agent(150, 100); // Blocking the direct path
        
        movingAgent.transitionTo(new MovingState(), 800, 600);
        movingAgent.destinationX = 200;
        movingAgent.destinationY = 100;
        
        // Make sure idle agent is actually idle
        idleAgent.state = new IdleState();
        idleAgent.state.enter(idleAgent, 800, 600, []);
        
        // Update moving agent with idle agent as obstacle
        const obstacles = [idleAgent];
        movingAgent.update(0.1, 800, 600, obstacles);
        
        // Moving agent should have pathfinding state initialized
        expect(movingAgent.pathState).toBeDefined();
    });
    
    it('should not walk through idle agents during movement', () => {
        const movingAgent = new Agent(100, 100);
        const idleAgent = new Agent(120, 100); // Very close, blocking path
        
        movingAgent.transitionTo(new MovingState(), 800, 600);
        movingAgent.destinationX = 500;
        movingAgent.destinationY = 100;
        
        // Idle agent in idle state
        idleAgent.state = new IdleState();
        idleAgent.state.enter(idleAgent, 800, 600, []);
        
        const initialDistance = Math.sqrt(
            Math.pow(movingAgent.x - idleAgent.x, 2) + 
            Math.pow(movingAgent.y - idleAgent.y, 2)
        );
        
        // Update moving agent multiple times with idle agent as obstacle
        const obstacles = [idleAgent];
        for (let i = 0; i < 10; i++) {
            movingAgent.update(0.1, 800, 600, obstacles);
        }
        
        const finalDistance = Math.sqrt(
            Math.pow(movingAgent.x - idleAgent.x, 2) + 
            Math.pow(movingAgent.y - idleAgent.y, 2)
        );
        
        // Agent should not get closer to idle agent than initial distance minus radius
        // (allowing for some movement but not walking through)
        expect(finalDistance).toBeGreaterThan(movingAgent.radius + idleAgent.radius - 5);
    });
    
    it('should prevent moving agent from colliding with idle agent', () => {
        const movingAgent = new Agent(100, 100);
        const idleAgent = new Agent(115, 100); // 15 pixels away
        
        // Set up moving agent heading straight towards idle agent
        movingAgent.transitionTo(new MovingState(), 800, 600);
        movingAgent.destinationX = 500;
        movingAgent.destinationY = 100;
        
        // Idle agent stays still
        idleAgent.state = new IdleState();
        idleAgent.state.enter(idleAgent, 800, 600, []);
        
        // Update moving agent with idle agent as obstacle
        const obstacles = [idleAgent];
        
        // Simulate multiple updates
        for (let i = 0; i < 20; i++) {
            const oldX = movingAgent.x;
            movingAgent.update(0.1, 800, 600, obstacles);
            
            // Check that moving agent doesn't collide with idle agent
            const collides = idleAgent.collidesWith(movingAgent.x, movingAgent.y, movingAgent.radius);
            expect(collides).toBe(false);
            
            // If agent stopped moving, break (it's stuck)
            if (Math.abs(movingAgent.x - oldX) < 0.001) {
                break;
            }
        }
    });
    
    it('should maintain minimum distance from idle agents', () => {
        const movingAgent = new Agent(100, 100);
        const idleAgent = new Agent(130, 100); // 30 pixels away
        
        movingAgent.transitionTo(new MovingState(), 800, 600);
        movingAgent.destinationX = 500;
        movingAgent.destinationY = 100;
        
        idleAgent.state = new IdleState();
        idleAgent.state.enter(idleAgent, 800, 600, []);
        
        const obstacles = [idleAgent];
        const minAllowedDistance = movingAgent.radius + idleAgent.radius;
        
        // Simulate movement
        for (let i = 0; i < 30; i++) {
            movingAgent.update(0.05, 800, 600, obstacles);
            
            const distance = Math.sqrt(
                Math.pow(movingAgent.x - idleAgent.x, 2) + 
                Math.pow(movingAgent.y - idleAgent.y, 2)
            );
            
            // Distance should never be less than combined radii
            expect(distance).toBeGreaterThanOrEqual(minAllowedDistance - 0.1); // Small tolerance for floating point
        }
    });
});
