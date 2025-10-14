import { AgentState } from './AgentState.js';

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
        this.state = AgentState.IDLE;
        this.idleTimer = 1000; // ticks until state change
        
        // Destination coordinates for pathfinding visualization
        this.destinationX = x;
        this.destinationY = y;
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
    
    // Frame-independent update
    update(deltaTime, canvasWidth, canvasHeight) {
        // Calculate distance to destination
        const dx = this.destinationX - this.x;
        const dy = this.destinationY - this.y;
        const distanceToDestination = Math.sqrt(dx * dx + dy * dy);
        
        // State machine logic
        if (this.state === AgentState.MOVING) {
            // Check if reached destination (within 5 units)
            if (distanceToDestination <= 5) {
                // Transition to IDLE
                this.state = AgentState.IDLE;
                this.idleTimer = 1000;
                // Set destination to current location
                this.destinationX = this.x;
                this.destinationY = this.y;
            } else {
                // Continue moving towards destination
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > 0 && distanceToDestination > 0) {
                    // Normalize direction and apply velocity
                    const dirX = dx / distanceToDestination;
                    const dirY = dy / distanceToDestination;
                    this.x += dirX * speed * deltaTime;
                    this.y += dirY * speed * deltaTime;
                }
            }
        } else {
            // IDLE state (or any other state defaults to IDLE behavior)
            // Decrement timer (deltaTime is in seconds, but timer is in ticks at 1000 ticks/sec)
            // Convert deltaTime to ticks
            const ticksElapsed = deltaTime * 1000;
            this.idleTimer -= ticksElapsed;
            
            // Check if timer expired
            if (this.idleTimer <= 0) {
                // Ensure timer is exactly 0 if it went negative
                if (this.idleTimer < 0) {
                    this.idleTimer = 0;
                }
                // Transition to MOVING
                this.state = AgentState.MOVING;
                this.chooseRandomDestination(canvasWidth, canvasHeight);
            }
        }
        
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
        
        // Draw agent
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
