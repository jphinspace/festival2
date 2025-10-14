import { Obstacle } from './Obstacle.js';

// Wall class - a type of static obstacle with different visual design
export class Wall extends Obstacle {
    /**
     * Create a wall obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the wall
     * @param {number} height - Height of the wall
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }

    /**
     * Draw the wall on the canvas with pale dark blueish outline
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        const bounds = this.getBounds();
        const rectWidth = bounds.right - bounds.left;
        const rectHeight = bounds.bottom - bounds.top;
        
        // Interior is transparent (no fill)
        
        // Draw pale dark blueish outline
        ctx.strokeStyle = '#6B7B8C'; // Pale dark blueish
        ctx.lineWidth = 2;
        ctx.strokeRect(bounds.left, bounds.top, rectWidth, rectHeight);
    }
}
