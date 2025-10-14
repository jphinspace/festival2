// Base obstacle class for static and dynamic obstacles
export class Obstacle {
    /**
     * Create an obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the obstacle
     * @param {number} height - Height of the obstacle
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Get the collision rectangle bounds
     * @returns {{left: number, right: number, top: number, bottom: number}}
     */
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }

    /**
     * Check if a circular agent collides with this obstacle
     * @param {number} agentX - Agent X coordinate
     * @param {number} agentY - Agent Y coordinate
     * @param {number} agentRadius - Agent radius
     * @returns {boolean} True if collision occurs
     */
    collidesWith(agentX, agentY, agentRadius) {
        const bounds = this.getBounds();
        
        // Find the closest point on the rectangle to the circle
        const closestX = Math.max(bounds.left, Math.min(agentX, bounds.right));
        const closestY = Math.max(bounds.top, Math.min(agentY, bounds.bottom));
        
        // Calculate distance from circle center to closest point
        const dx = agentX - closestX;
        const dy = agentY - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        // Collision occurs if distance is less than or equal to radius
        return distanceSquared <= (agentRadius * agentRadius);
    }

    /**
     * Check if a point is inside the obstacle (for spawn/destination checking)
     * @param {number} pointX - Point X coordinate
     * @param {number} pointY - Point Y coordinate
     * @param {number} margin - Safety margin to add around obstacle
     * @returns {boolean} True if point is inside obstacle (with margin)
     */
    containsPoint(pointX, pointY, margin = 0) {
        const bounds = this.getBounds();
        return pointX >= bounds.left - margin &&
               pointX <= bounds.right + margin &&
               pointY >= bounds.top - margin &&
               pointY <= bounds.bottom + margin;
    }

    /**
     * Draw the obstacle on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        const bounds = this.getBounds();
        const rectWidth = bounds.right - bounds.left;
        const rectHeight = bounds.bottom - bounds.top;
        
        // Draw bottom half - pale yellow
        ctx.fillStyle = '#FFFFE0'; // Pale yellow
        ctx.fillRect(bounds.left, bounds.top + rectHeight / 2, rectWidth, rectHeight / 2);
        
        // Draw top half - red and white vertical stripes
        const stripeCount = 6;
        const stripeWidth = rectWidth / stripeCount;
        
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#FF0000' : '#FFFFFF'; // Alternating red and white
            ctx.fillRect(bounds.left + i * stripeWidth, bounds.top, stripeWidth, rectHeight / 2);
        }
        
        // Draw border for clarity
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(bounds.left, bounds.top, rectWidth, rectHeight);
    }
}
