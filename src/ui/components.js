/**
 * @fileoverview UI Components for Banana Runner
 *
 * Reusable UI components for the game canvas including:
 * - Styled buttons (primary/secondary)
 * - Panel/card containers
 * - Headers with back navigation
 * - Section titles
 *
 * All components follow the design system and return bounds
 * for click detection.
 *
 * @module ui/components
 */

// ============================================
// COMPONENT FACTORY
// ============================================

/**
 * Creates UI component drawing functions bound to a canvas context and design system.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context
 * @param {HTMLCanvasElement} canvas - Canvas element (for dimensions)
 * @param {Object} DS - Design system instance
 * @returns {Object} Object containing all UI component functions
 *
 * @example
 * const UI = createUIComponents(ctx, canvas, DS);
 * const bounds = UI.drawButton(100, 200, 150, 50, 'Click Me');
 */
export function createUIComponents(ctx, canvas, DS) {

    /**
     * Draw a styled button
     *
     * @param {number} x - X position (center if centered=true)
     * @param {number} y - Y position
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {string} label - Button text
     * @param {Object} options - Button options
     * @param {boolean} [options.primary=true] - Primary (filled) or secondary (outline)
     * @param {boolean} [options.disabled=false] - Disabled state
     * @param {boolean} [options.centered=true] - Center horizontally on x
     * @param {string} [options.action] - Action identifier for click handling
     * @returns {Object} Bounds object {x, y, w, h, action}
     */
    function drawButton(x, y, width, height, label, options = {}) {
        const {
            primary = true,
            disabled = false,
            centered = true,
            action = label
        } = options;

        const actualX = centered ? x - width / 2 : x;
        const actualY = y;

        // Background
        if (disabled) {
            ctx.fillStyle = DS.colors.locked;
        } else if (primary) {
            ctx.fillStyle = DS.colors.primary;
        } else {
            ctx.fillStyle = 'transparent';
            ctx.strokeStyle = DS.colors.primary;
            ctx.lineWidth = 2;
        }

        // Draw rounded rect
        const r = DS.button.radius;
        ctx.beginPath();
        ctx.roundRect(actualX, actualY, width, height, r);
        if (primary || disabled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }

        // Text
        ctx.fillStyle = primary ? DS.colors.bgDark : DS.colors.primary;
        if (disabled) ctx.fillStyle = DS.colors.textMuted;
        ctx.font = DS.font('body', 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, actualX + width / 2, actualY + height / 2);

        // Return bounds for click detection
        return { x: actualX, y: actualY, w: width, h: height, action };
    }

    /**
     * Draw a header bar with title and optional back button
     *
     * @param {string} title - Header title text
     * @param {boolean} [showBack=true] - Show back navigation button
     * @returns {Object} {height, backBounds} - Header height and back button bounds
     */
    function drawHeader(title, showBack = true) {
        const height = DS.header.height();

        // Background
        ctx.fillStyle = DS.colors.bgOverlay;
        ctx.fillRect(0, 0, canvas.width, height);

        // Bottom border
        ctx.strokeStyle = DS.colors.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(canvas.width, height);
        ctx.stroke();

        // Back button
        let backBounds = null;
        if (showBack) {
            ctx.fillStyle = DS.colors.primary;
            ctx.font = DS.font('h3', 'bold');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('←', DS.spacing.md, height / 2);

            backBounds = { x: 0, y: 0, w: height, h: height, action: 'back' };
        }

        // Title
        ctx.fillStyle = DS.colors.white;
        ctx.font = DS.font('h3', 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, canvas.width / 2, height / 2);

        return { height, backBounds };
    }

    /**
     * Draw a panel/card container
     *
     * @param {number} x - X position (center if centered=true)
     * @param {number} y - Y position
     * @param {number} width - Panel width
     * @param {number} height - Panel height
     * @param {Object} options - Panel options
     * @param {boolean} [options.centered=false] - Center horizontally on x
     * @param {string} [options.title=null] - Optional title in top-left
     * @returns {Object} Bounds object {x, y, w, h}
     */
    function drawPanel(x, y, width, height, options = {}) {
        const { centered = false, title = null } = options;
        const actualX = centered ? x - width / 2 : x;

        // Background
        ctx.fillStyle = DS.colors.bgPanel;
        ctx.beginPath();
        ctx.roundRect(actualX, y, width, height, 12);
        ctx.fill();

        // Border
        ctx.strokeStyle = DS.colors.primary;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Title if provided
        if (title) {
            ctx.fillStyle = DS.colors.primary;
            ctx.font = DS.font('body', 'bold');
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(title, actualX + DS.spacing.md, y + DS.spacing.md);
        }

        return { x: actualX, y, w: width, h: height };
    }

    /**
     * Draw a section title (centered, uppercase, muted)
     *
     * @param {string} text - Title text
     * @param {number} y - Y position
     * @returns {number} Y position after title (for layout chaining)
     */
    function drawSectionTitle(text, y) {
        ctx.fillStyle = DS.colors.textSecondary;
        ctx.font = DS.font('small', 'bold');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(text.toUpperCase(), canvas.width / 2, y);
        return y + DS.fontSize('small') + DS.spacing.sm;
    }

    /**
     * Draw a notification toast
     *
     * @param {string} message - Notification message
     * @param {string} [type='info'] - Type: 'info', 'success', 'error'
     * @param {number} [opacity=1] - Opacity for fade animation
     */
    function drawNotification(message, type = 'info', opacity = 1) {
        const colors = {
            info: DS.colors.primary,
            success: DS.colors.success,
            error: DS.colors.error
        };

        const width = Math.min(350, canvas.width - DS.spacing.lg * 2);
        const height = DS.fontSize('body') + DS.spacing.lg;
        const x = (canvas.width - width) / 2;
        const y = DS.spacing.xl;

        ctx.globalAlpha = opacity;

        // Background
        ctx.fillStyle = DS.colors.bgPanel;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();

        // Border
        ctx.strokeStyle = colors[type] || colors.info;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text
        ctx.fillStyle = DS.colors.white;
        ctx.font = DS.font('body');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, y + height / 2);

        ctx.globalAlpha = 1;
    }

    // Return all component functions
    return {
        drawButton,
        drawHeader,
        drawPanel,
        drawSectionTitle,
        drawNotification
    };
}

export default createUIComponents;
