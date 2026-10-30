"use client";

import { useEffect, useRef, useState } from "react";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playLaserSound, playPrizeSound, playTone } from "@/lib/sound";

export function NeonSurgeGame() {
  const { addTickets } = useTicketWallet();
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [ticketsEarned, setTicketsEarned] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const nodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    setScore(0);
    setCombo(1);
    setTimeLeft(25);
    setGameState("playing");
    setTicketsEarned(0);
    spawnNode();
  };

  const spawnNode = () => {
    const nextNode = Math.floor(Math.random() * 8);
    setActiveNode(nextNode);
    playTone(600 + nextNode * 60, "sine", 0.08);

    if (nodeTimerRef.current) clearTimeout(nodeTimerRef.current);
    nodeTimerRef.current = setTimeout(() => {
      // Missed node
      setCombo(1);
      spawnNode();
    }, 1100);
  };

  const handleNodeClick = (index: number) => {
    if (gameState !== "playing") return;

    if (index === activeNode) {
      playLaserSound();
      const points = 10 * combo;
      setScore((s) => s + points);
      setCombo((c) => Math.min(10, c + 1));
      spawnNode();
    } else {
      playTone(180, "sawtooth", 0.15);
      setCombo(1);
    }
  };

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            if (nodeTimerRef.current) clearTimeout(nodeTimerRef.current);
            setGameState("gameover");
            setActiveNode(null);

            // Compute tickets
            const won = Math.max(5, Math.floor(score / 30));
            setTicketsEarned(won);
            addTickets(won);
            playPrizeSound();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (nodeTimerRef.current) clearTimeout(nodeTimerRef.current);
    };
  }, [gameState, score, addTickets]);

  return (
    <div className="cabinet-simulator cabinet-simulator--cyan">
      <div className="cabinet-hud">
        <div className="hud-metric">
          <span className="hud-metric__label">ENERGY SCORE</span>
          <span className="hud-metric__val hud-metric__val--cyan">{score}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">SURGE COMBO</span>
          <span className="hud-metric__val hud-metric__val--pink">{combo}x</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">TIME REMAINING</span>
          <span className="hud-metric__val hud-metric__val--lime">{timeLeft}s</span>
        </div>
      </div>

      <div className="crt-screen-bezel crt-screen-bezel--cyan">
        <div className="crt-scanlines" />
        <div className="neon-surge-arena">
          {gameState === "ready" && (
            <div className="surge-overlay-screen">
              <span className="surge-big-icon">⚡</span>
              <h2>NEON SURGE</h2>
              <p>Overcharged capacitors are leaking high voltage across the grid!</p>
              <p className="surge-sub">Tap the active glowing cyan lightning nodes before the timer expires.</p>
              <button
                type="button"
                className="virtual-action-btn virtual-action-btn--cyan"
                onClick={startGame}
              >
                START SURGE
              </button>
            </div>
          )}

          {gameState === "playing" && (
            <div className="surge-nodes-grid">
              {Array.from({ length: 8 }).map((_, idx) => {
                const isActive = activeNode === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`surge-node ${isActive ? "surge-node--active" : ""}`}
                    onClick={() => handleNodeClick(idx)}
                    aria-label={`Surge Node ${idx + 1}`}
                  >
                    <span className="surge-node-bolt">⚡</span>
                    {isActive && <span className="surge-pulse-ring" />}
                  </button>
                );
              })}
            </div>
          )}

          {gameState === "gameover" && (
            <div className="surge-overlay-screen">
              <h2>SURGE CONTAINED!</h2>
              <p className="surge-score">FINAL SCORE: {score}</p>
              <p className="surge-tickets">🎟️ +{ticketsEarned} TICKETS EARNED!</p>
              <button
                type="button"
                className="virtual-action-btn virtual-action-btn--cyan"
                onClick={startGame}
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="arcade-deck-controls">
        <p className="deck-hint">⚡ TAP SURGING NODES RAPIDLY TO BUILD MULTIPLIER COMBO</p>
      </div>
    </div>
  );
}
