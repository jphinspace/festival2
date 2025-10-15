import { Obstacle } from './Obstacle.js';

/**
 * StaticObstacle class - represents obstacles that don't move
 * Used for pathfinding, spawn location checking, and destination selection
 */
export class StaticObstacle extends Obstacle {
    /**
     * Create a static obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the obstacle
     * @param {number} height - Height of the obstacle
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }
}
