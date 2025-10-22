import { IdleState } from './AgentState.js';

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
    
    draw(ctx, showDestination = false, isSelected = false, isHovered = false) {
        // Draw destination line if enabled OR if agent is selected/hovered
        if (showDestination || isSelected || isHovered) {
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
        
        // Draw white outline if selected
        if (isSelected) {
            ctx.strokeStyle = '#FFFFFF'; // White
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    getSpeed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    
    getDirection() {
        // Calculate direction in degrees (0 = north, 90 = east, 180 = south, 270 = west)
        // In canvas: positive X = right (east), positive Y = down (south)
        // atan2(y, x) gives angle from positive X axis, counter-clockwise
        // We need compass bearing where 0 = north (negative Y direction)
        let angleRad = Math.atan2(this.vx, -this.vy); // Swap and negate y for compass
        let angleDeg = angleRad * (180 / Math.PI);
        // Normalize to 0-360
        let compassDeg = angleDeg;
        while (compassDeg < 0) compassDeg += 360;
        while (compassDeg >= 360) compassDeg -= 360;
        return Math.round(compassDeg);
    }
    
    getPathfindingMode() {
        return this.pathState.mode || 'bug';
    }
}
