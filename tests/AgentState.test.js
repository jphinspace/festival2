import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentState, IdleState, MovingState } from '../js/AgentState.js';
import { Agent } from '../js/Agent.js';

describe('AgentState', () => {
    describe('Base AgentState class', () => {
        it('should have enter method', () => {
            const state = new AgentState();
            expect(typeof state.enter).toBe('function');
        });
        
        it('should have update method', () => {
            const state = new AgentState();
            expect(typeof state.update).toBe('function');
        });
        
        it('should have exit method', () => {
            const state = new AgentState();
            expect(typeof state.exit).toBe('function');
        });
        
        it('should have getName method', () => {
            const state = new AgentState();
            expect(typeof state.getName).toBe('function');
            expect(state.getName()).toBe('AgentState');
        });
        
        it('should have getColor method', () => {
            const state = new AgentState();
            expect(typeof state.getColor).toBe('function');
        });
        
        it('should return null for default getColor', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(state.getColor(agent)).toBe(null);
        });
    });
    
    describe('IdleState', () => {
        let agent;
        let idleState;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
            idleState = new IdleState();
        });
        
        it('should extend AgentState', () => {
            expect(idleState instanceof AgentState).toBe(true);
        });
        
        it('should have getName return IdleState', () => {
            expect(idleState.getName()).toBe('IdleState');
        });
        
        it('should set idleTimer to 1000 on enter', () => {
            agent.idleTimer = 0;
            idleState.enter(agent, 800, 600);
            expect(agent.idleTimer).toBe(1000);
        });
        
        it('should set destination to current position on enter', () => {
            agent.x = 150;
            agent.y = 250;
            agent.destinationX = 500;
            agent.destinationY = 500;
            
            idleState.enter(agent, 800, 600);
            
            expect(agent.destinationX).toBe(150);
            expect(agent.destinationY).toBe(250);
        });
        
        it('should decrement timer during update', () => {
            agent.state = idleState;
            agent.idleTimer = 1000;
            
            idleState.update(agent, 0.1, 800, 600);
            
            expect(agent.idleTimer).toBe(900);
        });
        
        it('should transition to MovingState when timer expires', () => {
            agent.state = idleState;
            agent.idleTimer = 50;
            
            idleState.update(agent, 0.1, 800, 600);
            
            expect(agent.state instanceof MovingState).toBe(true);
            expect(agent.idleTimer).toBe(0);
        });
        
        it('should return dark red color', () => {
            expect(idleState.getColor(agent)).toBe('#8B0000');
        });
    });
    
    describe('MovingState', () => {
        let agent;
        let movingState;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
            movingState = new MovingState();
        });
        
        it('should extend AgentState', () => {
            expect(movingState instanceof AgentState).toBe(true);
        });
        
        it('should have getName return MovingState', () => {
            expect(movingState.getName()).toBe('MovingState');
        });
        
        it('should set idleTimer to 0 on enter', () => {
            agent.idleTimer = 1000;
            movingState.enter(agent, 800, 600);
            expect(agent.idleTimer).toBe(0);
        });
        
        it('should choose random destination on enter', () => {
            agent.destinationX = agent.x;
            agent.destinationY = agent.y;
            
            movingState.enter(agent, 800, 600);
            
            // Destination should change (with very high probability)
            const destChanged = agent.destinationX !== agent.x || agent.destinationY !== agent.y;
            expect(destChanged).toBe(true);
        });
        
        it('should move agent towards destination during update', () => {
            agent.state = movingState;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            const initialX = agent.x;
            const initialY = agent.y;
            
            movingState.update(agent, 0.1, 800, 600);
            
            // Agent should have moved closer to destination
            const dx = agent.destinationX - agent.x;
            const dy = agent.destinationY - agent.y;
            const initialDx = agent.destinationX - initialX;
            const initialDy = agent.destinationY - initialY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            const initialDist = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
            
            expect(newDist).toBeLessThan(initialDist);
        });
        
        it('should transition to IdleState when reaching destination', () => {
            agent.state = movingState;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 103;
            agent.destinationY = 103;
            
            movingState.update(agent, 0.1, 800, 600);
            
            expect(agent.state instanceof IdleState).toBe(true);
        });
        
        it('should return null for color (use agent type color)', () => {
            expect(movingState.getColor(agent)).toBe(null);
        });
    });
});
