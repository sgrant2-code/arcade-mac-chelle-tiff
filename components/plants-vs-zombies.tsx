"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTicketWallet } from "@/components/ticket-wallet";

// ============================================================================
// Types & Constants
// ============================================================================

export type PlantType = "sunflower" | "peashooter";

export interface PlantConfig {
  type: PlantType;
  name: string;
  cost: number;
  maxHp: number;
  description: string;
  icon: string;
}

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  sunflower: {
    type: "sunflower",
    name: "Sunflower",
    cost: 50,
    maxHp: 6, // Survives several zombie bites
    description: "Produces 25 Sun every 10s.",
    icon: "🌻",
  },
  peashooter: {
    type: "peashooter",
    name: "Peashooter",
    cost: 100,
    maxHp: 6,
    description: "Shoots peas (1 dmg) every 1.5s at zombies.",
    icon: "🌱",
  },
};

export interface PlantEntity {
  id: string;
  type: PlantType;
  row: number;
  col: number;
  hp: number;
  maxHp: number;
  plantedAt: number;
  lastActionTime: number; // For sunflower production or peashooter shot
  animOffset: number;
}

export interface ZombieEntity {
  id: string;
  row: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number; // ~0.5 px/frame at 60fps = 30 px/sec
  isAttacking: boolean;
  targetPlantRow: number | null;
  targetPlantCol: number | null;
  lastAttackTime: number;
  hitFlashTimer: number; // Flashes white when hit
  walkCycle: number;
}

export interface PeaEntity {
  id: string;
  row: number;
  x: number;
  y: number;
  speed: number;
  damage: number;
}

export interface SunEntity {
  id: string;
  x: number;
  y: number;
  targetY: number;
  radius: number;
  speed: number;
  opacity: number;
  createdAt: number;
  collected: boolean;
  value: number;
  isFromPlant?: boolean; // True if produced by a sunflower
}

export interface ParticleEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  opacity: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  createdAt: number;
}

// 5 rows by 9 columns lawn grid
const ROWS = 5;
const COLS = 9;

// Canvas & Grid geometry
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 480;
const GRID_OFFSET_X = 40;
const GRID_OFFSET_Y = 20;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 88;

// Lawn tile colors
const TILE_LIGHT = "#3ca54b";
const TILE_DARK = "#359642";
const TILE_BORDER = "rgba(0, 0, 0, 0.08)";

// Timing constants
const SUN_DROP_INTERVAL = 8000; // Natural sun drops every 8 seconds
const SUNFLOWER_SUN_INTERVAL = 10000; // Sunflower generates sun every 10 seconds
const PEASHOOTER_INTERVAL = 1500; // Peashooter shoots every 1.5 seconds
const ZOMBIE_SPAWN_INTERVAL = 12000; // Spawn zombie every 12 seconds
const ZOMBIE_ATTACK_INTERVAL = 1000; // Zombie bites plant every 1 second (1 damage)

// ============================================================================
// Sound Effects Helper (Web Audio API Synthesizer)
// ============================================================================
function playSound(type: "sun" | "plant" | "pea_shoot" | "pea_hit" | "zombie_groan" | "chomp" | "game_over" | "error") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "sun") {
      // Cheerful chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "pea_shoot") {
      // Quick pop "pew"
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "pea_hit") {
      // Soft splat
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else if (type === "chomp") {
      // Zombie bite sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "plant") {
      // Planting thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === "zombie_groan") {
      // Zombie spawn groan
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(95, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === "game_over") {
      // Tragic game over descending slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore autoplay restriction errors
  }
}

// ============================================================================
// Main PvZ Component
// ============================================================================
export function PlantsVsZombiesGame() {
  const { addTickets } = useTicketWallet();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --------------------------------------------------------------------------
  // Game State
  // --------------------------------------------------------------------------
  // Starting Sun amount: 100
  const [sun, setSun] = useState<number>(100);
  const sunRef = useRef<number>(100);
  sunRef.current = sun;

  // Selected card for planting
  const [selectedCard, setSelectedCard] = useState<PlantType | null>(null);
  const selectedCardRef = useRef<PlantType | null>(null);
  selectedCardRef.current = selectedCard;

  // Hovered lawn grid coordinates
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const hoveredCellRef = useRef<{ row: number; col: number } | null>(null);
  hoveredCellRef.current = hoveredCell;

  // Game status
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const isGameOverRef = useRef<boolean>(false);
  isGameOverRef.current = isGameOver;

  // Stats
  const [zombiesKilled, setZombiesKilled] = useState<number>(0);
  const [plantCount, setPlantCount] = useState<number>(0);

  // --------------------------------------------------------------------------
  // Game Entities Refs (mutable for high-performance 60fps loop)
  // --------------------------------------------------------------------------
  const gridRef = useRef<(PlantEntity | null)[][]>(
    Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
  );
  const zombiesRef = useRef<ZombieEntity[]>([]);
  const peasRef = useRef<PeaEntity[]>([]);
  const sunsRef = useRef<SunEntity[]>([]);
  const particlesRef = useRef<ParticleEntity[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // --------------------------------------------------------------------------
  // Helper: Spawn Sun (natural drop or sunflower production)
  // --------------------------------------------------------------------------
  const spawnSun = useCallback((customX?: number, customY?: number, isFromPlant: boolean = false) => {
    let x: number;
    let y: number;
    let targetY: number;

    if (customX !== undefined && customY !== undefined) {
      // Generated by Sunflower: drops slightly and lands next to the plant
      x = customX + (Math.random() * 20 - 10);
      y = customY - 15;
      targetY = customY + 12;
    } else {
      // Natural drop from sky
      const minX = GRID_OFFSET_X + 40;
      const maxX = GRID_OFFSET_X + COLS * CELL_WIDTH - 40;
      x = Math.floor(minX + Math.random() * (maxX - minX));
      const targetRow = Math.floor(Math.random() * ROWS);
      targetY = GRID_OFFSET_Y + targetRow * CELL_HEIGHT + CELL_HEIGHT / 2;
      y = -25;
    }

    const newSun: SunEntity = {
      id: `sun-${Date.now()}-${Math.random()}`,
      x,
      y,
      targetY,
      radius: 22,
      speed: isFromPlant ? 35 : 55,
      opacity: 1,
      createdAt: Date.now(),
      collected: false,
      value: 25,
      isFromPlant,
    };

    sunsRef.current.push(newSun);
  }, []);

  // --------------------------------------------------------------------------
  // Helper: Spawn a Zombie (every 12 seconds)
  // --------------------------------------------------------------------------
  const spawnZombie = useCallback(() => {
    if (isGameOverRef.current) return;

    const row = Math.floor(Math.random() * ROWS);
    const startX = CANVAS_WIDTH + 15; // Enters from the right edge
    const startY = GRID_OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2;

    const zombie: ZombieEntity = {
      id: `zombie-${Date.now()}-${Math.random()}`,
      row,
      x: startX,
      y: startY,
      hp: 10, // HP: 10 per specification
      maxHp: 10,
      speed: 30, // 0.5px/frame at 60fps = 30px/sec
      isAttacking: false,
      targetPlantRow: null,
      targetPlantCol: null,
      lastAttackTime: 0,
      hitFlashTimer: 0,
      walkCycle: 0,
    };

    zombiesRef.current.push(zombie);
    playSound("zombie_groan");
  }, []);

  // --------------------------------------------------------------------------
  // Natural Timers: Natural Sun (every 8s) & Zombie Spawning (every 12s)
  // --------------------------------------------------------------------------
  useEffect(() => {
    // Initial sun after 2s so the player can start playing right away
    const initSunTimer = setTimeout(() => {
      spawnSun();
    }, 2000);

    // Initial zombie after 6s to give player time to plant defense
    const initZombieTimer = setTimeout(() => {
      spawnZombie();
    }, 6000);

    // Natural Sun drops every 8 seconds per Phase 1 spec
    const sunInterval = setInterval(() => {
      if (!isGameOverRef.current) spawnSun();
    }, SUN_DROP_INTERVAL);

    // Zombie spawns every 12 seconds per Phase 2 spec
    const zombieInterval = setInterval(() => {
      if (!isGameOverRef.current) spawnZombie();
    }, ZOMBIE_SPAWN_INTERVAL);

    return () => {
      clearTimeout(initSunTimer);
      clearTimeout(initZombieTimer);
      clearInterval(sunInterval);
      clearInterval(zombieInterval);
    };
  }, [spawnSun, spawnZombie]);

  // --------------------------------------------------------------------------
  // Restart Game Handler
  // --------------------------------------------------------------------------
  const handleRestart = () => {
    gridRef.current = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));
    zombiesRef.current = [];
    peasRef.current = [];
    sunsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];

    setSun(100);
    sunRef.current = 100;
    setSelectedCard(null);
    setPlantCount(0);
    setZombiesKilled(0);
    setIsGameOver(false);
    isGameOverRef.current = false;
  };

  // --------------------------------------------------------------------------
  // Card Selection Handler
  // --------------------------------------------------------------------------
  const handleSelectCard = (type: PlantType) => {
    if (isGameOver) return;
    const config = PLANT_CONFIGS[type];
    if (sunRef.current < config.cost) {
      playSound("error");
      return;
    }

    setSelectedCard((prev) => (prev === type ? null : type));
  };

  // --------------------------------------------------------------------------
  // Mouse Movement on Canvas: Track Hovered Cell
  // --------------------------------------------------------------------------
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isGameOver) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const relX = mouseX - GRID_OFFSET_X;
    const relY = mouseY - GRID_OFFSET_Y;

    if (
      relX >= 0 &&
      relX < COLS * CELL_WIDTH &&
      relY >= 0 &&
      relY < ROWS * CELL_HEIGHT
    ) {
      const col = Math.floor(relX / CELL_WIDTH);
      const row = Math.floor(relY / CELL_HEIGHT);
      setHoveredCell({ row, col });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  // --------------------------------------------------------------------------
  // Canvas Click: Collect Sun OR Place Plant
  // --------------------------------------------------------------------------
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isGameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 1. Check if user clicked any clickable Sun
    for (let i = sunsRef.current.length - 1; i >= 0; i--) {
      const s = sunsRef.current[i];
      if (s.collected) continue;

      const dist = Math.hypot(clickX - s.x, clickY - s.y);
      if (dist <= s.radius + 10) {
        s.collected = true;

        setSun((prev) => {
          const nextVal = prev + s.value;
          sunRef.current = nextVal;
          return nextVal;
        });

        floatingTextsRef.current.push({
          id: `float-${Date.now()}-${Math.random()}`,
          text: `+${s.value}`,
          x: s.x,
          y: s.y,
          color: "#ffe600",
          opacity: 1,
          createdAt: Date.now(),
        });

        playSound("sun");
        return; // Click handled for sun, do not plant
      }
    }

    // 2. If a card is selected, try to plant on an empty cell
    const activeCard = selectedCardRef.current;
    if (!activeCard) return;

    const relX = clickX - GRID_OFFSET_X;
    const relY = clickY - GRID_OFFSET_Y;

    if (
      relX >= 0 &&
      relX < COLS * CELL_WIDTH &&
      relY >= 0 &&
      relY < ROWS * CELL_HEIGHT
    ) {
      const col = Math.floor(relX / CELL_WIDTH);
      const row = Math.floor(relY / CELL_HEIGHT);
      const config = PLANT_CONFIGS[activeCard];

      // Verify empty cell
      if (gridRef.current[row][col] !== null) {
        playSound("error");
        return;
      }

      // Verify Sun economy
      if (sunRef.current < config.cost) {
        playSound("error");
        setSelectedCard(null);
        return;
      }

      // Deduct sun & place plant
      setSun((prev) => {
        const nextVal = prev - config.cost;
        sunRef.current = nextVal;
        return nextVal;
      });

      const now = Date.now();
      const newPlant: PlantEntity = {
        id: `plant-${now}-${Math.random()}`,
        type: activeCard,
        row,
        col,
        hp: config.maxHp,
        maxHp: config.maxHp,
        plantedAt: now,
        lastActionTime: now,
        animOffset: Math.random() * Math.PI * 2,
      };

      gridRef.current[row][col] = newPlant;
      setPlantCount((c) => c + 1);

      playSound("plant");

      // Floating cost feedback
      floatingTextsRef.current.push({
        id: `cost-${now}`,
        text: `-${config.cost}`,
        x: GRID_OFFSET_X + col * CELL_WIDTH + CELL_WIDTH / 2,
        y: GRID_OFFSET_Y + row * CELL_HEIGHT + 20,
        color: "#ff5252",
        opacity: 1,
        createdAt: now,
      });

      // Deselect card
      setSelectedCard(null);
    }
  };

  // --------------------------------------------------------------------------
  // Main Game Loop: 60fps requestAnimationFrame
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const now = Date.now();
      const gameOver = isGameOverRef.current;

      // ======================================================================
      // 1. UPDATE GAME SIMULATION (if not Game Over)
      // ======================================================================
      if (!gameOver) {
        const grid = gridRef.current;
        const zombies = zombiesRef.current;
        const peas = peasRef.current;
        const suns = sunsRef.current;
        const particles = particlesRef.current;

        // --------------------------------------------------------------------
        // A. Plant Behaviors (Sunflower & Peashooter)
        // --------------------------------------------------------------------
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const plant = grid[r][c];
            if (!plant) continue;

            const plantX = GRID_OFFSET_X + c * CELL_WIDTH + CELL_WIDTH / 2;
            const plantY = GRID_OFFSET_Y + r * CELL_HEIGHT + CELL_HEIGHT / 2;

            if (plant.type === "sunflower") {
              // Sunflower: Generates 25 Sun at its tile position every 10 seconds
              if (now - plant.lastActionTime >= SUNFLOWER_SUN_INTERVAL) {
                plant.lastActionTime = now;
                spawnSun(plantX, plantY, true);

                // Little sunburst particle effect
                for (let i = 0; i < 6; i++) {
                  const angle = (i * Math.PI * 2) / 6;
                  particles.push({
                    id: `p-${Math.random()}`,
                    x: plantX,
                    y: plantY - 10,
                    vx: Math.cos(angle) * 40,
                    vy: Math.sin(angle) * 40,
                    color: "#ffe600",
                    radius: 3,
                    opacity: 1,
                  });
                }
              }
            } else if (plant.type === "peashooter") {
              // Peashooter: Shoots a pea every 1.5 seconds ONLY when a zombie is in its row
              // Check if any zombie is in the same row and to the right of the peashooter
              const hasZombieAhead = zombies.some((z) => z.row === r && z.x > plantX);

              if (hasZombieAhead && now - plant.lastActionTime >= PEASHOOTER_INTERVAL) {
                plant.lastActionTime = now;

                // Spawn pea projectile from snout cannon
                peas.push({
                  id: `pea-${now}-${Math.random()}`,
                  row: r,
                  x: plantX + 26,
                  y: plantY - 2,
                  speed: 240, // 240 px/sec
                  damage: 1, // Deals 1 damage on collision
                });

                playSound("pea_shoot");
              }
            }
          }
        }

        // --------------------------------------------------------------------
        // B. Pea Projectiles & Pea-Zombie Collision Detection
        // --------------------------------------------------------------------
        for (let pIdx = peas.length - 1; pIdx >= 0; pIdx--) {
          const pea = peas[pIdx];
          pea.x += pea.speed * dt;

          // Remove if off right screen
          if (pea.x > CANVAS_WIDTH + 20) {
            peas.splice(pIdx, 1);
            continue;
          }

          // Check collision with zombies in the same row
          let hitZombie = false;
          for (let zIdx = zombies.length - 1; zIdx >= 0; zIdx--) {
            const z = zombies[zIdx];
            if (z.row !== pea.row) continue;

            // Bounding box collision: pea x hits zombie body (zombie x ± 16)
            if (pea.x >= z.x - 14 && pea.x <= z.x + 18) {
              hitZombie = true;
              z.hp -= pea.damage;
              z.hitFlashTimer = 0.12; // Flash white
              playSound("pea_hit");

              // Green pea splatter particles
              for (let k = 0; k < 5; k++) {
                particles.push({
                  id: `p-${Math.random()}`,
                  x: pea.x,
                  y: pea.y,
                  vx: (Math.random() - 0.5) * 60,
                  vy: (Math.random() - 0.5) * 60,
                  color: "#4caf50",
                  radius: 2.5,
                  opacity: 1,
                });
              }

              // Check if zombie defeated
              if (z.hp <= 0) {
                zombies.splice(zIdx, 1);
                setZombiesKilled((k) => k + 1);
                addTickets(5); // Arcade prize ticket reward!

                // Zombie defeat text popup
                floatingTextsRef.current.push({
                  id: `kill-${Date.now()}`,
                  text: "+5 TIX",
                  x: z.x,
                  y: z.y - 30,
                  color: "#bcff3c",
                  opacity: 1,
                  createdAt: Date.now(),
                });
              }

              break; // Pea hits only one zombie
            }
          }

          if (hitZombie) {
            peas.splice(pIdx, 1); // Pea disappears after hit
          }
        }

        // --------------------------------------------------------------------
        // C. Zombie Movement, Plant Attack AI & Game Over Check
        // --------------------------------------------------------------------
        for (let zIdx = zombies.length - 1; zIdx >= 0; zIdx--) {
          const z = zombies[zIdx];
          z.walkCycle += dt * 4;
          if (z.hitFlashTimer > 0) z.hitFlashTimer -= dt;

          // Check if zombie touches a plant in its row
          const cellCol = Math.floor((z.x - GRID_OFFSET_X) / CELL_WIDTH);
          let targetPlant: PlantEntity | null = null;

          if (cellCol >= 0 && cellCol < COLS) {
            const plantInCell = grid[z.row][cellCol];
            if (plantInCell) {
              const plantCenterX = GRID_OFFSET_X + cellCol * CELL_WIDTH + CELL_WIDTH / 2;
              // Collision check: when zombie front touches plant
              if (z.x <= plantCenterX + 24 && z.x >= plantCenterX - 20) {
                targetPlant = plantInCell;
              }
            }
          }

          if (targetPlant) {
            // Zombie stops moving and attacks plant
            z.isAttacking = true;
            z.targetPlantRow = targetPlant.row;
            z.targetPlantCol = targetPlant.col;

            // Attack every 1 second (1 damage per bite)
            if (now - z.lastAttackTime >= ZOMBIE_ATTACK_INTERVAL) {
              z.lastAttackTime = now;
              targetPlant.hp -= 1;
              playSound("chomp");

              // Plant damage text
              floatingTextsRef.current.push({
                id: `bite-${Date.now()}`,
                text: "CHOMP!",
                x: z.x - 25,
                y: z.y - 25,
                color: "#ff3cbf",
                opacity: 1,
                createdAt: Date.now(),
              });

              // If plant's HP drops to 0, it is destroyed
              if (targetPlant.hp <= 0) {
                grid[targetPlant.row][targetPlant.col] = null;
                z.isAttacking = false;
                z.targetPlantRow = null;
                z.targetPlantCol = null;
                setPlantCount((c) => Math.max(0, c - 1));
              }
            }
          } else {
            // No plant obstructing: move slowly to the left
            z.isAttacking = false;
            z.x -= z.speed * dt;

            // Win/Loss Condition:
            // If zombie reaches the left edge (column 0, i.e., x <= GRID_OFFSET_X), trigger Game Over!
            if (z.x <= GRID_OFFSET_X + 8) {
              setIsGameOver(true);
              isGameOverRef.current = true;
              playSound("game_over");
              break;
            }
          }
        }

        // --------------------------------------------------------------------
        // D. Sun Falling Physics & Floating Text Updates
        // --------------------------------------------------------------------
        for (let i = suns.length - 1; i >= 0; i--) {
          const s = suns[i];
          if (s.y < s.targetY) {
            s.y += s.speed * dt;
            if (s.y > s.targetY) s.y = s.targetY;
          }

          const age = (now - s.createdAt) / 1000;
          if (s.collected) {
            s.radius = Math.max(0, s.radius - 60 * dt);
            s.y -= 80 * dt;
            s.opacity = Math.max(0, s.opacity - 4 * dt);
            if (s.opacity <= 0 || s.radius <= 0) {
              suns.splice(i, 1);
            }
          } else if (age > 14) {
            s.opacity = Math.max(0, s.opacity - 1.5 * dt);
            if (s.opacity <= 0) {
              suns.splice(i, 1);
            }
          }
        }

        // Update splat particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.opacity -= 2 * dt;
          if (p.opacity <= 0) particles.splice(i, 1);
        }

        // Update floating texts
        const floats = floatingTextsRef.current;
        for (let i = floats.length - 1; i >= 0; i--) {
          const ft = floats[i];
          ft.y -= 35 * dt;
          ft.opacity -= 1.2 * dt;
          if (ft.opacity <= 0) floats.splice(i, 1);
        }
      }

      // ======================================================================
      // 2. RENDER STAGE TO CANVAS
      // ======================================================================
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dirt / outer border
      ctx.fillStyle = "#1e1308";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Lawn foundation border
      ctx.fillStyle = "#4a2f13";
      ctx.fillRect(
        GRID_OFFSET_X - 12,
        GRID_OFFSET_Y - 8,
        COLS * CELL_WIDTH + 24,
        ROWS * CELL_HEIGHT + 16
      );

      // Draw 5x9 Lawn Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = GRID_OFFSET_X + c * CELL_WIDTH;
          const y = GRID_OFFSET_Y + r * CELL_HEIGHT;

          const isLight = (r + c) % 2 === 0;
          ctx.fillStyle = isLight ? TILE_LIGHT : TILE_DARK;
          ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);

          ctx.fillStyle = isLight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
          ctx.fillRect(x, y, CELL_WIDTH, 4);

          ctx.strokeStyle = TILE_BORDER;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        }
      }

      // Left edge warning danger line
      ctx.strokeStyle = "rgba(255, 60, 60, 0.4)";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y);
      ctx.lineTo(GRID_OFFSET_X, GRID_OFFSET_Y + ROWS * CELL_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // Highlight hovered cell & Ghost Preview
      const curHover = hoveredCellRef.current;
      const activeCard = selectedCardRef.current;

      if (curHover && !gameOver) {
        const hx = GRID_OFFSET_X + curHover.col * CELL_WIDTH;
        const hy = GRID_OFFSET_Y + curHover.row * CELL_HEIGHT;
        const isOccupied = gridRef.current[curHover.row][curHover.col] !== null;

        if (activeCard) {
          if (isOccupied) {
            ctx.fillStyle = "rgba(255, 60, 60, 0.35)";
            ctx.fillRect(hx, hy, CELL_WIDTH, CELL_HEIGHT);
            ctx.strokeStyle = "#ff3333";
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 1, hy + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);
          } else {
            ctx.fillStyle = "rgba(38, 247, 255, 0.25)";
            ctx.fillRect(hx, hy, CELL_WIDTH, CELL_HEIGHT);
            ctx.strokeStyle = "#26f7ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(hx + 1, hy + 1, CELL_WIDTH - 2, CELL_HEIGHT - 2);

            ctx.save();
            ctx.globalAlpha = 0.55;
            drawPlant(ctx, activeCard, hx + CELL_WIDTH / 2, hy + CELL_HEIGHT / 2 + 8, currentTime / 1000, 0, 1, 1);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.fillRect(hx, hy, CELL_WIDTH, CELL_HEIGHT);
        }
      }

      // Draw Plants & Plant Health Bars
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const plant = gridRef.current[r][c];
          if (plant) {
            const px = GRID_OFFSET_X + c * CELL_WIDTH + CELL_WIDTH / 2;
            const py = GRID_OFFSET_Y + r * CELL_HEIGHT + CELL_HEIGHT / 2 + 8;
            drawPlant(ctx, plant.type, px, py, currentTime / 1000, plant.animOffset, plant.hp, plant.maxHp);
          }
        }
      }

      // Draw Pea Projectiles
      const peas = peasRef.current;
      for (let i = 0; i < peas.length; i++) {
        const pea = peas[i];
        ctx.save();
        // Pea glow
        ctx.fillStyle = "rgba(188, 255, 60, 0.35)";
        ctx.beginPath();
        ctx.arc(pea.x, pea.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Pea sphere
        const peaGrad = ctx.createRadialGradient(pea.x - 2, pea.y - 2, 1, pea.x, pea.y, 6);
        peaGrad.addColorStop(0, "#c6ff00");
        peaGrad.addColorStop(0.6, "#4caf50");
        peaGrad.addColorStop(1, "#2e7d32");
        ctx.fillStyle = peaGrad;
        ctx.beginPath();
        ctx.arc(pea.x, pea.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Zombies
      const zombies = zombiesRef.current;
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        drawZombie(ctx, z);
      }

      // Draw Splat Particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Suns
      const suns = sunsRef.current;
      for (let i = 0; i < suns.length; i++) {
        drawSun(ctx, suns[i], currentTime / 1000);
      }

      // Draw Floating Texts
      const floats = floatingTextsRef.current;
      for (let i = 0; i < floats.length; i++) {
        const ft = floats[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.opacity);
        ctx.font = 'bold 15px "Press Start 2P", monospace, sans-serif';
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x - 14, ft.y);
        ctx.fillText(ft.text, ft.x - 14, ft.y);
        ctx.restore();
      }

      // Render Game Over Backdrop on Canvas
      if (gameOver) {
        ctx.save();
        ctx.fillStyle = "rgba(10, 4, 18, 0.82)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [addTickets, spawnSun]);

  // --------------------------------------------------------------------------
  // Canvas Helper: Draw Sun
  // --------------------------------------------------------------------------
  const drawSun = (ctx: CanvasRenderingContext2D, s: SunEntity, t: number) => {
    ctx.save();
    ctx.globalAlpha = s.opacity;

    const pulse = Math.sin(t * 4 + s.x) * 2;
    const currentRadius = Math.max(1, s.radius + pulse);
    const rotation = t * 1.5;

    // Outer glow
    const grad = ctx.createRadialGradient(s.x, s.y, currentRadius * 0.3, s.x, s.y, currentRadius * 1.6);
    grad.addColorStop(0, "rgba(255, 240, 100, 0.9)");
    grad.addColorStop(0.5, "rgba(255, 190, 20, 0.6)");
    grad.addColorStop(1, "rgba(255, 140, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Rotating Rays
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(rotation);
    ctx.fillStyle = "#ffb300";
    const rays = 8;
    for (let r = 0; r < rays; r++) {
      ctx.beginPath();
      ctx.ellipse(0, -currentRadius * 1.15, currentRadius * 0.28, currentRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate((Math.PI * 2) / rays);
    }
    ctx.restore();

    // Inner glowing sphere
    const innerGrad = ctx.createRadialGradient(s.x - 3, s.y - 3, 2, s.x, s.y, currentRadius);
    innerGrad.addColorStop(0, "#fffde7");
    innerGrad.addColorStop(0.4, "#fff176");
    innerGrad.addColorStop(1, "#fbc02d");
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cute face
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.arc(s.x - 6, s.y - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(s.x + 6, s.y - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x, s.y + 2, 5, 0.1, Math.PI - 0.1);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "#5d4037";
    ctx.stroke();

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // Canvas Helper: Draw Plants with Mini Health Bar
  // --------------------------------------------------------------------------
  const drawPlant = (
    ctx: CanvasRenderingContext2D,
    type: PlantType,
    x: number,
    y: number,
    t: number,
    animOffset: number,
    hp: number,
    maxHp: number
  ) => {
    ctx.save();

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 16, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (type === "sunflower") {
      const sway = Math.sin(t * 3 + animOffset) * 0.08;
      ctx.translate(x, y + 14);
      ctx.rotate(sway);
      ctx.translate(-x, -(y + 14));

      // Stem & Leaves
      ctx.strokeStyle = "#43a047";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.quadraticCurveTo(x - 4, y, x, y - 10);
      ctx.stroke();

      ctx.fillStyle = "#43a047";
      ctx.beginPath();
      ctx.ellipse(x - 14, y + 8, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(x + 14, y + 8, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Flower Head
      const headX = x;
      const headY = y - 12;

      // Golden Petals
      const petalCount = 12;
      const petalRadius = 18;
      ctx.fillStyle = "#fbc02d";
      for (let p = 0; p < petalCount; p++) {
        const angle = (p * (Math.PI * 2)) / petalCount;
        const px = headX + Math.cos(angle) * petalRadius;
        const py = headY + Math.sin(angle) * petalRadius;
        ctx.beginPath();
        ctx.arc(px, py, 7.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Brown center
      ctx.fillStyle = "#8d6e63";
      ctx.beginPath();
      ctx.arc(headX, headY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Face
      ctx.fillStyle = "#271b17";
      ctx.beginPath();
      ctx.arc(headX - 5, headY - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(headX + 5, headY - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(headX - 6, headY - 3, 1, 0, Math.PI * 2);
      ctx.arc(headX + 4, headY - 3, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 112, 67, 0.45)";
      ctx.beginPath();
      ctx.arc(headX - 9, headY + 3, 2.8, 0, Math.PI * 2);
      ctx.arc(headX + 9, headY + 3, 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#271b17";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(headX, headY + 2, 5, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else if (type === "peashooter") {
      const bounce = Math.sin(t * 4 + animOffset) * 2;
      const headX = x;
      const headY = y - 10 + bounce;

      // Stem & base leaves
      ctx.strokeStyle = "#2e7d32";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.quadraticCurveTo(x + 4, y + 4, headX, headY + 12);
      ctx.stroke();

      ctx.fillStyle = "#2e7d32";
      ctx.beginPath();
      ctx.ellipse(x - 12, y + 12, 11, 5, -0.3, 0, Math.PI * 2);
      ctx.ellipse(x + 12, y + 12, 11, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#43a047";
      ctx.beginPath();
      ctx.ellipse(headX - 16, headY + 4, 8, 4, -0.6, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = "#4caf50";
      ctx.beginPath();
      ctx.arc(headX, headY, 16, 0, Math.PI * 2);
      ctx.fill();

      // Snout / Cannon
      ctx.fillStyle = "#388e3c";
      ctx.beginPath();
      ctx.ellipse(headX + 16, headY + 1, 9, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1b5e20";
      ctx.beginPath();
      ctx.ellipse(headX + 18, headY + 1, 4, 5.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(headX + 4, headY - 4, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(headX + 5, headY - 5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mini Plant Health Bar (shown when damaged)
    if (hp < maxHp) {
      const barW = 36;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y - 35;

      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      const hpRatio = Math.max(0, hp / maxHp);
      ctx.fillStyle = hpRatio > 0.5 ? "#76ff03" : "#ff5252";
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // Canvas Helper: Draw Classic Zombie
  // --------------------------------------------------------------------------
  const drawZombie = (ctx: CanvasRenderingContext2D, z: ZombieEntity) => {
    ctx.save();

    // White flash when damaged by a pea
    if (z.hitFlashTimer > 0) {
      ctx.filter = "brightness(2) contrast(1.5)";
    }

    const zx = z.x;
    const zy = z.y;

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(zx, zy + 26, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Walking leg sway
    const legSway = Math.sin(z.walkCycle) * 6;

    // Left leg
    ctx.fillStyle = "#37474f";
    ctx.fillRect(zx - 6, zy + 8, 5, 18 + legSway);
    // Right leg
    ctx.fillStyle = "#263238";
    ctx.fillRect(zx + 2, zy + 8, 5, 18 - legSway);

    // Torso / Brown coat
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(zx - 10, zy - 12, 20, 22);

    // White shirt collar & red tie
    ctx.fillStyle = "#eceff1";
    ctx.beginPath();
    ctx.moveTo(zx - 3, zy - 12);
    ctx.lineTo(zx, zy - 6);
    ctx.lineTo(zx + 3, zy - 12);
    ctx.fill();

    ctx.fillStyle = "#d32f2f";
    ctx.beginPath();
    ctx.moveTo(zx - 2, zy - 6);
    ctx.lineTo(zx + 2, zy - 6);
    ctx.lineTo(zx, zy + 2);
    ctx.fill();

    // Outstretched Arms (facing left towards the lawn)
    const armBob = z.isAttacking ? Math.sin(z.walkCycle * 2) * 4 : 0;
    ctx.fillStyle = "#8d9e8c"; // zombie gray-green arm
    ctx.fillRect(zx - 20, zy - 6 + armBob, 12, 5);

    // Zombie Head
    const headX = zx - 4;
    const headY = zy - 22;

    ctx.fillStyle = "#8d9e8c"; // zombie skin
    ctx.beginPath();
    ctx.roundRect(headX - 10, headY - 12, 20, 22, 6);
    ctx.fill();

    // A few wisps of hair
    ctx.strokeStyle = "#3e2723";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY - 12);
    ctx.lineTo(headX - 6, headY - 17);
    ctx.moveTo(headX + 2, headY - 12);
    ctx.lineTo(headX + 4, headY - 18);
    ctx.stroke();

    // Goofy asymmetric bulging eyes
    ctx.fillStyle = "#fff9c4";
    ctx.beginPath();
    ctx.arc(headX - 4, headY - 3, 4, 0, Math.PI * 2);
    ctx.arc(headX + 4, headY - 2, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Black pupils
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(headX - 5, headY - 3, 1.4, 0, Math.PI * 2);
    ctx.arc(headX + 3, headY - 2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Open mouth / jaw
    ctx.fillStyle = "#212121";
    ctx.fillRect(headX - 7, headY + 3, 12, z.isAttacking ? 6 : 4);

    // Teeth
    ctx.fillStyle = "#fff9c4";
    ctx.fillRect(headX - 5, headY + 3, 2, 2);
    ctx.fillRect(headX + 1, headY + 3, 2, 2);

    ctx.restore();

    // Zombie Health Bar
    const barWidth = 32;
    const barHeight = 4;
    const barX = zx - barWidth / 2;
    const barY = zy - 42;

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    const hpRatio = Math.max(0, z.hp / z.maxHp);
    ctx.fillStyle = hpRatio > 0.5 ? "#bcff3c" : hpRatio > 0.25 ? "#ffd54f" : "#ff3333";
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  };

  return (
    <div className="pvz-container">
      {/* ------------------------------------------------------------------ */}
      {/* TOP CONTROL HUD: Sun Counter & Plant Selection Bar                 */}
      {/* ------------------------------------------------------------------ */}
      <div className="pvz-hud">
        {/* Sun Counter (Top-Left) */}
        <div className="pvz-sun-counter" title="Current Sun Amount">
          <div className="pvz-sun-icon" aria-hidden="true">
            ☀️
          </div>
          <div className="pvz-sun-info">
            <span className="pvz-sun-label">SUN</span>
            <span className="pvz-sun-val">{sun}</span>
          </div>
        </div>

        {/* Plant Selection Bar */}
        <div className="pvz-card-bar" role="toolbar" aria-label="Plant Selection Bar">
          {(Object.keys(PLANT_CONFIGS) as PlantType[]).map((type) => {
            const config = PLANT_CONFIGS[type];
            const isSelected = selectedCard === type;
            const canAfford = sun >= config.cost;

            return (
              <button
                key={type}
                type="button"
                className={`pvz-card ${isSelected ? "pvz-card--selected" : ""} ${
                  !canAfford ? "pvz-card--disabled" : ""
                }`}
                onClick={() => handleSelectCard(type)}
                disabled={(!canAfford && !isSelected) || isGameOver}
                title={`${config.name} (${config.cost} Sun) - ${config.description}`}
              >
                <div className="pvz-card-icon">{config.icon}</div>
                <div className="pvz-card-details">
                  <span className="pvz-card-name">{config.name}</span>
                  <span className="pvz-card-cost">{config.cost} ☀️</span>
                </div>
                {isSelected && <span className="pvz-card-active-indicator">READY</span>}
              </button>
            );
          })}
        </div>

        {/* HUD Actions & Stats */}
        <div className="pvz-hud-actions">
          <div className="pvz-score-badge" title="Zombies Defeated">
            <span className="pvz-score-label">KILLS</span>
            <span className="pvz-score-val">🧟 {zombiesKilled}</span>
          </div>
          {selectedCard && (
            <button
              type="button"
              className="pvz-btn-cancel"
              onClick={() => setSelectedCard(null)}
              title="Cancel plant selection"
            >
              Cancel ✕
            </button>
          )}
          <button
            type="button"
            className="pvz-btn-reset"
            onClick={handleRestart}
            title="Restart current game"
          >
            Restart
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* GAME CANVAS & GAME OVER OVERLAY                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="pvz-canvas-wrapper">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`pvz-canvas ${selectedCard ? "pvz-canvas--planting" : ""}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
        />

        {/* Game Over Modal Overlay */}
        {isGameOver && (
          <div className="pvz-game-over-overlay">
            <div className="pvz-game-over-card">
              <span className="pvz-skull-icon">🧠 💀</span>
              <h2 className="pvz-game-over-title">THE ZOMBIES ATE YOUR BRAINS!</h2>
              <p className="pvz-game-over-desc">
                A zombie managed to break through your lawn defenses and reached the house!
              </p>

              <div className="pvz-game-over-stats">
                <div>
                  <span>Zombies Defeated</span>
                  <strong>{zombiesKilled}</strong>
                </div>
                <div>
                  <span>Plants Deployed</span>
                  <strong>{plantCount}</strong>
                </div>
              </div>

              <button type="button" className="pvz-btn-try-again" onClick={handleRestart}>
                TRY AGAIN
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="pvz-status-bar">
          <p>
            {isGameOver ? (
              <span className="pvz-text-danger">Game Over! Protect the left edge next time.</span>
            ) : selectedCard ? (
              <span className="pvz-highlight-text">
                Click any empty lawn cell to plant your {PLANT_CONFIGS[selectedCard].name}!
              </span>
            ) : (
              <span>
                🌻 Sunflower generates 25 Sun every 10s · 🌱 Peashooter fires at zombies in row (1 dmg)
              </span>
            )}
          </p>
          <span className="pvz-plant-stat">Active Plants: {plantCount}</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STYLES: Dedicated PvZ arcade styling                               */}
      {/* ------------------------------------------------------------------ */}
      <style jsx>{`
        .pvz-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          user-select: none;
        }

        .pvz-hud {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          padding: 0.85rem 1.25rem;
          background: rgba(19, 12, 41, 0.95);
          border: 2px solid var(--lime, #bcff3c);
          box-shadow: 0 0 18px rgba(188, 255, 60, 0.2), inset 0 0 20px rgba(0, 0, 0, 0.6);
        }

        .pvz-sun-counter {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.4rem 0.9rem;
          background: #110926;
          border: 2px solid #ffcc00;
          box-shadow: inset 0 0 10px rgba(255, 204, 0, 0.25), 0 0 10px rgba(255, 204, 0, 0.2);
        }

        .pvz-sun-icon {
          font-size: 1.6rem;
          filter: drop-shadow(0 0 6px #ffea00);
          animation: pvz-pulse 2s infinite ease-in-out;
        }

        .pvz-sun-info {
          display: flex;
          flex-direction: column;
        }

        .pvz-sun-label {
          font-family: "Press Start 2P", monospace;
          font-size: 0.52rem;
          color: #ffc107;
          letter-spacing: 0.08em;
        }

        .pvz-sun-val {
          font-family: "Press Start 2P", monospace;
          font-size: 1.15rem;
          color: #fff;
          text-shadow: 0 0 8px #ffb300;
        }

        .pvz-card-bar {
          display: flex;
          gap: 0.75rem;
        }

        .pvz-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.85rem;
          background: #1a1236;
          border: 2px solid var(--cyan, #26f7ff);
          color: var(--cream, #fff6dc);
          cursor: pointer;
          transition: all 120ms ease;
          box-shadow: 0 3px 0 rgba(0, 0, 0, 0.4);
        }

        .pvz-card:hover:not(:disabled) {
          transform: translateY(-2px);
          border-color: #ffe600;
          box-shadow: 0 6px 0 rgba(0, 0, 0, 0.4), 0 0 12px rgba(255, 230, 0, 0.4);
        }

        .pvz-card--selected {
          background: #31216b;
          border-color: #ffe600 !important;
          box-shadow: 0 0 16px rgba(255, 230, 0, 0.6), inset 0 0 12px rgba(255, 230, 0, 0.2) !important;
          transform: translateY(-3px);
        }

        .pvz-card--disabled {
          opacity: 0.45;
          cursor: not-allowed;
          border-color: #554877;
          filter: grayscale(0.5);
        }

        .pvz-card-icon {
          font-size: 1.5rem;
        }

        .pvz-card-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.2rem;
        }

        .pvz-card-name {
          font-family: "Press Start 2P", monospace;
          font-size: 0.58rem;
          color: var(--cream, #fff6dc);
        }

        .pvz-card-cost {
          font-family: "Press Start 2P", monospace;
          font-size: 0.62rem;
          color: #ffd54f;
          text-shadow: 0 0 5px rgba(255, 213, 79, 0.6);
        }

        .pvz-card-active-indicator {
          position: absolute;
          top: -7px;
          right: -7px;
          background: #ffe600;
          color: #000;
          font-family: "Press Start 2P", monospace;
          font-size: 0.45rem;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: bold;
        }

        .pvz-hud-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .pvz-score-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.35rem 0.65rem;
          background: #110926;
          border: 1px solid var(--lime, #bcff3c);
        }

        .pvz-score-label {
          font-family: "Press Start 2P", monospace;
          font-size: 0.45rem;
          color: var(--lime, #bcff3c);
        }

        .pvz-score-val {
          font-family: "Press Start 2P", monospace;
          font-size: 0.72rem;
          color: #fff;
        }

        .pvz-btn-cancel,
        .pvz-btn-reset {
          font-family: "Press Start 2P", monospace;
          font-size: 0.58rem;
          padding: 0.5rem 0.75rem;
          background: #1a1236;
          border: 1px solid var(--pink, #ff3cbf);
          color: var(--pink, #ff3cbf);
          cursor: pointer;
          transition: background 120ms ease;
        }

        .pvz-btn-cancel:hover,
        .pvz-btn-reset:hover {
          background: var(--pink, #ff3cbf);
          color: #000;
        }

        .pvz-canvas-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          border: 3px solid var(--lime, #bcff3c);
          background: #000;
          box-shadow: 0 0 25px rgba(188, 255, 60, 0.25);
        }

        .pvz-canvas {
          display: block;
          max-width: 100%;
          height: auto;
          cursor: default;
        }

        .pvz-canvas--planting {
          cursor: crosshair;
        }

        .pvz-game-over-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 10;
        }

        .pvz-game-over-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.2rem;
          max-width: 520px;
          padding: 2.2rem 2rem;
          background: rgba(19, 12, 41, 0.96);
          border: 3px solid #ff3333;
          box-shadow: 0 0 40px rgba(255, 51, 51, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.8);
          animation: pvz-pop-in 240ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .pvz-skull-icon {
          font-size: 2.5rem;
        }

        .pvz-game-over-title {
          font-family: "Press Start 2P", monospace;
          font-size: 1.15rem;
          color: #ff3333;
          line-height: 1.6;
          margin: 0;
          text-shadow: 2px 2px 0 #000, 0 0 15px rgba(255, 51, 51, 0.8);
        }

        .pvz-game-over-desc {
          margin: 0;
          font-size: 0.9rem;
          color: var(--muted, #b9afd2);
          line-height: 1.6;
        }

        .pvz-game-over-stats {
          display: flex;
          gap: 2rem;
          padding: 0.8rem 1.4rem;
          background: #0c061a;
          border: 1px dashed var(--pink, #ff3cbf);
        }

        .pvz-game-over-stats div {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .pvz-game-over-stats span {
          font-family: "Press Start 2P", monospace;
          font-size: 0.5rem;
          color: var(--muted, #b9afd2);
        }

        .pvz-game-over-stats strong {
          font-family: "Press Start 2P", monospace;
          font-size: 1.2rem;
          color: var(--lime, #bcff3c);
        }

        .pvz-btn-try-again {
          font-family: "Press Start 2P", monospace;
          font-size: 0.85rem;
          padding: 0.85rem 1.6rem;
          background: #ff3333;
          color: #fff;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 4px 0 #8b0000;
          transition: transform 120ms ease;
        }

        .pvz-btn-try-again:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #8b0000;
        }

        .pvz-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
          width: 100%;
          padding: 0.65rem 1rem;
          background: rgba(19, 12, 41, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.78rem;
          color: var(--muted, #b9afd2);
        }

        .pvz-status-bar p {
          margin: 0;
        }

        .pvz-highlight-text {
          color: var(--cyan, #26f7ff);
          font-family: "Press Start 2P", monospace;
          font-size: 0.58rem;
        }

        .pvz-text-danger {
          color: #ff5252;
          font-family: "Press Start 2P", monospace;
          font-size: 0.58rem;
        }

        .pvz-plant-stat {
          font-family: "Press Start 2P", monospace;
          font-size: 0.55rem;
          color: var(--lime, #bcff3c);
        }

        @keyframes pvz-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes pvz-pop-in {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @media (max-width: 720px) {
          .pvz-hud {
            flex-direction: column;
            align-items: stretch;
          }
          .pvz-card-bar {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
