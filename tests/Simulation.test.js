import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Simulation } from '../js/Simulation.js';
import { Agent } from '../js/Agent.js';

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
            beginPath: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
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
        });
        
        it('should initialize agents array', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents).toBeDefined();
            expect(Array.isArray(simulation.agents)).toBe(true);
        });
        
        it('should call init on construction', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents.length).toBe(50);
        });
    });
    
    describe('init', () => {
        it('should create 50 fan agents', () => {
            const simulation = new Simulation(canvas);
            
            expect(simulation.agents.length).toBe(50);
        });
        
        it('should create agents with positions within canvas bounds', () => {
            const simulation = new Simulation(canvas);
            
            simulation.agents.forEach(agent => {
                expect(agent.x).toBeGreaterThanOrEqual(0);
                expect(agent.x).toBeLessThanOrEqual(canvas.width);
                expect(agent.y).toBeGreaterThanOrEqual(0);
                expect(agent.y).toBeLessThanOrEqual(canvas.height);
            });
        });
        
        it('should create all agents with fan type', () => {
            const simulation = new Simulation(canvas);
            
            simulation.agents.forEach(agent => {
                expect(agent.type).toBe('fan');
                expect(agent instanceof Agent).toBe(true);
            });
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
    
    describe('update', () => {
        it('should calculate deltaTime based on currentTime and lastTime', () => {
            const simulation = new Simulation(canvas);
            simulation.lastTime = 1000;
            
            // Mock agent update to track deltaTime
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100); // 100ms later
            
            // deltaTime should be (100ms / 1000) * tickRate(1.0) = 0.1 seconds
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                0.1,
                canvas.width,
                canvas.height
            );
        });
        
        it('should apply tick rate multiplier to deltaTime', () => {
            const simulation = new Simulation(canvas);
            simulation.lastTime = 1000;
            simulation.setTickRate(2.0);
            
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100); // 100ms later
            
            // deltaTime should be (100ms / 1000) * tickRate(2.0) = 0.2 seconds
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                0.2,
                canvas.width,
                canvas.height
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
            simulation.agents[0].update = jest.fn();
            
            simulation.update(1100);
            
            expect(simulation.agents[0].update).toHaveBeenCalledWith(
                expect.any(Number),
                800,
                600
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
            
            // Mock all agent draw methods
            simulation.agents.forEach(agent => {
                agent.draw = jest.fn();
            });
            
            simulation.draw();
            
            simulation.agents.forEach(agent => {
                expect(agent.draw).toHaveBeenCalledWith(mockCtx);
            });
        });
        
        it('should clear canvas before drawing agents', () => {
            const simulation = new Simulation(canvas);
            const calls = [];
            
            mockCtx.clearRect = jest.fn(() => calls.push('clear'));
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
