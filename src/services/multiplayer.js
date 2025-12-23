/**
 * @fileoverview Multiplayer Service for Banana Runner
 *
 * Handles multiplayer lobby functionality:
 * - Lobby creation and joining
 * - Real-time player updates
 * - Game state synchronization
 * - Ready status management
 *
 * @module services/multiplayer
 */

// ============================================
// MULTIPLAYER SERVICE FACTORY
// ============================================

/**
 * Creates a multiplayer service instance
 *
 * @param {Object} supabaseClient - Initialized Supabase client
 * @param {Object} callbacks - Callback functions
 * @param {Function} callbacks.onLobbyUpdate - Called when lobby state changes
 * @param {Function} callbacks.onPlayersUpdate - Called when players change
 * @param {Function} callbacks.onGameStart - Called when game should start
 * @param {Function} callbacks.onOpponentScore - Called with opponent score updates
 * @returns {Object} Multiplayer service with methods
 *
 * @example
 * const mp = createMultiplayerService(supabaseClient, {
 *     onLobbyUpdate: (lobby) => updateLobbyUI(lobby),
 *     onPlayersUpdate: (players) => updatePlayersUI(players),
 *     onGameStart: () => startGame(),
 *     onOpponentScore: (score) => updateOpponentScore(score)
 * });
 */
export function createMultiplayerService(supabaseClient, callbacks = {}) {
    const {
        onLobbyUpdate = () => {},
        onPlayersUpdate = () => {},
        onGameStart = () => {},
        onOpponentScore = () => {}
    } = callbacks;

    // Internal state
    let currentLobby = null;
    let lobbyPlayers = [];
    let lobbySubscription = null;
    let playersSubscription = null;
    let isHost = false;

    /**
     * Generate a random lobby code
     * @returns {string} 6-character uppercase alphanumeric code
     */
    function generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    /**
     * Create a new lobby
     *
     * @param {string} hostId - Host player's user ID
     * @param {string} land - Selected land/biome
     * @returns {Promise<Object|null>} Created lobby or null on failure
     */
    async function createLobby(hostId, land) {
        if (!supabaseClient || !hostId) return null;

        const code = generateLobbyCode();

        const { data, error } = await supabaseClient
            .from('game_lobbies')
            .insert({
                code: code,
                host_id: hostId,
                land: land,
                status: 'waiting'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating lobby:', error);
            return null;
        }

        currentLobby = data;
        isHost = true;

        // Join the lobby as host
        await joinLobby(data.id, hostId);

        // Subscribe to lobby updates
        subscribeToLobby(data.id);

        onLobbyUpdate(currentLobby);
        return data;
    }

    /**
     * Find an available lobby to join, or create a new one
     *
     * @param {string} playerId - Player's user ID
     * @param {string} land - Selected land
     * @returns {Promise<Object|null>} Lobby or null
     */
    async function findOrCreateLobby(playerId, land) {
        if (!supabaseClient || !playerId) return null;

        // Try to find an existing waiting lobby
        const { data: existingLobbies, error } = await supabaseClient
            .from('game_lobbies')
            .select('*')
            .eq('status', 'waiting')
            .neq('host_id', playerId)
            .order('created_at', { ascending: true })
            .limit(1);

        if (existingLobbies && existingLobbies.length > 0) {
            // Join existing lobby
            const lobby = existingLobbies[0];
            currentLobby = lobby;
            isHost = false;

            await joinLobby(lobby.id, playerId);
            subscribeToLobby(lobby.id);

            onLobbyUpdate(currentLobby);
            return lobby;
        }

        // No available lobby, create new one
        return createLobby(playerId, land);
    }

    /**
     * Join a lobby by code
     *
     * @param {string} code - Lobby code
     * @param {string} playerId - Player's user ID
     * @returns {Promise<Object|null>} Lobby or null
     */
    async function joinByCode(code, playerId) {
        if (!supabaseClient || !playerId) return null;

        const { data: lobby, error } = await supabaseClient
            .from('game_lobbies')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('status', 'waiting')
            .single();

        if (error || !lobby) {
            console.error('Lobby not found:', code);
            return null;
        }

        currentLobby = lobby;
        isHost = false;

        await joinLobby(lobby.id, playerId);
        subscribeToLobby(lobby.id);

        onLobbyUpdate(currentLobby);
        return lobby;
    }

    /**
     * Add player to lobby_players table
     */
    async function joinLobby(lobbyId, playerId) {
        const { error } = await supabaseClient
            .from('lobby_players')
            .insert({
                lobby_id: lobbyId,
                player_id: playerId,
                is_ready: false
            });

        if (error) {
            console.error('Error joining lobby:', error);
        }
    }

    /**
     * Subscribe to lobby and player updates
     */
    function subscribeToLobby(lobbyId) {
        // Clean up existing subscriptions
        unsubscribe();

        // Subscribe to lobby changes
        lobbySubscription = supabaseClient
            .channel(`lobby:${lobbyId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'game_lobbies', filter: `id=eq.${lobbyId}` },
                (payload) => {
                    if (payload.new) {
                        currentLobby = payload.new;
                        onLobbyUpdate(currentLobby);

                        if (payload.new.status === 'playing') {
                            onGameStart();
                        }
                    }
                }
            )
            .subscribe();

        // Subscribe to player changes
        playersSubscription = supabaseClient
            .channel(`lobby_players:${lobbyId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'lobby_players', filter: `lobby_id=eq.${lobbyId}` },
                async () => {
                    await refreshPlayers(lobbyId);
                    checkAllReady();
                }
            )
            .subscribe();

        // Initial player load
        refreshPlayers(lobbyId);
    }

    /**
     * Refresh players list from database
     */
    async function refreshPlayers(lobbyId) {
        const { data, error } = await supabaseClient
            .from('lobby_players')
            .select('*, profiles(username)')
            .eq('lobby_id', lobbyId);

        if (!error && data) {
            lobbyPlayers = data;
            onPlayersUpdate(lobbyPlayers);
        }
    }

    /**
     * Check if all players are ready and start game
     */
    async function checkAllReady() {
        if (!isHost || lobbyPlayers.length < 2) return;

        const allReady = lobbyPlayers.every(p => p.is_ready);
        if (allReady) {
            // Host starts the game
            await supabaseClient
                .from('game_lobbies')
                .update({ status: 'playing' })
                .eq('id', currentLobby.id);
        }
    }

    /**
     * Toggle player's ready status
     *
     * @param {string} playerId - Player's user ID
     * @returns {Promise<boolean>} New ready status
     */
    async function toggleReady(playerId) {
        if (!currentLobby || !playerId) return false;

        const currentPlayer = lobbyPlayers.find(p => p.player_id === playerId);
        const newReady = !currentPlayer?.is_ready;

        await supabaseClient
            .from('lobby_players')
            .update({ is_ready: newReady })
            .eq('lobby_id', currentLobby.id)
            .eq('player_id', playerId);

        return newReady;
    }

    /**
     * Leave the current lobby
     *
     * @param {string} playerId - Player's user ID
     */
    async function leaveLobby(playerId) {
        if (!currentLobby || !playerId) return;

        // Remove from lobby_players
        await supabaseClient
            .from('lobby_players')
            .delete()
            .eq('lobby_id', currentLobby.id)
            .eq('player_id', playerId);

        // If host, delete the lobby
        if (isHost) {
            await supabaseClient
                .from('game_lobbies')
                .delete()
                .eq('id', currentLobby.id);
        }

        unsubscribe();
        currentLobby = null;
        lobbyPlayers = [];
        isHost = false;

        onLobbyUpdate(null);
        onPlayersUpdate([]);
    }

    /**
     * Broadcast game state to opponent
     *
     * @param {Object} state - Game state {score, bananas, gameOver}
     */
    function broadcastGameState(state) {
        if (!currentLobby) return;

        supabaseClient.channel(`game:${currentLobby.id}`).send({
            type: 'broadcast',
            event: 'game_state',
            payload: state
        });
    }

    /**
     * Listen for opponent game state updates
     *
     * @param {string} playerId - Current player's ID (to filter out own updates)
     */
    function listenForOpponentState(playerId) {
        if (!currentLobby) return;

        supabaseClient
            .channel(`game:${currentLobby.id}`)
            .on('broadcast', { event: 'game_state' }, (payload) => {
                if (payload.payload.playerId !== playerId) {
                    onOpponentScore(payload.payload);
                }
            })
            .subscribe();
    }

    /**
     * Unsubscribe from all real-time channels
     */
    function unsubscribe() {
        if (lobbySubscription) {
            supabaseClient.removeChannel(lobbySubscription);
            lobbySubscription = null;
        }
        if (playersSubscription) {
            supabaseClient.removeChannel(playersSubscription);
            playersSubscription = null;
        }
    }

    /**
     * Get current lobby
     * @returns {Object|null}
     */
    function getLobby() {
        return currentLobby;
    }

    /**
     * Get current lobby players
     * @returns {Array}
     */
    function getPlayers() {
        return lobbyPlayers;
    }

    /**
     * Check if current player is host
     * @returns {boolean}
     */
    function isLobbyHost() {
        return isHost;
    }

    return {
        createLobby,
        findOrCreateLobby,
        joinByCode,
        toggleReady,
        leaveLobby,
        broadcastGameState,
        listenForOpponentState,
        unsubscribe,
        getLobby,
        getPlayers,
        isLobbyHost
    };
}

export default createMultiplayerService;
