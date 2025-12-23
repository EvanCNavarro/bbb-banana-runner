/**
 * @fileoverview Utility functions for Banana Runner
 *
 * Contains helper functions used throughout the game including:
 * - Sprite rendering
 * - Collision detection helpers
 * - Math utilities
 *
 * @module core/utils
 */

// ============================================
// SPRITE RENDERING
// ============================================

/**
 * Draws a pixel art sprite on the canvas
 *
 * Sprites are defined as 2D arrays where each number represents
 * a color index in the colorMap. 0 is transparent.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {number} x - X position to draw at
 * @param {number} y - Y position to draw at
 * @param {number[][]} pixels - 2D array of color indices
 * @param {number} scale - Scale multiplier for pixel size
 * @param {Object<number, string>} colorMap - Maps indices to CSS colors
 *
 * @example
 * // Draw a simple 2x2 sprite
 * const pixels = [[1, 2], [2, 1]];
 * const colors = { 1: '#FF0000', 2: '#00FF00' };
 * drawSprite(ctx, 100, 100, pixels, 4, colors);
 */
export function drawSprite(ctx, x, y, pixels, scale, colorMap) {
    for (let row = 0; row < pixels.length; row++) {
        for (let col = 0; col < pixels[row].length; col++) {
            const colorId = pixels[row][col];
            if (colorId) {
                ctx.fillStyle = colorMap[colorId];
                ctx.fillRect(
                    x + col * scale,
                    y + row * scale,
                    scale,
                    scale
                );
            }
        }
    }
}

// ============================================
// GEOMETRY HELPERS
// ============================================

/**
 * Check if a point is inside a rectangular bounds
 *
 * @param {number} px - Point X coordinate
 * @param {number} py - Point Y coordinate
 * @param {Object} bounds - Rectangle bounds
 * @param {number} bounds.x - Rectangle X position
 * @param {number} bounds.y - Rectangle Y position
 * @param {number} bounds.w - Rectangle width
 * @param {number} bounds.h - Rectangle height
 * @returns {boolean} True if point is inside bounds
 */
export function pointInBounds(px, py, bounds) {
    if (!bounds) return false;
    return px >= bounds.x && px <= bounds.x + bounds.w &&
           py >= bounds.y && py <= bounds.y + bounds.h;
}

/**
 * Check if two rectangles overlap (AABB collision)
 *
 * @param {Object} a - First rectangle
 * @param {Object} b - Second rectangle
 * @returns {boolean} True if rectangles overlap
 */
export function rectsOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// ============================================
// MATH UTILITIES
// ============================================

/**
 * Clamp a value between min and max
 *
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 *
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Generate a random integer between min and max (inclusive)
 *
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random lobby code (6 uppercase alphanumeric characters)
 *
 * @returns {string} Random lobby code
 */
export function generateLobbyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================
// CANVAS UTILITIES
// ============================================

/**
 * Draw a rounded rectangle path
 * (Polyfill for older browsers without roundRect)
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @param {number} radius - Corner radius
 */
export function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}
