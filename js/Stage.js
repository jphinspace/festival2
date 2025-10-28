import { Obstacle } from './Obstacle.js';

// Stage class - a type of static obstacle representing a performance stage
export class Stage extends Obstacle {
    /**
     * Create a stage obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the stage
     * @param {number} height - Height of the stage
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }

    /**
     * Draw the stage on the canvas with dark gray fill
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        const bounds = this.getBounds();
        const rectWidth = bounds.right - bounds.left;
        const rectHeight = bounds.bottom - bounds.top;
        
        // Draw dark gray fill
        ctx.fillStyle = '#404040'; // Dark gray
        ctx.fillRect(bounds.left, bounds.top, rectWidth, rectHeight);
        
        // Draw border for clarity
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(bounds.left, bounds.top, rectWidth, rectHeight);
    }
}
