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
        
        this.init();
    }
    
    init() {
        // Create initial fan agents
        const numFans = 50;
        for (let i = 0; i < numFans; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.agents.push(new Agent(x, y, 'fan'));
        }
    }
    
    setTickRate(rate) {
        this.tickRate = rate;
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
            agent.draw(this.ctx);
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
