import { StaticObstacle } from './StaticObstacle.js';

/**
 * FoodStall class - a type of static obstacle representing food stalls
 */
export class FoodStall extends StaticObstacle {
    /**
     * Create a food stall obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the obstacle
     * @param {number} height - Height of the obstacle
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }

    /**
     * Draw the food stall on the canvas
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
