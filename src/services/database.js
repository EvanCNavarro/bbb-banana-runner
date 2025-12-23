/**
 * @fileoverview Database Service for Banana Runner
 *
 * Handles all database operations:
 * - Score saving (game sessions)
 * - Profile stats updates
 * - Leaderboard queries
 * - Player progress (skins, achievements)
 *
 * @module services/database
 */

// ============================================
// DATABASE SERVICE FACTORY
// ============================================

/**
 * Creates a database service instance
 *
 * @param {Object} supabaseClient - Initialized Supabase client
 * @returns {Object} Database service with methods
 *
 * @example
 * const db = createDatabaseService(supabaseClient);
 * await db.saveScore(1500, 25, 'snow');
 * const leaders = await db.getLeaderboard();
 */
export function createDatabaseService(supabaseClient) {

    /**
     * Save a game score and update profile stats
     *
     * @param {string} playerId - Player's user ID
     * @param {Object} gameData - Game session data
     * @param {number} gameData.score - Final score
     * @param {number} gameData.bananas - Bananas collected
     * @param {string} gameData.land - Land/biome played
     * @param {string} [gameData.mode='solo'] - Game mode
     * @param {Object} currentProfile - Current user profile (for comparison)
     * @returns {Promise<Object>} {success, newHighScore, updatedProfile}
     */
    async function saveScore(playerId, gameData, currentProfile) {
        if (!supabaseClient || !playerId) {
            return { success: false, newHighScore: false, updatedProfile: null };
        }

        const { score, bananas, land, mode = 'solo' } = gameData;

        // Save game session
        const { error: sessionError } = await supabaseClient
            .from('game_sessions')
            .insert({
                player_id: playerId,
                score: score,
                bananas_collected: bananas,
                land_played: land,
                game_mode: mode
            });

        if (sessionError) {
            console.error('Error saving session:', sessionError);
            return { success: false, newHighScore: false, updatedProfile: null };
        }

        // Update profile stats
        if (currentProfile) {
            const updates = {
                total_games: (currentProfile.total_games || 0) + 1,
                total_bananas: (currentProfile.total_bananas || 0) + bananas,
                total_score: (currentProfile.total_score || 0) + score
            };

            const newHighScore = score > (currentProfile.high_score || 0);
            if (newHighScore) {
                updates.high_score = score;
            }

            const { error: updateError } = await supabaseClient
                .from('profiles')
                .update(updates)
                .eq('id', playerId);

            if (!updateError) {
                return {
                    success: true,
                    newHighScore,
                    updatedProfile: { ...currentProfile, ...updates }
                };
            }
        }

        return { success: true, newHighScore: false, updatedProfile: null };
    }

    /**
     * Get global leaderboard
     *
     * @param {number} [limit=10] - Max entries to return
     * @returns {Promise<Array>} Leaderboard entries
     */
    async function getLeaderboard(limit = 10) {
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from('leaderboard')
            .select('*')
            .order('high_score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get leaderboard for a specific land/biome
     *
     * @param {string} land - Land name
     * @param {number} [limit=10] - Max entries to return
     * @returns {Promise<Array>} Leaderboard entries for land
     */
    async function getLandLeaderboard(land, limit = 10) {
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from('game_sessions')
            .select('player_id, score, profiles!inner(username)')
            .eq('land_played', land)
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching land leaderboard:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Get game over statistics for display
     *
     * @param {string} playerId - Current player ID
     * @param {string} land - Land that was played
     * @param {number} currentScore - Score from current game
     * @returns {Promise<Object>} Stats object
     */
    async function getGameOverStats(playerId, land, currentScore) {
        const stats = {
            globalTopScore: null,
            globalTopPlayer: null,
            biomeTopScore: null,
            biomeTopPlayer: null,
            personalBiomeBest: null,
            isNewBiomeBest: false,
            isNewGlobalBest: false,
            loading: false
        };

        if (!supabaseClient) return stats;

        try {
            // Global top score
            const { data: globalData } = await supabaseClient
                .from('profiles')
                .select('username, high_score')
                .order('high_score', { ascending: false })
                .limit(1)
                .single();

            if (globalData) {
                stats.globalTopScore = globalData.high_score;
                stats.globalTopPlayer = globalData.username;
                stats.isNewGlobalBest = playerId && currentScore > globalData.high_score;
            }

            // Biome top score
            const { data: biomeData } = await supabaseClient
                .from('game_sessions')
                .select('score, profiles!inner(username)')
                .eq('land_played', land)
                .order('score', { ascending: false })
                .limit(1)
                .single();

            if (biomeData) {
                stats.biomeTopScore = biomeData.score;
                stats.biomeTopPlayer = biomeData.profiles?.username || 'Unknown';
            }

            // Personal biome best
            if (playerId) {
                const { data: personalData } = await supabaseClient
                    .from('game_sessions')
                    .select('score')
                    .eq('player_id', playerId)
                    .eq('land_played', land)
                    .order('score', { ascending: false })
                    .limit(1)
                    .single();

                if (personalData) {
                    stats.personalBiomeBest = personalData.score;
                    stats.isNewBiomeBest = currentScore > personalData.score;
                } else {
                    stats.personalBiomeBest = 0;
                    stats.isNewBiomeBest = true;
                }
            }
        } catch (err) {
            console.error('Error fetching game over stats:', err);
        }

        return stats;
    }

    /**
     * Load player's unlocked skins
     *
     * @param {string} playerId - Player ID
     * @returns {Promise<Array<string>>} Array of unlocked skin IDs
     */
    async function getPlayerSkins(playerId) {
        if (!supabaseClient || !playerId) return ['default'];

        const { data, error } = await supabaseClient
            .from('player_skins')
            .select('skin_id')
            .eq('player_id', playerId);

        if (error || !data) {
            return ['default'];
        }

        return ['default', ...data.map(s => s.skin_id)];
    }

    /**
     * Unlock a skin for player
     *
     * @param {string} playerId - Player ID
     * @param {string} skinId - Skin to unlock
     * @returns {Promise<boolean>} Success status
     */
    async function unlockSkin(playerId, skinId) {
        if (!supabaseClient || !playerId) return false;

        const { error } = await supabaseClient
            .from('player_skins')
            .insert({
                player_id: playerId,
                skin_id: skinId
            });

        return !error;
    }

    /**
     * Load player's unlocked achievements
     *
     * @param {string} playerId - Player ID
     * @returns {Promise<Array<string>>} Array of unlocked achievement IDs
     */
    async function getPlayerAchievements(playerId) {
        if (!supabaseClient || !playerId) return [];

        const { data, error } = await supabaseClient
            .from('player_achievements')
            .select('achievement_id')
            .eq('player_id', playerId);

        if (error || !data) {
            return [];
        }

        return data.map(a => a.achievement_id);
    }

    /**
     * Unlock an achievement for player
     *
     * @param {string} playerId - Player ID
     * @param {string} achievementId - Achievement to unlock
     * @returns {Promise<boolean>} Success status
     */
    async function unlockAchievement(playerId, achievementId) {
        if (!supabaseClient || !playerId) return false;

        const { error } = await supabaseClient
            .from('player_achievements')
            .insert({
                player_id: playerId,
                achievement_id: achievementId
            });

        return !error;
    }

    /**
     * Update player's equipped skin
     *
     * @param {string} playerId - Player ID
     * @param {string} skinId - Skin to equip
     * @returns {Promise<boolean>} Success status
     */
    async function equipSkin(playerId, skinId) {
        if (!supabaseClient || !playerId) return false;

        const { error } = await supabaseClient
            .from('profiles')
            .update({ equipped_skin: skinId })
            .eq('id', playerId);

        return !error;
    }

    return {
        saveScore,
        getLeaderboard,
        getLandLeaderboard,
        getGameOverStats,
        getPlayerSkins,
        unlockSkin,
        getPlayerAchievements,
        unlockAchievement,
        equipSkin
    };
}

export default createDatabaseService;
