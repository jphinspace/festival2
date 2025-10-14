import { Agent } from './Agent.js';

// Simulation class
export class Simulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.agents = [];
        this.tickRate = 1.0; // 1x = 1000 ticks per second
        this.lastTime = performance.now();
        this.running = true;
        this.showDestinations = false; // Toggle for destination lines
        
        this.init();
    }
    
    init() {
        // No initial agents - they will be spawned via button
    }
    
    setTickRate(rate) {
        this.tickRate = rate;
    }
    
    toggleDestinations() {
        this.showDestinations = !this.showDestinations;
        return this.showDestinations;
    }
    
    getSpawnLocation() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height
        };
    }
    
    spawnFanAgent() {
        const location = this.getSpawnLocation();
        this.agents.push(new Agent(location.x, location.y, 'fan'));
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
            agent.update(deltaTime, this.canvas.width, this.canvas.height);
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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
