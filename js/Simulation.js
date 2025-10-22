import { Agent } from './Agent.js';
import { Obstacle } from './Obstacle.js';
import { Wall } from './Wall.js';
import { FoodStall } from './FoodStall.js';
import { SpecialMovementZone } from './SpecialMovementZone.js';

// Simulation class
export class Simulation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.agents = [];
        this.obstacles = [];
        this.specialMovementZones = [];
        this.tickRate = 1.0; // 1x = 1000 ticks per second
        this.lastTime = performance.now();
        this.running = true;
        this.showDestinations = false; // Toggle for destination lines
        this.paused = false; // Pause state
        this.desiredTickRate = 1.0; // Store the desired tick rate when paused
        this.selectedAgents = []; // Currently selected agents (list allows future multi-select)
        this.hoveredAgents = []; // Currently hovered agents (list for consistency, max size 1)
        
        this.init();
    }
    
    init() {
        // Create 4 food stall obstacles in a vertical line, evenly spaced
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const agentDiameter = 10; // agent radius = 5, diameter = 10
        const obstacleSize = 40; // 4 agent diameters (agent radius = 5)
        const spacing = 2.5 * agentDiameter; // 25 pixels between stalls
        
        // Position 3rd stall at center, with 2 above and 1 below
        // Stall positions: 0, 1, 2 (at center), 3
        // Calculate Y positions relative to center
        const stall2Y = centerY; // 3rd stall (index 2) at center
        const stall1Y = stall2Y - (obstacleSize + spacing);
        const stall0Y = stall1Y - (obstacleSize + spacing);
        const stall3Y = stall2Y + (obstacleSize + spacing);
        
        const yPositions = [stall0Y, stall1Y, stall2Y, stall3Y];
        
        // Create 4 food stall obstacles in vertical line
        for (let i = 0; i < 4; i++) {
            this.obstacles.push(new FoodStall(centerX, yPositions[i], obstacleSize, obstacleSize));
        }
        
        // Create entranceway zone with walls
        // Wall dimensions: height = ~1/5 of canvas height, width = ~45% of canvas width
        const wallHeight = this.canvas.height / 5;
        const wallWidth = this.canvas.width * 0.45;
        const gapWidth = this.canvas.width * 0.1;
        
        // Position walls at bottom of canvas
        const wallY = this.canvas.height - wallHeight / 2;
        
        // Left wall
        const leftWallX = wallWidth / 2;
        this.obstacles.push(new Wall(leftWallX, wallY, wallWidth, wallHeight));
        
        // Right wall
        const rightWallX = this.canvas.width - wallWidth / 2;
        this.obstacles.push(new Wall(rightWallX, wallY, wallWidth, wallHeight));
        
        // Entranceway special movement zone (in the gap between walls)
        const entrancewayX = this.canvas.width / 2;
        const entrancewayWidth = gapWidth;
        this.specialMovementZones.push(new SpecialMovementZone(
            entrancewayX,
            wallY,
            entrancewayWidth,
            wallHeight,
            'entranceway'
        ));
    }
    
    setTickRate(rate) {
        if (this.paused) {
            // Store the desired rate but don't apply it
            this.desiredTickRate = rate;
        } else {
            this.tickRate = rate;
            this.desiredTickRate = rate;
        }
    }
    
    setPaused(paused) {
        this.paused = paused;
        if (paused) {
            // Store current tick rate and set to 0
            this.desiredTickRate = this.tickRate;
            this.tickRate = 0;
        } else {
            // Restore the desired tick rate
            this.tickRate = this.desiredTickRate;
        }
    }
    
    isPaused() {
        return this.paused;
    }
    
    toggleDestinations() {
        this.showDestinations = !this.showDestinations;
        return this.showDestinations;
    }
    
    getAgentAtPosition(x, y) {
        // Check agents in reverse order (top-most rendered first)
        for (let i = this.agents.length - 1; i >= 0; i--) {
            const agent = this.agents[i];
            const dx = x - agent.x;
            const dy = y - agent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= agent.radius) {
                return agent;
            }
        }
        return undefined;
    }
    
    addSelectedAgent(agent) {
        // Add agent to selection if not already selected
        if (!this.selectedAgents.includes(agent)) {
            this.selectedAgents.push(agent);
        }
    }
    
    clearSelectedAgents() {
        this.selectedAgents = [];
    }
    
    getSelectedAgents() {
        return this.selectedAgents;
    }
    
    addHoveredAgent(agent) {
        // Add agent to hover (max size 1, so clear first)
        this.hoveredAgents = [agent];
    }
    
    clearHoveredAgents() {
        this.hoveredAgents = [];
    }
    
    getHoveredAgents() {
        return this.hoveredAgents;
    }
    
    getSpawnLocation() {
        const agentRadius = 5;
        const maxAttempts = 100;
        
        // Get the entranceway zone (should be the first/only zone)
        const entranceway = this.specialMovementZones.find(zone => zone.type === 'entranceway');
        
        if (entranceway) {
            // Spawn inside the entranceway zone
            const bounds = entranceway.getBounds();
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // Generate random point within entranceway bounds
                const x = bounds.left + Math.random() * (bounds.right - bounds.left);
                const y = bounds.top + Math.random() * (bounds.bottom - bounds.top);
                
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
            
            // If we couldn't find a spot after maxAttempts, return a random location in entranceway anyway
            return {
                x: bounds.left + Math.random() * (bounds.right - bounds.left),
                y: bounds.top + Math.random() * (bounds.bottom - bounds.top)
            };
        }
        
        // Fallback: if no entranceway zone exists, use old behavior
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
        agent.specialMovementZones = this.specialMovementZones;
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
            agent.obstacles = this.obstacles;
            agent.specialMovementZones = this.specialMovementZones;
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
        
        // Draw special movement zones
        for (const zone of this.specialMovementZones) {
            zone.draw(this.ctx);
        }
        
        // Draw all agents
        for (const agent of this.agents) {
            const isSelected = this.selectedAgents.includes(agent);
            const isHovered = this.hoveredAgents.includes(agent);
            agent.draw(this.ctx, this.showDestinations, isSelected, isHovered);
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
