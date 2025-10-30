import { IdleState } from './AgentState.js';
import { hasLineOfSight, hasLineOfSightSinglePath } from './Pathfinding.js';

// Constants
const ANTI_OVERLAP_VISUAL_SCALE = 1.0; // Scale factor for visualizing anti-overlap vectors
const ARROW_SIZE = 5; // Size of arrowhead for anti-overlap vector visualization

// Static counter for generating unique agent IDs
let nextAgentId = 1;

// Agent class representing festival attendees
export class Agent {
    constructor(x, y, type = 'fan') {
        this.id = nextAgentId++;
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
        
        // Hunger system
        this.hunger = 0; // starts at 0 (not hungry)
        this.totalTicks = 0; // tracks total ticks for backward compatibility
        
        // Anti-overlap velocity vector
        this.antiOverlapVx = 0;
        this.antiOverlapVy = 0;
        
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
        
        // Track total ticks for backward compatibility
        const ticksElapsed = deltaTime * 1000;
        this.totalTicks += ticksElapsed;
        
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
                
                // Check line of sight independently for each line
                const leftLosIsClear = hasLineOfSightSinglePath(
                    leftStartX, leftStartY,
                    leftEndX, leftEndY,
                    this.obstacles,
                    0  // No radius since we're checking the edge path itself
                );
                
                const rightLosIsClear = hasLineOfSightSinglePath(
                    rightStartX, rightStartY,
                    rightEndX, rightEndY,
                    this.obstacles,
                    0  // No radius since we're checking the edge path itself
                );
                
                // Draw left edge line with its own color
                const leftColor = leftLosIsClear ? 'rgba(0, 206, 209, 1.0)' : 'rgba(255, 255, 0, 1.0)';
                ctx.strokeStyle = leftColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(leftStartX, leftStartY);
                ctx.lineTo(leftEndX, leftEndY);
                ctx.stroke();
                
                // Draw right edge line with its own color
                const rightColor = rightLosIsClear ? 'rgba(0, 206, 209, 1.0)' : 'rgba(255, 255, 0, 1.0)';
                ctx.strokeStyle = rightColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(rightStartX, rightStartY);
                ctx.lineTo(rightEndX, rightEndY);
                ctx.stroke();
            }
            
            // Draw centerline with its own color
            const centerLosIsClear = hasLineOfSightSinglePath(
                this.x, this.y,
                this.destinationX, this.destinationY,
                this.obstacles,
                this.radius  // Use agent radius for center path
            );
            ctx.strokeStyle = centerLosIsClear ? '#00CED1' : '#FFFF00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.destinationX, this.destinationY);
            ctx.stroke();
            
            // Draw anti-overlap velocity vector in red
            const antiOverlapMagnitude = Math.sqrt(
                this.antiOverlapVx * this.antiOverlapVx + 
                this.antiOverlapVy * this.antiOverlapVy
            );
            
            if (antiOverlapMagnitude > 0) {
                // Scale the vector for visualization (make it visible but not overwhelming)
                const endX = this.x + this.antiOverlapVx * ANTI_OVERLAP_VISUAL_SCALE;
                const endY = this.y + this.antiOverlapVy * ANTI_OVERLAP_VISUAL_SCALE;
                
                ctx.strokeStyle = '#FF0000'; // Red for anti-overlap vector
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                
                // Draw arrowhead
                const angle = Math.atan2(this.antiOverlapVy, this.antiOverlapVx);
                
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - ARROW_SIZE * Math.cos(angle - Math.PI / 6),
                    endY - ARROW_SIZE * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    endX - ARROW_SIZE * Math.cos(angle + Math.PI / 6),
                    endY - ARROW_SIZE * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            }
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
