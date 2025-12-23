# Banana Runner v2.0.0 Roadmap

## Current State (v1.0.0)

### Architecture Issues
- **Monolithic codebase**: 9,871 lines in a single `index.html` file
- **Vanilla JS**: No framework, no build system, no type safety
- **Mixed concerns**: Game logic, rendering, UI, and data all intertwined
- **Multiplayer limitations**: Supabase Realtime broadcast only (~12 updates/sec)

### What Works Well
- Supabase services are properly modularized (`src/services/`)
- Design system is centralized (`src/core/designSystem.js`)
- RLS policies properly configured
- Basic multiplayer functional

---

## v2.0.0 Goals

### 1. Modern Tech Stack
### 2. Proper Code Architecture
### 3. Production-Ready Multiplayer
### 4. Complete Achievement System
### 5. Performance Optimization

---

## Tech Stack Migration

### Current Stack
```
Frontend: Vanilla JS, HTML5 Canvas
Backend: Supabase (Auth, PostgreSQL, Realtime)
Hosting: Vercel (static)
Build: None (raw files)
```

### Proposed v2.0.0 Stack
```
Frontend:
  - Framework: React or Svelte (component-based)
  - Game Engine: Phaser 3 or PixiJS (canvas abstraction)
  - State: Zustand or Jotai (lightweight state management)
  - Types: TypeScript (type safety)

Backend:
  - Supabase (keep - Auth, PostgreSQL, Storage)
  - PartyKit or Liveblocks (low-latency multiplayer)
  - OR: Colyseus (self-hosted game server)

Build:
  - Vite (fast bundling, HMR)
  - ESLint + Prettier (code quality)

Hosting:
  - Vercel (frontend)
  - Fly.io or Railway (game server if needed)
```

### Why These Choices

| Choice | Reason |
|--------|--------|
| **React/Svelte** | Component architecture, huge ecosystem, easy to hire |
| **Phaser 3** | Battle-tested game framework, handles sprites/physics/input |
| **TypeScript** | Catch bugs at compile time, better IDE support |
| **Vite** | 10-100x faster than Webpack, native ES modules |
| **PartyKit** | Edge-deployed WebSocket rooms, <50ms latency globally |
| **Zustand** | Simple state, no boilerplate, works with React |

---

## Code Architecture

### Current Structure (Bad)
```
/
├── index.html (9,871 lines - EVERYTHING)
└── src/
    ├── core/ (config, design)
    ├── services/ (auth, db, multiplayer)
    └── ui/ (components, clicks)
```

### Proposed Structure (v2.0.0)
```
/
├── src/
│   ├── main.tsx                 # App entry point
│   ├── App.tsx                  # Root component
│   │
│   ├── game/                    # Game engine layer
│   │   ├── Game.ts              # Phaser game instance
│   │   ├── scenes/
│   │   │   ├── BootScene.ts     # Asset loading
│   │   │   ├── MenuScene.ts     # Main menu
│   │   │   ├── PlayScene.ts     # Gameplay
│   │   │   └── GameOverScene.ts # Results
│   │   ├── entities/
│   │   │   ├── Player.ts        # Player class
│   │   │   ├── Obstacle.ts      # Obstacle class
│   │   │   ├── Banana.ts        # Collectible
│   │   │   └── PowerUp.ts       # Power-up base class
│   │   ├── systems/
│   │   │   ├── PhysicsSystem.ts # Collision, gravity
│   │   │   ├── SpawnSystem.ts   # Entity spawning
│   │   │   ├── ScoreSystem.ts   # Points, combos
│   │   │   └── EffectSystem.ts  # Particles, VFX
│   │   └── config/
│   │       ├── constants.ts     # Game constants
│   │       └── lands.ts         # Land definitions
│   │
│   ├── multiplayer/             # Realtime layer
│   │   ├── GameRoom.ts          # PartyKit room logic
│   │   ├── NetworkManager.ts    # Connection handling
│   │   ├── StateSync.ts         # State reconciliation
│   │   └── types.ts             # Shared message types
│   │
│   ├── store/                   # State management
│   │   ├── gameStore.ts         # Game state (Zustand)
│   │   ├── userStore.ts         # Auth state
│   │   ├── achievementStore.ts  # Achievements
│   │   └── skinStore.ts         # Skins/unlocks
│   │
│   ├── services/                # Backend services
│   │   ├── supabase.ts          # Supabase client
│   │   ├── auth.ts              # Authentication
│   │   ├── database.ts          # CRUD operations
│   │   └── leaderboard.ts       # Rankings
│   │
│   ├── components/              # React/Svelte UI
│   │   ├── screens/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── MenuScreen.tsx
│   │   │   ├── ShopScreen.tsx
│   │   │   ├── AchievementsScreen.tsx
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   └── LobbyScreen.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── PlayerCard.tsx
│   │   └── game/
│   │       └── GameCanvas.tsx   # Phaser embed
│   │
│   ├── assets/                  # Static assets
│   │   ├── sprites/             # PNG spritesheets
│   │   ├── audio/               # Sound effects
│   │   └── data/
│   │       ├── skins.json       # Skin definitions
│   │       └── achievements.json
│   │
│   └── types/                   # TypeScript types
│       ├── game.ts
│       ├── player.ts
│       └── multiplayer.ts
│
├── server/                      # Game server (if needed)
│   └── partykit/
│       └── game-room.ts         # PartyKit room
│
├── supabase/
│   ├── migrations/              # DB migrations
│   └── functions/               # Edge functions
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Lines of Code Estimate

| Module | Lines | vs Current |
|--------|-------|------------|
| Game scenes | ~1,500 | Extracted from index.html |
| Entities | ~800 | New, typed classes |
| Systems | ~600 | Extracted physics/spawn |
| Multiplayer | ~500 | New, dedicated layer |
| Store | ~400 | New state management |
| Services | ~600 | Refactored existing |
| Components | ~1,200 | New React/Svelte UI |
| Types | ~300 | New TypeScript types |
| **Total** | **~6,000** | **-40% from 9,871** |

---

## Database Schema Updates

### Current Issues
1. No `multiplayer_wins` column in profiles
2. Missing indexes on frequently queried columns
3. No proper lobby cleanup mechanism
4. Achievement tracking incomplete

### v2.0.0 Schema Changes

```sql
-- ============================================
-- PROFILES: Add missing columns
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS multiplayer_wins INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS multiplayer_games INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_daily_reward TIMESTAMP WITH TIME ZONE;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_high_score ON profiles(high_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_bananas ON profiles(total_bananas DESC);

-- ============================================
-- GAME_SESSIONS: Add multiplayer tracking
-- ============================================
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS lobby_id UUID REFERENCES game_lobbies(id);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS final_rank INTEGER; -- 1st, 2nd, etc.
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS opponent_count INTEGER DEFAULT 0;

-- ============================================
-- GAME_LOBBIES: Add game state
-- ============================================
ALTER TABLE game_lobbies ADD COLUMN IF NOT EXISTS game_seed BIGINT;
ALTER TABLE game_lobbies ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_lobbies ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE game_lobbies ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES profiles(id);

-- Auto-cleanup old lobbies
CREATE OR REPLACE FUNCTION cleanup_old_lobbies()
RETURNS void AS $$
BEGIN
    DELETE FROM game_lobbies
    WHERE status = 'waiting'
    AND created_at < NOW() - INTERVAL '1 hour';

    UPDATE game_lobbies
    SET status = 'abandoned'
    WHERE status = 'playing'
    AND started_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MATCH_RESULTS: New table for multiplayer history
-- ============================================
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lobby_id UUID REFERENCES game_lobbies(id) ON DELETE CASCADE,
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    final_score INTEGER NOT NULL,
    final_rank INTEGER NOT NULL,
    bananas_collected INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(lobby_id, player_id)
);

CREATE INDEX idx_match_results_player ON match_results(player_id);
CREATE INDEX idx_match_results_lobby ON match_results(lobby_id);

-- ============================================
-- DAILY_CHALLENGES: Future feature
-- ============================================
CREATE TABLE IF NOT EXISTS daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    challenge_type TEXT NOT NULL, -- 'score', 'bananas', 'land', 'powerup'
    target_value INTEGER NOT NULL,
    reward_bananas INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_daily_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(player_id, challenge_id)
);
```

---

## Multiplayer Architecture

### Current Limitations
- **12 updates/sec** via Supabase broadcast
- **No authoritative server** - clients can cheat
- **No latency compensation** - rubber-banding on lag
- **No reconnection** - disconnect = game over

### v2.0.0 Multiplayer Goals
- **60 updates/sec** minimum for smooth gameplay
- **Authoritative game server** - server validates all actions
- **Client-side prediction** - responsive despite latency
- **Reconnection support** - rejoin in-progress games

### Proposed Architecture

```
┌─────────────┐     WebSocket      ┌─────────────────┐
│   Client A  │◄──────────────────►│                 │
└─────────────┘                    │   PartyKit      │
                                   │   Game Room     │
┌─────────────┐     WebSocket      │                 │
│   Client B  │◄──────────────────►│  - Game state   │
└─────────────┘                    │  - Validation   │
                                   │  - Broadcast    │
┌─────────────┐     WebSocket      │                 │
│   Client C  │◄──────────────────►│                 │
└─────────────┘                    └────────┬────────┘
                                            │
                                            │ Game results
                                            ▼
                                   ┌─────────────────┐
                                   │    Supabase     │
                                   │  - Profiles     │
                                   │  - Sessions     │
                                   │  - Leaderboard  │
                                   └─────────────────┘
```

### Message Protocol

```typescript
// Client → Server
type ClientMessage =
  | { type: 'join', playerId: string, skin: string }
  | { type: 'ready' }
  | { type: 'input', jump: boolean, timestamp: number }
  | { type: 'collect', entityId: string }
  | { type: 'die' }
  | { type: 'leave' }

// Server → Client
type ServerMessage =
  | { type: 'state', players: PlayerState[], entities: Entity[], tick: number }
  | { type: 'spawn', entity: Entity }
  | { type: 'remove', entityId: string }
  | { type: 'score', playerId: string, score: number }
  | { type: 'death', playerId: string }
  | { type: 'gameOver', results: MatchResult[] }
```

### Latency Compensation

```typescript
// Client-side prediction
function handleInput(input: Input) {
  // 1. Apply input locally immediately
  applyInputLocally(input);

  // 2. Send to server with timestamp
  sendToServer({ type: 'input', ...input, timestamp: Date.now() });

  // 3. Store in pending inputs buffer
  pendingInputs.push(input);
}

// Server reconciliation
function onServerState(state: GameState) {
  // 1. Apply authoritative state
  applyServerState(state);

  // 2. Re-apply pending inputs not yet acknowledged
  for (const input of pendingInputs) {
    if (input.timestamp > state.lastProcessedTimestamp) {
      applyInputLocally(input);
    }
  }

  // 3. Clear acknowledged inputs
  pendingInputs = pendingInputs.filter(i => i.timestamp > state.lastProcessedTimestamp);
}
```

---

## Achievement System Fixes

### Current Bugs

1. **Land tracking broken** - `landsPlayed` Set not persisted
2. **Power-up counts not saved** - Session stats lost
3. **Multiplayer wins not tracked** - No `multiplayer_wins` column
4. **Retroactive check only on login** - Misses mid-session unlocks

### v2.0.0 Achievement System

```typescript
// src/store/achievementStore.ts
interface AchievementStore {
  // State
  unlocked: Set<string>;
  progress: Map<string, number>;

  // Actions
  checkAchievement(id: string): boolean;
  trackProgress(type: string, delta: number): void;
  unlock(id: string): Promise<void>;

  // Computed
  getProgress(id: string): { current: number, target: number };
  getUnlockPercentage(): number;
}

// Achievement definitions with proper typing
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'games' | 'score' | 'bananas' | 'powerups' | 'lands' | 'multiplayer' | 'shop';
  requirement: {
    type: string;
    value: number;
  };
  reward: number;
  icon: string;
  hidden?: boolean; // Secret achievements
}

// Real-time tracking
function trackPowerUp(type: PowerUpType) {
  const countKey = `${type}_collected`;
  achievementStore.trackProgress(countKey, 1);

  // Immediately check related achievements
  checkPowerUpAchievements(type);
}

function trackLandPlayed(land: Land) {
  userStore.addPlayedLand(land);

  if (userStore.playedLands.size >= 4) {
    achievementStore.checkAchievement('global_wanderer');
  }
}
```

### Achievement Categories (50+)

| Category | Count | Examples |
|----------|-------|----------|
| Games Played | 6 | First Steps, Banana Master, True Champion |
| High Score | 7 | First Hundred → Legendary Runner |
| Bananas | 6 | First Banana → Banana Billionaire |
| Power-ups | 18 | Per power-up: first use, 10x, 25x |
| Lands | 5 | Play each land, play all lands |
| Multiplayer | 4 | First win, 5 wins, 10 wins, Champion |
| Shop | 3 | First purchase, 5 purchases, 20 purchases |
| Special | 5+ | Rank #1, daily streak, etc. |

---

## Performance Targets

### Current Performance
- ~45-55 FPS on mobile (drops during effects)
- ~60 FPS on desktop
- 514KB initial bundle (uncompressed)

### v2.0.0 Targets

| Metric | Target | How |
|--------|--------|-----|
| Mobile FPS | 60 stable | Phaser's optimized rendering |
| Desktop FPS | 60+ | RequestAnimationFrame + delta |
| Initial bundle | <200KB gzipped | Code splitting, tree shaking |
| Time to interactive | <2s | Lazy load non-critical |
| Memory usage | <100MB | Object pooling, cleanup |

### Optimization Strategies

1. **Object Pooling** - Reuse entity objects instead of creating/destroying
2. **Sprite Batching** - Render all sprites in single draw call
3. **Culling** - Don't render off-screen entities
4. **Asset Compression** - PNG → WebP, lazy load audio
5. **Code Splitting** - Load game code only when needed

---

## Migration Plan

### Phase 1: Setup (Week 1-2)
- [ ] Initialize Vite + React/Svelte project
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint + Prettier
- [ ] Create basic project structure
- [ ] Set up Phaser 3 integration

### Phase 2: Core Game (Week 3-5)
- [ ] Port player physics to Phaser
- [ ] Port entity system (obstacles, bananas, power-ups)
- [ ] Port collision detection
- [ ] Port scoring system
- [ ] Create game scenes (Boot, Menu, Play, GameOver)

### Phase 3: UI Migration (Week 6-7)
- [ ] Create React/Svelte components for all screens
- [ ] Port shop system
- [ ] Port achievements display
- [ ] Port leaderboard
- [ ] Add responsive design

### Phase 4: Multiplayer (Week 8-10)
- [ ] Set up PartyKit or Colyseus server
- [ ] Implement game room logic
- [ ] Add client-side prediction
- [ ] Add reconnection support
- [ ] Load test with 4-8 players

### Phase 5: Polish (Week 11-12)
- [ ] Fix all achievement tracking
- [ ] Add sound effects
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile testing

### Phase 6: Launch (Week 13)
- [ ] Database migrations
- [ ] Deploy new frontend
- [ ] Deploy game server
- [ ] Monitor and hotfix

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Phaser learning curve | Medium | Start with simple scenes, iterate |
| State sync bugs | High | Extensive testing, rollback plan |
| Performance regression | Medium | Continuous benchmarking |
| User data migration | High | Test on staging, backup everything |
| Scope creep | High | Strict MVP definition |

---

## Success Metrics

### Technical
- [ ] 60 FPS on all devices
- [ ] <100ms multiplayer latency
- [ ] <3s initial load time
- [ ] Zero data loss during migration

### Product
- [ ] All 50+ achievements functional
- [ ] 4-player multiplayer stable
- [ ] Maintain current feature parity
- [ ] Improved code maintainability (measured by new dev onboarding time)

---

## Open Questions

1. **React vs Svelte?** - React has larger ecosystem, Svelte is faster
2. **Phaser vs PixiJS?** - Phaser has more game features, Pixi is lighter
3. **PartyKit vs Colyseus?** - PartyKit is managed, Colyseus is self-hosted
4. **Gradual migration or big bang?** - Risk vs complexity tradeoff

---

## Appendix: Current Code Stats

```
index.html:     9,871 lines (514KB)
src/services/:  1,060 lines
src/core/:        524 lines
src/ui/:          439 lines
─────────────────────────────
Total:         11,894 lines

Sprites data:   ~2,800 lines (28%)
Game logic:     ~3,200 lines (32%)
UI rendering:   ~2,000 lines (20%)
Other:          ~1,871 lines (20%)
```
