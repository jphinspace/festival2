import { Agent } from './Agent.js';
import { Obstacle } from './Obstacle.js';

// Simulation class
export class Simulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.agents = [];
        this.obstacles = [];
        this.tickRate = 1.0; // 1x = 1000 ticks per second
        this.lastTime = performance.now();
        this.running = true;
        this.showDestinations = false; // Toggle for destination lines
        this.showPaths = false; // Toggle for pathfinding path lines
        
        this.init();
    }
    
    init() {
        // Create food stall obstacle in center (4 agent diameters = 40 pixels)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const obstacleSize = 40; // 4 agent diameters (agent radius = 5)
        this.obstacles.push(new Obstacle(centerX, centerY, obstacleSize, obstacleSize));
    }
    
    setTickRate(rate) {
        this.tickRate = rate;
    }
    
    toggleDestinations() {
        this.showDestinations = !this.showDestinations;
        return this.showDestinations;
    }
    
    togglePaths() {
        this.showPaths = !this.showPaths;
        return this.showPaths;
    }
    
    getSpawnLocation() {
        const agentRadius = 5;
        const maxAttempts = 100;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            
            // Check if this location collides with any obstacle
            let collides = false;
            for (const obstacle of this.obstacles) {
                if (obstacle.collidesWith(x, y, agentRadius)) {
                    collides = true;
                    break;
                }
            }
            
            if (!collides) {
                return { x, y };
            }
        }
        
        // If we couldn't find a spot after maxAttempts, return a random location anyway
        // (better than infinite loop)
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height
        };
    }
    
    spawnFanAgent() {
        const location = this.getSpawnLocation();
        const agent = new Agent(location.x, location.y, 'fan');
        agent.obstacles = this.obstacles;
        this.agents.push(agent);
    }
    
    update(currentTime) {
        // Calculate deltaTime in seconds
        const deltaTimeMs = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Apply tick rate multiplier
        // deltaTime is in seconds, adjusted by tick rate
        const deltaTime = (deltaTimeMs / 1000) * this.tickRate;
        
        // Update all agents
        for (const agent of this.agents) {
            agent.update(deltaTime, this.canvas.width, this.canvas.height, this.obstacles);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw obstacles first (so agents appear on top)
        for (const obstacle of this.obstacles) {
            obstacle.draw(this.ctx);
        }
        
        // Draw all agents
        for (const agent of this.agents) {
            agent.draw(this.ctx, this.showDestinations, this.showPaths);
        }
    }
    
    run() {
        const loop = (currentTime) => {
            if (this.running) {
                this.update(currentTime);
                this.draw();
                requestAnimationFrame(loop);
            }
        };
        requestAnimationFrame(loop);
    }
}
