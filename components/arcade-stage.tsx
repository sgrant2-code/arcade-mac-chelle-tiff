"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTicketWallet } from "@/components/ticket-wallet";
import { games } from "@/lib/games";
import { playClickSound } from "@/lib/sound";

export function ArcadeStage() {
  const router = useRouter();
  const { openPrizeShop, openTicketBooth } = useTicketWallet();

  const handleGameClick = (slug: string) => {
    playClickSound();
    router.push(`/games/${slug}`);
  };

  return (
    <div className="arcade-scene-container">
      {/* Visual Interactive Viewport */}
      <div className="arcade-viewport">
        {/* Arcade Background Image */}
        <div className="arcade-image-wrapper">
          <Image
            src="/arcade-scene.jpg"
            alt="Neon Arcade Interior: Retro arcade cabinets, glowing neon sign, ticket counter with cat attendant"
            width={1024}
            height={616}
            priority
            className="arcade-scene-image"
          />

          {/* Interactive Overlay Hotspots */}
          <div className="arcade-hotspots-layer" aria-label="Interactive arcade floor elements">
            {/* HOTSPOT 1: Cabinet 1 (Game 1 - Space Defender) */}
            <button
              type="button"
              className="hotspot hotspot--game-1"
              onClick={() => handleGameClick("game-1")}
              aria-label="Play Game 1: Space Defender cabinet"
            >
              <span className="hotspot-beacon">
                <span className="beacon-dot" />
                <span className="beacon-ping" />
              </span>
              <span className="hotspot-tooltip">
                <span className="tooltip-tag">👾 GAME 1</span>
                <strong>Space Defender</strong>
                <span className="tooltip-action">Click to Play →</span>
              </span>
            </button>

            {/* HOTSPOT 2: Central Prize Counter & Shelves */}
            <button
              type="button"
              className="hotspot hotspot--prize-booth"
              onClick={() => {
                playClickSound();
                openPrizeShop();
              }}
              aria-label="Open Prize Shop counter"
            >
              <span className="hotspot-beacon">
                <span className="beacon-dot beacon-dot--gold" />
                <span className="beacon-ping beacon-ping--gold" />
              </span>
              <span className="hotspot-tooltip">
                <span className="tooltip-tag">🎁 PRIZE COUNTER</span>
                <strong>Redeem Tickets</strong>
                <span className="tooltip-action">Browse Shelves →</span>
              </span>
            </button>

            {/* HOTSPOT 3: "GET TICKETS >" Button */}
            <button
              type="button"
              className="hotspot hotspot--get-tickets-btn"
              onClick={() => {
                playClickSound();
                openTicketBooth();
              }}
              aria-label="Get and buy tickets at the cashier"
            >
              <span className="hotspot-glow-border" />
              <span className="hotspot-tooltip hotspot-tooltip--top">
                <span className="tooltip-tag">🎟️ TICKET EXCHANGE</span>
                <strong>Buy & Refill Tickets</strong>
                <span className="tooltip-action">Open Cashier →</span>
              </span>
            </button>

            {/* HOTSPOT 4: Cabinet 2 (Game 2 - Neon Surge) */}
            <button
              type="button"
              className="hotspot hotspot--game-2"
              onClick={() => handleGameClick("game-2")}
              aria-label="Play Game 2: Neon Surge cabinet"
            >
              <span className="hotspot-beacon">
                <span className="beacon-dot beacon-dot--cyan" />
                <span className="beacon-ping beacon-ping--cyan" />
              </span>
              <span className="hotspot-tooltip">
                <span className="tooltip-tag">⚡ GAME 2</span>
                <strong>Neon Surge</strong>
                <span className="tooltip-action">Click to Play →</span>
              </span>
            </button>

            {/* HOTSPOT 5: Cabinet 3 (Game 3 - Pixel Matrix) */}
            <button
              type="button"
              className="hotspot hotspot--game-3"
              onClick={() => handleGameClick("game-3")}
              aria-label="Play Game 3: Pixel Matrix cabinet"
            >
              <span className="hotspot-beacon">
                <span className="beacon-dot beacon-dot--lime" />
                <span className="beacon-ping beacon-ping--lime" />
              </span>
              <span className="hotspot-tooltip">
                <span className="tooltip-tag">🟪 GAME 3</span>
                <strong>Pixel Matrix</strong>
                <span className="tooltip-action">Click to Play →</span>
              </span>
            </button>
          </div>
        </div>

        {/* Floating Floor Controls / Helper Bar */}
        <div className="scene-status-bar">
          <div className="status-live">
            <span className="live-indicator" />
            <span>ARCADE STATUS: ALL SYSTEMS ONLINE</span>
          </div>
          <div className="status-hints">
            <span>✨ Tap any cabinet to jump into the game</span>
            <span className="bullet">·</span>
            <span>🎁 Tap the counter to open the Prize Shop</span>
          </div>
        </div>
      </div>

      {/* Accessible Interactive Floor Quick Deck */}
      <section className="arcade-floor-deck" aria-label="Arcade stations">
        <div className="deck-header">
          <p className="eyebrow">CHOOSE YOUR DESTINATION</p>
          <h2>THE ARCADE FLOOR</h2>
        </div>

        <div className="floor-quick-grid">
          {/* Game 1 Card */}
          <Link
            href="/games/game-1"
            className="deck-card deck-card--pink"
            onClick={playClickSound}
          >
            <div className="deck-card__badge">CABINET 01</div>
            <span className="deck-card__icon">👾</span>
            <h3>Space Defender</h3>
            <p>Retro vertical space invader shooter. Blast alien armadas for tickets.</p>
            <span className="deck-card__btn">Play Cabinet →</span>
          </Link>

          {/* Prize Shop Card */}
          <button
            type="button"
            className="deck-card deck-card--gold"
            onClick={() => {
              playClickSound();
              openPrizeShop();
            }}
          >
            <div className="deck-card__badge deck-card__badge--gold">PRIZE BOOTH</div>
            <span className="deck-card__icon">🎁</span>
            <h3>Prize Shop Counter</h3>
            <p>Meet Mittens at the counter and exchange tickets for plushies and trophies.</p>
            <span className="deck-card__btn">Open Prize Shop →</span>
          </button>

          {/* Game 2 Card */}
          <Link
            href="/games/game-2"
            className="deck-card deck-card--cyan"
            onClick={playClickSound}
          >
            <div className="deck-card__badge">CABINET 02</div>
            <span className="deck-card__icon">⚡</span>
            <h3>Neon Surge</h3>
            <p>High speed cyber lightning reflex test. Zap glowing overloads.</p>
            <span className="deck-card__btn">Play Cabinet →</span>
          </Link>

          {/* Game 3 Card */}
          <Link
            href="/games/game-3"
            className="deck-card deck-card--lime"
            onClick={playClickSound}
          >
            <div className="deck-card__badge">CABINET 03</div>
            <span className="deck-card__icon">🟪</span>
            <h3>Pixel Matrix</h3>
            <p>Simon-style 4-tile neon color puzzle. Climb rounds and win tickets.</p>
            <span className="deck-card__btn">Play Cabinet →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
