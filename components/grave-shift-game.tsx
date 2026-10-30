"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTicketWallet } from "@/components/ticket-wallet";

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const WORLD_WIDTH = 1_940;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 58;

type Platform = { x: number; y: number; width: number; height?: number };
type Collectible = { id: string; x: number; y: number };
type Specter = { id: string; x: number; y: number; range: number; pace: number };

type RunState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: -1 | 1;
  grounded: boolean;
  started: boolean;
  score: number;
  lives: number;
  checkpoint: "start" | "clearing";
  collected: Set<string>;
  defeated: Set<string>;
  invulnerableUntil: number;
};

type Frame = {
  x: number;
  y: number;
  camera: number;
  time: number;
  facing: -1 | 1;
  moving: boolean;
  score: number;
  lives: number;
  started: boolean;
  complete: boolean;
  collected: string[];
  defeated: string[];
  message: string;
};

const platforms: Platform[] = [
  { x: -48, y: 456, width: 320 },
  { x: 320, y: 406, width: 130 },
  { x: 505, y: 360, width: 154 },
  { x: 716, y: 420, width: 190 },
  { x: 963, y: 350, width: 176 },
  { x: 1_194, y: 400, width: 245 },
  { x: 1_502, y: 336, width: 136 },
  { x: 1_688, y: 440, width: 286 },
];

const lanterns: Collectible[] = [
  { id: "lantern-1", x: 135, y: 382 },
  { id: "lantern-2", x: 365, y: 332 },
  { id: "lantern-3", x: 550, y: 286 },
  { id: "lantern-4", x: 628, y: 286 },
  { id: "lantern-5", x: 792, y: 346 },
  { id: "lantern-6", x: 1_010, y: 276 },
  { id: "lantern-7", x: 1_094, y: 276 },
  { id: "lantern-8", x: 1_255, y: 326 },
  { id: "lantern-9", x: 1_547, y: 262 },
];

const specters: Specter[] = [
  { id: "specter-1", x: 574, y: 314, range: 34, pace: 0.0021 },
  { id: "specter-2", x: 1_068, y: 303, range: 45, pace: 0.0018 },
  { id: "specter-3", x: 1_320, y: 352, range: 65, pace: 0.0015 },
  { id: "specter-4", x: 1_562, y: 280, range: 30, pace: 0.0025 },
];

function newRun(): RunState {
  return {
    x: 82,
    y: 398,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    started: false,
    score: 0,
    lives: 3,
    checkpoint: "start",
    collected: new Set(),
    defeated: new Set(),
    invulnerableUntil: 0,
  };
}

function initialFrame(): Frame {
  return {
    x: 82,
    y: 398,
    camera: 0,
    time: 0,
    facing: 1,
    moving: false,
    score: 0,
    lives: 3,
    started: false,
    complete: false,
    collected: [],
    defeated: [],
    message: "Wake the lanterns. Cross the gravewood.",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function overlaps(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function StonePlatform({ platform, index }: { platform: Platform; index: number }) {
  const blockCount = Math.ceil(platform.width / 32);

  return (
    <g transform={`translate(${platform.x} ${platform.y})`} className="stage-platform">
      <rect width={platform.width} height={platform.height ?? 110} fill="#1a2331" />
      <rect width={platform.width} height="8" fill="#70827b" />
      <rect y="8" width={platform.width} height="6" fill="#354752" />
      {Array.from({ length: blockCount }, (_, block) => (
        <g key={`${index}-${block}`} transform={`translate(${block * 32} 14)`}>
          <rect width="31" height="30" fill={block % 2 === 0 ? "#263746" : "#2d3e4b"} />
          <path d="M4 8h13M20 19h7M12 25h8" stroke="#15222c" strokeWidth="3" />
          {block % 3 === 0 && <rect x="24" y="3" width="4" height="12" fill="#49605c" />}
        </g>
      ))}
      <path d={`M0 43h${platform.width}`} stroke="#101923" strokeWidth="3" />
      <path d={`M0 76h${platform.width}`} stroke="#101923" strokeWidth="3" />
    </g>
  );
}

function GnarledTree({ x, ground, scale = 1 }: { x: number; ground: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${ground}) scale(${scale})`} className="gnarled-tree">
      <path d="M0 0C9-32 4-76 14-125l-13-27 20 10 4-46 13 49 21-23-15 44c5 39 17 76 11 118Z" fill="#101722" />
      <path d="M18-15c-1-58 5-96 8-132M7-76l20 9M27-115l-14 5" fill="none" stroke="#2e3e45" strokeWidth="5" />
      <path d="M18-144c-29-11-36-33-32-50 16 8 28 18 35 34 5-20 17-35 35-43 3 28-12 47-32 58Z" fill="#17272e" />
      <path d="M17-153c-5-18-1-31 5-43 9 16 10 28 6 43Z" fill="#52634f" opacity=".45" />
    </g>
  );
}

function Lantern({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="soul-lantern">
        <circle cx="0" cy="0" r="19" fill="#e8f6ac" opacity=".08" />
        <path d="M-6 7h12l-2-13h-8Z" fill="#d6ff74" />
        <path d="M-4-7c0-9 8-9 8 0" fill="none" stroke="#d6ff74" strokeWidth="3" />
        <rect x="-7" y="7" width="14" height="3" fill="#5e8038" />
        <rect x="-3" y="-3" width="6" height="8" fill="#fff9bd" />
      </g>
    </g>
  );
}

function SpecterSprite({ x, y, direction, squashed }: { x: number; y: number; direction: number; squashed: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`scale(${direction} 1)`}>
        <g className={squashed ? "specter specter--gone" : "specter"}>
          <path d="M-15 29V9C-15-4 15-4 15 9v20l-6-5-8 5-8-5Z" fill="#7b92a1" />
          <path d="M-10 12h20" stroke="#c1e4ce" strokeWidth="3" opacity=".7" />
          <rect x="-8" y="9" width="4" height="6" fill="#e7ff99" />
          <rect x="4" y="9" width="4" height="6" fill="#e7ff99" />
          <path d="M-5 20h10" stroke="#293845" strokeWidth="3" />
        </g>
      </g>
    </g>
  );
}

function ZombieHero({ x, y, facing, moving }: { x: number; y: number; facing: number; moving: boolean }) {
  const step = moving ? 3 : 0;
  return (
    <g transform={`translate(${x} ${y})`} className="zombie-hero">
      <ellipse cx="16" cy="57" rx="18" ry="4" fill="#08101b" opacity=".55" />
      <g transform={`translate(${facing === -1 ? 32 : 0} 0) scale(${facing} 1)`}>
        <rect x="5" y="39" width="9" height={15 + step} fill="#40526a" />
        <rect x="19" y="39" width="9" height={15 - step} fill="#40526a" />
        <rect x="3" y="53" width="13" height="5" fill="#18263a" />
        <rect x="18" y="53" width="13" height="5" fill="#18263a" />
        <rect x="4" y="22" width="25" height="22" fill="#6f4d84" />
        <rect x="6" y="26" width="21" height="17" fill="#815a96" />
        <rect x="3" y="28" width="4" height="12" fill="#95ad6d" />
        <rect x="27" y="29" width="4" height="12" fill="#95ad6d" />
        <rect x="7" y="9" width="19" height="18" fill="#9ebd75" />
        <rect x="5" y="6" width="22" height="7" fill="#31445a" />
        <rect x="9" y="3" width="15" height="6" fill="#41546c" />
        <rect x="18" y="15" width="4" height="5" fill="#eaff88" />
        <rect x="9" y="17" width="5" height="3" fill="#374f43" />
        <path d="M11 23h10" stroke="#435544" strokeWidth="2" />
        <rect x="9" y="12" width="4" height="3" fill="#4f6c51" />
      </g>
    </g>
  );
}

function Heart({ active }: { active: boolean }) {
  return <span className={active ? "heart" : "heart heart--empty"}>♥</span>;
}

export function GraveShiftGame() {
  const { addTickets } = useTicketWallet();
  const run = useRef<RunState>(newRun());
  const keys = useRef({ left: false, right: false, jumpQueued: false });
  const complete = useRef(false);
  const lastDraw = useRef(0);
  const messageRef = useRef(initialFrame().message);
  const [frame, setFrame] = useState<Frame>(initialFrame);

  const begin = useCallback(() => {
    if (complete.current) return;
    run.current.started = true;
    messageRef.current = "Light the way — the gate is beyond the old pines.";
    setFrame((current) => ({ ...current, started: true, message: messageRef.current }));
  }, []);

  const reset = useCallback(() => {
    run.current = newRun();
    keys.current = { left: false, right: false, jumpQueued: false };
    complete.current = false;
    messageRef.current = initialFrame().message;
    setFrame(initialFrame());
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    let lastTime = performance.now();

    const keyDown = (event: KeyboardEvent) => {
      const isGameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW"].includes(event.code);
      if (!isGameKey) return;
      event.preventDefault();
      begin();
      if (event.code === "ArrowLeft" || event.code === "KeyA") keys.current.left = true;
      if (event.code === "ArrowRight" || event.code === "KeyD") keys.current.right = true;
      if ((event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW") && !event.repeat) keys.current.jumpQueued = true;
    };

    const keyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") keys.current.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD") keys.current.right = false;
    };

    const draw = (state: RunState, nextMessage: string, time = 0) => {
      const normalizedMessage = nextMessage || "Light the way — the gate is beyond the old pines.";
      messageRef.current = normalizedMessage;
      const camera = clamp(state.x - 310, 0, WORLD_WIDTH - VIEW_WIDTH);
      setFrame({
        x: state.x,
        y: state.y,
        camera,
        time,
        facing: state.facing,
        moving: Math.abs(state.vx) > 12,
        score: state.score,
        lives: state.lives,
        started: state.started,
        complete: complete.current,
        collected: [...state.collected],
        defeated: [...state.defeated],
        message: normalizedMessage,
      });
    };

    const respawn = (state: RunState, nextMessage: string) => {
      const atClearing = state.checkpoint === "clearing";
      state.x = atClearing ? 990 : 82;
      state.y = atClearing ? 292 : 398;
      state.vx = 0;
      state.vy = 0;
      state.grounded = true;
      state.lives = Math.max(1, state.lives - 1);
      state.invulnerableUntil = performance.now() + 1_150;
      draw(state, nextMessage, performance.now());
    };

    const tick = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.034);
      lastTime = now;
      const state = run.current;
      let status = messageRef.current;

      if (state.started && !complete.current) {
        // Grave Shift is an auto-runner: the player only needs to time jumps.
        // Holding left backs away from danger; holding right gives a small sprint boost.
        const direction = keys.current.left ? -1 : 1;
        const targetSpeed = direction * (keys.current.right ? 305 : 215);
        state.vx += (targetSpeed - state.vx) * Math.min(1, delta * 13);
        state.facing = direction;

        if (keys.current.jumpQueued && state.grounded) {
          state.vy = -565;
          state.grounded = false;
        }
        keys.current.jumpQueued = false;

        const previousBottom = state.y + PLAYER_HEIGHT;
        state.vy += 1_540 * delta;
        state.x = clamp(state.x + state.vx * delta, 0, WORLD_WIDTH - PLAYER_WIDTH);
        state.y += state.vy * delta;
        state.grounded = false;

        let landingY: number | undefined;
        for (const platform of platforms) {
          const crossesPlatform = state.vy >= 0 && previousBottom <= platform.y + 4 && state.y + PLAYER_HEIGHT >= platform.y;
          const overlapsPlatform = state.x + PLAYER_WIDTH > platform.x && state.x < platform.x + platform.width;
          if (crossesPlatform && overlapsPlatform && (landingY === undefined || platform.y < landingY)) landingY = platform.y;
        }
        if (landingY !== undefined) {
          state.y = landingY - PLAYER_HEIGHT;
          state.vy = 0;
          state.grounded = true;
        }

        if (state.x > 970 && state.checkpoint === "start") {
          state.checkpoint = "clearing";
          status = "The moon sees you. The old gate is close.";
        }

        for (const lantern of lanterns) {
          if (!state.collected.has(lantern.id) && overlaps({ x: state.x, y: state.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT }, { x: lantern.x - 9, y: lantern.y - 12, width: 18, height: 22 })) {
            state.collected.add(lantern.id);
            state.score += 1;
            status = `${state.score} soul lantern${state.score === 1 ? "" : "s"} lit`;
          }
        }

        for (const specter of specters) {
          if (state.defeated.has(specter.id)) continue;
          const enemyX = specter.x + Math.sin(now * specter.pace) * specter.range;
          const hitbox = { x: enemyX - 14, y: specter.y, width: 28, height: 30 };
          const hero = { x: state.x, y: state.y, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
          if (overlaps(hero, hitbox) && now > state.invulnerableUntil) {
            if (state.vy > 105 && state.y + PLAYER_HEIGHT - state.vy * delta <= specter.y + 12) {
              state.defeated.add(specter.id);
              state.vy = -305;
              status = "Specter cleared!";
            } else {
              respawn(state, "A wisp sent you back to the last lantern.");
              status = messageRef.current;
            }
          }
        }

        if (state.y > VIEW_HEIGHT + 100) {
          respawn(state, "The bog spit you back out.");
          status = messageRef.current;
        }

        if (state.x > 1_822 && state.y > 360) {
          complete.current = true;
          state.vx = 0;
          state.vy = 0;
          status = "GRAVE SHIFT COMPLETE · 25 tickets found";
          addTickets(25);
        }
      }

      if (now - lastDraw.current > 34) {
        lastDraw.current = now;
        draw(state, status, now);
      }
      animationFrame = requestAnimationFrame(tick);
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    animationFrame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      cancelAnimationFrame(animationFrame);
    };
  }, [addTickets, begin]);

  const press = (control: "left" | "right" | "jump") => {
    begin();
    if (control === "jump") keys.current.jumpQueued = true;
    else keys.current[control] = true;
  };

  const release = (control: "left" | "right") => {
    keys.current[control] = false;
  };

  const collected = new Set(frame.collected);
  const defeated = new Set(frame.defeated);
  const camera = frame.camera;
  const heroFacing = frame.facing;
  const moving = frame.moving && !frame.complete;

  return (
    <section className="grave-shift" aria-label="Grave Shift platform game">
      <div className="grave-shift__titlebar">
        <div>
          <p className="eyebrow">CABINET 01 · HALLOWEEN PLATFORMER</p>
          <h1>Grave Shift</h1>
        </div>
        <Link className="grave-shift__exit" href="/">← Exit cabinet</Link>
      </div>

      <div className="game-screen" role="application" aria-label="Grave Shift auto-runner. The hero moves right automatically. Hold left or A to retreat, right or D to sprint, and jump with space, W, or up arrow.">
        <div className="game-screen__hud" aria-live="polite">
          <div className="hud-block">
            <span className="hud-label">SOULS</span>
            <strong>{String(frame.score).padStart(2, "0")}<small>/{lanterns.length}</small></strong>
          </div>
          <p className="game-screen__message">{frame.message}</p>
          <div className="hud-block hud-block--life">
            <span className="hud-label">UNDEAD</span>
            <strong aria-label={`${frame.lives} lives`}><Heart active={frame.lives >= 1} /><Heart active={frame.lives >= 2} /><Heart active={frame.lives >= 3} /></strong>
          </div>
        </div>

        <svg className="grave-stage" viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" shapeRendering="crispEdges">
          <defs>
            <linearGradient id="grave-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#081327" />
              <stop offset=".55" stopColor="#182241" />
              <stop offset="1" stopColor="#483150" />
            </linearGradient>
            <radialGradient id="moon-glow">
              <stop offset="0" stopColor="#d9edc6" stopOpacity=".37" />
              <stop offset="1" stopColor="#d9edc6" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bog-mist" x1="0" x2="1">
              <stop stopColor="#95b4ab" stopOpacity="0" />
              <stop offset=".5" stopColor="#95b4ab" stopOpacity=".16" />
              <stop offset="1" stopColor="#95b4ab" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill="url(#grave-sky)" />
          <circle cx="752" cy="102" r="142" fill="url(#moon-glow)" />
          <circle cx="752" cy="102" r="45" fill="#edf2c8" />
          <path d="M727 93h18l-8 7h23l-11 11h-20l9-10h-16Z" fill="#b1bfaa" opacity=".75" />
          <g opacity=".75" fill="#141a2e">
            <path d="M60 100l7 8 10-4-5 11 10 8-13 1-8 12-3-13-14-5 13-5Z" />
            <path d="M498 150l6 7 9-4-5 10 11 8-13 1-7 10-3-11-12-5 12-5Z" />
            <path d="M865 185l5 6 9-3-5 9 10 6-12 2-6 9-3-10-10-4 10-5Z" />
          </g>
          <g transform={`translate(${-camera} 0)`}>
            <path d="M-100 408c136-42 250-39 380-13 161 31 328-20 511-8 159 10 388-12 1_272 4v153H-100Z" fill="#121e2e" opacity=".9" />
            <GnarledTree x={35} ground={438} scale={1.05} />
            <GnarledTree x={260} ground={442} scale={0.82} />
            <GnarledTree x={470} ground={424} scale={1.25} />
            <GnarledTree x={760} ground={448} scale={0.9} />
            <GnarledTree x={1_005} ground={390} scale={1.25} />
            <GnarledTree x={1_335} ground={420} scale={.95} />
            <GnarledTree x={1_600} ground={434} scale={1.3} />
            <GnarledTree x={1_830} ground={440} scale={.87} />
            <path d="M-40 432c230-28 456 32 674 0s448 24 740-11 402 19 596-5v80H-40Z" fill="url(#bog-mist)" />
            {platforms.map((platform, index) => <StonePlatform key={index} platform={platform} index={index} />)}
            {lanterns.map((lantern) => !collected.has(lantern.id) && <Lantern key={lantern.id} x={lantern.x} y={lantern.y} />)}
            {specters.map((specter) => {
              const x = specter.x + Math.sin(frame.time * specter.pace) * specter.range;
              return <SpecterSprite key={specter.id} x={x} y={specter.y} direction={Math.cos(frame.time * specter.pace) > 0 ? 1 : -1} squashed={defeated.has(specter.id)} />;
            })}
            <g transform="translate(1842 344)" className="grave-gate">
              <path d="M0 96V19l20-21 20 21v77M40 96V19l20-21 20 21v77" fill="#25313f" stroke="#91a68b" strokeWidth="4" />
              <path d="M-10 96h90" stroke="#18232e" strokeWidth="7" />
              <circle cx="40" cy="18" r="9" fill="#eaff8d" opacity=".8" />
              <text x="40" y="116" textAnchor="middle" fill="#d8e7b3" fontSize="10">EXIT</text>
            </g>
            <ZombieHero x={frame.x} y={frame.y} facing={heroFacing} moving={moving} />
          </g>
          <path d="M0 500c151-18 267 14 421-2s292-4 539-10v52H0Z" fill="#0a131c" opacity=".72" />
        </svg>

        {!frame.started && (
          <div className="game-screen__intro">
            <p className="game-screen__kicker">THE GRAVEWOOD HAS A PULSE</p>
            <h2>Keep the soul lanterns lit.</h2>
            <p>A newly undead plumber has one shift left: outrun the fog, stomp the wisps, and reach the gate.</p>
            <button className="game-screen__start" type="button" onClick={begin}>Start shift</button>
            <span>AUTO-RUN ACTIVE · SPACE TO JUMP</span>
          </div>
        )}

        {frame.complete && (
          <div className="game-screen__complete">
            <span>✦</span>
            <h2>Shift survived</h2>
            <p>{frame.score} of {lanterns.length} soul lanterns lit · 25 tickets added</p>
            <button type="button" onClick={reset}>Play again</button>
          </div>
        )}
      </div>

      <div className="grave-shift__footer">
        <div className="control-pad" aria-label="Touch controls">
          <button type="button" aria-label="Move left" onPointerDown={() => press("left")} onPointerUp={() => release("left")} onPointerLeave={() => release("left")}>←</button>
          <button type="button" aria-label="Move right" onPointerDown={() => press("right")} onPointerUp={() => release("right")} onPointerLeave={() => release("right")}>→</button>
          <button className="control-pad__jump" type="button" onPointerDown={() => press("jump")}>JUMP</button>
        </div>
        <p><strong>How to haunt:</strong> Your ghoul runs forward automatically. Hold <kbd>←</kbd> / <kbd>A</kbd> to retreat, <kbd>→</kbd> / <kbd>D</kbd> to sprint, and <kbd>space</kbd> to jump. Land on wisps from above to banish them.</p>
      </div>
    </section>
  );
}
