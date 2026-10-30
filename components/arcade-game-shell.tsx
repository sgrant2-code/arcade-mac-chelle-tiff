"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArcadeGame } from "@/lib/games";
import {
  generateSessionId,
  type ArcadeGameComponentProps,
  type ArcadeGameSession,
  type ArcadeHostCallbacks,
  type GameCommand,
  type GameResultPayload,
} from "@/lib/game-contract";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound, playPrizeSound, playTone } from "@/lib/sound";

type ArcadeGameShellProps = {
  game: ArcadeGame;
  children: (props: ArcadeGameComponentProps) => React.ReactNode;
};

export function ArcadeGameShell({ game, children }: ArcadeGameShellProps) {
  const router = useRouter();
  const { tickets, addTickets, spendTickets } = useTicketWallet();

  const [session, setSession] = useState<ArcadeGameSession | null>(null);
  const [command, setCommand] = useState<GameCommand>("resume");
  const [liveScore, setLiveScore] = useState(0);
  const [result, setResult] = useState<GameResultPayload | null>(null);
  const [ticketsAwarded, setTicketsAwarded] = useState(0);
  const [muted, setMuted] = useState(false);

  // Initialize a new game session
  const startSession = useCallback(() => {
    playClickSound();

    // Check entry fee if configured
    if (game.entryFee > 0) {
      if (tickets < game.entryFee) {
        alert(`Insufficient tickets! This cabinet requires a ${game.entryFee} ticket entry fee.`);
        return;
      }
      spendTickets(game.entryFee);
    }

    const newSession: ArcadeGameSession = {
      sessionId: generateSessionId(game.slug),
      gameId: game.id,
      gameSlug: game.slug,
      mode: "standard",
      entryFeePaid: game.entryFee,
      soundPreferences: {
        muted,
        volume: muted ? 0 : 0.8,
      },
      startedAt: Date.now(),
    };

    setLiveScore(0);
    setResult(null);
    setTicketsAwarded(0);
    setCommand("resume");
    setSession(newSession);
  }, [game, tickets, spendTickets, muted]);

  // Callbacks passed to the mini-game component
  const callbacks: ArcadeHostCallbacks = useMemo(
    () => ({
      onWin: (payload: GameResultPayload) => {
        setResult(payload);
        setLiveScore(payload.score);

        // Platform awards tickets based on game registry rules
        const ticketsWon = game.reward.max > 0 ? game.reward.max : 25;
        setTicketsAwarded(ticketsWon);
        addTickets(ticketsWon);
        playPrizeSound();
      },
      onLoss: (payload: GameResultPayload) => {
        setResult(payload);
        setLiveScore(payload.score);
        playTone(150, "sawtooth", 0.3);
      },
      onQuit: () => {
        playClickSound();
        router.push("/games");
      },
      onScoreUpdate: (score: number) => {
        setLiveScore(score);
      },
    }),
    [game, addTickets, router],
  );

  const togglePause = () => {
    playClickSound();
    setCommand((prev) => (prev === "pause" ? "resume" : "pause"));
  };

  const toggleMute = () => {
    playClickSound();
    setMuted((prev) => !prev);
  };

  return (
    <div className={`arcade-cabinet-shell arcade-cabinet-shell--${game.accent}`}>
      {/* Shell HUD Header */}
      <div className="cabinet-shell-hud">
        <div className="shell-hud-left">
          <Link href="/games" className="shell-back-btn">
            ← Floor
          </Link>
          <span className="shell-title-tag">{game.marqueeLabel} · {game.displayName}</span>
        </div>

        <div className="shell-hud-center">
          <div className="shell-score-box">
            <span className="shell-score-label">SCORE</span>
            <span className="shell-score-val">{liveScore}</span>
          </div>
        </div>

        <div className="shell-hud-right">
          {session && !result && (
            <button
              type="button"
              className="shell-control-btn"
              onClick={togglePause}
              aria-label={command === "pause" ? "Resume Game" : "Pause Game"}
            >
              {command === "pause" ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
          )}

          <button
            type="button"
            className="shell-control-btn"
            onClick={toggleMute}
            aria-label={muted ? "Unmute Sound" : "Mute Sound"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* Screen Area */}
      <div className="cabinet-shell-screen">
        {!session ? (
          /* Pre-Session Start Overlay */
          <div className="cabinet-shell-start-card">
            <span className="shell-game-icon">{game.asset.icon}</span>
            <h2>{game.displayName}</h2>
            <p className="shell-tagline">{game.tagline}</p>
            <p className="shell-desc">{game.description}</p>

            <div className="shell-rules-box">
              <div className="rule-item">
                <span className="rule-label">ENTRY FEE:</span>
                <span className="rule-val">{game.entryFee === 0 ? "FREE PLAY" : `${game.entryFee} Tickets`}</span>
              </div>
              <div className="rule-item">
                <span className="rule-label">REWARD:</span>
                <span className="rule-val rule-val--lime">{game.reward.description}</span>
              </div>
            </div>

            <button
              type="button"
              className="shell-insert-coin-btn"
              onClick={startSession}
            >
              INSERT COIN / START GAME
            </button>
          </div>
        ) : result ? (
          /* Shared Platform Result Screen */
          <div className={`cabinet-shell-result-card cabinet-shell-result-card--${result.outcome}`}>
            <span className="result-symbol">{result.outcome === "win" ? "🏆" : "💀"}</span>
            <h2>{result.outcome === "win" ? "VICTORY · STAGE CLEARED" : "GAME OVER"}</h2>
            <p className="result-score-text">FINAL SCORE: {result.score.toLocaleString()}</p>

            {result.outcome === "win" && (
              <div className="result-tickets-payout">
                <span className="ticket-icon">🎟️</span>
                <span>+{ticketsAwarded} TICKETS ADDED TO WALLET</span>
              </div>
            )}

            <div className="result-actions">
              <button
                type="button"
                className="shell-action-btn shell-action-btn--primary"
                onClick={startSession}
              >
                PLAY AGAIN
              </button>
              <Link href="/games" className="shell-action-btn shell-action-btn--secondary">
                RETURN TO ARCADE
              </Link>
            </div>
          </div>
        ) : (
          /* Render Active Mini-Game via Contract */
          <div className="cabinet-shell-game-container">
            {children({ session, callbacks, command })}
          </div>
        )}
      </div>
    </div>
  );
}
