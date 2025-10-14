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
        
        this.init();
    }
    
    init() {
        // Create 4 vertical food stall obstacles, evenly spaced
        const centerY = this.canvas.height / 2;
        const agentDiameter = 10; // agent radius = 5, diameter = 10
        const stallWidth = 40; // 4 agent diameters
        const stallHeight = 80; // 8 agent diameters (vertical orientation)
        const spacing = 2.5 * agentDiameter; // 25 pixels between stalls
        
        // Calculate total width and starting position to center all stalls
        const totalWidth = 4 * stallWidth + 3 * spacing; // 4 stalls + 3 gaps
        const startX = (this.canvas.width - totalWidth) / 2 + stallWidth / 2;
        
        // Create 4 food stall obstacles
        for (let i = 0; i < 4; i++) {
            const x = startX + i * (stallWidth + spacing);
            this.obstacles.push(new Obstacle(x, centerY, stallWidth, stallHeight));
        }
    }
    
    setTickRate(rate) {
        this.tickRate = rate;
    }
    
    toggleDestinations() {
        this.showDestinations = !this.showDestinations;
        return this.showDestinations;
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
            agent.draw(this.ctx, this.showDestinations);
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
