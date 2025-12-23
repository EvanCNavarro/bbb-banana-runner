/**
 * @fileoverview Design System for Banana Runner
 *
 * Provides consistent styling across the game UI including:
 * - Color palette (semantic colors)
 * - Typography (responsive font sizing)
 * - Spacing scale (8px base)
 * - Component dimensions (buttons, headers)
 *
 * The design system is responsive and scales based on canvas width
 * to support mobile, tablet, and desktop displays.
 *
 * @module core/designSystem
 */

// ============================================
// COLOR PALETTE
// ============================================

/**
 * Game color palette with semantic naming
 * @constant {Object}
 */
export const colors = {
    // Primary brand colors
    primary: '#FFE135',      // Banana yellow - main accent
    primaryDark: '#E5C800',  // Darker yellow for hover/pressed states

    // Text colors (on dark backgrounds)
    white: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#666666',

    // Background colors
    bgDark: '#0a0a0f',       // Darkest background
    bgPanel: '#1a1a2e',      // Panel/card background
    bgOverlay: 'rgba(0, 0, 0, 0.85)',      // Modal overlay
    bgOverlayLight: 'rgba(0, 0, 0, 0.7)',  // Lighter overlay

    // Semantic colors
    success: '#4CAF50',      // Green - success, ready, unlocked
    error: '#E53935',        // Red - errors, lose state
    warning: '#FF9800',      // Orange - warnings

    // Game-specific
    locked: '#444444',       // Locked items
    unlocked: '#4CAF50'      // Unlocked items
};

// ============================================
// SPACING SCALE
// ============================================

/**
 * Spacing scale based on 8px grid
 * @constant {Object}
 */
export const spacing = {
    xs: 4,    // Extra small
    sm: 8,    // Small
    md: 16,   // Medium (base)
    lg: 24,   // Large
    xl: 32,   // Extra large
    xxl: 48   // 2x Extra large
};

// ============================================
// TYPOGRAPHY
// ============================================

/**
 * Base font sizes before responsive scaling
 * @constant {Object}
 */
const fontSizes = {
    h1: 48,      // Main titles (Game Over, Welcome)
    h2: 36,      // Section titles
    h3: 24,      // Subsection titles, important labels
    body: 18,    // Regular text, buttons
    small: 14,   // Secondary text, stats
    tiny: 12     // Fine print, hints
};

/**
 * Responsive breakpoints for typography scaling
 * @constant {Object}
 */
const typography = {
    minWidth: 375,     // Mobile width
    maxWidth: 1200,    // Desktop width
    minScale: 0.85,    // Scale at min width
    maxScale: 1.4      // Scale at max width
};

/**
 * Calculate responsive font size based on canvas width
 * @param {string} size - Size key (h1, h2, h3, body, small, tiny)
 * @param {number} canvasWidth - Current canvas width
 * @returns {number} Calculated font size in pixels
 */
export function getFontSize(size, canvasWidth) {
    const { minWidth, maxWidth, minScale, maxScale } = typography;
    const clampedWidth = Math.min(Math.max(canvasWidth, minWidth), maxWidth);
    const scale = minScale + (maxScale - minScale) * ((clampedWidth - minWidth) / (maxWidth - minWidth));
    return Math.round((fontSizes[size] || fontSizes.body) * scale);
}

/**
 * Get CSS font string for canvas rendering
 * @param {string} size - Size key
 * @param {string} weight - 'normal' or 'bold'
 * @param {number} canvasWidth - Current canvas width
 * @returns {string} Font string for ctx.font
 */
export function getFont(size, weight = 'normal', canvasWidth) {
    const px = getFontSize(size, canvasWidth);
    const w = weight === 'bold' ? 'bold ' : '';
    return `${w}${px}px monospace`;
}

// ============================================
// COMPONENT DIMENSIONS
// ============================================

/**
 * Button dimension calculations
 * @constant {Object}
 */
export const button = {
    /**
     * Get button height based on canvas width
     * @param {number} canvasWidth
     * @returns {number}
     */
    height: (canvasWidth) => Math.max(48, Math.round(canvasWidth * 0.06)),

    /**
     * Get minimum button width
     * @param {number} canvasWidth
     * @returns {number}
     */
    minWidth: (canvasWidth) => Math.max(160, Math.round(canvasWidth * 0.25)),

    /** Border radius for rounded corners */
    radius: 8,

    /** Get button padding */
    padding: () => spacing.lg
};

/**
 * Header dimension calculations
 * @constant {Object}
 */
export const header = {
    /**
     * Get header height based on canvas width
     * @param {number} canvasWidth
     * @returns {number}
     */
    height: (canvasWidth) => Math.max(56, Math.round(canvasWidth * 0.07))
};

// ============================================
// DESIGN SYSTEM FACTORY
// ============================================

/**
 * Creates a design system instance bound to a canvas element.
 * This allows the DS to access canvas dimensions for responsive calculations.
 *
 * @param {HTMLCanvasElement} canvas - The game canvas element
 * @returns {Object} Design system object with all styling utilities
 *
 * @example
 * const canvas = document.getElementById('gameCanvas');
 * const DS = createDesignSystem(canvas);
 * ctx.font = DS.font('h1', 'bold');
 * ctx.fillStyle = DS.colors.primary;
 */
export function createDesignSystem(canvas) {
    return {
        colors,
        spacing,

        /**
         * Get responsive font size
         * @param {string} size - Size key
         * @returns {number} Font size in pixels
         */
        fontSize: (size) => getFontSize(size, canvas.width),

        /**
         * Get font string for canvas
         * @param {string} size - Size key
         * @param {string} weight - 'normal' or 'bold'
         * @returns {string} Font string
         */
        font: (size, weight = 'normal') => getFont(size, weight, canvas.width),

        button: {
            height: () => button.height(canvas.width),
            minWidth: () => button.minWidth(canvas.width),
            radius: button.radius,
            padding: button.padding
        },

        header: {
            height: () => header.height(canvas.width)
        }
    };
}

// ============================================
// DEFAULT EXPORT
// ============================================

/**
 * Default export - the factory function
 * Use this to create a canvas-bound design system instance
 */
export default createDesignSystem;
