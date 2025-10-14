import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Simulation } from '../js/Simulation.js';
import { Agent } from '../js/Agent.js';
import { Obstacle } from '../js/Obstacle.js';

describe('Simulation', () => {
    let canvas;
    let mockCtx;
    let performanceNowMock;
    let rafMock;
    
    beforeEach(() => {
        // Reset and setup mocks
        jest.clearAllMocks();
        
        // Mock performance.now()
        performanceNowMock = jest.fn(() => 1000);
        global.performance = {
            now: performanceNowMock
        };
        
        // Mock requestAnimationFrame
        rafMock = jest.fn((callback) => {
            callback(1000);
            return 1;
        });
        global.requestAnimationFrame = rafMock;
        
        // Create mock canvas
        mockCtx = {
            clearRect: jest.fn(),
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            stroke: jest.fn(),
            fillRect: jest.fn(),
            strokeRect: jest.fn(),
            getContext: jest.fn(() => mockCtx)
        };
        
        canvas = {
            width: 800,
            height: 600,
            getContext: jest.fn(() => mockCtx)
        };
    });
    
    describe('constructor', () => {
        it('should initialize with canvas and context', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.canvas).toBe(canvas);
            expect(simulation.ctx).toBe(mockCtx);
            expect(canvas.getContext).toHaveBeenCalledWith('2d');
        });
        
        it('should initialize with default properties', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.tickRate).toBe(1.0);
            expect(simulation.lastTime).toBeGreaterThan(0);
            expect(simulation.running).toBe(true);
            expect(simulation.showDestinations).toBe(false);
        });
        
        it('should initialize agents array', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents).toBeDefined();
            expect(Array.isArray(simulation.agents)).toBe(true);
        });
        
        it('should call init on construction', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents.length).toBe(0);
        });
    });
    
    describe('init', () => {
        it('should not create any agents initially', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents.length).toBe(0);
        });

        it('should create four vertical food stall obstacles', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.obstacles.length).toBe(4);
            
            // All obstacles should be vertically oriented (height > width)
            simulation.obstacles.forEach(obstacle => {
                expect(obstacle.width).toBe(40);
                expect(obstacle.height).toBe(80);
                expect(obstacle.y).toBe(300); // All at vertical center
            });
        });

        it('should space food stalls 2.5x agent diameter apart', () => {
            const simulation = new Simulation(canvas);
            const agentDiameter = 10;
            const expectedSpacing = 2.5 * agentDiameter; // 25 pixels
            
            // Check spacing between consecutive stalls
            for (let i = 0; i < simulation.obstacles.length - 1; i++) {
                const stall1 = simulation.obstacles[i];
                const stall2 = simulation.obstacles[i + 1];
                
                // Distance between centers minus their widths should equal spacing
                const centerDistance = stall2.x - stall1.x;
                const edgeToEdgeDistance = centerDistance - stall1.width;
                
                expect(edgeToEdgeDistance).toBeCloseTo(expectedSpacing, 0);
            }
        });

        it('should center food stalls horizontally on canvas', () => {
            const simulation = new Simulation(canvas);
            
            // Calculate expected total width
            const stallWidth = 40;
            const spacing = 25;
            const totalWidth = 4 * stallWidth + 3 * spacing;
            
            // First stall should start at centered position
            const expectedStartX = (canvas.width - totalWidth) / 2 + stallWidth / 2;
            expect(simulation.obstacles[0].x).toBeCloseTo(expectedStartX, 0);
            
            // Last stall should end at centered position
            const expectedEndX = expectedStartX + 3 * (stallWidth + spacing);
            expect(simulation.obstacles[3].x).toBeCloseTo(expectedEndX, 0);
        });
    });
    
    describe('getSpawnLocation', () => {
        it('should return a location within canvas bounds', () => {
            const simulation = new Simulation(canvas);
            
            const location = simulation.getSpawnLocation();
            
            expect(location.x).toBeGreaterThanOrEqual(0);
            expect(location.x).toBeLessThanOrEqual(canvas.width);
            expect(location.y).toBeGreaterThanOrEqual(0);
            expect(location.y).toBeLessThanOrEqual(canvas.height);
        });
        
        it('should return different locations on multiple calls', () => {
            const simulation = new Simulation(canvas);
            
            const location1 = simulation.getSpawnLocation();
            const location2 = simulation.getSpawnLocation();
            
            // Very unlikely to be exactly the same with random values
            const isDifferent = location1.x !== location2.x || location1.y !== location2.y;
            expect(isDifferent).toBe(true);
        });

        it('should avoid spawning on obstacles when possible', () => {
            const simulation = new Simulation(canvas);
            const agentRadius = 5;
            
            // Try spawning multiple agents and check they don't collide with obstacle
            let clearsFound = 0;
            for (let i = 0; i < 50; i++) {
                const location = simulation.getSpawnLocation();
                let collides = false;
                for (const obstacle of simulation.obstacles) {
                    if (obstacle.collidesWith(location.x, location.y, agentRadius)) {
                        collides = true;
                        break;
                    }
                }
                if (!collides) {
                    clearsFound++;
                }
            }
            
            // Most spawns should be clear of obstacles
            expect(clearsFound).toBeGreaterThan(40);
        });

        it('should fallback to random location when entire area is covered', () => {
            const simulation = new Simulation(canvas);
            
            // Add large obstacles covering most of the canvas
            simulation.obstacles = [
                new Obstacle(200, 200, 400, 400),
                new Obstacle(600, 200, 400, 400),
                new Obstacle(200, 500, 400, 400),
                new Obstacle(600, 500, 400, 400)
            ];
            
            const location = simulation.getSpawnLocation();
            
            // Should still return a location
            expect(location.x).toBeGreaterThanOrEqual(0);
            expect(location.x).toBeLessThanOrEqual(canvas.width);
            expect(location.y).toBeGreaterThanOrEqual(0);
            expect(location.y).toBeLessThanOrEqual(canvas.height);
        });
    });
    
    describe('spawnFanAgent', () => {
        it('should add one agent to the agents array', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents.length).toBe(0);
            
            simulation.spawnFanAgent();
            
            expect(simulation.agents.length).toBe(1);
        });
        
        it('should create a fan type agent', () => {
            const simulation = new Simulation(canvas);
            
            simulation.spawnFanAgent();
            
            expect(simulation.agents[0].type).toBe('fan');
            expect(simulation.agents[0] instanceof Agent).toBe(true);
        });
        
        it('should place agent at spawn location', () => {
            const simulation = new Simulation(canvas);
            
            simulation.spawnFanAgent();
            
            const agent = simulation.agents[0];
            expect(agent.x).toBeGreaterThanOrEqual(0);
            expect(agent.x).toBeLessThanOrEqual(canvas.width);
            expect(agent.y).toBeGreaterThanOrEqual(0);
            expect(agent.y).toBeLessThanOrEqual(canvas.height);
        });
        
        it('should add multiple agents when called multiple times', () => {
            const simulation = new Simulation(canvas);
            
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            expect(simulation.agents.length).toBe(3);
        });

        it('should set obstacles reference on spawned agent', () => {
            const simulation = new Simulation(canvas);
            
            simulation.spawnFanAgent();
            
            expect(simulation.agents[0].obstacles).toBeDefined();
            expect(simulation.agents[0].obstacles).toBe(simulation.obstacles);
        });
    });
    
    describe('setTickRate', () => {
        it('should update tick rate', () => {
            const simulation = new Simulation(canvas);
            
            simulation.setTickRate(2.5);
            
            expect(simulation.tickRate).toBe(2.5);
        });
        
        it('should accept different tick rates', () => {
            const simulation = new Simulation(canvas);
            
            simulation.setTickRate(0.5);
            expect(simulation.tickRate).toBe(0.5);
            
            simulation.setTickRate(5.0);
            expect(simulation.tickRate).toBe(5.0);
        });
    });
    
    describe('toggleDestinations', () => {
        it('should toggle showDestinations and return new state', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.showDestinations).toBe(false);
            
            const result1 = simulation.toggleDestinations();
            expect(result1).toBe(true);
            expect(simulation.showDestinations).toBe(true);
            
            const result2 = simulation.toggleDestinations();
            expect(result2).toBe(false);
            expect(simulation.showDestinations).toBe(false);
        });
    });
    
    describe('update', () => {
        it('should calculate deltaTime based on currentTime and lastTime', () => {
            const simulation = new Simulation(canvas);
            simulation.lastTime = 1000;
            
            // Spawn an agent to test with
            simulation.spawnFanAgent();
            
            // Mock agent update to track deltaTime
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100); // 100ms later
            
            // deltaTime should be (100ms / 1000) * tickRate(1.0) = 0.1 seconds
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                0.1,
                canvas.width,
                canvas.height,
                expect.any(Array)
            );
        });
        
        it('should apply tick rate multiplier to deltaTime', () => {
            const simulation = new Simulation(canvas);
            simulation.lastTime = 1000;
            simulation.setTickRate(2.0);
            
            // Spawn an agent to test with
            simulation.spawnFanAgent();
            
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100); // 100ms later
            
            // deltaTime should be (100ms / 1000) * tickRate(2.0) = 0.2 seconds
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                0.2,
                canvas.width,
                canvas.height,
                expect.any(Array)
            );
        });
        
        it('should update lastTime to currentTime', () => {
            const simulation = new Simulation(canvas);
            simulation.lastTime = 1000;
            
            simulation.update(1500);
            
            expect(simulation.lastTime).toBe(1500);
        });
        
        it('should update all agents', () => {
            const simulation = new Simulation(canvas);
            
            // Spawn some agents
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            // Mock all agent updates
            simulation.agents.forEach(agent => {
                agent.update = jest.fn();
            });
            
            simulation.update(1100);
            
            simulation.agents.forEach(agent => {
                expect(agent.update).toHaveBeenCalledTimes(1);
            });
        });
        
        it('should pass canvas dimensions to agent update', () => {
            const simulation = new Simulation(canvas);
            
            // Spawn an agent to test with
            simulation.spawnFanAgent();
            
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100);
            
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                expect.any(Number),
                800,
                600,
                expect.any(Array)
            );
        });
    });
    
    describe('draw', () => {
        it('should clear the canvas', () => {
            const simulation = new Simulation(canvas);
            
            simulation.draw();
            
            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
        });
        
        it('should draw all agents', () => {
            const simulation = new Simulation(canvas);
            
            // Spawn some agents
            simulation.spawnFanAgent();
            simulation.spawnFanAgent();
            
            // Mock all agent draw methods
            simulation.agents.forEach(agent => {
                agent.draw = jest.fn();
            });
            
            simulation.draw();
            
            simulation.agents.forEach(agent => {
                expect(agent.draw).toHaveBeenCalledWith(mockCtx, false);
            });
        });
        
        it('should pass showDestinations flag to agent draw', () => {
            const simulation = new Simulation(canvas);
            simulation.showDestinations = true;
            
            // Spawn an agent to test with
            simulation.spawnFanAgent();
            
            simulation.agents[0].draw = jest.fn();
            
            simulation.draw();
            
            expect(simulation.agents[0].draw).toHaveBeenCalledWith(mockCtx, true);
        });
        
        it('should clear canvas before drawing agents', () => {
            const simulation = new Simulation(canvas);
            const calls = [];
            
            mockCtx.clearRect = jest.fn(() => calls.push('clear'));
            
            // Spawn an agent to test with
            simulation.spawnFanAgent();
            simulation.agents[0].draw = jest.fn(() => calls.push('draw'));
            
            simulation.draw();
            
            expect(calls[0]).toBe('clear');
        });
    });
    
    describe('run', () => {
        it('should call requestAnimationFrame', () => {
            const simulation = new Simulation(canvas);
            
            // Prevent infinite loop - mock to only call once
            rafMock.mockImplementationOnce((callback) => 1);
            
            simulation.run();
            
            expect(rafMock).toHaveBeenCalled();
        });
        
        it('should call update and draw when running', () => {
            // Prevent infinite loop - stop after first call
            let callCount = 0;
            rafMock.mockImplementation((callback) => {
                if (callCount === 0) {
                    callCount++;
                    callback(1100);
                }
                return 1;
            });
            
            const simulation = new Simulation(canvas);
            const updateSpy = jest.spyOn(simulation, 'update');
            const drawSpy = jest.spyOn(simulation, 'draw');
            
            simulation.run();
            
            expect(updateSpy).toHaveBeenCalledWith(1100);
            expect(drawSpy).toHaveBeenCalled();
            
            updateSpy.mockRestore();
            drawSpy.mockRestore();
        });
        
        it('should not call update and draw when not running', () => {
            const simulation = new Simulation(canvas);
            simulation.running = false;
            simulation.update = jest.fn();
            simulation.draw = jest.fn();
            
            rafMock.mockImplementationOnce((callback) => {
                callback(1100);
                return 1;
            });
            
            simulation.run();
            
            expect(simulation.update).not.toHaveBeenCalled();
            expect(simulation.draw).not.toHaveBeenCalled();
        });
        
        it('should continue animation loop when running is true', () => {
            const simulation = new Simulation(canvas);
            let callCount = 0;
            
            rafMock.mockImplementation((callback) => {
                if (callCount < 3) {
                    callCount++;
                    callback(1000 + callCount * 16);
                }
                return callCount;
            });
            
            simulation.run();
            
            expect(callCount).toBe(3);
        });
    });
});
