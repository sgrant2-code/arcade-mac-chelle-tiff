/**
 * NEON ARCADE — Shared Game Integration Contract
 *
 * This contract establishes the boundary between the NEON ARCADE platform shell
 * and independently developed mini-games.
 *
 * DIVISION OF RESPONSIBILITIES:
 * ============================================================================
 * PLATFORM OWNS:
 * - Game entry fee verification and debiting
 * - Ticket wallet management (awarding tickets on verified win)
 * - Session ID generation & round lifecycle tracking
 * - Shared victory / game over result overlays
 * - Leaderboard submissions
 * - Global sound preferences (mute, master volume)
 * - Navigation between floor, cabinets, prize counter, and wallet
 *
 * MINI-GAME MODULE OWNS:
 * - Game-specific mechanics, physics, and gameplay loops
 * - Canvas / SVG / DOM rendering
 * - Player controls (keyboard, touch, virtual gamepad)
 * - Score calculations and internal combo multipliers
 * - Win and loss condition evaluation
 * - Internal game entities, enemies, and level timers
 *
 * RULES:
 * - A game module must NEVER directly modify the ticket balance.
 * - The game module communicates solely via the provided ArcadeHostCallbacks.
 */

export type ArcadeSoundPreferences = {
  muted: boolean;
  volume: number; // Normalized 0.0 to 1.0
};

export type GameMode = "standard" | "practice" | "endless";

/**
 * Session context provided to the mini-game component upon round start.
 */
export type ArcadeGameSession = {
  sessionId: string; // Unique round UUID
  gameId: string; // Registry game ID (e.g. "game-1")
  gameSlug: string; // Registry slug (e.g. "game-1")
  mode: GameMode;
  entryFeePaid: number;
  soundPreferences: ArcadeSoundPreferences;
  startedAt: number; // Unix timestamp
};

/**
 * Result payload reported by the mini-game when a round completes.
 */
export type GameResultPayload = {
  sessionId: string;
  outcome: "win" | "loss";
  score: number;
  durationSeconds?: number;
  metadata?: Record<string, unknown>; // Optional game-specific statistics (e.g. accuracy, waves)
};

/**
 * Host callbacks provided by the NEON ARCADE platform.
 */
export type ArcadeHostCallbacks = {
  /**
   * Called by the game when a winning condition is achieved.
   * Platform validates the session, awards registered tickets, and posts score.
   */
  onWin: (payload: GameResultPayload) => void;

  /**
   * Called by the game when the player loses all lives, runs out of time, etc.
   * Platform presents the game over screen with retry or exit options.
   */
  onLoss: (payload: GameResultPayload) => void;

  /**
   * Called when player chooses to abandon the game early or exit to the floor.
   */
  onQuit: (sessionId: string) => void;

  /**
   * Optional periodic score broadcast so the cabinet HUD can display live scores.
   */
  onScoreUpdate?: (currentScore: number) => void;
};

/**
 * Commands dispatched from the arcade shell to the active game.
 */
export type GameCommand = "pause" | "resume" | "restart" | "cleanup";

/**
 * The standard React component props required by any NEON ARCADE mini-game module.
 */
export type ArcadeGameComponentProps = {
  session: ArcadeGameSession;
  callbacks: ArcadeHostCallbacks;
  command?: GameCommand;
};

/**
 * Helper to generate a unique arcade round session ID.
 */
export function generateSessionId(gameSlug: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `neon_${gameSlug}_${timestamp}_${random}`;
}
