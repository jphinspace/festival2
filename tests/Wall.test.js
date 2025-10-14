import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Wall } from '../js/Wall.js';

describe('Wall', () => {
    describe('constructor', () => {
        it('should create a wall with given position and size', () => {
            const wall = new Wall(100, 150, 360, 120);
            
            expect(wall.x).toBe(100);
            expect(wall.y).toBe(150);
            expect(wall.width).toBe(360);
            expect(wall.height).toBe(120);
        });

        it('should handle different sizes', () => {
            const wall = new Wall(50, 75, 300, 100);
            
            expect(wall.width).toBe(300);
            expect(wall.height).toBe(100);
        });
    });

    describe('getBounds', () => {
        it('should return correct bounds for centered wall', () => {
            const wall = new Wall(100, 100, 40, 40);
            const bounds = wall.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should handle rectangular walls', () => {
            const wall = new Wall(200, 300, 360, 120);
            const bounds = wall.getBounds();
            
            expect(bounds.left).toBe(20);
            expect(bounds.right).toBe(380);
            expect(bounds.top).toBe(240);
            expect(bounds.bottom).toBe(360);
        });
    });

    describe('collidesWith', () => {
        it('should detect collision when agent is inside wall', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            expect(wall.collidesWith(100, 100, 5)).toBe(true);
        });

        it('should detect collision at wall edge', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            // Agent at edge should collide (within radius)
            expect(wall.collidesWith(85, 100, 5)).toBe(true);
        });

        it('should not detect collision when agent is outside wall', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            expect(wall.collidesWith(200, 200, 5)).toBe(false);
        });

        it('should consider agent radius in collision detection', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            // Agent just outside wall bounds but within radius
            expect(wall.collidesWith(75, 100, 5)).toBe(true);
            
            // Agent outside wall bounds and radius
            expect(wall.collidesWith(75, 100, 1)).toBe(false);
        });
    });

    describe('containsPoint', () => {
        it('should return true for point inside wall', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            expect(wall.containsPoint(100, 100)).toBe(true);
            expect(wall.containsPoint(85, 95)).toBe(true);
        });

        it('should return false for point outside wall', () => {
            const wall = new Wall(100, 100, 40, 40);
            
            expect(wall.containsPoint(150, 150)).toBe(false);
            expect(wall.containsPoint(50, 50)).toBe(false);
        });

        it('should consider margin parameter', () => {
            const wall = new Wall(100, 100, 40, 40);
            const margin = 10;
            
            // Point just outside bounds but within margin
            expect(wall.containsPoint(75, 100, margin)).toBe(true);
            
            // Point outside bounds and margin
            expect(wall.containsPoint(65, 100, margin)).toBe(false);
        });

        it('should return true for points at wall corners with margin', () => {
            const wall = new Wall(100, 100, 40, 40);
            const margin = 5;
            
            // Top-left corner
            expect(wall.containsPoint(75, 75, margin)).toBe(true);
            // Top-right corner
            expect(wall.containsPoint(125, 75, margin)).toBe(true);
            // Bottom-left corner
            expect(wall.containsPoint(75, 125, margin)).toBe(true);
            // Bottom-right corner
            expect(wall.containsPoint(125, 125, margin)).toBe(true);
        });
    });

    describe('draw', () => {
        let wall;
        let mockCtx;

        beforeEach(() => {
            wall = new Wall(100, 100, 40, 40);
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                fillRect: jest.fn(),
                strokeRect: jest.fn()
            };
        });

        it('should draw pale dark blueish outline', () => {
            wall.draw(mockCtx);
            
            // Check that strokeStyle was set to pale dark blueish
            expect(mockCtx.strokeStyle).toBe('#6B7B8C');
        });

        it('should not fill the interior', () => {
            wall.draw(mockCtx);
            
            // Should not call fillRect (transparent interior)
            expect(mockCtx.fillRect).not.toHaveBeenCalled();
        });

        it('should draw border with line width 2', () => {
            wall.draw(mockCtx);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
            expect(mockCtx.lineWidth).toBe(2);
        });

        it('should use correct dimensions for drawing', () => {
            wall.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[0]).toBe(80); // left
            expect(strokeCall[1]).toBe(80); // top
            expect(strokeCall[2]).toBe(40); // width
            expect(strokeCall[3]).toBe(40); // height
        });
    });
});
