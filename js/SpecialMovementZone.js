// SpecialMovementZone class - non-obstacle entities that affect spawn/destination logic
export class SpecialMovementZone {
    /**
     * Create a special movement zone
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the zone
     * @param {number} height - Height of the zone
     * @param {string} type - Type of zone (e.g., 'entranceway')
     */
    constructor(x, y, width, height, type = 'entranceway') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    /**
     * Get the bounds of the zone
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
     * Check if a point is inside the zone
     * @param {number} pointX - Point X coordinate
     * @param {number} pointY - Point Y coordinate
     * @param {number} margin - Safety margin to add around zone
     * @returns {boolean} True if point is inside zone (with margin)
     */
    containsPoint(pointX, pointY, margin = 0) {
        const bounds = this.getBounds();
        return pointX >= bounds.left - margin &&
               pointX <= bounds.right + margin &&
               pointY >= bounds.top - margin &&
               pointY <= bounds.bottom + margin;
    }

    /**
     * Draw the special movement zone on the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        const bounds = this.getBounds();
        const rectWidth = bounds.right - bounds.left;
        const rectHeight = bounds.bottom - bounds.top;
        
        // Interior is transparent (no fill)
        
        // Draw pale purple/lavender outline
        ctx.strokeStyle = '#D8BFD8'; // Pale purple/lavender (thistle)
        ctx.lineWidth = 2;
        ctx.strokeRect(bounds.left, bounds.top, rectWidth, rectHeight);
    }
}
