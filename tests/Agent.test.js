import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Agent } from '../js/Agent.js';

describe('Agent', () => {
    describe('constructor', () => {
        it('should create an agent with given position and default type', () => {
            const agent = new Agent(100, 200);
            
            expect(agent.x).toBe(100);
            expect(agent.y).toBe(200);
            expect(agent.type).toBe('fan');
            expect(agent.radius).toBe(5);
            expect(agent.destinationX).toBe(100);
            expect(agent.destinationY).toBe(200);
        });
        
        it('should create an agent with specified type', () => {
            const agent = new Agent(50, 75, 'security');
            
            expect(agent.type).toBe('security');
        });
        
        it('should initialize velocity within expected range', () => {
            const agent = new Agent(100, 200);
            
            expect(agent.vx).toBeGreaterThanOrEqual(-50);
            expect(agent.vx).toBeLessThanOrEqual(50);
            expect(agent.vy).toBeGreaterThanOrEqual(-50);
            expect(agent.vy).toBeLessThanOrEqual(50);
        });
        
        it('should set color based on type', () => {
            const agent = new Agent(100, 200);
            
            expect(agent.color).toBeDefined();
            expect(typeof agent.color).toBe('string');
        });
    });
    
    describe('getColorForType', () => {
        let agent;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
        });
        
        it('should return pale orange for fan type', () => {
            const color = agent.getColorForType('fan');
            
            expect(color).toBe('#FFB380');
        });
        
        it('should return yellow for security type', () => {
            const color = agent.getColorForType('security');
            
            expect(color).toBe('yellow');
        });
        
        it('should return red for performer type', () => {
            const color = agent.getColorForType('performer');
            
            expect(color).toBe('red');
        });
        
        it('should return blue for unknown type', () => {
            const color = agent.getColorForType('unknown');
            
            expect(color).toBe('blue');
        });
    });
    
    describe('update', () => {
        let agent;
        
        beforeEach(() => {
            agent = new Agent(400, 300);
            agent.vx = 100; // 100 pixels per second to the right
            agent.vy = 50;  // 50 pixels per second down
        });
        
        it('should update position based on velocity and deltaTime', () => {
            const deltaTime = 0.1; // 0.1 seconds
            const initialX = agent.x;
            const initialY = agent.y;
            
            agent.update(deltaTime, 800, 600);
            
            expect(agent.x).toBe(initialX + agent.vx * deltaTime);
            expect(agent.y).toBe(initialY + agent.vy * deltaTime);
        });
        
        it('should update destination coordinates', () => {
            agent.update(0.1, 800, 600);
            
            expect(agent.destinationX).toBeDefined();
            expect(agent.destinationY).toBeDefined();
            expect(typeof agent.destinationX).toBe('number');
            expect(typeof agent.destinationY).toBe('number');
        });
        
        it('should bounce off left wall', () => {
            agent.x = 3; // Near left edge
            agent.vx = -100; // Moving left
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vx).toBe(100); // Velocity reversed
            expect(agent.x).toBeGreaterThanOrEqual(agent.radius); // Clamped to radius
        });
        
        it('should bounce off right wall', () => {
            agent.x = 797; // Near right edge
            agent.vx = 100; // Moving right
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vx).toBe(-100); // Velocity reversed
            expect(agent.x).toBeLessThanOrEqual(800 - agent.radius); // Clamped
        });
        
        it('should bounce off top wall', () => {
            agent.y = 3; // Near top edge
            agent.vy = -100; // Moving up
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vy).toBe(100); // Velocity reversed
            expect(agent.y).toBeGreaterThanOrEqual(agent.radius); // Clamped to radius
        });
        
        it('should bounce off bottom wall', () => {
            agent.y = 597; // Near bottom edge
            agent.vy = 100; // Moving down
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vy).toBe(-100); // Velocity reversed
            expect(agent.y).toBeLessThanOrEqual(600 - agent.radius); // Clamped
        });
        
        it('should not change velocity when not hitting walls', () => {
            const initialVx = agent.vx;
            const initialVy = agent.vy;
            
            agent.update(0.01, 800, 600); // Small time step in middle of canvas
            
            expect(agent.vx).toBe(initialVx);
            expect(agent.vy).toBe(initialVy);
        });
        
        it('should handle collision with left wall when x equals radius', () => {
            agent.x = agent.radius - 1;
            agent.vx = -100;
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vx).toBe(100);
            expect(agent.x).toBe(agent.radius);
        });
        
        it('should handle collision with right wall when x equals width minus radius', () => {
            agent.x = 800 - agent.radius + 1;
            agent.vx = 100;
            
            agent.update(0.1, 800, 600);
            
            expect(agent.vx).toBe(-100);
            expect(agent.x).toBe(800 - agent.radius);
        });
    });
    
    describe('draw', () => {
        let agent;
        let mockCtx;
        
        beforeEach(() => {
            agent = new Agent(100, 200, 'fan');
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                stroke: jest.fn()
            };
        });
        
        it('should set fillStyle to agent color', () => {
            agent.draw(mockCtx);
            
            expect(mockCtx.fillStyle).toBe(agent.color);
        });
        
        it('should call beginPath', () => {
            agent.draw(mockCtx);
            
            expect(mockCtx.beginPath).toHaveBeenCalled();
        });
        
        it('should draw arc with correct parameters', () => {
            agent.draw(mockCtx);
            
            expect(mockCtx.arc).toHaveBeenCalledWith(
                agent.x,
                agent.y,
                agent.radius,
                0,
                Math.PI * 2
            );
        });
        
        it('should call fill to draw the agent', () => {
            agent.draw(mockCtx);
            
            expect(mockCtx.fill).toHaveBeenCalled();
        });
        
        it('should draw destination line when showDestination is true', () => {
            agent.draw(mockCtx, true);
            
            expect(mockCtx.strokeStyle).toBe('#00FF00');
            expect(mockCtx.moveTo).toHaveBeenCalledWith(agent.x, agent.y);
            expect(mockCtx.lineTo).toHaveBeenCalledWith(agent.destinationX, agent.destinationY);
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
        
        it('should not draw destination line when showDestination is false', () => {
            agent.draw(mockCtx, false);
            
            expect(mockCtx.stroke).not.toHaveBeenCalled();
            expect(mockCtx.moveTo).not.toHaveBeenCalled();
            expect(mockCtx.lineTo).not.toHaveBeenCalled();
        });
        
        it('should call methods in correct order', () => {
            const calls = [];
            mockCtx.beginPath = jest.fn(() => calls.push('beginPath'));
            mockCtx.arc = jest.fn(() => calls.push('arc'));
            mockCtx.fill = jest.fn(() => calls.push('fill'));
            
            agent.draw(mockCtx);
            
            expect(calls).toEqual(['beginPath', 'arc', 'fill']);
        });
    });
});
