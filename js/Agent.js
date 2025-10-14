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
        
        // Initialize state
        this.state.enter(this, 0, 0);
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
    
    chooseRandomDestination(canvasWidth, canvasHeight) {
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
        this.state.enter(this, canvasWidth, canvasHeight);
    }
    
    // Frame-independent update
    update(deltaTime, canvasWidth, canvasHeight) {
        // Delegate to current state
        this.state.update(this, deltaTime, canvasWidth, canvasHeight);
        
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
        
        // Draw agent - use state color if available, otherwise use type color
        const stateColor = this.state.getColor(this);
        ctx.fillStyle = stateColor || this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
