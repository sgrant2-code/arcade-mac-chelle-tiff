"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTicketWallet } from "@/components/ticket-wallet";

// ============================================================================
// Types & Constants
// ============================================================================

export type HazardType = "tombstone" | "holy_water" | "cross";

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  flickerSpeed: number;
  color: string;
}

export interface BrainCollectible {
  id: string;
  x: number;
  y: number;
  baseY: number;
  radius: number;
  collected: boolean;
  angle: number;
}

export interface Hazard {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  opacity: number;
  rotation?: number;
}

export interface FloatingNotification {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;

// Corrupted Rainbow 6-Stripe Color Palette
const CORRUPTED_PALETTE = [
  "#39ff14", // Toxic Green
  "#7b1fa2", // Deep Purple
  "#d50000", // Crimson Red
  "#ff6d00", // Dark Orange
  "#cddc39", // Slime Yellow
  "#c2185b", // Blood Magenta
];

// ============================================================================
// Dark 8-bit Chiptune Audio Synthesizer (Web Audio API)
// ============================================================================
class ZombieAudioManager {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isBgmPlaying: boolean = false;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.isBgmPlaying = false;
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  // Play 'splat' jump sound
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  // Play 'munch' sound for eating brains
  public playMunch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.setValueAtTime(600, this.ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(300, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {}
  }

  // Play death crunch / splatter sound
  public playDeath() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  // Play ticket fanfare
  public playTicketReward() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.15);
      });
    } catch {}
  }

  // Start dark looping 8-bit chiptune
  public startBgm() {
    if (this.isMuted || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    const notes = [146.83, 174.61, 220.0, 196.0, 146.83, 164.81, 130.81, 110.0]; // Eerie D-minor chiptune bass
    let step = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        const freq = notes[step % notes.length];
        step++;

        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch {}
    }, 200);
  }

  public stopBgm() {
    if (this.bgmInterval) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}

const audioManager = new ZombieAudioManager();

// ============================================================================
// Main Zombie Nyan Cat Component
// ============================================================================
export function ZombieNyanCatGame() {
  const { addTickets } = useTicketWallet();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --------------------------------------------------------------------------
  // Game States
  // --------------------------------------------------------------------------
  const [brainsEaten, setBrainsEaten] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // References for 60fps game loop
  const brainsEatenRef = useRef<number>(0);
  const distanceRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);
  const hasStartedRef = useRef<boolean>(false);
  const distanceBonusAwardedRef = useRef<boolean>(false);

  brainsEatenRef.current = brainsEaten;
  distanceRef.current = distance;
  isGameOverRef.current = isGameOver;
  hasStartedRef.current = hasStarted;

  // Cat Physics
  const catRef = useRef({
    x: 140,
    y: 220,
    vy: 0,
    width: 52,
    height: 32,
    gravity: 920, // px/s^2
    jumpStrength: -360, // px/s
    rotation: 0,
  });

  // Entities Refs
  const starsRef = useRef<Star[]>([]);
  const trailHistoryRef = useRef<TrailPoint[]>([]);
  const brainsRef = useRef<BrainCollectible[]>([]);
  const hazardsRef = useRef<Hazard[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const notificationsRef = useRef<FloatingNotification[]>([]);

  // Spawn timers
  const lastBrainSpawnRef = useRef<number>(0);
  const lastHazardSpawnRef = useRef<number>(0);

  // --------------------------------------------------------------------------
  // Initialize Stars Background (Dark Graveyard Sky)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const starPalette = ["#39ff14", "#8855ff", "#e0e0e0", "#ff4081", "#76ff03"];
    const stars: Star[] = [];
    for (let i = 0; i < 65; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() < 0.25 ? 3 : Math.random() < 0.6 ? 2 : 1,
        speed: 25 + Math.random() * 85, // Parallax scrolling speed
        flickerSpeed: 2 + Math.random() * 5,
        color: starPalette[Math.floor(Math.random() * starPalette.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  // --------------------------------------------------------------------------
  // Jump / Action Trigger
  // --------------------------------------------------------------------------
  const handleJump = useCallback(() => {
    if (isGameOverRef.current) return;

    if (!hasStartedRef.current) {
      setHasStarted(true);
      hasStartedRef.current = true;
      audioManager.startBgm();
    }

    const cat = catRef.current;
    cat.vy = cat.jumpStrength;
    cat.rotation = -0.22;
    audioManager.playJump();

    // Spurt of toxic green jump particles from paws
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        id: `jump-p-${Math.random()}`,
        x: cat.x - 10,
        y: cat.y + cat.height / 2,
        vx: -60 - Math.random() * 60,
        vy: 30 + (Math.random() - 0.5) * 60,
        color: "#39ff14",
        size: 3,
        opacity: 1,
      });
    }
  }, []);

  // Keyboard controls (Spacebar or ArrowUp)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleJump]);

  // Restart / Reanimate
  const handleRestart = () => {
    catRef.current = {
      x: 140,
      y: 220,
      vy: 0,
      width: 52,
      height: 32,
      gravity: 920,
      jumpStrength: -360,
      rotation: 0,
    };
    brainsRef.current = [];
    hazardsRef.current = [];
    particlesRef.current = [];
    notificationsRef.current = [];
    trailHistoryRef.current = [];

    setBrainsEaten(0);
    setDistance(0);
    setIsGameOver(false);
    setHasStarted(false);

    brainsEatenRef.current = 0;
    distanceRef.current = 0;
    isGameOverRef.current = false;
    hasStartedRef.current = false;
    distanceBonusAwardedRef.current = false;

    lastBrainSpawnRef.current = 0;
    lastHazardSpawnRef.current = 0;
  };

  // Toggle Audio Mute
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    audioManager.setMuted(nextState);
    if (!nextState && hasStartedRef.current && !isGameOverRef.current) {
      audioManager.startBgm();
    }
  };

  // --------------------------------------------------------------------------
  // Main 60fps Canvas Game Loop
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.08);
      lastTime = time;

      const cat = catRef.current;
      const stars = starsRef.current;
      const trail = trailHistoryRef.current;
      const brains = brainsRef.current;
      const hazards = hazardsRef.current;
      const particles = particlesRef.current;
      const notifications = notificationsRef.current;
      const gameOver = isGameOverRef.current;
      const started = hasStartedRef.current;

      // ======================================================================
      // 1. UPDATE SIMULATION
      // ======================================================================
      if (started && !gameOver) {
        // Distance traveled
        const currentDist = distanceRef.current + dt * 65;
        distanceRef.current = currentDist;
        setDistance(Math.floor(currentDist));

        // Check 1,000 distance bonus tickets (Award 15 bonus tickets per spec)
        if (currentDist >= 1000 && !distanceBonusAwardedRef.current) {
          distanceBonusAwardedRef.current = true;
          addTickets(15);
          audioManager.playTicketReward();
          notifications.push({
            id: `bonus-1000-${Date.now()}`,
            text: "+15 TICKETS! (1000M SURVIVOR)",
            x: CANVAS_WIDTH / 2 - 120,
            y: 90,
            color: "#bcff3c",
            opacity: 1,
          });
        }

        // Cat Gravity & Motion
        cat.vy += cat.gravity * dt;
        cat.y += cat.vy * dt;

        // Smooth rotation based on velocity
        cat.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, cat.vy * 0.0018));

        // Floor / Ceiling Collision Bounds
        if (cat.y < 20) {
          cat.y = 20;
          cat.vy = 0;
        } else if (cat.y + cat.height > CANVAS_HEIGHT - 20) {
          // Splat on the floor -> triggers Game Over
          cat.y = CANVAS_HEIGHT - 20 - cat.height;
          triggerGameOver();
        }

        // Record Trail Point (for Corrupted Rainbow)
        trail.push({
          x: cat.x - 8,
          y: cat.y + cat.height / 2,
          time,
        });

        // Keep trail points from current cat X back to left screen edge
        while (trail.length > 0 && trail[0].x < -50) {
          trail.shift();
        }
        // Move trail leftward with world scroll
        for (let i = 0; i < trail.length; i++) {
          trail[i].x -= 220 * dt;
        }

        // --------------------------------------------------------------------
        // Spawn Brain Collectibles (every ~1.8 - 2.5s)
        // --------------------------------------------------------------------
        if (time - lastBrainSpawnRef.current > 2000 + Math.random() * 800) {
          lastBrainSpawnRef.current = time;
          const spawnY = 50 + Math.random() * (CANVAS_HEIGHT - 130);
          brains.push({
            id: `brain-${Date.now()}-${Math.random()}`,
            x: CANVAS_WIDTH + 30,
            y: spawnY,
            baseY: spawnY,
            radius: 14,
            collected: false,
            angle: Math.random() * Math.PI * 2,
          });
        }

        // --------------------------------------------------------------------
        // Spawn Hazards (Tombstones, Holy Water, Crosses every ~2.0 - 3.2s)
        // --------------------------------------------------------------------
        if (time - lastHazardSpawnRef.current > 2200 + Math.random() * 1200) {
          lastHazardSpawnRef.current = time;
          const types: HazardType[] = ["tombstone", "holy_water", "cross"];
          const type = types[Math.floor(Math.random() * types.length)];

          let spawnY = 0;
          let w = 32;
          let h = 42;

          if (type === "tombstone") {
            // Can spawn either floating or at bottom
            const atBottom = Math.random() > 0.45;
            w = 34;
            h = 46;
            spawnY = atBottom ? CANVAS_HEIGHT - 20 - h : 60 + Math.random() * (CANVAS_HEIGHT - 160);
          } else if (type === "holy_water") {
            w = 26;
            h = 36;
            spawnY = 50 + Math.random() * (CANVAS_HEIGHT - 120);
          } else {
            w = 32;
            h = 42;
            spawnY = 40 + Math.random() * (CANVAS_HEIGHT - 120);
          }

          hazards.push({
            id: `hazard-${Date.now()}-${Math.random()}`,
            type,
            x: CANVAS_WIDTH + 30,
            y: spawnY,
            width: w,
            height: h,
          });
        }

        // --------------------------------------------------------------------
        // Update Brains & Brain Collision Logic
        // --------------------------------------------------------------------
        const scrollSpeed = 220 + Math.min(100, currentDist * 0.05);

        for (let i = brains.length - 1; i >= 0; i--) {
          const b = brains[i];
          b.x -= scrollSpeed * dt;
          b.angle += dt * 4;
          b.y = b.baseY + Math.sin(b.angle) * 8; // Gentle floating bob

          // Remove offscreen
          if (b.x < -40) {
            brains.splice(i, 1);
            continue;
          }

          // Cat vs Brain Bounding Box / Radius Collision
          const catCenterX = cat.x + cat.width / 2;
          const catCenterY = cat.y + cat.height / 2;
          const dist = Math.hypot(catCenterX - b.x, catCenterY - b.y);

          if (dist < b.radius + cat.height / 2 + 4) {
            // Brain eaten!
            brains.splice(i, 1);
            const nextBrains = brainsEatenRef.current + 1;
            brainsEatenRef.current = nextBrains;
            setBrainsEaten(nextBrains);

            audioManager.playMunch();

            // Slime particle burst
            for (let k = 0; k < 12; k++) {
              const pAngle = Math.random() * Math.PI * 2;
              const pSpeed = 60 + Math.random() * 100;
              particles.push({
                id: `slime-${Math.random()}`,
                x: b.x,
                y: b.y,
                vx: Math.cos(pAngle) * pSpeed,
                vy: Math.sin(pAngle) * pSpeed,
                color: Math.random() > 0.4 ? "#39ff14" : "#ff4081",
                size: 3 + Math.random() * 3,
                opacity: 1,
              });
            }

            // Floating feedback
            notifications.push({
              id: `nom-${Date.now()}-${Math.random()}`,
              text: "+1 BRAIN!",
              x: b.x - 20,
              y: b.y - 15,
              color: "#ff4081",
              opacity: 1,
            });

            // Ticket Rewards: 1 ticket for every 5 brains eaten per spec!
            if (nextBrains % 5 === 0) {
              addTickets(1);
              audioManager.playTicketReward();
              notifications.push({
                id: `ticket-${Date.now()}-${Math.random()}`,
                text: "+1 TICKET! (5 BRAINS)",
                x: b.x - 30,
                y: b.y - 35,
                color: "#bcff3c",
                opacity: 1,
              });
            }
          }
        }

        // --------------------------------------------------------------------
        // Update Hazards & Hazard Collision Detection
        // --------------------------------------------------------------------
        for (let i = hazards.length - 1; i >= 0; i--) {
          const h = hazards[i];
          h.x -= scrollSpeed * dt;

          if (h.x + h.width < -40) {
            hazards.splice(i, 1);
            continue;
          }

          // Accurate Bounding-Box Collision with Cat
          // Tighter inner hitbox for fair gameplay
          const catHit = {
            left: cat.x + 6,
            right: cat.x + cat.width - 6,
            top: cat.y + 6,
            bottom: cat.y + cat.height - 6,
          };

          const hazardHit = {
            left: h.x + 4,
            right: h.x + h.width - 4,
            top: h.y + 4,
            bottom: h.y + h.height - 4,
          };

          const isColliding =
            catHit.left < hazardHit.right &&
            catHit.right > hazardHit.left &&
            catHit.top < hazardHit.bottom &&
            catHit.bottom > hazardHit.top;

          if (isColliding) {
            triggerGameOver();
            break;
          }
        }
      }

      // ----------------------------------------------------------------------
      // Helper: Trigger Death & Game Over
      // ----------------------------------------------------------------------
      function triggerGameOver() {
        setIsGameOver(true);
        isGameOverRef.current = true;
        audioManager.stopBgm();
        audioManager.playDeath();

        // Massive death splatter particle explosion
        for (let k = 0; k < 35; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 70 + Math.random() * 180;
          particlesRef.current.push({
            id: `death-${Math.random()}`,
            x: cat.x + cat.width / 2,
            y: cat.y + cat.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: Math.random() > 0.5 ? "#39ff14" : Math.random() > 0.3 ? "#d50000" : "#7b1fa2",
            size: 4 + Math.random() * 4,
            opacity: 1,
          });
        }
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.opacity -= 1.8 * dt;
        if (p.opacity <= 0) particles.splice(i, 1);
      }

      // Update Floating Notifications
      for (let i = notifications.length - 1; i >= 0; i--) {
        const n = notifications[i];
        n.y -= 45 * dt;
        n.opacity -= 1.3 * dt;
        if (n.opacity <= 0) notifications.splice(i, 1);
      }

      // Update Decaying Stars (Scrolling left)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x -= s.speed * dt;
        if (s.x < 0) {
          s.x = CANVAS_WIDTH;
          s.y = Math.random() * CANVAS_HEIGHT;
        }
      }

      // ======================================================================
      // 2. RENDER GRAPHICS (Pixelated Dark Sky & Corrupted Rainbow)
      // ======================================================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dark, eerie space/graveyard sky (#0b0d1b)
      ctx.fillStyle = "#0b0d1b";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Distant eerie fog gradient
      const fogGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - 90, 0, CANVAS_HEIGHT);
      fogGrad.addColorStop(0, "rgba(27, 94, 32, 0)");
      fogGrad.addColorStop(1, "rgba(27, 94, 32, 0.35)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, CANVAS_HEIGHT - 90, CANVAS_WIDTH, 90);

      // Flickering, decaying pixel stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const flicker = Math.sin(time * 0.003 * s.flickerSpeed + i) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = flicker;
        ctx.fillStyle = s.color;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
        ctx.restore();
      }

      // Render Corrupted 6-Stripe Wavy Rainbow Trail
      renderCorruptedRainbow(ctx, trail, cat, time);

      // Render Hazards (Tombstones, Holy Water, Crosses)
      for (let i = 0; i < hazards.length; i++) {
        drawHazard(ctx, hazards[i], time);
      }

      // Render Brain Collectibles
      for (let i = 0; i < brains.length; i++) {
        drawBrain(ctx, brains[i]);
      }

      // Render Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        ctx.restore();
      }

      // Render Zombie Nyan Cat Sprite
      if (!gameOver) {
        drawZombieNyanCat(ctx, cat.x, cat.y, cat.rotation, time);
      }

      // Render Floating Notifications
      for (let i = 0; i < notifications.length; i++) {
        const n = notifications[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, n.opacity);
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = n.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(n.text, Math.floor(n.x), Math.floor(n.y));
        ctx.fillText(n.text, Math.floor(n.x), Math.floor(n.y));
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [addTickets]);

  // --------------------------------------------------------------------------
  // Canvas Helper: Corrupted Rainbow 6-Stripe Wavy Trail
  // --------------------------------------------------------------------------
  const renderCorruptedRainbow = (
    ctx: CanvasRenderingContext2D,
    trail: TrailPoint[],
    cat: { x: number; y: number; height: number },
    time: number
  ) => {
    const stripeHeight = 4; // 6 stripes * 4px = 24px ribbon
    const totalHeight = CORRUPTED_PALETTE.length * stripeHeight;

    ctx.save();

    if (trail.length < 2) {
      // Idle straight rainbow if just started
      const startX = 0;
      const endX = cat.x - 4;
      const baseCenterY = cat.y + cat.height / 2;

      for (let x = startX; x < endX; x += 10) {
        const wave = Math.sin(x * 0.04 + time * 0.008) * 4;
        const segmentY = baseCenterY + wave - totalHeight / 2;

        CORRUPTED_PALETTE.forEach((color, idx) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, Math.floor(segmentY + idx * stripeHeight), 10, stripeHeight);
        });
      }
    } else {
      // Dynamic trail fluctuating with cat history
      for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i + 1];

        // Additional eerie wave vibration
        const wave = Math.sin(p1.x * 0.05 + time * 0.01) * 3;
        const width = Math.max(2, p2.x - p1.x + 2);
        const topY = p1.y + wave - totalHeight / 2;

        CORRUPTED_PALETTE.forEach((color, idx) => {
          ctx.fillStyle = color;
          ctx.fillRect(Math.floor(p1.x), Math.floor(topY + idx * stripeHeight), Math.ceil(width), stripeHeight);
        });
      }
    }

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // Canvas Helper: Pixel Art Zombie Nyan Cat
  // --------------------------------------------------------------------------
  const drawZombieNyanCat = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    time: number
  ) => {
    ctx.save();
    ctx.translate(x + 26, y + 16);
    ctx.rotate(rotation);
    ctx.translate(-26, -16);

    // Pixel scale = 2px
    const p = 2;

    // Paw / Tail Animation
    const legBob = Math.sin(time * 0.02) * 2;
    const tailWiggle = Math.sin(time * 0.015) * 4;

    // 1. Decaying Zombie Tail (Left)
    ctx.fillStyle = "#6d866a"; // Pale decaying zombie skin
    ctx.fillRect(0, 14 + tailWiggle, 6 * p, 3 * p);
    ctx.fillStyle = "#8fa88b";
    ctx.fillRect(2 * p, 12 + tailWiggle, 3 * p, 2 * p);
    // Exposed tail bone
    ctx.fillStyle = "#e0e0e0";
    ctx.fillRect(-2 * p, 15 + tailWiggle, 2 * p, 2 * p);

    // 2. Pop-Tart Body: Moldy Graveyard Toast + Dark Slime Frosting
    // Toast crust
    ctx.fillStyle = "#3e483e";
    ctx.fillRect(6 * p, 2 * p, 16 * p, 12 * p);

    // Inner toast
    ctx.fillStyle = "#536353";
    ctx.fillRect(7 * p, 3 * p, 14 * p, 10 * p);

    // Dark Toxic Slime Frosting
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(8 * p, 4 * p, 12 * p, 8 * p);

    // Brain & Maggot Sprinkles on Pastry
    ctx.fillStyle = "#ff4081"; // Brain pink
    ctx.fillRect(9 * p, 5 * p, 2 * p, 2 * p);
    ctx.fillRect(15 * p, 7 * p, 2 * p, 2 * p);
    ctx.fillRect(11 * p, 9 * p, 2 * p, 2 * p);

    ctx.fillStyle = "#bcff3c"; // Toxic neon slime speckles
    ctx.fillRect(13 * p, 5 * p, 2 * p, 2 * p);
    ctx.fillRect(17 * p, 8 * p, 2 * p, 2 * p);

    // Exposed Ribcage Bone on Pastry
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(13 * p, 8 * p, p, 3 * p);
    ctx.fillRect(15 * p, 8 * p, p, 3 * p);

    // 3. Paws (Greenish gray with bone tips)
    ctx.fillStyle = "#6d866a";
    // Back paws
    ctx.fillRect(8 * p, 14 * p + legBob, 3 * p, 3 * p);
    ctx.fillRect(18 * p, 14 * p - legBob, 3 * p, 3 * p);

    // 4. Undead Cat Head (Pale greenish-gray skin)
    const headX = 18 * p;
    const headY = 2 * p;

    ctx.fillStyle = "#7c9885";
    ctx.fillRect(headX, headY, 9 * p, 9 * p);

    // Cat Ears (One chewed/notched ear)
    // Left ear (chewed/damaged)
    ctx.fillStyle = "#5d7765";
    ctx.fillRect(headX + p, headY - 3 * p, 2 * p, 3 * p);
    // Right ear
    ctx.fillStyle = "#7c9885";
    ctx.fillRect(headX + 6 * p, headY - 4 * p, 3 * p, 4 * p);

    // Exposed Brain on Head (Chewed skull top)
    ctx.fillStyle = "#ff4081";
    ctx.fillRect(headX + 3 * p, headY - 2 * p, 3 * p, 2 * p);

    // Glowing Asymmetrical Zombie Eyes
    // Left eye: Glowing Blood Red
    ctx.fillStyle = "#ff1744";
    ctx.fillRect(headX + 2 * p, headY + 3 * p, 2 * p, 2 * p);
    // Right eye: Glowing Slime Yellow
    ctx.fillStyle = "#ffd600";
    ctx.fillRect(headX + 6 * p, headY + 3 * p, 2 * p, 2 * p);

    // Black pupils
    ctx.fillStyle = "#000";
    ctx.fillRect(headX + 3 * p, headY + 3 * p, p, p);
    ctx.fillRect(headX + 7 * p, headY + 3 * p, p, p);

    // Sharp Zombie Vampire Teeth / Fangs
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(headX + 3 * p, headY + 7 * p, p, 2 * p);
    ctx.fillRect(headX + 6 * p, headY + 7 * p, p, 2 * p);

    // Nose
    ctx.fillStyle = "#273429";
    ctx.fillRect(headX + 4 * p, headY + 5 * p, 2 * p, p);

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // Canvas Helper: Pixel Art Brain Collectible
  // --------------------------------------------------------------------------
  const drawBrain = (ctx: CanvasRenderingContext2D, b: BrainCollectible) => {
    ctx.save();
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);

    // Pink brain outer glow
    ctx.fillStyle = "rgba(255, 64, 129, 0.3)";
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fill();

    // Pixel brain shape
    ctx.fillStyle = "#ff4081";
    // Left lobe
    ctx.fillRect(bx - 12, by - 8, 12, 16);
    // Right lobe
    ctx.fillRect(bx, by - 8, 12, 16);

    // Brain folds / sulci details
    ctx.fillStyle = "#c2185b";
    ctx.fillRect(bx - 8, by - 4, 6, 2);
    ctx.fillRect(bx - 10, by + 2, 7, 2);
    ctx.fillRect(bx + 2, by - 4, 7, 2);
    ctx.fillRect(bx + 3, by + 2, 6, 2);
    // Center divider
    ctx.fillRect(bx - 1, by - 8, 2, 16);

    // Shiny highlights
    ctx.fillStyle = "#ff80ab";
    ctx.fillRect(bx - 10, by - 6, 3, 2);
    ctx.fillRect(bx + 4, by - 6, 3, 2);

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // Canvas Helper: Pixel Art Hazards (Tombstone, Holy Water, Cross)
  // --------------------------------------------------------------------------
  const drawHazard = (ctx: CanvasRenderingContext2D, h: Hazard, time: number) => {
    ctx.save();
    const x = Math.floor(h.x);
    const y = Math.floor(h.y);

    if (h.type === "tombstone") {
      // Stone gray tombstone
      ctx.fillStyle = "#455a64";
      ctx.beginPath();
      ctx.roundRect(x, y, h.width, h.height, [14, 14, 0, 0]);
      ctx.fill();

      // Stone border / shade
      ctx.strokeStyle = "#263238";
      ctx.lineWidth = 2;
      ctx.stroke();

      // R.I.P. inscription
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.fillStyle = "#cfd8dc";
      ctx.fillText("RIP", x + 6, y + 20);

      // Cracks in stone
      ctx.strokeStyle = "#1b2428";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 26);
      ctx.lineTo(x + 16, y + 34);
      ctx.lineTo(x + 24, y + 36);
      ctx.stroke();
    } else if (h.type === "holy_water") {
      // Radiant Holy Water Flask
      const glow = Math.sin(time * 0.008) * 0.2 + 0.5;
      ctx.fillStyle = `rgba(38, 247, 255, ${glow})`;
      ctx.beginPath();
      ctx.arc(x + h.width / 2, y + h.height / 2, 22, 0, Math.PI * 2);
      ctx.fill();

      // Glass Bottle
      ctx.fillStyle = "#00bcd4";
      ctx.fillRect(x + 3, y + 10, h.width - 6, h.height - 10);

      // Radiant glowing blue water
      ctx.fillStyle = "#e0f7fa";
      ctx.fillRect(x + 6, y + 14, h.width - 12, h.height - 16);

      // Cork stopper
      ctx.fillStyle = "#8d6e63";
      ctx.fillRect(x + 8, y + 4, h.width - 16, 6);

      // Holy cross symbol on bottle
      ctx.fillStyle = "#ffd600";
      ctx.fillRect(x + 11, y + 18, 4, 10);
      ctx.fillRect(x + 8, y + 21, 10, 4);
    } else if (h.type === "cross") {
      // Golden luminous Holy Cross (deadly to undead)
      ctx.fillStyle = "rgba(255, 235, 59, 0.3)";
      ctx.fillRect(x - 4, y - 4, h.width + 8, h.height + 8);

      ctx.fillStyle = "#ffb300";
      // Vertical beam
      ctx.fillRect(x + 11, y, 10, h.height);
      // Horizontal beam
      ctx.fillRect(x, y + 12, h.width, 10);

      // Inner gleam
      ctx.fillStyle = "#fffde7";
      ctx.fillRect(x + 13, y + 2, 6, h.height - 4);
      ctx.fillRect(x + 2, y + 14, h.width - 4, 6);
    }

    ctx.restore();
  };

  return (
    <div className="nyan-container">
      {/* ------------------------------------------------------------------ */}
      {/* TOP RETRO HUD: Brains Score & Controls                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="nyan-hud">
        {/* Score: BRAINS EATEN (per Phase 1 requirement) */}
        <div className="nyan-score-box">
          <span className="nyan-score-label">BRAINS EATEN</span>
          <span className="nyan-score-val">🧠 {brainsEaten}</span>
        </div>

        {/* Distance Tracker */}
        <div className="nyan-score-box">
          <span className="nyan-score-label">DISTANCE</span>
          <span className="nyan-score-val">🏃 {distance}M</span>
        </div>

        {/* Audio Mute & Restart Controls */}
        <div className="nyan-hud-actions">
          <button
            type="button"
            className="nyan-btn"
            onClick={toggleMute}
            title={isMuted ? "Unmute Dark Chiptune Audio" : "Mute Audio"}
          >
            {isMuted ? "🔇 Muted" : "🔊 Audio On"}
          </button>
          <button
            type="button"
            className="nyan-btn nyan-btn--reset"
            onClick={handleRestart}
            title="Reset Game Run"
          >
            Restart
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RETRO CANVAS & GAME OVER OVERLAY                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="nyan-canvas-wrapper" onClick={handleJump}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="nyan-canvas"
        />

        {/* Initial Start Prompt */}
        {!hasStarted && !isGameOver && (
          <div className="nyan-start-prompt">
            <h2>ZOMBIE NYAN CAT</h2>
            <p>Press [SPACEBAR] or CLICK to Jump</p>
            <small>Eat Brains (1 Ticket per 5) · Dodge Holy Water & Tombs · Survive 1000m (+15 Tickets)</small>
          </div>
        )}

        {/* Step 2 Game Over Overlay: YOU DIED AGAIN */}
        {isGameOver && (
          <div className="nyan-game-over-overlay" onClick={(e) => e.stopPropagation()}>
            <div className="nyan-game-over-card">
              <span className="nyan-skull-icon">💀 ☣️</span>
              <h2 className="nyan-game-over-title">YOU DIED AGAIN</h2>
              <p className="nyan-game-over-desc">
                Your undead feline body shattered upon the sacred graveyard hazards!
              </p>

              <div className="nyan-stats-grid">
                <div>
                  <span>BRAINS COLLECTED</span>
                  <strong>{brainsEaten}</strong>
                </div>
                <div>
                  <span>DISTANCE RUN</span>
                  <strong>{distance}m</strong>
                </div>
              </div>

              <button type="button" className="nyan-btn-reanimate" onClick={handleRestart}>
                REANIMATE ⚡
              </button>
            </div>
          </div>
        )}

        {/* Bottom Arcade Status Bar */}
        <div className="nyan-status-bar">
          <span>
            Controls: <strong>[SPACE]</strong> or <strong>[CLICK]</strong> to Jump
          </span>
          <span className="nyan-ticket-tip">
            🎟️ Earn 1 ticket / 5 brains · 15 tickets @ 1,000m
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* COMPONENT STYLES: 8-bit Pixel Theme                                */}
      {/* ------------------------------------------------------------------ */}
      <style jsx>{`
        .nyan-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          user-select: none;
        }

        .nyan-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          padding: 0.85rem 1.25rem;
          background: rgba(11, 13, 27, 0.95);
          border: 2px solid var(--cyan, #26f7ff);
          box-shadow: 0 0 18px rgba(38, 247, 255, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.8);
        }

        .nyan-score-box {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.4rem 0.9rem;
          background: #060814;
          border: 1px solid #39ff14;
          box-shadow: inset 0 0 10px rgba(57, 255, 20, 0.2);
        }

        .nyan-score-label {
          font-family: "Press Start 2P", monospace;
          font-size: 0.52rem;
          color: #39ff14;
          letter-spacing: 0.08em;
        }

        .nyan-score-val {
          font-family: "Press Start 2P", monospace;
          font-size: 1.05rem;
          color: #fff;
          text-shadow: 0 0 8px #39ff14;
        }

        .nyan-hud-actions {
          display: flex;
          gap: 0.6rem;
        }

        .nyan-btn {
          font-family: "Press Start 2P", monospace;
          font-size: 0.58rem;
          padding: 0.55rem 0.85rem;
          background: #151936;
          border: 1px solid var(--cyan, #26f7ff);
          color: var(--cyan, #26f7ff);
          cursor: pointer;
          transition: all 120ms ease;
        }

        .nyan-btn:hover {
          background: var(--cyan, #26f7ff);
          color: #000;
        }

        .nyan-btn--reset {
          border-color: var(--pink, #ff3cbf);
          color: var(--pink, #ff3cbf);
        }

        .nyan-btn--reset:hover {
          background: var(--pink, #ff3cbf);
          color: #000;
        }

        .nyan-canvas-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          border: 3px solid var(--cyan, #26f7ff);
          background: #0b0d1b;
          box-shadow: 0 0 25px rgba(38, 247, 255, 0.25);
          cursor: pointer;
        }

        .nyan-canvas {
          display: block;
          max-width: 100%;
          height: auto;
          image-rendering: pixelated;
        }

        .nyan-start-prompt {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: rgba(11, 13, 27, 0.75);
          text-align: center;
          padding: 1rem;
          pointer-events: none;
        }

        .nyan-start-prompt h2 {
          font-family: "Press Start 2P", monospace;
          font-size: clamp(1.2rem, 3.5vw, 2rem);
          color: #39ff14;
          text-shadow: 3px 3px 0 #000, 0 0 20px #39ff14;
          margin: 0;
        }

        .nyan-start-prompt p {
          font-family: "Press Start 2P", monospace;
          font-size: 0.75rem;
          color: #fff;
          margin: 0;
          animation: pulse-jump 1.2s infinite alternate;
        }

        .nyan-start-prompt small {
          font-size: 0.85rem;
          color: var(--muted, #b9afd2);
          max-width: 480px;
          line-height: 1.5;
        }

        .nyan-game-over-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          background: rgba(11, 13, 27, 0.88);
          z-index: 10;
        }

        .nyan-game-over-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.2rem;
          max-width: 520px;
          padding: 2.2rem 2rem;
          background: #11142e;
          border: 3px solid #ff1744;
          box-shadow: 0 0 40px rgba(255, 23, 68, 0.5), inset 0 0 25px rgba(0, 0, 0, 0.8);
          animation: nyan-pop-in 240ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .nyan-skull-icon {
          font-size: 2.4rem;
        }

        .nyan-game-over-title {
          font-family: "Press Start 2P", monospace;
          font-size: 1.2rem;
          color: #ff1744;
          margin: 0;
          text-shadow: 2px 2px 0 #000, 0 0 15px #ff1744;
        }

        .nyan-game-over-desc {
          font-size: 0.88rem;
          color: var(--muted, #b9afd2);
          margin: 0;
          line-height: 1.6;
        }

        .nyan-stats-grid {
          display: flex;
          gap: 2rem;
          padding: 0.8rem 1.4rem;
          background: #070914;
          border: 1px dashed #39ff14;
        }

        .nyan-stats-grid div {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .nyan-stats-grid span {
          font-family: "Press Start 2P", monospace;
          font-size: 0.5rem;
          color: var(--muted, #b9afd2);
        }

        .nyan-stats-grid strong {
          font-family: "Press Start 2P", monospace;
          font-size: 1.2rem;
          color: #39ff14;
        }

        .nyan-btn-reanimate {
          font-family: "Press Start 2P", monospace;
          font-size: 0.85rem;
          padding: 0.85rem 1.6rem;
          background: #39ff14;
          color: #000;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 4px 0 #1b5e20;
          transition: transform 120ms ease;
        }

        .nyan-btn-reanimate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #1b5e20;
        }

        .nyan-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          width: 100%;
          padding: 0.65rem 1rem;
          background: rgba(11, 13, 27, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.75rem;
          color: var(--muted, #b9afd2);
        }

        .nyan-ticket-tip {
          font-family: "Press Start 2P", monospace;
          font-size: 0.52rem;
          color: var(--lime, #bcff3c);
        }

        @keyframes pulse-jump {
          0% {
            transform: scale(0.96);
          }
          100% {
            transform: scale(1.04);
          }
        }

        @keyframes nyan-pop-in {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
