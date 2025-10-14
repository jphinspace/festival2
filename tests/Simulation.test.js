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

        it('should create four food stall obstacles in a vertical line', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.obstacles.length).toBe(6); // 4 food stalls + 2 walls
            
            // First 4 obstacles should be food stalls in a vertical line
            // with original square dimensions (40x40)
            for (let i = 0; i < 4; i++) {
                expect(simulation.obstacles[i].width).toBe(40);
                expect(simulation.obstacles[i].height).toBe(40);
                expect(simulation.obstacles[i].x).toBe(400); // All at horizontal center
            }
        });

        it('should space food stalls 2.5x agent diameter apart vertically', () => {
            const simulation = new Simulation(canvas);
            const agentDiameter = 10;
            const expectedSpacing = 2.5 * agentDiameter; // 25 pixels
            
            // Check spacing between consecutive food stalls (first 4 obstacles)
            for (let i = 0; i < 3; i++) {
                const stall1 = simulation.obstacles[i];
                const stall2 = simulation.obstacles[i + 1];
                
                // Distance between centers minus their heights should equal spacing
                const centerDistance = stall2.y - stall1.y;
                const edgeToEdgeDistance = centerDistance - stall1.height;
                
                expect(edgeToEdgeDistance).toBeCloseTo(expectedSpacing, 0);
            }
        });

        it('should position 3rd stall at vertical center with 2 above and 1 below', () => {
            const simulation = new Simulation(canvas);
            
            // 3rd stall (index 2) should be at vertical center
            expect(simulation.obstacles[2].y).toBe(300);
            
            // Verify 2 stalls above center
            expect(simulation.obstacles[0].y).toBeLessThan(300);
            expect(simulation.obstacles[1].y).toBeLessThan(300);
            
            // Verify 1 stall below center
            expect(simulation.obstacles[3].y).toBeGreaterThan(300);
        });

        it('should create two wall obstacles at the bottom', () => {
            const simulation = new Simulation(canvas);
            
            // Last two obstacles should be walls
            const leftWall = simulation.obstacles[4];
            const rightWall = simulation.obstacles[5];
            
            // Walls should have proper dimensions (45% width, 20% height)
            const expectedWidth = canvas.width * 0.45;
            const expectedHeight = canvas.height / 5;
            
            expect(leftWall.width).toBeCloseTo(expectedWidth, 0);
            expect(leftWall.height).toBeCloseTo(expectedHeight, 0);
            expect(rightWall.width).toBeCloseTo(expectedWidth, 0);
            expect(rightWall.height).toBeCloseTo(expectedHeight, 0);
            
            // Walls should be at bottom of canvas
            const expectedY = canvas.height - expectedHeight / 2;
            expect(leftWall.y).toBeCloseTo(expectedY, 0);
            expect(rightWall.y).toBeCloseTo(expectedY, 0);
            
            // Left wall should be on left side
            expect(leftWall.x).toBeCloseTo(expectedWidth / 2, 0);
            
            // Right wall should be on right side
            expect(rightWall.x).toBeCloseTo(canvas.width - expectedWidth / 2, 0);
        });

        it('should create one entranceway special movement zone', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.specialMovementZones.length).toBe(1);
            
            const zone = simulation.specialMovementZones[0];
            expect(zone.type).toBe('entranceway');
            
            // Zone should be 10% width in the center gap
            const expectedWidth = canvas.width * 0.1;
            expect(zone.width).toBeCloseTo(expectedWidth, 0);
            
            // Zone should have same height as walls
            const expectedHeight = canvas.height / 5;
            expect(zone.height).toBeCloseTo(expectedHeight, 0);
            
            // Zone should be centered horizontally
            expect(zone.x).toBe(canvas.width / 2);
            
            // Zone should be at bottom
            const expectedY = canvas.height - expectedHeight / 2;
            expect(zone.y).toBeCloseTo(expectedY, 0);
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

        it('should spawn inside entranceway zone', () => {
            const simulation = new Simulation(canvas);
            
            const entranceway = simulation.specialMovementZones[0];
            const bounds = entranceway.getBounds();
            
            // Test multiple spawn locations
            for (let i = 0; i < 20; i++) {
                const location = simulation.getSpawnLocation();
                
                // Should be inside entranceway bounds
                expect(location.x).toBeGreaterThanOrEqual(bounds.left);
                expect(location.x).toBeLessThanOrEqual(bounds.right);
                expect(location.y).toBeGreaterThanOrEqual(bounds.top);
                expect(location.y).toBeLessThanOrEqual(bounds.bottom);
            }
        });

        it('should fallback to entranceway location when no clear spots exist', () => {
            const simulation = new Simulation(canvas);
            
            // Cover the entranceway with a large obstacle (impossible scenario but tests fallback)
            const entranceway = simulation.specialMovementZones[0];
            simulation.obstacles.push(new Obstacle(entranceway.x, entranceway.y, entranceway.width, entranceway.height));
            
            const location = simulation.getSpawnLocation();
            
            const bounds = entranceway.getBounds();
            // Should still return a location in entranceway
            expect(location.x).toBeGreaterThanOrEqual(bounds.left);
            expect(location.x).toBeLessThanOrEqual(bounds.right);
            expect(location.y).toBeGreaterThanOrEqual(bounds.top);
            expect(location.y).toBeLessThanOrEqual(bounds.bottom);
        });

        it('should fallback to old behavior when no entranceway zone exists', () => {
            const simulation = new Simulation(canvas);
            
            // Remove entranceway zone to test fallback
            simulation.specialMovementZones = [];
            
            const location = simulation.getSpawnLocation();
            
            // Should still return a location
            expect(location.x).toBeGreaterThanOrEqual(0);
            expect(location.x).toBeLessThanOrEqual(canvas.width);
            expect(location.y).toBeGreaterThanOrEqual(0);
            expect(location.y).toBeLessThanOrEqual(canvas.height);
        });

        it('should fallback to random location when no zone exists and entire area is covered', () => {
            const simulation = new Simulation(canvas);
            
            // Remove entranceway zone
            simulation.specialMovementZones = [];
            
            // Cover entire canvas with obstacles
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
