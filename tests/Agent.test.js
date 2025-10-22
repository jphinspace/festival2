import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Agent } from '../js/Agent.js';
import { IdleState, MovingState } from '../js/AgentState.js';
import { Obstacle } from '../js/Obstacle.js';
import { SpecialMovementZone } from '../js/SpecialMovementZone.js';

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

        it('should avoid obstacles when choosing destination', () => {
            const obstacles = [new Obstacle(400, 300, 100, 100)];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Check that destination doesn't collide with obstacle
            let collides = false;
            for (const obstacle of obstacles) {
                if (obstacle.containsPoint(agent.destinationX, agent.destinationY, agent.radius)) {
                    collides = true;
                    break;
                }
            }
            
            // Most of the time, should avoid obstacle
            expect(collides).toBe(false);
        });

        it('should fallback to random location if cannot find clear spot', () => {
            // Create obstacles that cover almost entire canvas
            const obstacles = [
                new Obstacle(200, 200, 400, 400),
                new Obstacle(600, 200, 400, 400),
                new Obstacle(200, 500, 400, 200),
                new Obstacle(600, 500, 400, 200)
            ];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Should still set a destination even if it collides
            expect(agent.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
        });

        it('should avoid special movement zones when choosing destination', () => {
            const zone = new SpecialMovementZone(400, 300, 100, 100, 'entranceway');
            agent.specialMovementZones = [zone];
            
            agent.chooseRandomDestination(800, 600, []);
            
            // Check that destination doesn't collide with zone
            let collidesWithZone = false;
            for (const z of agent.specialMovementZones) {
                if (z.containsPoint(agent.destinationX, agent.destinationY, agent.radius)) {
                    collidesWithZone = true;
                    break;
                }
            }
            
            // Most of the time, should avoid zone
            expect(collidesWithZone).toBe(false);
        });

        it('should avoid both obstacles and special movement zones', () => {
            const obstacles = [new Obstacle(200, 200, 100, 100)];
            const zone = new SpecialMovementZone(600, 400, 100, 100, 'entranceway');
            agent.specialMovementZones = [zone];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Check that destination doesn't collide with obstacle or zone
            let collides = false;
            for (const obstacle of obstacles) {
                if (obstacle.containsPoint(agent.destinationX, agent.destinationY, agent.radius)) {
                    collides = true;
                    break;
                }
            }
            for (const z of agent.specialMovementZones) {
                if (z.containsPoint(agent.destinationX, agent.destinationY, agent.radius)) {
                    collides = true;
                    break;
                }
            }
            
            expect(collides).toBe(false);
        });

        it('should handle empty special movement zones array', () => {
            agent.specialMovementZones = [];
            const obstacles = [new Obstacle(400, 300, 100, 100)];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Should still set a destination
            expect(agent.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
        });

        it('should handle undefined special movement zones', () => {
            agent.specialMovementZones = undefined;
            const obstacles = [new Obstacle(400, 300, 100, 100)];
            
            agent.chooseRandomDestination(800, 600, obstacles);
            
            // Should still set a destination
            expect(agent.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
        });

        it('should fallback to random location when zones and obstacles cover entire area', () => {
            // Cover entire canvas with a zone
            const zone = new SpecialMovementZone(400, 300, 800, 600, 'entranceway');
            agent.specialMovementZones = [zone];
            
            agent.chooseRandomDestination(800, 600, []);
            
            // Should still set a destination even if it collides with zone
            expect(agent.destinationX).toBeGreaterThanOrEqual(0);
            expect(agent.destinationX).toBeLessThanOrEqual(800);
            expect(agent.destinationY).toBeGreaterThanOrEqual(0);
            expect(agent.destinationY).toBeLessThanOrEqual(600);
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
        
        it('should set fillStyle to state color when in IdleState', () => {
            agent.draw(mockCtx);
            
            expect(mockCtx.fillStyle).toBe('#8B0000'); // Dark red for idle
        });
        
        it('should set fillStyle to agent type color when in MovingState', () => {
            agent.transitionTo(new MovingState(), 800, 600);
            agent.draw(mockCtx);
            
            expect(mockCtx.fillStyle).toBe(agent.color); // Type color for moving
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
        
        it('should draw white outline when isSelected is true', () => {
            agent.draw(mockCtx, false, true);
            
            expect(mockCtx.strokeStyle).toBe('#FFFFFF');
            expect(mockCtx.lineWidth).toBe(2);
            // arc should be called twice: once for fill, once for stroke
            expect(mockCtx.arc).toHaveBeenCalledTimes(2);
            expect(mockCtx.stroke).toHaveBeenCalled();
        });
        
        it('should not draw outline when isSelected is false', () => {
            // Reset mock to track only this call
            mockCtx.stroke = jest.fn();
            mockCtx.arc = jest.fn();
            
            agent.draw(mockCtx, false, false);
            
            // arc should only be called once for fill (not for stroke)
            expect(mockCtx.arc).toHaveBeenCalledTimes(1);
            expect(mockCtx.stroke).not.toHaveBeenCalled();
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
    
    describe('getSpeed', () => {
        it('should return the magnitude of velocity', () => {
            const agent = new Agent(100, 200);
            agent.vx = 30;
            agent.vy = 40;
            
            const speed = agent.getSpeed();
            
            expect(speed).toBe(50); // sqrt(30^2 + 40^2) = 50
        });
        
        it('should return 0 when agent is not moving', () => {
            const agent = new Agent(100, 200);
            agent.vx = 0;
            agent.vy = 0;
            
            const speed = agent.getSpeed();
            
            expect(speed).toBe(0);
        });
        
        it('should handle negative velocities', () => {
            const agent = new Agent(100, 200);
            agent.vx = -30;
            agent.vy = -40;
            
            const speed = agent.getSpeed();
            
            expect(speed).toBe(50);
        });
    });
    
    describe('getDirection', () => {
        it('should return 0 degrees for north direction', () => {
            const agent = new Agent(100, 200);
            agent.vx = 0;
            agent.vy = -10; // Moving north (negative y)
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(0);
        });
        
        it('should return 90 degrees for east direction', () => {
            const agent = new Agent(100, 200);
            agent.vx = 10; // Moving east (positive x)
            agent.vy = 0;
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(90);
        });
        
        it('should return 180 degrees for south direction', () => {
            const agent = new Agent(100, 200);
            agent.vx = 0;
            agent.vy = 10; // Moving south (positive y)
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(180);
        });
        
        it('should return 270 degrees for west direction', () => {
            const agent = new Agent(100, 200);
            agent.vx = -10; // Moving west (negative x)
            agent.vy = 0;
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(270);
        });
        
        it('should handle diagonal directions (northeast)', () => {
            const agent = new Agent(100, 200);
            agent.vx = 10;
            agent.vy = -10;
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(45);
        });
        
        it('should handle diagonal directions (southeast)', () => {
            const agent = new Agent(100, 200);
            agent.vx = 10;
            agent.vy = 10;
            
            const direction = agent.getDirection();
            
            expect(direction).toBe(135);
        });
        
        it('should normalize angles to 0-360 range', () => {
            const agent = new Agent(100, 200);
            agent.vx = -10;
            agent.vy = -10;
            
            const direction = agent.getDirection();
            
            expect(direction).toBeGreaterThanOrEqual(0);
            expect(direction).toBeLessThan(360);
        });
    });
    
    describe('getPathfindingMode', () => {
        it('should return "bug" when pathState.mode is not set', () => {
            const agent = new Agent(100, 200);
            agent.pathState = {};
            
            const mode = agent.getPathfindingMode();
            
            expect(mode).toBe('bug');
        });
        
        it('should return "bug" when pathState.mode is "bug"', () => {
            const agent = new Agent(100, 200);
            agent.pathState = { mode: 'bug' };
            
            const mode = agent.getPathfindingMode();
            
            expect(mode).toBe('bug');
        });
        
        it('should return "astar" when pathState.mode is "astar"', () => {
            const agent = new Agent(100, 200);
            agent.pathState = { mode: 'astar' };
            
            const mode = agent.getPathfindingMode();
            
            expect(mode).toBe('astar');
        });
    });
});
