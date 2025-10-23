import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { 
    AgentState, 
    IdleState, 
    MovingState, 
    MovingToFoodStallState,
    calculateFoodStallTransitionProbability,
    shouldTransitionToFoodStall,
    getFoodStallRegions,
    chooseRandomFoodStallRegion,
    getDestinationInRegion
} from '../js/AgentState.js';
import { Agent } from '../js/Agent.js';
import { FoodStall } from '../js/FoodStall.js';
import { Obstacle } from '../js/Obstacle.js';

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
        
        it('should return magenta for default getColor', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(state.getColor(agent)).toBe('magenta');
        });

        it('should call enter without errors with obstacles', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(() => state.enter(agent, 800, 600, [])).not.toThrow();
        });

        it('should call enter without errors without obstacles parameter', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(() => state.enter(agent, 800, 600)).not.toThrow();
        });

        it('should call update without errors with obstacles', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(() => state.update(agent, 0.1, 800, 600, [])).not.toThrow();
        });

        it('should call update without errors without obstacles parameter', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(() => state.update(agent, 0.1, 800, 600)).not.toThrow();
        });

        it('should call exit without errors', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            expect(() => state.exit(agent)).not.toThrow();
        });
        
        it('should initialize with empty timers map', () => {
            const state = new AgentState();
            expect(state.timers).toBeInstanceOf(Map);
            expect(state.timers.size).toBe(0);
        });
        
        it('should add timer correctly', () => {
            const state = new AgentState();
            const callback = jest.fn();
            state.addTimer('test', 1000, callback);
            
            expect(state.timers.has('test')).toBe(true);
            expect(state.timers.get('test').interval).toBe(1000);
            expect(state.timers.get('test').elapsed).toBe(0);
        });
        
        it('should remove timer correctly', () => {
            const state = new AgentState();
            const callback = jest.fn();
            state.addTimer('test', 1000, callback);
            expect(state.timers.has('test')).toBe(true);
            
            state.removeTimer('test');
            expect(state.timers.has('test')).toBe(false);
        });
        
        it('should fire timer callback when interval elapses', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            const callback = jest.fn();
            
            state.addTimer('test', 1000, callback);
            state.updateTimers(agent, 1.0, 800, 600, []);
            
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(agent, 800, 600, []);
        });
        
        it('should fire timer callback multiple times for large delta', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            const callback = jest.fn();
            
            state.addTimer('test', 1000, callback);
            state.updateTimers(agent, 3.5, 800, 600, []);
            
            expect(callback).toHaveBeenCalledTimes(3);
        });
        
        it('should not fire timer callback before interval elapses', () => {
            const state = new AgentState();
            const agent = new Agent(100, 200);
            const callback = jest.fn();
            
            state.addTimer('test', 1000, callback);
            state.updateTimers(agent, 0.5, 800, 600, []);
            
            expect(callback).not.toHaveBeenCalled();
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
        
        it('should return agent type color for moving state', () => {
            expect(movingState.getColor(agent)).toBe(agent.color);
        });
        
        it('should transition to MovingToFoodStallState when hunger check passes after 1000 ticks', () => {
            agent.state = movingState;
            agent.state.enter(agent, 800, 600, []);
            agent.hunger = 100; // High hunger
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            // Mock Math.random to always return 0 (always transition)
            const originalRandom = Math.random;
            Math.random = () => 0;
            
            // Update with 1.0 second (1000 ticks) to trigger timer
            movingState.update(agent, 1.0, 800, 600, []);
            
            Math.random = originalRandom;
            
            expect(agent.state instanceof MovingToFoodStallState).toBe(true);
        });
    });
    
    describe('Helper Functions', () => {
        describe('calculateFoodStallTransitionProbability', () => {
            it('should return 0 for hunger 50 or below', () => {
                expect(calculateFoodStallTransitionProbability(0)).toBe(0);
                expect(calculateFoodStallTransitionProbability(25)).toBe(0);
                expect(calculateFoodStallTransitionProbability(50)).toBe(0);
            });
            
            it('should return 0.01 for hunger 51', () => {
                expect(calculateFoodStallTransitionProbability(51)).toBe(0.01);
            });
            
            it('should return 0.02 for hunger 52', () => {
                expect(calculateFoodStallTransitionProbability(52)).toBe(0.02);
            });
            
            it('should return 0.10 for hunger 60', () => {
                expect(calculateFoodStallTransitionProbability(60)).toBe(0.10);
            });
            
            it('should return 0.50 for hunger 100', () => {
                expect(calculateFoodStallTransitionProbability(100)).toBe(0.50);
            });
            
            it('should cap at 0.50 for hunger above 100', () => {
                expect(calculateFoodStallTransitionProbability(110)).toBe(0.50);
                expect(calculateFoodStallTransitionProbability(999)).toBe(0.50);
                expect(calculateFoodStallTransitionProbability(150)).toBe(0.50);
            });
            
            it('should calculate correct probability for intermediate values', () => {
                expect(calculateFoodStallTransitionProbability(75)).toBe(0.25);
                expect(calculateFoodStallTransitionProbability(80)).toBe(0.30);
                expect(calculateFoodStallTransitionProbability(90)).toBe(0.40);
            });
        });
        
        describe('shouldTransitionToFoodStall', () => {
            it('should never transition with hunger 50 or below', () => {
                // Test multiple times to ensure it's consistently false
                for (let i = 0; i < 100; i++) {
                    expect(shouldTransitionToFoodStall(50)).toBe(false);
                    expect(shouldTransitionToFoodStall(0)).toBe(false);
                }
            });
            
            it('should always transition when Math.random returns 0 and hunger > 50', () => {
                const originalRandom = Math.random;
                Math.random = () => 0;
                
                expect(shouldTransitionToFoodStall(51)).toBe(true);
                expect(shouldTransitionToFoodStall(100)).toBe(true);
                
                Math.random = originalRandom;
            });
            
            it('should never transition when Math.random returns 1', () => {
                const originalRandom = Math.random;
                Math.random = () => 1;
                
                expect(shouldTransitionToFoodStall(51)).toBe(false);
                expect(shouldTransitionToFoodStall(100)).toBe(false);
                expect(shouldTransitionToFoodStall(999)).toBe(false);
                
                Math.random = originalRandom;
            });
            
            it('should transition based on probability for edge cases', () => {
                const originalRandom = Math.random;
                
                // Just below probability threshold - should not transition
                Math.random = () => 0.011;
                expect(shouldTransitionToFoodStall(51)).toBe(false); // prob = 0.01
                
                // Just at probability threshold - should transition
                Math.random = () => 0.01;
                expect(shouldTransitionToFoodStall(51)).toBe(false); // prob = 0.01, but < not <=
                
                // Just below threshold
                Math.random = () => 0.009;
                expect(shouldTransitionToFoodStall(51)).toBe(true); // prob = 0.01
                
                Math.random = originalRandom;
            });
        });
        
        describe('getFoodStallRegions', () => {
            it('should return empty array when no food stalls exist', () => {
                const regions = getFoodStallRegions([]);
                expect(regions).toEqual([]);
            });
            
            it('should return empty array when only non-food-stall obstacles exist', () => {
                const obstacles = [
                    new Obstacle(100, 100, 40, 40),
                    new Obstacle(200, 200, 50, 50)
                ];
                const regions = getFoodStallRegions(obstacles);
                expect(regions).toEqual([]);
            });
            
            it('should return 2 regions for 1 food stall', () => {
                const obstacles = [new FoodStall(400, 300, 40, 40)];
                const regions = getFoodStallRegions(obstacles);
                expect(regions.length).toBe(2);
            });
            
            it('should return 8 regions for 4 food stalls', () => {
                const obstacles = [
                    new FoodStall(400, 170, 40, 40),
                    new FoodStall(400, 235, 40, 40),
                    new FoodStall(400, 300, 40, 40),
                    new FoodStall(400, 365, 40, 40)
                ];
                const regions = getFoodStallRegions(obstacles);
                expect(regions.length).toBe(8);
            });
            
            it('should create correct left region for a food stall', () => {
                const stall = new FoodStall(400, 300, 40, 40);
                const obstacles = [stall];
                const regions = getFoodStallRegions(obstacles);
                
                const leftRegion = regions.find(r => r.side === 'left');
                expect(leftRegion).toBeDefined();
                expect(leftRegion.bounds.left).toBe(370); // 380 - 10
                expect(leftRegion.bounds.right).toBe(380);
                expect(leftRegion.bounds.top).toBe(280);
                expect(leftRegion.bounds.bottom).toBe(320);
                expect(leftRegion.stallId).toBe(stall.id);
            });
            
            it('should create correct right region for a food stall', () => {
                const stall = new FoodStall(400, 300, 40, 40);
                const obstacles = [stall];
                const regions = getFoodStallRegions(obstacles);
                
                const rightRegion = regions.find(r => r.side === 'right');
                expect(rightRegion).toBeDefined();
                expect(rightRegion.bounds.left).toBe(420);
                expect(rightRegion.bounds.right).toBe(430); // 420 + 10
                expect(rightRegion.bounds.top).toBe(280);
                expect(rightRegion.bounds.bottom).toBe(320);
                expect(rightRegion.stallId).toBe(stall.id);
            });
            
            it('should handle mixed obstacles correctly', () => {
                const obstacles = [
                    new Obstacle(100, 100, 40, 40),
                    new FoodStall(400, 300, 40, 40),
                    new Obstacle(500, 500, 30, 30),
                    new FoodStall(400, 200, 40, 40)
                ];
                const regions = getFoodStallRegions(obstacles);
                expect(regions.length).toBe(4); // 2 food stalls × 2 regions each
            });
        });
        
        describe('chooseRandomFoodStallRegion', () => {
            it('should return null when no food stalls exist', () => {
                const region = chooseRandomFoodStallRegion([]);
                expect(region).toBeNull();
            });
            
            it('should return null when only non-food-stall obstacles exist', () => {
                const obstacles = [
                    new Obstacle(100, 100, 40, 40)
                ];
                const region = chooseRandomFoodStallRegion(obstacles);
                expect(region).toBeNull();
            });
            
            it('should return a region when food stalls exist', () => {
                const obstacles = [new FoodStall(400, 300, 40, 40)];
                const region = chooseRandomFoodStallRegion(obstacles);
                expect(region).not.toBeNull();
                expect(region).toHaveProperty('bounds');
                expect(region).toHaveProperty('stallId');
                expect(region).toHaveProperty('side');
            });
            
            it('should return left or right side', () => {
                const obstacles = [new FoodStall(400, 300, 40, 40)];
                const region = chooseRandomFoodStallRegion(obstacles);
                expect(['left', 'right']).toContain(region.side);
            });
            
            it('should randomly select from multiple regions', () => {
                const obstacles = [
                    new FoodStall(400, 170, 40, 40),
                    new FoodStall(400, 300, 40, 40)
                ];
                
                // Test multiple times to increase confidence in randomness
                const selectedSides = new Set();
                for (let i = 0; i < 20; i++) {
                    const region = chooseRandomFoodStallRegion(obstacles);
                    selectedSides.add(region.side);
                }
                
                // Should select both sides at least once in 20 attempts
                expect(selectedSides.size).toBeGreaterThan(1);
            });
        });
        
        describe('getDestinationInRegion', () => {
            it('should return coordinates within region bounds', () => {
                const region = {
                    bounds: {
                        left: 370,
                        right: 380,
                        top: 280,
                        bottom: 320
                    },
                    stallId: 1,
                    side: 'left'
                };
                
                const dest = getDestinationInRegion(region);
                expect(dest.x).toBeGreaterThanOrEqual(370);
                expect(dest.x).toBeLessThanOrEqual(380);
                expect(dest.y).toBeGreaterThanOrEqual(280);
                expect(dest.y).toBeLessThanOrEqual(320);
            });
            
            it('should return different coordinates on multiple calls', () => {
                const region = {
                    bounds: {
                        left: 370,
                        right: 380,
                        top: 280,
                        bottom: 320
                    },
                    stallId: 1,
                    side: 'left'
                };
                
                const destinations = [];
                for (let i = 0; i < 10; i++) {
                    destinations.push(getDestinationInRegion(region));
                }
                
                // Check that not all destinations are identical
                const allSame = destinations.every(d => 
                    d.x === destinations[0].x && d.y === destinations[0].y
                );
                expect(allSame).toBe(false);
            });
        });
    });
    
    describe('MovingToFoodStallState', () => {
        let agent;
        let movingToFoodStallState;
        let obstacles;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
            movingToFoodStallState = new MovingToFoodStallState();
            obstacles = [
                new FoodStall(400, 170, 40, 40),
                new FoodStall(400, 235, 40, 40),
                new FoodStall(400, 300, 40, 40),
                new FoodStall(400, 365, 40, 40)
            ];
        });
        
        it('should extend AgentState', () => {
            expect(movingToFoodStallState instanceof AgentState).toBe(true);
        });
        
        it('should have getName return MovingToFoodStallState', () => {
            expect(movingToFoodStallState.getName()).toBe('MovingToFoodStallState');
        });
        
        it('should set idleTimer to 0 on enter', () => {
            agent.idleTimer = 1000;
            movingToFoodStallState.enter(agent, 800, 600, obstacles);
            expect(agent.idleTimer).toBe(0);
        });
        
        it('should set destination to a food stall region on enter', () => {
            movingToFoodStallState.enter(agent, 800, 600, obstacles);
            
            // Destination should be in one of the food stall regions
            // Check if destination is in any valid region (left or right of any stall)
            const inValidRegion = (
                // Left regions (370-380)
                (agent.destinationX >= 370 && agent.destinationX <= 380) ||
                // Right regions (420-430)
                (agent.destinationX >= 420 && agent.destinationX <= 430)
            );
            
            expect(inValidRegion).toBe(true);
        });
        
        it('should choose random destination if no food stalls exist', () => {
            const noFoodStalls = [new Obstacle(100, 100, 40, 40)];
            agent.destinationX = agent.x;
            agent.destinationY = agent.y;
            
            movingToFoodStallState.enter(agent, 800, 600, noFoodStalls);
            
            // Destination should change (with very high probability)
            const destChanged = agent.destinationX !== agent.x || agent.destinationY !== agent.y;
            expect(destChanged).toBe(true);
        });
        
        it('should move agent towards destination during update', () => {
            agent.state = movingToFoodStallState;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 375; // In left region
            agent.destinationY = 300;
            
            const initialX = agent.x;
            const initialY = agent.y;
            
            movingToFoodStallState.update(agent, 0.1, 800, 600, obstacles);
            
            // Agent should have moved closer to destination
            const dx = agent.destinationX - agent.x;
            const dy = agent.destinationY - agent.y;
            const initialDx = agent.destinationX - initialX;
            const initialDy = agent.destinationY - initialY;
            const newDist = Math.sqrt(dx * dx + dy * dy);
            const initialDist = Math.sqrt(initialDx * initialDx + initialDy * initialDy);
            
            expect(newDist).toBeLessThan(initialDist);
        });
        
        it('should reset hunger to 0 when reaching destination', () => {
            agent.state = movingToFoodStallState;
            agent.hunger = 75;
            agent.totalTicks = 75000;
            agent.x = 375;
            agent.y = 300;
            agent.destinationX = 377;
            agent.destinationY = 302;
            
            movingToFoodStallState.update(agent, 0.1, 800, 600, obstacles);
            
            expect(agent.hunger).toBe(0);
            expect(agent.totalTicks).toBe(0);
        });
        
        it('should transition to IdleState when reaching destination', () => {
            agent.state = movingToFoodStallState;
            agent.x = 375;
            agent.y = 300;
            agent.destinationX = 377;
            agent.destinationY = 302;
            
            movingToFoodStallState.update(agent, 0.1, 800, 600, obstacles);
            
            expect(agent.state instanceof IdleState).toBe(true);
        });
        
        it('should return green color', () => {
            expect(movingToFoodStallState.getColor(agent)).toBe('#00FF00');
        });
        
        it('should handle enter without obstacles parameter', () => {
            agent.idleTimer = 1000;
            expect(() => movingToFoodStallState.enter(agent, 800, 600)).not.toThrow();
            expect(agent.idleTimer).toBe(0);
        });
        
        it('should handle update without obstacles parameter', () => {
            agent.state = movingToFoodStallState;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            expect(() => movingToFoodStallState.update(agent, 0.1, 800, 600)).not.toThrow();
        });
        
        it('should handle zero speed correctly', () => {
            agent.state = movingToFoodStallState;
            agent.vx = 0;
            agent.vy = 0;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            const initialX = agent.x;
            const initialY = agent.y;
            
            movingToFoodStallState.update(agent, 0.1, 800, 600, obstacles);
            
            // Agent should not move when speed is 0
            expect(agent.x).toBe(initialX);
            expect(agent.y).toBe(initialY);
        });
        
        it('should handle zero waypoint distance correctly', () => {
            agent.state = movingToFoodStallState;
            agent.x = 200;
            agent.y = 200;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            const initialX = agent.x;
            const initialY = agent.y;
            
            movingToFoodStallState.update(agent, 0.1, 800, 600, obstacles);
            
            // Should transition to idle when at destination
            expect(agent.state instanceof IdleState).toBe(true);
        });
    });
    
    describe('State Transitions', () => {
        let agent;
        let obstacles;
        
        beforeEach(() => {
            agent = new Agent(100, 200);
            obstacles = [
                new FoodStall(400, 170, 40, 40),
                new FoodStall(400, 235, 40, 40),
                new FoodStall(400, 300, 40, 40),
                new FoodStall(400, 365, 40, 40)
            ];
        });
        
        it('should transition from IdleState to MovingToFoodStallState when hunger check passes after 1000 ticks', () => {
            agent.state = new IdleState();
            agent.state.enter(agent, 800, 600, obstacles);
            agent.hunger = 100;
            
            // Mock Math.random to always return 0 (always transition)
            const originalRandom = Math.random;
            Math.random = () => 0;
            
            // Update with 1.0 second (1000 ticks) to trigger timer
            agent.state.update(agent, 1.0, 800, 600, obstacles);
            
            Math.random = originalRandom;
            
            expect(agent.state instanceof MovingToFoodStallState).toBe(true);
        });
        
        it('should not transition from IdleState to MovingToFoodStallState when hunger is low', () => {
            agent.state = new IdleState();
            agent.state.enter(agent, 800, 600, obstacles);
            agent.hunger = 40;
            
            // Update with 1.0 second (1000 ticks) to trigger timer
            agent.state.update(agent, 1.0, 800, 600, obstacles);
            
            // Should transition to MovingState because idleTimer expired, not to food stall
            expect(agent.state instanceof MovingToFoodStallState).toBe(false);
        });
        
        it('should transition from MovingState to MovingToFoodStallState when hunger check passes after 1000 ticks', () => {
            agent.state = new MovingState();
            agent.state.enter(agent, 800, 600, obstacles);
            agent.hunger = 100;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            // Mock Math.random to always return 0 (always transition)
            const originalRandom = Math.random;
            Math.random = () => 0;
            
            // Update with 1.0 second (1000 ticks) to trigger timer
            agent.state.update(agent, 1.0, 800, 600, obstacles);
            
            Math.random = originalRandom;
            
            expect(agent.state instanceof MovingToFoodStallState).toBe(true);
        });
        
        it('should not transition from MovingState to MovingToFoodStallState when hunger is low', () => {
            agent.state = new MovingState();
            agent.state.enter(agent, 800, 600, obstacles);
            agent.hunger = 40;
            agent.x = 100;
            agent.y = 100;
            agent.destinationX = 200;
            agent.destinationY = 200;
            
            // Update with 1.0 second (1000 ticks) to trigger timer
            agent.state.update(agent, 1.0, 800, 600, obstacles);
            
            // Should remain in MovingState, not transition to food stall
            expect(agent.state instanceof MovingState).toBe(true);
            expect(agent.state instanceof MovingToFoodStallState).toBe(false);
        });
        
        it('should not check food stall transition before 1000 ticks have elapsed', () => {
            agent.state = new IdleState();
            agent.state.enter(agent, 800, 600, obstacles);
            agent.hunger = 100;
            
            // Mock Math.random to always return 0 (would always transition if checked)
            const originalRandom = Math.random;
            Math.random = () => 0;
            
            // Update with only 0.5 seconds (500 ticks) - not enough to trigger timer
            agent.state.update(agent, 0.5, 800, 600, obstacles);
            
            Math.random = originalRandom;
            
            // Should remain in IdleState because timer hasn't fired yet
            expect(agent.state instanceof IdleState).toBe(true);
        });
    });
});
