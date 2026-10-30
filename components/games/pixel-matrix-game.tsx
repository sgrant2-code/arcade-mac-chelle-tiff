"use client";

import { useEffect, useRef, useState } from "react";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playPrizeSound, playTone } from "@/lib/sound";

const TILES = [
  { id: 0, color: "yellow", bg: "#ffd700", freq: 330, label: "TOP LEFT" },
  { id: 1, color: "cyan", bg: "#26f7ff", freq: 440, label: "TOP RIGHT" },
  { id: 2, color: "red", bg: "#ff3c5f", freq: 554, label: "BOTTOM LEFT" },
  { id: 3, color: "purple", bg: "#b53cff", freq: 659, label: "BOTTOM RIGHT" },
];

export function PixelMatrixGame() {
  const { addTickets } = useTicketWallet();
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [gameState, setGameState] = useState<"ready" | "showing" | "player" | "gameover">("ready");
  const [ticketsEarned, setTicketsEarned] = useState(0);

  const isShowingRef = useRef(false);

  const startNewGame = () => {
    setRound(1);
    setTicketsEarned(0);
    const firstTile = Math.floor(Math.random() * 4);
    const newSeq = [firstTile];
    setSequence(newSeq);
    playSequence(newSeq);
  };

  const playSequence = async (seq: number[]) => {
    setGameState("showing");
    isShowingRef.current = true;
    setUserStep(0);

    for (let i = 0; i < seq.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      const tileIndex = seq[i];
      setActiveTile(tileIndex);
      playTone(TILES[tileIndex].freq, "sine", 0.25);
      await new Promise((r) => setTimeout(r, 300));
      setActiveTile(null);
    }

    await new Promise((r) => setTimeout(r, 200));
    isShowingRef.current = false;
    setGameState("player");
  };

  const handleTilePress = (tileId: number) => {
    if (gameState !== "player" || isShowingRef.current) return;

    setActiveTile(tileId);
    playTone(TILES[tileId].freq, "sine", 0.2);
    setTimeout(() => setActiveTile(null), 180);

    // Check match
    if (tileId === sequence[userStep]) {
      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        // Round completed!
        const nextRound = round + 1;
        setRound(nextRound);
        const nextTile = Math.floor(Math.random() * 4);
        const newSeq = [...sequence, nextTile];
        setSequence(newSeq);

        setTimeout(() => {
          playSequence(newSeq);
        }, 700);
      } else {
        setUserStep(nextStep);
      }
    } else {
      // Wrong tile! Game Over
      playTone(130, "sawtooth", 0.4);
      setGameState("gameover");

      const ticketsWon = Math.max(5, round * 10);
      setTicketsEarned(ticketsWon);
      addTickets(ticketsWon);
      playPrizeSound();
    }
  };

  return (
    <div className="cabinet-simulator cabinet-simulator--lime">
      <div className="cabinet-hud">
        <div className="hud-metric">
          <span className="hud-metric__label">ROUND</span>
          <span className="hud-metric__val hud-metric__val--lime">{round}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">SEQUENCE LENGTH</span>
          <span className="hud-metric__val hud-metric__val--pink">{sequence.length}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">STATUS</span>
          <span className="hud-metric__val hud-metric__val--cyan">
            {gameState === "showing" ? "WATCH..." : gameState === "player" ? "REPEAT!" : "READY"}
          </span>
        </div>
      </div>

      <div className="crt-screen-bezel crt-screen-bezel--lime">
        <div className="crt-scanlines" />
        <div className="matrix-arena">
          {gameState === "ready" && (
            <div className="matrix-start-screen">
              <span className="matrix-big-icon">🟪</span>
              <h2>PIXEL MATRIX</h2>
              <p>Memorize the glowing color sequence, then press the tiles in exact order.</p>
              <button
                type="button"
                className="virtual-action-btn virtual-action-btn--lime"
                onClick={startNewGame}
              >
                START MATRIX
              </button>
            </div>
          )}

          {(gameState === "showing" || gameState === "player") && (
            <div className="matrix-tiles-grid">
              {TILES.map((tile) => {
                const isLit = activeTile === tile.id;
                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={gameState !== "player"}
                    className={`matrix-tile matrix-tile--${tile.color} ${
                      isLit ? "matrix-tile--active" : ""
                    }`}
                    onClick={() => handleTilePress(tile.id)}
                    aria-label={tile.label}
                  />
                );
              })}
            </div>
          )}

          {gameState === "gameover" && (
            <div className="matrix-start-screen">
              <h2>SEQUENCE BROKEN!</h2>
              <p>You conquered {round - 1} full sequence rounds!</p>
              <p className="surge-tickets">🎟️ +{ticketsEarned} TICKETS EARNED!</p>
              <button
                type="button"
                className="virtual-action-btn virtual-action-btn--lime"
                onClick={startNewGame}
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="arcade-deck-controls">
        <p className="deck-hint">🟪 WATCH THE 4 COLORED SQUARES AND DUPLICATE THE PATTERN</p>
      </div>
    </div>
  );
}
