import { IdleState } from './AgentState.js';
import { hasLineOfSight } from './Pathfinding.js';

// Agent class representing festival attendees
export class Agent {
    constructor(x, y, type = 'fan') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 100; // velocity in pixels per second
        this.vy = (Math.random() - 0.5) * 100;
        this.radius = 5;
        
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
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * canvasWidth;
            const y = Math.random() * canvasHeight;
            
            // Check if this destination collides with any obstacle
            let collides = false;
            for (const obstacle of obstacles) {
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
            // Check line of sight to determine line color
            const losIsClear = hasLineOfSight(
                this.x, 
                this.y, 
                this.destinationX, 
                this.destinationY, 
                this.obstacles, 
                this.radius
            );
            
            // Calculate direction and perpendicular vectors for parallel lines
            const dx = this.destinationX - this.x;
            const dy = this.destinationY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const unitDx = dx / distance;
                const unitDy = dy / distance;
                
                // Calculate perpendicular unit vector (rotated 90 degrees)
                const perpDx = -unitDy;
                const perpDy = unitDx;
                
                // Calculate offset points for left and right edges
                const leftStartX = this.x + perpDx * (-this.radius);
                const leftStartY = this.y + perpDy * (-this.radius);
                const leftEndX = this.destinationX + perpDx * (-this.radius);
                const leftEndY = this.destinationY + perpDy * (-this.radius);
                
                const rightStartX = this.x + perpDx * this.radius;
                const rightStartY = this.y + perpDy * this.radius;
                const rightEndX = this.destinationX + perpDx * this.radius;
                const rightEndY = this.destinationY + perpDy * this.radius;
                
                // Draw left and right edge lines (fully opaque)
                const edgeColor = losIsClear ? 'rgba(0, 206, 209, 1.0)' : 'rgba(255, 0, 0, 1.0)';
                ctx.strokeStyle = edgeColor;
                ctx.lineWidth = 1;
                
                // Left edge line
                ctx.beginPath();
                ctx.moveTo(leftStartX, leftStartY);
                ctx.lineTo(leftEndX, leftEndY);
                ctx.stroke();
                
                // Right edge line
                ctx.beginPath();
                ctx.moveTo(rightStartX, rightStartY);
                ctx.lineTo(rightEndX, rightEndY);
                ctx.stroke();
            }
            
            // Draw centerline (main line)
            ctx.strokeStyle = losIsClear ? '#00CED1' : '#FF0000';
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
