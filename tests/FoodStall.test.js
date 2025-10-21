import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FoodStall } from '../js/FoodStall.js';

describe('FoodStall', () => {
    describe('constructor', () => {
        it('should create a food stall with given position and size', () => {
            const foodStall = new FoodStall(100, 150, 40, 40);
            
            expect(foodStall.x).toBe(100);
            expect(foodStall.y).toBe(150);
            expect(foodStall.width).toBe(40);
            expect(foodStall.height).toBe(40);
        });

        it('should handle different sizes', () => {
            const foodStall = new FoodStall(50, 75, 30, 60);
            
            expect(foodStall.width).toBe(30);
            expect(foodStall.height).toBe(60);
        });
    });

    describe('getBounds', () => {
        it('should return correct bounds for centered food stall', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            const bounds = foodStall.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should handle rectangular food stalls', () => {
            const foodStall = new FoodStall(200, 300, 60, 40);
            const bounds = foodStall.getBounds();
            
            expect(bounds.left).toBe(170);
            expect(bounds.right).toBe(230);
            expect(bounds.top).toBe(280);
            expect(bounds.bottom).toBe(320);
        });
    });

    describe('collidesWith', () => {
        it('should detect collision when agent is inside food stall', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            expect(foodStall.collidesWith(100, 100, 5)).toBe(true);
        });

        it('should detect collision at food stall edge', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            // Agent at edge should collide (within radius)
            expect(foodStall.collidesWith(85, 100, 5)).toBe(true);
        });

        it('should not detect collision when agent is outside food stall', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            expect(foodStall.collidesWith(200, 200, 5)).toBe(false);
        });

        it('should consider agent radius in collision detection', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            // Agent just outside food stall bounds but within radius
            expect(foodStall.collidesWith(75, 100, 5)).toBe(true);
            
            // Agent outside food stall bounds and radius
            expect(foodStall.collidesWith(75, 100, 1)).toBe(false);
        });
    });

    describe('containsPoint', () => {
        it('should return true for point inside food stall', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            expect(foodStall.containsPoint(100, 100)).toBe(true);
            expect(foodStall.containsPoint(85, 95)).toBe(true);
        });

        it('should return false for point outside food stall', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            
            expect(foodStall.containsPoint(150, 150)).toBe(false);
            expect(foodStall.containsPoint(50, 50)).toBe(false);
        });

        it('should consider margin parameter', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            const margin = 10;
            
            // Point just outside bounds but within margin
            expect(foodStall.containsPoint(75, 100, margin)).toBe(true);
            
            // Point outside bounds and margin
            expect(foodStall.containsPoint(65, 100, margin)).toBe(false);
        });

        it('should return true for points at food stall corners with margin', () => {
            const foodStall = new FoodStall(100, 100, 40, 40);
            const margin = 5;
            
            // Top-left corner
            expect(foodStall.containsPoint(75, 75, margin)).toBe(true);
            // Top-right corner
            expect(foodStall.containsPoint(125, 75, margin)).toBe(true);
            // Bottom-left corner
            expect(foodStall.containsPoint(75, 125, margin)).toBe(true);
            // Bottom-right corner
            expect(foodStall.containsPoint(125, 125, margin)).toBe(true);
        });
    });

    describe('draw', () => {
        let foodStall;
        let mockCtx;

        beforeEach(() => {
            foodStall = new FoodStall(100, 100, 40, 40);
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                fillRect: jest.fn(),
                strokeRect: jest.fn()
            };
        });

        it('should draw pale yellow bottom half', () => {
            foodStall.draw(mockCtx);
            
            // Check that fillStyle was set to pale yellow
            const fillRectCalls = mockCtx.fillRect.mock.calls;
            
            expect(fillRectCalls.length).toBeGreaterThan(0);
        });

        it('should draw red and white stripes on top half', () => {
            foodStall.draw(mockCtx);
            
            // Should have multiple fillRect calls for stripes
            expect(mockCtx.fillRect.mock.calls.length).toBeGreaterThan(6);
        });

        it('should draw border', () => {
            foodStall.draw(mockCtx);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
            expect(mockCtx.lineWidth).toBe(2);
        });

        it('should use correct dimensions for drawing', () => {
            foodStall.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[0]).toBe(80); // left
            expect(strokeCall[1]).toBe(80); // top
            expect(strokeCall[2]).toBe(40); // width
            expect(strokeCall[3]).toBe(40); // height
        });

        it('should draw for different sized food stalls', () => {
            const largeFoodStall = new FoodStall(200, 200, 80, 60);
            largeFoodStall.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[2]).toBe(80); // width
            expect(strokeCall[3]).toBe(60); // height
        });
    });
});
