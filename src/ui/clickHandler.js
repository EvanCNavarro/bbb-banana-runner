/**
 * @fileoverview Click/Touch Handler for Banana Runner
 *
 * Manages clickable areas and input handling for the game UI.
 * Supports both mouse clicks and touch events for mobile.
 *
 * @module ui/clickHandler
 */

import { pointInBounds } from '../core/utils.js';

// ============================================
// CLICKABLE AREAS MANAGER
// ============================================

/**
 * Creates a clickable areas manager
 *
 * @returns {Object} Manager with methods to track and check clickable areas
 *
 * @example
 * const clickManager = createClickManager();
 * clickManager.reset();
 * clickManager.add({ x: 0, y: 0, w: 100, h: 50, action: 'start' });
 * const hit = clickManager.checkClick(50, 25); // Returns 'start'
 */
export function createClickManager() {
    let clickableAreas = [];

    return {
        /**
         * Reset all clickable areas (call at start of each frame)
         */
        reset() {
            clickableAreas = [];
        },

        /**
         * Add a clickable area
         * @param {Object} bounds - Area bounds {x, y, w, h, action}
         */
        add(bounds) {
            if (bounds) {
                clickableAreas.push(bounds);
            }
        },

        /**
         * Check if a point hits any clickable area
         * @param {number} x - X coordinate
         * @param {number} y - Y coordinate
         * @returns {string|null} Action of hit area, or null if no hit
         */
        checkClick(x, y) {
            for (const area of clickableAreas) {
                if (pointInBounds(x, y, area)) {
                    return area.action;
                }
            }
            return null;
        },

        /**
         * Get all current clickable areas (for debugging)
         * @returns {Array} Array of clickable areas
         */
        getAreas() {
            return [...clickableAreas];
        },

        /**
         * Get count of clickable areas
         * @returns {number} Count
         */
        count() {
            return clickableAreas.length;
        }
    };
}

// ============================================
// INPUT HANDLER
// ============================================

/**
 * Creates an input handler for canvas click/touch events
 *
 * @param {HTMLCanvasElement} canvas - Game canvas element
 * @param {Object} options - Configuration options
 * @param {Function} options.onAction - Callback when action is triggered (action: string)
 * @param {Function} options.onGameTap - Callback for taps during gameplay
 * @param {Function} options.getClickManager - Function that returns current click manager
 * @param {Function} options.getGameState - Function that returns current game state
 * @param {Array<string>} options.menuStates - Game states where menu clicks apply
 * @returns {Object} Input handler with attach/detach methods
 *
 * @example
 * const inputHandler = createInputHandler(canvas, {
 *     onAction: (action) => handleMenuAction(action),
 *     onGameTap: () => jump(),
 *     getClickManager: () => clickManager,
 *     getGameState: () => gameState,
 *     menuStates: ['menu', 'welcome', 'gameover', 'leaderboard', 'lobby']
 * });
 * inputHandler.attach();
 */
export function createInputHandler(canvas, options) {
    const {
        onAction,
        onGameTap,
        getClickManager,
        getGameState,
        menuStates = ['welcome', 'menu', 'gameover', 'leaderboard', 'lobby']
    } = options;

    /**
     * Convert client coordinates to canvas coordinates
     */
    function clientToCanvas(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    /**
     * Handle a click/tap at given client coordinates
     */
    function handleInput(clientX, clientY) {
        const { x, y } = clientToCanvas(clientX, clientY);
        const gameState = getGameState();
        const isMenuState = menuStates.includes(gameState);

        if (isMenuState) {
            const clickManager = getClickManager();
            const action = clickManager.checkClick(x, y);

            if (action) {
                onAction(action);
                return true;
            }

            // Special case: game over allows restart on any tap
            if (gameState === 'gameover') {
                onGameTap();
                return true;
            }

            return false;
        } else {
            // During gameplay, any tap triggers game action (jump)
            onGameTap();
            return true;
        }
    }

    // Event handlers
    function handleClick(e) {
        handleInput(e.clientX, e.clientY);
    }

    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY);
    }

    return {
        /**
         * Attach event listeners to canvas
         */
        attach() {
            canvas.addEventListener('click', handleClick);
            canvas.addEventListener('touchstart', handleTouch);
        },

        /**
         * Remove event listeners from canvas
         */
        detach() {
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('touchstart', handleTouch);
        },

        /**
         * Manually trigger input at coordinates
         */
        triggerAt(clientX, clientY) {
            return handleInput(clientX, clientY);
        }
    };
}

export default { createClickManager, createInputHandler };
