/**
 * @fileoverview Authentication Service for Banana Runner
 *
 * Handles user authentication using Supabase Auth:
 * - Username/password sign up and sign in
 * - Session management
 * - User profile loading
 * - Auth state change listeners
 *
 * Uses username-to-email conversion since Supabase Auth requires email.
 * Usernames are converted to: username@banana-jump.local
 *
 * @module services/auth
 */

// ============================================
// CONSTANTS
// ============================================

/**
 * Domain used for converting usernames to email format
 * @constant {string}
 */
const AUTH_EMAIL_DOMAIN = 'banana-jump.local';

/**
 * Minimum username length
 * @constant {number}
 */
const MIN_USERNAME_LENGTH = 3;

/**
 * Regex for valid username characters
 * @constant {RegExp}
 */
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// ============================================
// HELPERS
// ============================================

/**
 * Convert username to email format for Supabase Auth
 *
 * @param {string} username - Username to convert
 * @returns {string} Email in format: username@banana-jump.local
 */
export function usernameToEmail(username) {
    return `${username.toLowerCase()}@${AUTH_EMAIL_DOMAIN}`;
}

/**
 * Validate username format
 *
 * @param {string} username - Username to validate
 * @returns {Object} {valid: boolean, error: string|null}
 */
export function validateUsername(username) {
    if (!username || username.length < MIN_USERNAME_LENGTH) {
        return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
    }
    if (!USERNAME_REGEX.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true, error: null };
}

// ============================================
// AUTH SERVICE FACTORY
// ============================================

/**
 * Creates an authentication service instance
 *
 * @param {Object} supabaseClient - Initialized Supabase client
 * @param {Object} callbacks - Callback functions for state updates
 * @param {Function} callbacks.onUserChange - Called when user changes (user) => void
 * @param {Function} callbacks.onProfileChange - Called when profile loads (profile) => void
 * @param {Function} callbacks.onAuthError - Called on auth errors (message) => void
 * @param {Function} callbacks.onAuthSuccess - Called on successful auth () => void
 * @returns {Object} Auth service with methods
 *
 * @example
 * const auth = createAuthService(supabaseClient, {
 *     onUserChange: (user) => { currentUser = user; },
 *     onProfileChange: (profile) => { userProfile = profile; },
 *     onAuthError: (msg) => showError(msg),
 *     onAuthSuccess: () => closeModal()
 * });
 */
export function createAuthService(supabaseClient, callbacks = {}) {
    const {
        onUserChange = () => {},
        onProfileChange = () => {},
        onAuthError = console.error,
        onAuthSuccess = () => {}
    } = callbacks;

    // Internal state
    let currentUser = null;
    let userProfile = null;

    /**
     * Load user profile from database
     */
    async function loadProfile() {
        if (!supabaseClient || !currentUser) return null;

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            console.error('Error loading profile:', error);
            return null;
        }

        userProfile = data;
        onProfileChange(data);
        return data;
    }

    /**
     * Initialize auth and listen for changes
     */
    async function initialize() {
        if (!supabaseClient) return;

        // Check existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            currentUser = session.user;
            onUserChange(currentUser);
            await loadProfile();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                currentUser = session.user;
                onUserChange(currentUser);
                await loadProfile();
            } else {
                currentUser = null;
                userProfile = null;
                onUserChange(null);
                onProfileChange(null);
            }
        });
    }

    /**
     * Sign up a new user
     *
     * @param {string} username - Desired username
     * @param {string} password - Password
     * @returns {Promise<boolean>} Success status
     */
    async function signUp(username, password) {
        if (!supabaseClient) {
            onAuthError('Service not configured');
            return false;
        }

        // Validate username
        const validation = validateUsername(username);
        if (!validation.valid) {
            onAuthError(validation.error);
            return false;
        }

        const email = usernameToEmail(username);

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { username }
                }
            });

            if (error) {
                if (error.message.includes('already registered')) {
                    onAuthError('Username already taken');
                } else {
                    onAuthError(error.message);
                }
                return false;
            }

            // Create profile record
            if (data.user) {
                await supabaseClient
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        username: username
                    });
            }

            // Auto-login if session exists
            if (data.session) {
                onAuthSuccess();
                return true;
            } else {
                // Manually sign in
                return signIn(username, password);
            }
        } catch (err) {
            onAuthError('Sign up failed. Please try again.');
            console.error('SignUp error:', err);
            return false;
        }
    }

    /**
     * Sign in an existing user
     *
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<boolean>} Success status
     */
    async function signIn(username, password) {
        if (!supabaseClient) {
            onAuthError('Service not configured');
            return false;
        }

        const email = usernameToEmail(username);

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                if (error.message.includes('Invalid login')) {
                    onAuthError('Invalid username or password');
                } else {
                    onAuthError(error.message);
                }
                return false;
            }

            onAuthSuccess();
            return true;
        } catch (err) {
            onAuthError('Sign in failed. Please try again.');
            console.error('SignIn error:', err);
            return false;
        }
    }

    /**
     * Sign out the current user
     */
    async function signOut() {
        if (!supabaseClient) return;

        await supabaseClient.auth.signOut();
        currentUser = null;
        userProfile = null;
        onUserChange(null);
        onProfileChange(null);
    }

    /**
     * Get current user
     * @returns {Object|null} Current user or null
     */
    function getUser() {
        return currentUser;
    }

    /**
     * Get current user profile
     * @returns {Object|null} Current profile or null
     */
    function getProfile() {
        return userProfile;
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    function isAuthenticated() {
        return currentUser !== null;
    }

    /**
     * Update user profile
     *
     * @param {Object} updates - Fields to update
     * @returns {Promise<boolean>} Success status
     */
    async function updateProfile(updates) {
        if (!supabaseClient || !currentUser) return false;

        const { error } = await supabaseClient
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id);

        if (!error) {
            userProfile = { ...userProfile, ...updates };
            onProfileChange(userProfile);
            return true;
        }

        return false;
    }

    return {
        initialize,
        signUp,
        signIn,
        signOut,
        getUser,
        getProfile,
        isAuthenticated,
        updateProfile,
        loadProfile
    };
}

export default createAuthService;
