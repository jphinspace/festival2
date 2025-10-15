import { Obstacle } from './Obstacle.js';

/**
 * DynamicObstacle class - represents obstacles that can move (like agents)
 * Used for pathfinding only, NOT for spawn location checking or destination selection
 */
export class DynamicObstacle extends Obstacle {
    /**
     * Create a dynamic obstacle
     * @param {number} x - X coordinate of the center
     * @param {number} y - Y coordinate of the center
     * @param {number} width - Width of the obstacle
     * @param {number} height - Height of the obstacle
     */
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }
}
