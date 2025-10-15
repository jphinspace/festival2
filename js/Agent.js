import { IdleState } from './AgentState.js';
import { DynamicObstacle } from './DynamicObstacle.js';

// Agent class representing festival attendees
export class Agent extends DynamicObstacle {
    constructor(x, y, type = 'fan') {
        // Agent is a circular obstacle with diameter = 2 * radius
        const radius = 5;
        super(x, y, radius * 2, radius * 2);
        
        this.type = type;
        this.vx = (Math.random() - 0.5) * 100; // velocity in pixels per second
        this.vy = (Math.random() - 0.5) * 100;
        this.radius = radius;
        
        // Color based on type
        this.color = this.getColorForType(type);
        
        // State management
        this.state = new IdleState();
        this.idleTimer = 1000; // ticks until state change
        
        // Destination coordinates for pathfinding visualization
        this.destinationX = x;
        this.destinationY = y;
        
        // Obstacles for pathfinding
        this.obstacles = [];
        
        // Special movement zones
        this.specialMovementZones = [];
        
        // Pathfinding state (persistent for hybrid bug algorithm)
        this.pathState = {};
        
        // Initialize state
        this.state.enter(this, 0, 0, this.obstacles);
    }
    
    getColorForType(type) {
        switch(type) {
            case 'fan':
                return '#FFB380'; // Pale orange
            case 'security':
                return 'yellow';
            case 'performer':
                return 'red';
            default:
                return 'blue';
        }
    }
    
    chooseRandomDestination(canvasWidth, canvasHeight, obstacles = []) {
        const agentRadius = this.radius;
        const maxAttempts = 100;
        
        // Filter to only check static obstacles for destination selection
        const staticObstacles = obstacles.filter(obs => !(obs instanceof DynamicObstacle));
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            
            // Check if this destination collides with any static obstacle
            let collides = false;
            for (const obstacle of staticObstacles) {
                if (obstacle.containsPoint(x, y, agentRadius)) {
                    collides = true;
                    break;
                }
            }
            
            // Check if this destination is inside any special movement zone
            // (treat zones as obstacles for destination selection only)
            if (!collides && this.specialMovementZones) {
                for (const zone of this.specialMovementZones) {
                    if (zone.containsPoint(x, y, agentRadius)) {
                        collides = true;
                        break;
                    }
                }
            }
            
            if (!collides) {
                this.destinationX = x;
                this.destinationY = y;
                return;
            }
        }
        
        // If we couldn't find a spot after maxAttempts, use random location anyway
        this.destinationX = Math.random() * canvasWidth;
        this.destinationY = Math.random() * canvasHeight;
    }
    
    /**
     * Transition to a new state
     * @param {AgentState} newState - The new state to transition to
     * @param {number} canvasWidth - Canvas width for state initialization
     * @param {number} canvasHeight - Canvas height for state initialization
     */
    transitionTo(newState, canvasWidth, canvasHeight) {
        this.state.exit(this);
        this.state = newState;
        this.state.enter(this, canvasWidth, canvasHeight, this.obstacles);
    }
    
    // Frame-independent update
    update(deltaTime, canvasWidth, canvasHeight, obstacles = []) {
        // Update obstacles reference
        this.obstacles = obstacles;
        
        // Delegate to current state
        this.state.update(this, deltaTime, canvasWidth, canvasHeight, obstacles);
        
        // Clamp position to canvas bounds
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        
        // Clamp destination to canvas bounds
        this.destinationX = Math.max(0, Math.min(canvasWidth, this.destinationX));
        this.destinationY = Math.max(0, Math.min(canvasHeight, this.destinationY));
    }
    
    draw(ctx, showDestination = false) {
        // Draw destination line if enabled
        if (showDestination) {
            ctx.strokeStyle = '#00FF00'; // Bright green
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.destinationX, this.destinationY);
            ctx.stroke();
        }
        
        // Draw agent using state color
        ctx.fillStyle = this.state.getColor(this);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
