-- ============================================
-- BANANA RUNNER - DATABASE SCHEMA
-- ============================================

-- ============================================
-- PROFILES TABLE (User data & stats)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Core Stats
    high_score INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_bananas BIGINT DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    total_time_played INTEGER DEFAULT 0, -- Total seconds played

    -- Currency (spendable bananas for shop purchases)
    spendable_bananas BIGINT DEFAULT 0,

    -- Customization
    equipped_skin TEXT DEFAULT 'default',

    -- Power-up Stats
    jetpacks_collected INTEGER DEFAULT 0,
    dino_stomps_collected INTEGER DEFAULT 0,
    bubbles_collected INTEGER DEFAULT 0,
    bubble_hits_absorbed INTEGER DEFAULT 0,
    pogos_collected INTEGER DEFAULT 0,
    lions_collected INTEGER DEFAULT 0,
    turtles_collected INTEGER DEFAULT 0,
    stars_collected INTEGER DEFAULT 0,

    -- Land-specific Stats
    snow_games_played INTEGER DEFAULT 0,
    desert_games_played INTEGER DEFAULT 0,
    jungle_games_played INTEGER DEFAULT 0,
    ocean_games_played INTEGER DEFAULT 0,
    snow_best_score INTEGER DEFAULT 0,
    desert_best_score INTEGER DEFAULT 0,
    jungle_best_score INTEGER DEFAULT 0,
    ocean_best_score INTEGER DEFAULT 0,

    -- Gameplay Milestones
    first_game_at TIMESTAMP WITH TIME ZONE,
    last_game_at TIMESTAMP WITH TIME ZONE,
    highest_level_reached INTEGER DEFAULT 0,
    times_reached_rank_one INTEGER DEFAULT 0,

    -- Purchase Stats
    total_purchases INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0
);

-- ============================================
-- GAME_SESSIONS TABLE (Game history)
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    bananas_collected INTEGER DEFAULT 0,
    land_played TEXT NOT NULL,
    game_mode TEXT DEFAULT 'solo',
    duration INTEGER DEFAULT 0,
    highest_level INTEGER DEFAULT 0,
    jetpacks_used INTEGER DEFAULT 0,
    dino_stomps_used INTEGER DEFAULT 0,
    bubbles_used INTEGER DEFAULT 0,
    pogos_used INTEGER DEFAULT 0,
    lions_used INTEGER DEFAULT 0,
    turtles_used INTEGER DEFAULT 0,
    stars_used INTEGER DEFAULT 0,
    bubble_hits_absorbed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_score ON game_sessions(score DESC);

-- ============================================
-- GAME_LOBBIES TABLE (Multiplayer rooms)
-- ============================================
CREATE TABLE IF NOT EXISTS game_lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    land TEXT DEFAULT 'snow',
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lobbies_code ON game_lobbies(code);
CREATE INDEX IF NOT EXISTS idx_lobbies_status ON game_lobbies(status);

-- ============================================
-- LOBBY_PLAYERS TABLE (Players in lobbies)
-- ============================================
CREATE TABLE IF NOT EXISTS lobby_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES game_lobbies(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(lobby_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_lobby_players_lobby ON lobby_players(lobby_id);

-- ============================================
-- PLAYER_SKINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_skins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skin_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id, skin_id)
);

-- ============================================
-- PLAYER_ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS player_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(player_id, achievement_id)
);

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    p.id as player_id,
    p.username,
    p.high_score,
    p.total_games,
    p.total_bananas
FROM profiles p
WHERE p.high_score > 0
ORDER BY p.high_score DESC;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobby_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_achievements ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- GAME_SESSIONS policies
DROP POLICY IF EXISTS "Anyone can view sessions" ON game_sessions;
CREATE POLICY "Anyone can view sessions" ON game_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own sessions" ON game_sessions;
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = player_id);

-- GAME_LOBBIES policies
DROP POLICY IF EXISTS "Anyone can view lobbies" ON game_lobbies;
CREATE POLICY "Anyone can view lobbies" ON game_lobbies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create lobbies" ON game_lobbies;
CREATE POLICY "Users can create lobbies" ON game_lobbies FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update lobbies" ON game_lobbies;
CREATE POLICY "Hosts can update lobbies" ON game_lobbies FOR UPDATE USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete lobbies" ON game_lobbies;
CREATE POLICY "Hosts can delete lobbies" ON game_lobbies FOR DELETE USING (auth.uid() = host_id);

-- LOBBY_PLAYERS policies
DROP POLICY IF EXISTS "Anyone can view lobby players" ON lobby_players;
CREATE POLICY "Anyone can view lobby players" ON lobby_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join lobbies" ON lobby_players;
CREATE POLICY "Users can join lobbies" ON lobby_players FOR INSERT WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "Users can update own status" ON lobby_players;
CREATE POLICY "Users can update own status" ON lobby_players FOR UPDATE USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Users can leave lobbies" ON lobby_players;
CREATE POLICY "Users can leave lobbies" ON lobby_players FOR DELETE USING (auth.uid() = player_id);

-- PLAYER_SKINS policies
DROP POLICY IF EXISTS "Users can view own skins" ON player_skins;
CREATE POLICY "Users can view own skins" ON player_skins FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Users can unlock skins" ON player_skins;
CREATE POLICY "Users can unlock skins" ON player_skins FOR INSERT WITH CHECK (auth.uid() = player_id);

-- PLAYER_ACHIEVEMENTS policies
DROP POLICY IF EXISTS "Users can view own achievements" ON player_achievements;
CREATE POLICY "Users can view own achievements" ON player_achievements FOR SELECT USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Users can unlock achievements" ON player_achievements;
CREATE POLICY "Users can unlock achievements" ON player_achievements FOR INSERT WITH CHECK (auth.uid() = player_id);

-- ============================================
-- REALTIME
-- ============================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_lobbies;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE lobby_players;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- MIGRATION: Add new columns to existing tables
-- (Run these if tables already exist)
-- ============================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_time_played INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jetpacks_collected INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dino_stomps_collected INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS snow_games_played INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desert_games_played INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jungle_games_played INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ocean_games_played INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS snow_best_score INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS desert_best_score INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jungle_best_score INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ocean_best_score INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_game_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_game_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS highest_level_reached INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS times_reached_rank_one INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_purchases INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0;
-- ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS highest_level INTEGER DEFAULT 0;
-- ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS jetpacks_used INTEGER DEFAULT 0;
-- ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS dino_stomps_used INTEGER DEFAULT 0;
