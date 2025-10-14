import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { IdleState, MovingState } from '../js/AgentState.js';

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
        
        it('should initialize state to IdleState', () => {
            const agent = new Agent(100, 200);
            
            expect(agent.state instanceof IdleState).toBe(true);
        });
        
        it('should initialize idleTimer to 1000', () => {
            const agent = new Agent(100, 200);
            
            expect(agent.idleTimer).toBe(1000);
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
    
    describe('chooseRandomDestination', () => {
        let agent;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
        });
        
        it('should set destination within canvas bounds', () => {
            agent.chooseRandomDestination(800, 600);
            
            expect(agent.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
        });
        
        it('should change destination from current values', () => {
            const initialDestX = agent.destinationX;
            const initialDestY = agent.destinationY;
            
            // Run multiple times to ensure it changes (random)
            let changed = false;
            for (let i = 0; i < 10; i++) {
                agent.chooseRandomDestination(800, 600);
                if (agent.destinationX !== initialDestX || agent.destinationY !== initialDestY) {
                    changed = true;
                    break;
                }
            }
            
            expect(changed).toBe(true);
        });
    });
    
    describe('update', () => {
        let agent;
        
        beforeEach(() => {
            agent = new Agent(400, 300);
            agent.vx = 100; // 100 pixels per second to the right
            agent.vy = 50;  // 50 pixels per second down
        });
        
        describe('IDLE state', () => {
            it('should not move when in IDLE state', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 500;
                const initialX = agent.x;
                const initialY = agent.y;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.x).toBe(initialX);
                expect(agent.y).toBe(initialY);
            });
            
            it('should decrement idleTimer by ticks elapsed', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 1000;
                
                // deltaTime of 0.1 seconds = 100 ticks at 1000 ticks/sec
                agent.update(0.1, 800, 600);
                
                expect(agent.idleTimer).toBe(900);
            });
            
            it('should transition to MOVING when timer reaches 0', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 50;
                agent.destinationX = agent.x;
                agent.destinationY = agent.y;
                
                // deltaTime of 0.1 seconds = 100 ticks
                agent.update(0.1, 800, 600);
                
                expect(agent.state instanceof MovingState).toBe(true);
                expect(agent.idleTimer).toBe(0);
            });
            
            it('should set idleTimer to 0 if it goes negative', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 10;
                
                // deltaTime of 0.1 seconds = 100 ticks
                agent.update(0.1, 800, 600);
                
                expect(agent.idleTimer).toBe(0);
            });
            
            it('should leave idleTimer at 0 if it is exactly 0 when timer expires', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 100;
                agent.destinationX = agent.x;
                agent.destinationY = agent.y;
                
                // deltaTime of 0.1 seconds = 100 ticks (exactly matches timer)
                agent.update(0.1, 800, 600);
                
                expect(agent.idleTimer).toBe(0);
                expect(agent.state instanceof MovingState).toBe(true);
            });
            
            it('should choose new destination when transitioning to MOVING', () => {
                agent.state = new IdleState();
                agent.state.enter(agent, 800, 600);
                agent.idleTimer = 50;
                agent.destinationX = agent.x;
                agent.destinationY = agent.y;
                
                agent.update(0.1, 800, 600);
                
                // Destination should change from current position
                const destChanged = agent.destinationX !== agent.x || agent.destinationY !== agent.y;
                expect(destChanged).toBe(true);
            });
        });
        
        describe('MOVING state', () => {
            it('should move towards destination', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 200;
                agent.destinationY = 200;
                
                const initialX = agent.x;
                const initialY = agent.y;
                
                agent.update(0.1, 800, 600);
                
                // Should have moved closer to destination
                const newDx = agent.destinationX - agent.x;
                const newDy = agent.destinationY - agent.y;
                const initialDx = agent.destinationX - initialX;
                const initialDy = agent.destinationY - initialY;
                const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
                const initialDist = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
                
                expect(newDist).toBeLessThan(initialDist);
            });
            
            it('should not move if speed is 0', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.vx = 0;
                agent.vy = 0;
                agent.destinationX = 200;
                agent.destinationY = 200;
                
                const initialX = agent.x;
                const initialY = agent.y;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.x).toBe(initialX);
                expect(agent.y).toBe(initialY);
            });
            
            it('should transition to IDLE when reaching destination', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 103;
                agent.destinationY = 103;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.state instanceof IdleState).toBe(true);
            });
            
            it('should reset idleTimer to 1000 when transitioning to IDLE', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 103;
                agent.destinationY = 103;
                agent.idleTimer = 0;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.idleTimer).toBe(1000);
            });
            
            it('should set destination to current location when reaching destination', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 103;
                agent.destinationY = 103;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.destinationX).toBe(agent.x);
                expect(agent.destinationY).toBe(agent.y);
            });
            
            it('should consider within 5 units as reaching destination', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 104;
                agent.destinationY = 103;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.state instanceof IdleState).toBe(true);
            });
            
            it('should not transition if more than 5 units away', () => {
                agent.state = new MovingState();
                agent.state.enter(agent, 800, 600);
                agent.x = 100;
                agent.y = 100;
                agent.destinationX = 110;
                agent.destinationY = 110;
                
                agent.update(0.1, 800, 600);
                
                expect(agent.state instanceof MovingState).toBe(true);
            });
        });
        
        it('should update destination coordinates', () => {
            agent.update(0.1, 800, 600);
            
            expect(agent.destinationX).toBeDefined();
            expect(agent.destinationY).toBeDefined();
            expect(typeof agent.destinationX).toBe('number');
            expect(typeof agent.destinationY).toBe('number');
        });
        
        it('should clamp position to canvas bounds', () => {
            agent.state = new MovingState();
            agent.state.enter(agent, 800, 600);
            agent.x = 1;
            agent.y = 1;
            agent.destinationX = -100;
            agent.destinationY = -100;
            
            agent.update(0.1, 800, 600);
            
            expect(agent.x).toBeGreaterThanOrEqual(agent.radius);
            expect(agent.y).toBeGreaterThanOrEqual(agent.radius);
        });
        
        it('should clamp destination to canvas bounds', () => {
            agent.destinationX = 1000;
            agent.destinationY = 1000;
            
            agent.update(0.1, 800, 600);
            
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
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
