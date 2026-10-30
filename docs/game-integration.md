# NEON ARCADE — Game Integration Guide (Phase 1)

Welcome to the **NEON ARCADE** team! This guide explains how to build, test, and integrate your independent mini-game into the shared NEON ARCADE platform without modifying core platform code or colliding with teammates.

---

## 1. Division of Responsibilities

| Responsibility | Owned By | Description |
| :--- | :--- | :--- |
| **Ticket Wallet & Balances** | **Arcade Platform** | Games **never** modify the wallet directly. The platform manages entry fee debit and reward payouts. |
| **Session Lifecycle & IDs** | **Arcade Platform** | Generates session IDs (`sessionId`), validates rounds, and triggers payouts. |
| **Cabinet Header, HUD & Navigation**| **Arcade Platform** | Score overlays, pause/mute triggers, and exit routes back to the floor. |
| **Shared Result Overlays** | **Arcade Platform** | Victory screen with ticket payout summary, Game Over screen, and retry/exit handlers. |
| **Gameplay Mechanics & Canvas** | **Your Mini-Game** | Rendering loops (Canvas/SVG/DOM), physics, player controls, levels, timers, and sprite assets. |
| **Score & Outcome Evaluation** | **Your Mini-Game** | Calculating game points, combo bonuses, and detecting win vs. loss conditions. |

> [!IMPORTANT]
> **Strict Rule**: A mini-game module must **never** directly import or mutate the ticket wallet. When your game reaches a win or loss condition, report it through the standard host callbacks. The arcade platform verifies the session and securely awards tickets to the player's wallet.

---

## 2. Where to Place Your Game Code

Place all files specific to your mini-game in an isolated folder under `components/games/[your-game-name]/`:

```
components/
└── games/
    └── my-game/
        ├── my-game.tsx           # Main React game component / adapter
        ├── game-engine.ts        # Internal gameplay logic, physics, entities
        ├── assets/               # Game-specific sprites, audio, or textures
        └── my-game.module.css    # (Optional) Game-specific styles
```

Do not put platform-level logic (e.g., ticket math, site navigation) inside your mini-game directory.

---

## 3. Registering Your Game in the Central Registry

Open [`lib/games.ts`](file:///Users/miche/Documents/arcade-mac-chelle-tiff/lib/games.ts). Every cabinet in the arcade reads from this single array.

Update or add your entry in `games`:

```typescript
{
  id: "my-game-id",
  slug: "my-game-slug",
  displayName: "Super Neon Blaster",
  tagline: "Vaporize the grid invaders before midnight!",
  description: "High-octane vertical shooter with combo multipliers.",
  asset: {
    icon: "👾",
    accent: "pink", // "pink" | "cyan" | "lime" | "gold" | "purple"
    marqueeLabel: "CABINET 01",
  },
  route: "/games/my-game-slug",
  status: "available", // "coming_soon" | "available" | "disabled"
  entryFee: 0, // Free play or ticket cost
  reward: {
    min: 10,
    max: 50,
    description: "10-50 tickets based on waves cleared",
  },
}
```

- When `status: "coming_soon"`, the platform displays the cabinet with game name, artwork, and a **Coming Soon** badge.
- When `status: "available"`, the platform mounts your game component.

---

## 4. Component Props & Host Callbacks Contract

Your main game component receives standard props defined in [`lib/game-contract.ts`](file:///Users/miche/Documents/arcade-mac-chelle-tiff/lib/game-contract.ts):

```typescript
import type { ArcadeGameComponentProps } from "@/lib/game-contract";

export function MyMiniGame({ session, callbacks, command }: ArcadeGameComponentProps) {
  // session.sessionId         -> Unique round ID (string)
  // session.soundPreferences  -> { muted: boolean, volume: number }
  // command                   -> "pause" | "resume" | "restart" | "cleanup"
  // callbacks.onWin(...)      -> Report round victory & score
  // callbacks.onLoss(...)     -> Report game over & score
  // callbacks.onScoreUpdate   -> Broadcast live score to cabinet HUD
  // callbacks.onQuit(...)     -> User voluntarily abandoned round
}
```

### Reporting Game Outcomes

#### On Victory
When the player completes the level or achieves the winning criteria:
```typescript
callbacks.onWin({
  sessionId: session.sessionId,
  outcome: "win",
  score: 14500,
  durationSeconds: 42,
  metadata: { wavesCleared: 5, accuracy: 0.92 }
});
```
*The platform will display the victory banner, post the score, and deposit tickets into the player's wallet.*

#### On Loss (Game Over)
When the player runs out of lives or time:
```typescript
callbacks.onLoss({
  sessionId: session.sessionId,
  outcome: "loss",
  score: 3200,
  durationSeconds: 18,
});
```

#### On Live Score Update
To update the cabinet HUD in real-time as enemies are defeated:
```typescript
callbacks.onScoreUpdate?.(currentScore);
```

### Handling Pause and Resume

The platform shell provides pause/resume buttons. When the user toggles pause, the platform updates `command`:

```typescript
useEffect(() => {
  if (command === "pause") {
    pauseInternalGameLoop();
  } else if (command === "resume") {
    resumeInternalGameLoop();
  }
}, [command]);
```

### Handling Cleanup

Ensure your component cleans up any `requestAnimationFrame`, `setInterval`, audio nodes, or DOM listeners on unmount:

```typescript
useEffect(() => {
  return () => {
    cancelAnimationFrame(animFrameId);
    stopAudioContext();
  };
}, []);
```

---

## 5. Minimal Example Adapter

Here is a minimal self-contained adapter illustrating how an existing standalone game connects to NEON ARCADE:

```typescript
"use client";

import { useEffect, useState } from "react";
import type { ArcadeGameComponentProps } from "@/lib/game-contract";

export function ExampleMiniGameAdapter({
  session,
  callbacks,
  command,
}: ArcadeGameComponentProps) {
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Handle commands from the arcade platform
  useEffect(() => {
    setIsPaused(command === "pause");
  }, [command]);

  // 2. Simulate gameplay actions
  const handleScorePoints = (points: number) => {
    if (isPaused) return;
    const newScore = score + points;
    setScore(newScore);
    callbacks.onScoreUpdate?.(newScore);
  };

  const handleFinishLevel = () => {
    callbacks.onWin({
      sessionId: session.sessionId,
      outcome: "win",
      score,
      metadata: { roundsPlayed: 1 },
    });
  };

  const handleDefeat = () => {
    callbacks.onLoss({
      sessionId: session.sessionId,
      outcome: "loss",
      score,
    });
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h3>Round: {session.sessionId}</h3>
      <p>Score: {score}</p>
      {isPaused && <p style={{ color: "#ffd700" }}>PAUSED</p>}

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
        <button onClick={() => handleScorePoints(100)}>+100 Points</button>
        <button onClick={handleFinishLevel}>Win Level</button>
        <button onClick={handleDefeat}>Game Over</button>
        <button onClick={() => callbacks.onQuit(session.sessionId)}>Exit to Floor</button>
      </div>
    </div>
  );
}
```

---

## 6. How to Test Your Game Locally

1. Set your game's status to `"available"` in [`lib/games.ts`](file:///Users/miche/Documents/arcade-mac-chelle-tiff/lib/games.ts).
2. Wire your component into [`app/games/[slug]/page.tsx`](file:///Users/miche/Documents/arcade-mac-chelle-tiff/app/games/[slug]/page.tsx).
3. Start the dev server: `npm run dev`.
4. Open `http://localhost:3000/games/[your-slug]` in your browser.
5. Verify:
   - Starting a session debits any entry fee (if fee > 0).
   - Calling `onWin` displays the platform victory banner and awards tickets.
   - Calling `onLoss` displays the Game Over screen with retry action.
   - Pause/resume commands halt and resume your loop.
   - Navigating away cleanly tears down timers and audio.
