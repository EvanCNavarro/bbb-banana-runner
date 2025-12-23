/**
 * @fileoverview Game configuration and constants
 *
 * This file contains all game configuration values, Supabase credentials,
 * and game physics constants. Centralizing these makes it easy to tune
 * game behavior and switch environments.
 *
 * @module core/config
 */

// ============================================
// SUPABASE CONFIGURATION
// ============================================

/**
 * Supabase project URL
 * @constant {string}
 */
export const SUPABASE_URL = 'https://cwolgatnphccqvunihav.supabase.co';

/**
 * Supabase anonymous API key (safe to expose in client)
 * @constant {string}
 */
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3b2xnYXRucGhjY3F2dW5paGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Mjc2NTksImV4cCI6MjA4MjAwMzY1OX0.IyhyEfc1OWnXYJ5FADPtIdpzRWBn2EXKlIt85l2_xLc';

// ============================================
// GAME PHYSICS CONSTANTS
// ============================================

/**
 * Scale multiplier for player sprite rendering
 * @constant {number}
 */
export const PLAYER_SCALE = 1.5;

/**
 * Scale multiplier for entity (obstacle/banana) sprites
 * @constant {number}
 */
export const ENTITY_SCALE = 1.5;

/**
 * Vertical offset for banana placement above ground
 * @constant {number}
 */
export const BANANA_HEIGHT_OFFSET = 55;

/**
 * Time window (ms) to buffer jump input before landing
 * Allows players to press jump slightly before landing
 * @constant {number}
 */
export const JUMP_BUFFER_MS = 150;

/**
 * Initial game scroll speed (pixels per frame at 60fps)
 * @constant {number}
 */
export const INITIAL_SPEED = 8;

/**
 * Speed increase per frame (acceleration, normalized to 60fps)
 * @constant {number}
 */
export const SPEED_INCREMENT = 0.0006;

/**
 * Jump velocity (negative = upward)
 * @constant {number}
 */
export const JUMP_VELOCITY = -18;

/**
 * Gravity acceleration per frame
 * @constant {number}
 */
export const GRAVITY = 1.2;

/**
 * Base spawn interval range [min, max]
 * Actual interval = min + random * (max - min)
 * @constant {Object}
 */
export const SPAWN_INTERVAL = {
    base: 280,
    variance: 220
};

/**
 * Probability of spawning a banana vs obstacle
 * @constant {number}
 */
export const BANANA_SPAWN_CHANCE = 0.35;

/**
 * Points awarded per banana collected
 * @constant {number}
 */
export const BANANA_POINTS = 100;

/**
 * Ground height as fraction of canvas height
 * @constant {number}
 */
export const GROUND_HEIGHT_RATIO = 0.15;

// ============================================
// GAME STATE CONSTANTS
// ============================================

/**
 * Valid game states for the state machine
 * @constant {Object}
 */
export const GAME_STATES = {
    WELCOME: 'welcome',
    MENU: 'menu',
    PLAYING: 'playing',
    GAMEOVER: 'gameover',
    LEADERBOARD: 'leaderboard',
    LOBBY: 'lobby'
};

/**
 * Game modes
 * @constant {Object}
 */
export const GAME_MODES = {
    SOLO: 'solo',
    MULTIPLAYER: 'multiplayer'
};
