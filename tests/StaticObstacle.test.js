import { describe, it, expect } from '@jest/globals';
import { StaticObstacle } from '../js/StaticObstacle.js';
import { Obstacle } from '../js/Obstacle.js';

describe('StaticObstacle', () => {
    describe('constructor', () => {
        it('should create a static obstacle with given position and size', () => {
            const obstacle = new StaticObstacle(100, 150, 40, 40);
            
            expect(obstacle.x).toBe(100);
            expect(obstacle.y).toBe(150);
            expect(obstacle.width).toBe(40);
            expect(obstacle.height).toBe(40);
        });

        it('should extend Obstacle base class', () => {
            const obstacle = new StaticObstacle(50, 75, 30, 60);
            
            expect(obstacle instanceof Obstacle).toBe(true);
        });
    });

    describe('inherited methods', () => {
        let obstacle;

        beforeEach(() => {
            obstacle = new StaticObstacle(100, 100, 40, 40);
        });

        it('should inherit getBounds from Obstacle', () => {
            const bounds = obstacle.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should inherit collidesWith from Obstacle', () => {
            const result = obstacle.collidesWith(100, 100, 5);
            
            expect(result).toBe(true);
        });

        it('should inherit containsPoint from Obstacle', () => {
            const result = obstacle.containsPoint(100, 100);
            
            expect(result).toBe(true);
        });
    });

    describe('type checking', () => {
        it('should be identifiable as StaticObstacle', () => {
            const obstacle = new StaticObstacle(100, 100, 40, 40);
            
            expect(obstacle instanceof StaticObstacle).toBe(true);
        });

        it('should be identifiable as Obstacle', () => {
            const obstacle = new StaticObstacle(100, 100, 40, 40);
            
            expect(obstacle instanceof Obstacle).toBe(true);
        });
    });

    describe('filtering', () => {
        it('should be filterable from mixed obstacle arrays', () => {
            const staticObs1 = new StaticObstacle(100, 100, 40, 40);
            const staticObs2 = new StaticObstacle(200, 200, 40, 40);
            const obstacles = [staticObs1, staticObs2];
            
            const staticObstacles = obstacles.filter(obs => obs instanceof StaticObstacle);
            
            expect(staticObstacles.length).toBe(2);
        });
    });
});
