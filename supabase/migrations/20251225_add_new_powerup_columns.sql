-- Add new power-up tracking columns to profiles table
-- For the new power-up system: Bubble, Pogo, Lion, Turtle, Star

-- Bubble Shield stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bubbles_collected INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bubble_hits_absorbed INTEGER DEFAULT 0;

-- Pogo Stick stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pogos_collected INTEGER DEFAULT 0;

-- Lion Roar stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lions_collected INTEGER DEFAULT 0;

-- Turtle stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS turtles_collected INTEGER DEFAULT 0;

-- Star stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stars_collected INTEGER DEFAULT 0;

-- Add new power-up columns to game_sessions table
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS bubbles_used INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS pogos_used INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS lions_used INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS turtles_used INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS stars_used INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS bubble_hits_absorbed INTEGER DEFAULT 0;
