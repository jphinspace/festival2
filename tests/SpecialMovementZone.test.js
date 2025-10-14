import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SpecialMovementZone } from '../js/SpecialMovementZone.js';

describe('SpecialMovementZone', () => {
    describe('constructor', () => {
        it('should create a zone with given position and size', () => {
            const zone = new SpecialMovementZone(100, 150, 80, 120, 'entranceway');
            
            expect(zone.x).toBe(100);
            expect(zone.y).toBe(150);
            expect(zone.width).toBe(80);
            expect(zone.height).toBe(120);
            expect(zone.type).toBe('entranceway');
        });

        it('should default type to entranceway', () => {
            const zone = new SpecialMovementZone(50, 75, 30, 60);
            
            expect(zone.type).toBe('entranceway');
        });

        it('should handle custom types', () => {
            const zone = new SpecialMovementZone(50, 75, 30, 60, 'custom');
            
            expect(zone.type).toBe('custom');
        });
    });

    describe('getBounds', () => {
        it('should return correct bounds for centered zone', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            const bounds = zone.getBounds();
            
            expect(bounds.left).toBe(80);
            expect(bounds.right).toBe(120);
            expect(bounds.top).toBe(80);
            expect(bounds.bottom).toBe(120);
        });

        it('should handle rectangular zones', () => {
            const zone = new SpecialMovementZone(200, 300, 80, 120);
            const bounds = zone.getBounds();
            
            expect(bounds.left).toBe(160);
            expect(bounds.right).toBe(240);
            expect(bounds.top).toBe(240);
            expect(bounds.bottom).toBe(360);
        });
    });

    describe('containsPoint', () => {
        it('should return true for point inside zone', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            
            expect(zone.containsPoint(100, 100)).toBe(true);
            expect(zone.containsPoint(85, 95)).toBe(true);
        });

        it('should return false for point outside zone', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            
            expect(zone.containsPoint(150, 150)).toBe(false);
            expect(zone.containsPoint(50, 50)).toBe(false);
        });

        it('should consider margin parameter', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            const margin = 10;
            
            // Point just outside bounds but within margin
            expect(zone.containsPoint(75, 100, margin)).toBe(true);
            
            // Point outside bounds and margin
            expect(zone.containsPoint(65, 100, margin)).toBe(false);
        });

        it('should return true for points at zone corners with margin', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            const margin = 5;
            
            // Top-left corner
            expect(zone.containsPoint(75, 75, margin)).toBe(true);
            // Top-right corner
            expect(zone.containsPoint(125, 75, margin)).toBe(true);
            // Bottom-left corner
            expect(zone.containsPoint(75, 125, margin)).toBe(true);
            // Bottom-right corner
            expect(zone.containsPoint(125, 125, margin)).toBe(true);
        });

        it('should return true for points at exact boundaries', () => {
            const zone = new SpecialMovementZone(100, 100, 40, 40);
            
            // Edge points
            expect(zone.containsPoint(80, 100)).toBe(true);
            expect(zone.containsPoint(120, 100)).toBe(true);
            expect(zone.containsPoint(100, 80)).toBe(true);
            expect(zone.containsPoint(100, 120)).toBe(true);
        });
    });

    describe('draw', () => {
        let zone;
        let mockCtx;

        beforeEach(() => {
            zone = new SpecialMovementZone(100, 100, 40, 40, 'entranceway');
            mockCtx = {
                fillStyle: '',
                strokeStyle: '',
                lineWidth: 0,
                fillRect: jest.fn(),
                strokeRect: jest.fn()
            };
        });

        it('should draw pale purple/lavender outline', () => {
            zone.draw(mockCtx);
            
            // Check that strokeStyle was set to pale purple/lavender
            expect(mockCtx.strokeStyle).toBe('#D8BFD8');
        });

        it('should not fill the interior', () => {
            zone.draw(mockCtx);
            
            // Should not call fillRect (transparent interior)
            expect(mockCtx.fillRect).not.toHaveBeenCalled();
        });

        it('should draw border with line width 2', () => {
            zone.draw(mockCtx);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledTimes(1);
            expect(mockCtx.lineWidth).toBe(2);
        });

        it('should use correct dimensions for drawing', () => {
            zone.draw(mockCtx);
            
            const strokeCall = mockCtx.strokeRect.mock.calls[0];
            expect(strokeCall[0]).toBe(80); // left
            expect(strokeCall[1]).toBe(80); // top
            expect(strokeCall[2]).toBe(40); // width
            expect(strokeCall[3]).toBe(40); // height
        });
    });
});
