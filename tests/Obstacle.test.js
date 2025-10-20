import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Obstacle } from '../js/Obstacle.js';

describe('Obstacle', () => {
    describe('constructor', () => {
        it('should create an obstacle with given position and size', () => {
            const obstacle = new Obstacle(100, 150, 40, 40);
            
            expect(obstacle.x).toBe(100);
            expect(obstacle.y).toBe(150);
            expect(obstacle.width).toBe(40);
            expect(obstacle.height).toBe(40);
        });

        it('should handle different sizes', () => {
            const obstacle = new Obstacle(50, 75, 30, 60);
            
            expect(obstacle.width).toBe(30);
            expect(obstacle.height).toBe(60);
        });
    });

    describe('getBounds', () => {
        it('should return correct bounds for centered obstacle', () => {
            const obstacle = new Obstacle(100, 100, 40, 40);
            const bounds = obstacle.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should return correct bounds for rectangular obstacle', () => {
            const obstacle = new Obstacle(200, 150, 60, 40);
            const bounds = obstacle.getBounds();
            
            expect(bounds.left).toBe(170);
            expect(bounds.right).toBe(230);
            expect(bounds.top).toBe(130);
            expect(bounds.bottom).toBe(170);
        });

        it('should handle obstacles at origin', () => {
            const obstacle = new Obstacle(0, 0, 20, 20);
            const bounds = obstacle.getBounds();
            
            expect(bounds.left).toBe(-10);
            expect(bounds.right).toBe(10);
            expect(bounds.top).toBe(-10);
            expect(bounds.bottom).toBe(10);
        });
    });

    describe('collidesWith', () => {
        let obstacle;

        beforeEach(() => {
            // Create a 40x40 obstacle centered at (100, 100)
            // Bounds: left=80, right=120, top=80, bottom=120
            obstacle = new Obstacle(100, 100, 40, 40);
        });

        it('should detect collision when circle center is inside rectangle', () => {
            const result = obstacle.collidesWith(100, 100, 5);
            
            expect(result).toBe(true);
        });

        it('should detect collision when circle touches rectangle edge', () => {
            // Circle with radius 5 at x=75 should touch left edge (80)
            const result = obstacle.collidesWith(75, 100, 5);
            
            expect(result).toBe(true);
        });

        it('should detect no collision when circle is far from rectangle', () => {
            const result = obstacle.collidesWith(200, 200, 5);
            
            expect(result).toBe(false);
        });

        it('should detect collision near corner', () => {
            // Circle near top-left corner
            const result = obstacle.collidesWith(77, 77, 5);
            
            expect(result).toBe(true);
        });

        it('should detect no collision just outside corner', () => {
            // Circle just outside top-left corner
            const result = obstacle.collidesWith(75, 75, 5);
            
            expect(result).toBe(false);
        });

        it('should handle large circles', () => {
            // Large circle that encompasses the obstacle
            const result = obstacle.collidesWith(100, 100, 50);
            
            expect(result).toBe(true);
        });

        it('should handle zero radius', () => {
            // Point inside rectangle
            const result1 = obstacle.collidesWith(100, 100, 0);
            expect(result1).toBe(true);

            // Point outside rectangle
            const result2 = obstacle.collidesWith(200, 200, 0);
            expect(result2).toBe(false);
        });

        it('should detect collision on right edge', () => {
            const result = obstacle.collidesWith(125, 100, 5);
            
            expect(result).toBe(true);
        });

        it('should detect collision on top edge', () => {
            const result = obstacle.collidesWith(100, 75, 5);
            
            expect(result).toBe(true);
        });

        it('should detect collision on bottom edge', () => {
            const result = obstacle.collidesWith(100, 125, 5);
            
            expect(result).toBe(true);
        });
    });

    describe('containsPoint', () => {
        let obstacle;

        beforeEach(() => {
            // Create a 40x40 obstacle centered at (100, 100)
            // Bounds: left=80, right=120, top=80, bottom=120
            obstacle = new Obstacle(100, 100, 40, 40);
        });

        it('should return true for point inside obstacle', () => {
            const result = obstacle.containsPoint(100, 100);
            
            expect(result).toBe(true);
        });

        it('should return false for point outside obstacle', () => {
            const result = obstacle.containsPoint(200, 200);
            
            expect(result).toBe(false);
        });

        it('should return true for point on boundary', () => {
            const result = obstacle.containsPoint(80, 100);
            
            expect(result).toBe(true);
        });

        it('should handle margin parameter', () => {
            // Point just outside without margin
            const result1 = obstacle.containsPoint(125, 100, 0);
            expect(result1).toBe(false);

            // Same point inside with margin
            const result2 = obstacle.containsPoint(125, 100, 10);
            expect(result2).toBe(true);
        });

        it('should handle negative margin', () => {
            // Point inside but close to edge
            const result = obstacle.containsPoint(81, 100, -2);
            
            expect(result).toBe(false);
        });

        it('should check all four corners with margin', () => {
            const margin = 5;
            
            // Top-left corner
            expect(obstacle.containsPoint(75, 75, margin)).toBe(true);
            // Top-right corner
            expect(obstacle.containsPoint(125, 75, margin)).toBe(true);
            // Bottom-left corner
            expect(obstacle.containsPoint(75, 125, margin)).toBe(true);
            // Bottom-right corner
            expect(obstacle.containsPoint(125, 125, margin)).toBe(true);
        });
    });

    describe('draw', () => {
        let obstacle;
        let mockCtx;

        beforeEach(() => {
            obstacle = new Obstacle(100, 100, 40, 40);
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                fillRect: jest.fn(),
                strokeRect: jest.fn()
            };
        });

        it('should draw magenta rectangle', () => {
            obstacle.draw(mockCtx);
            
            // Check that fillStyle was set to magenta
            expect(mockCtx.fillStyle).toBe('#FF00FF');
            expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
        });

        it('should draw border', () => {
            obstacle.draw(mockCtx);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
            expect(mockCtx.lineWidth).toBe(2);
        });

        it('should use correct dimensions for drawing', () => {
            obstacle.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[0]).toBe(80); // left
            expect(strokeCall[1]).toBe(80); // top
            expect(strokeCall[2]).toBe(40); // width
            expect(strokeCall[3]).toBe(40); // height
        });

        it('should draw for different sized obstacles', () => {
            const largeObstacle = new Obstacle(200, 200, 80, 60);
            largeObstacle.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[2]).toBe(80); // width
            expect(strokeCall[3]).toBe(60); // height
        });
    });
});
