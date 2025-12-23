-- Add multiplayer tracking columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS multiplayer_games INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS multiplayer_wins INTEGER DEFAULT 0;
