import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Stage } from '../js/Stage.js';

describe('Stage', () => {
    describe('constructor', () => {
        it('should create a stage with given position and size', () => {
            const stage = new Stage(100, 150, 80, 60);
            
            expect(stage.x).toBe(100);
            expect(stage.y).toBe(150);
            expect(stage.width).toBe(80);
            expect(stage.height).toBe(60);
        });

        it('should handle different sizes', () => {
            const stage = new Stage(50, 75, 100, 80);
            
            expect(stage.width).toBe(100);
            expect(stage.height).toBe(80);
        });
    });

    describe('getBounds', () => {
        it('should return correct bounds for centered stage', () => {
            const stage = new Stage(100, 100, 40, 40);
            const bounds = stage.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should handle rectangular stages', () => {
            const stage = new Stage(200, 300, 80, 60);
            const bounds = stage.getBounds();
            
            expect(bounds.left).toBe(160);
            expect(bounds.right).toBe(240);
            expect(bounds.top).toBe(270);
            expect(bounds.bottom).toBe(330);
        });
    });

    describe('collidesWith', () => {
        it('should detect collision when agent is inside stage', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            expect(stage.collidesWith(100, 100, 5)).toBe(true);
        });

        it('should detect collision at stage edge', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            // Agent at edge should collide (within radius)
            expect(stage.collidesWith(85, 100, 5)).toBe(true);
        });

        it('should not detect collision when agent is outside stage', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            expect(stage.collidesWith(200, 200, 5)).toBe(false);
        });

        it('should consider agent radius in collision detection', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            // Agent just outside stage bounds but within radius
            expect(stage.collidesWith(75, 100, 5)).toBe(true);
            
            // Agent outside stage bounds and radius
            expect(stage.collidesWith(75, 100, 1)).toBe(false);
        });
    });

    describe('containsPoint', () => {
        it('should return true for point inside stage', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            expect(stage.containsPoint(100, 100)).toBe(true);
            expect(stage.containsPoint(85, 95)).toBe(true);
        });

        it('should return false for point outside stage', () => {
            const stage = new Stage(100, 100, 40, 40);
            
            expect(stage.containsPoint(150, 150)).toBe(false);
            expect(stage.containsPoint(50, 50)).toBe(false);
        });

        it('should consider margin parameter', () => {
            const stage = new Stage(100, 100, 40, 40);
            const margin = 10;
            
            // Point just outside bounds but within margin
            expect(stage.containsPoint(75, 100, margin)).toBe(true);
            
            // Point outside bounds and margin
            expect(stage.containsPoint(65, 100, margin)).toBe(false);
        });

        it('should return true for points at stage corners with margin', () => {
            const stage = new Stage(100, 100, 40, 40);
            const margin = 5;
            
            // Top-left corner
            expect(stage.containsPoint(75, 75, margin)).toBe(true);
            // Top-right corner
            expect(stage.containsPoint(125, 75, margin)).toBe(true);
            // Bottom-left corner
            expect(stage.containsPoint(75, 125, margin)).toBe(true);
            // Bottom-right corner
            expect(stage.containsPoint(125, 125, margin)).toBe(true);
        });
    });

    describe('draw', () => {
        let stage;
        let mockCtx;

        beforeEach(() => {
            stage = new Stage(100, 100, 40, 40);
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                fillRect: jest.fn(),
                strokeRect: jest.fn()
            };
        });

        it('should draw dark gray fill', () => {
            stage.draw(mockCtx);
            
            // Check that fillStyle was set to dark gray
            expect(mockCtx.fillStyle).toBe('#404040');
        });

        it('should fill the interior', () => {
            stage.draw(mockCtx);
            
            // Should call fillRect
            expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
        });

        it('should draw border with line width 2', () => {
            stage.draw(mockCtx);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
            expect(mockCtx.lineWidth).toBe(2);
        });

        it('should use correct dimensions for drawing', () => {
            stage.draw(mockCtx);
            
            const fillCall = mockCtx.fillRect.mock.calls[0];
            expect(fillCall[0]).toBe(80); // left
            expect(fillCall[1]).toBe(80); // top
            expect(fillCall[2]).toBe(40); // width
            expect(fillCall[3]).toBe(40); // height
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[0]).toBe(80); // left
            expect(strokeCall[1]).toBe(80); // top
            expect(strokeCall[2]).toBe(40); // width
            expect(strokeCall[3]).toBe(40); // height
        });
    });
});
