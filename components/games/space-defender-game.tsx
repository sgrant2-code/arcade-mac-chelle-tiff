"use client";

import { useEffect, useRef, useState } from "react";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playLaserSound, playPrizeSound, playTone } from "@/lib/sound";

export function SpaceDefenderGame() {
  const { addTickets } = useTicketWallet();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [ticketsEarned, setTicketsEarned] = useState(0);

  const stateRef = useRef({
    gameState: "ready" as "ready" | "playing" | "gameover",
    score: 0,
    playerX: 180,
    playerSpeed: 5,
    keys: { left: false, right: false, fire: false },
    bullets: [] as { x: number; y: number }[],
    invaders: [] as { x: number; y: number; alive: boolean; color: string }[],
    invaderDir: 1,
    invaderSpeed: 1.2,
    lastFireTime: 0,
    animationFrameId: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem("space-defender-highscore");
    if (saved) setHighScore(Number(saved) || 0);
  }, []);

  const initGame = () => {
    const invaders: { x: number; y: number; alive: boolean; color: string }[] = [];
    const colors = ["#ff3cbf", "#26f7ff", "#bcff3c", "#ffd700"];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        invaders.push({
          x: 45 + c * 42,
          y: 40 + r * 30,
          alive: true,
          color: colors[r % colors.length],
        });
      }
    }

    stateRef.current.invaders = invaders;
    stateRef.current.bullets = [];
    stateRef.current.playerX = 180;
    stateRef.current.score = 0;
    stateRef.current.invaderDir = 1;
    stateRef.current.invaderSpeed = 1.2;
    stateRef.current.gameState = "playing";
    setScore(0);
    setTicketsEarned(0);
    setGameState("playing");
  };

  const fireBullet = () => {
    const now = Date.now();
    if (now - stateRef.current.lastFireTime > 240) {
      stateRef.current.bullets.push({
        x: stateRef.current.playerX + 16,
        y: 330,
      });
      stateRef.current.lastFireTime = now;
      playLaserSound();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        stateRef.current.keys.left = true;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        stateRef.current.keys.right = true;
      } else if (e.code === "Space") {
        e.preventDefault();
        if (stateRef.current.gameState === "playing") {
          fireBullet();
        } else if (stateRef.current.gameState === "ready" || stateRef.current.gameState === "gameover") {
          initGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        stateRef.current.keys.left = false;
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        stateRef.current.keys.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const gameLoop = () => {
      if (!running) return;

      const state = stateRef.current;

      // Update Player
      if (state.gameState === "playing") {
        if (state.keys.left) state.playerX = Math.max(10, state.playerX - state.playerSpeed);
        if (state.keys.right) state.playerX = Math.min(360, state.playerX + state.playerSpeed);

        // Update Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          b.y -= 7;
          if (b.y < 0) {
            state.bullets.splice(i, 1);
            continue;
          }

          // Check hit with invaders
          for (let j = 0; j < state.invaders.length; j++) {
            const inv = state.invaders[j];
            if (
              inv.alive &&
              b.x >= inv.x - 4 &&
              b.x <= inv.x + 28 &&
              b.y >= inv.y - 4 &&
              b.y <= inv.y + 22
            ) {
              inv.alive = false;
              state.bullets.splice(i, 1);
              state.score += 20;
              setScore(state.score);
              playTone(400, "square", 0.05);
              break;
            }
          }
        }

        // Update Invaders movement
        let switchDir = false;
        let anyAlive = false;
        let reachedBottom = false;

        for (const inv of state.invaders) {
          if (!inv.alive) continue;
          anyAlive = true;
          inv.x += state.invaderDir * state.invaderSpeed;
          if (inv.x > 365 || inv.x < 15) {
            switchDir = true;
          }
          if (inv.y > 320) {
            reachedBottom = true;
          }
        }

        if (switchDir) {
          state.invaderDir *= -1;
          for (const inv of state.invaders) {
            if (inv.alive) inv.y += 12;
          }
          state.invaderSpeed = Math.min(3.5, state.invaderSpeed + 0.1);
        }

        // Win or Lose check
        if (!anyAlive || reachedBottom) {
          state.gameState = "gameover";
          setGameState("gameover");

          // Calculate tickets: 1 ticket per 20 points, min 5 tickets
          const ticketsWon = Math.max(5, Math.floor(state.score / 20));
          setTicketsEarned(ticketsWon);
          addTickets(ticketsWon);
          playPrizeSound();

          // High score check
          if (state.score > highScore) {
            setHighScore(state.score);
            localStorage.setItem("space-defender-highscore", String(state.score));
          }
        }
      }

      // RENDER
      ctx.fillStyle = "#060310";
      ctx.fillRect(0, 0, 400, 380);

      // Stars background
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      for (let s = 0; s < 25; s++) {
        const sx = (s * 83) % 400;
        const sy = (s * 47 + (Date.now() / 50)) % 380;
        ctx.fillRect(sx, sy, 2, 2);
      }

      if (state.gameState === "playing") {
        // Draw Player Ship
        ctx.fillStyle = "#26f7ff";
        ctx.shadowColor = "#26f7ff";
        ctx.shadowBlur = 10;
        ctx.fillRect(state.playerX + 12, 330, 8, 14);
        ctx.fillRect(state.playerX + 4, 336, 24, 8);
        ctx.fillRect(state.playerX, 340, 32, 6);
        ctx.shadowBlur = 0;

        // Draw Bullets
        ctx.fillStyle = "#ff3cbf";
        ctx.shadowColor = "#ff3cbf";
        ctx.shadowBlur = 8;
        for (const b of state.bullets) {
          ctx.fillRect(b.x - 1, b.y, 3, 10);
        }
        ctx.shadowBlur = 0;

        // Draw Invaders
        for (const inv of state.invaders) {
          if (!inv.alive) continue;
          ctx.fillStyle = inv.color;
          ctx.shadowColor = inv.color;
          ctx.shadowBlur = 6;
          // 8-bit invader shape
          ctx.fillRect(inv.x + 4, inv.y, 16, 4);
          ctx.fillRect(inv.x, inv.y + 4, 24, 8);
          ctx.fillRect(inv.x + 4, inv.y + 12, 4, 6);
          ctx.fillRect(inv.x + 16, inv.y + 12, 4, 6);
          ctx.shadowBlur = 0;
        }
      } else if (state.gameState === "ready") {
        // Start screen
        ctx.fillStyle = "#ff3cbf";
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("SPACE DEFENDER", 200, 140);

        ctx.fillStyle = "#26f7ff";
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText("DEFEND THE NEON COSMOS", 200, 180);

        ctx.fillStyle = "#bcff3c";
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText("PRESS START / FIRE", 200, 240);

        ctx.fillStyle = "#fff6dc";
        ctx.font = "8px 'Press Start 2P', monospace";
        ctx.fillText("Controls: [A/D] or [← / →] to move", 200, 290);
        ctx.fillText("[SPACE] or [FIRE] to shoot", 200, 310);
      } else if (state.gameState === "gameover") {
        // Game Over screen
        ctx.fillStyle = "#ff3cbf";
        ctx.font = "14px 'Press Start 2P', monospace";
        ctx.textAlign = "center";
        ctx.fillText("MISSION COMPLETE", 200, 130);

        ctx.fillStyle = "#fff6dc";
        ctx.font = "10px 'Press Start 2P', monospace";
        ctx.fillText(`SCORE: ${score}`, 200, 175);

        ctx.fillStyle = "#bcff3c";
        ctx.font = "11px 'Press Start 2P', monospace";
        ctx.fillText(`+${ticketsEarned} TICKETS EARNED!`, 200, 220);

        ctx.fillStyle = "#26f7ff";
        ctx.font = "9px 'Press Start 2P', monospace";
        ctx.fillText("PRESS PLAY AGAIN", 200, 280);
      }

      state.animationFrameId = requestAnimationFrame(gameLoop);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animationFrameId);
    };
  }, [score, highScore, ticketsEarned, addTickets]);

  return (
    <div className="cabinet-simulator">
      {/* Game HUD Bar */}
      <div className="cabinet-hud">
        <div className="hud-metric">
          <span className="hud-metric__label">SCORE</span>
          <span className="hud-metric__val hud-metric__val--cyan">{score}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">HIGH SCORE</span>
          <span className="hud-metric__val hud-metric__val--pink">{highScore}</span>
        </div>
        <div className="hud-metric">
          <span className="hud-metric__label">REWARD RATE</span>
          <span className="hud-metric__val hud-metric__val--lime">10 TIX / 100 PTS</span>
        </div>
      </div>

      {/* CRT Screen Display */}
      <div className="crt-screen-bezel">
        <div className="crt-scanlines" />
        <div className="crt-glow-overlay" />
        <canvas
          ref={canvasRef}
          width={400}
          height={380}
          className="game-canvas"
        />
      </div>

      {/* Arcade Physical Controls (Interactive) */}
      <div className="arcade-deck-controls">
        <div className="deck-stick-group">
          <button
            type="button"
            className="virtual-arrow-btn"
            onPointerDown={() => {
              stateRef.current.keys.left = true;
            }}
            onPointerUp={() => {
              stateRef.current.keys.left = false;
            }}
            aria-label="Move Left"
          >
            ◀
          </button>
          <div className="virtual-joystick-stem" />
          <button
            type="button"
            className="virtual-arrow-btn"
            onPointerDown={() => {
              stateRef.current.keys.right = true;
            }}
            onPointerUp={() => {
              stateRef.current.keys.right = false;
            }}
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>

        <div className="deck-action-group">
          {gameState === "playing" ? (
            <button
              type="button"
              className="virtual-action-btn virtual-action-btn--fire"
              onClick={fireBullet}
            >
              FIRE!
            </button>
          ) : (
            <button
              type="button"
              className="virtual-action-btn virtual-action-btn--start"
              onClick={initGame}
            >
              {gameState === "ready" ? "START GAME" : "PLAY AGAIN"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
