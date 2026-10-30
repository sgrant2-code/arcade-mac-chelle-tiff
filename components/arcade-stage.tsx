"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { games, getGame } from "@/lib/games";
import { playClickSound } from "@/lib/sound";

export function ArcadeStage() {
  const router = useRouter();

  const handleGameClick = (slug: string) => {
    playClickSound();
    router.push(`/games/${slug}`);
  };

  const game1 = getGame("game-1") ?? games[0];
  const game2 = getGame("game-2") ?? games[1];
  const game3 = getGame("game-3") ?? games[2];

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
            {/* HOTSPOT 1: Cabinet 1 */}
            {game1 && (
              <button
                type="button"
                className={`hotspot hotspot--game-1`}
                onClick={() => handleGameClick(game1.slug)}
                aria-label={`Cabinet 1: ${game1.displayName}`}
              >
                <span className="hotspot-beacon">
                  <span className={`beacon-dot beacon-dot--${game1.asset.accent}`} />
                  <span className={`beacon-ping beacon-ping--${game1.asset.accent}`} />
                </span>
                <span className="hotspot-tooltip">
                  <span className="tooltip-tag">{game1.asset.icon} {game1.asset.marqueeLabel}</span>
                  <strong>{game1.displayName}</strong>
                  <span className="tooltip-action">
                    {game1.status === "coming_soon" ? "Coming Soon →" : "Click to Play →"}
                  </span>
                </span>
              </button>
            )}

            {/* HOTSPOT 2: Central Prize Counter & Shelves */}
            <Link
              href="/prize-counter"
              className="hotspot hotspot--prize-booth"
              onClick={playClickSound}
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
            </Link>

            {/* HOTSPOT 3: "GET TICKETS >" Button */}
            <Link
              href="/wallet"
              className="hotspot hotspot--get-tickets-btn"
              onClick={playClickSound}
              aria-label="Get and buy tickets at the cashier wallet"
            >
              <span className="hotspot-glow-border" />
              <span className="hotspot-tooltip hotspot-tooltip--top">
                <span className="tooltip-tag">🎟️ TICKET EXCHANGE</span>
                <strong>Ticket Wallet</strong>
                <span className="tooltip-action">View & Refill →</span>
              </span>
            </Link>

            {/* HOTSPOT 4: Cabinet 2 */}
            {game2 && (
              <button
                type="button"
                className={`hotspot hotspot--game-2`}
                onClick={() => handleGameClick(game2.slug)}
                aria-label={`Cabinet 2: ${game2.displayName}`}
              >
                <span className="hotspot-beacon">
                  <span className={`beacon-dot beacon-dot--${game2.asset.accent}`} />
                  <span className={`beacon-ping beacon-ping--${game2.asset.accent}`} />
                </span>
                <span className="hotspot-tooltip">
                  <span className="tooltip-tag">{game2.asset.icon} {game2.asset.marqueeLabel}</span>
                  <strong>{game2.displayName}</strong>
                  <span className="tooltip-action">
                    {game2.status === "coming_soon" ? "Coming Soon →" : "Click to Play →"}
                  </span>
                </span>
              </button>
            )}

            {/* HOTSPOT 5: Cabinet 3 */}
            {game3 && (
              <button
                type="button"
                className={`hotspot hotspot--game-3`}
                onClick={() => handleGameClick(game3.slug)}
                aria-label={`Cabinet 3: ${game3.displayName}`}
              >
                <span className="hotspot-beacon">
                  <span className={`beacon-dot beacon-dot--${game3.asset.accent}`} />
                  <span className={`beacon-ping beacon-ping--${game3.asset.accent}`} />
                </span>
                <span className="hotspot-tooltip">
                  <span className="tooltip-tag">{game3.asset.icon} {game3.asset.marqueeLabel}</span>
                  <strong>{game3.displayName}</strong>
                  <span className="tooltip-action">
                    {game3.status === "coming_soon" ? "Coming Soon →" : "Click to Play →"}
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Floating Floor Controls / Helper Bar */}
        <div className="scene-status-bar">
          <div className="status-live">
            <span className="live-indicator" />
            <span>ARCADE STATUS: ALL SYSTEMS ONLINE</span>
          </div>
          <div className="status-hints">
            <span>✨ Tap any cabinet to view route</span>
            <span className="bullet">·</span>
            <span>🎁 Tap the counter for the Prize Shop</span>
          </div>
        </div>
      </div>

      {/* Shared Floor Deck Reading Directly from Registry */}
      <section className="arcade-floor-deck" aria-label="Arcade stations">
        <div className="deck-header">
          <p className="eyebrow">CHOOSE YOUR DESTINATION</p>
          <h2>THE ARCADE FLOOR</h2>
        </div>

        <div className="floor-quick-grid">
          {/* Dynamically mapped from shared games registry */}
          {games.map((g) => (
            <Link
              key={g.id}
              href={g.route}
              className={`deck-card deck-card--${g.asset.accent}`}
              onClick={playClickSound}
            >
              <div className="deck-card__badge">
                {g.asset.marqueeLabel} · {g.status === "available" ? "ONLINE" : "COMING SOON"}
              </div>
              <span className="deck-card__icon">{g.asset.icon}</span>
              <h3>{g.displayName}</h3>
              <p>{g.description}</p>
              <span className="deck-card__btn">
                {g.status === "available" ? "Enter Cabinet →" : "View Cabinet →"}
              </span>
            </Link>
          ))}

          {/* Prize Shop Card */}
          <Link
            href="/prize-counter"
            className="deck-card deck-card--gold"
            onClick={playClickSound}
          >
            <div className="deck-card__badge deck-card__badge--gold">PRIZE BOOTH</div>
            <span className="deck-card__icon">🎁</span>
            <h3>Prize Counter</h3>
            <p>Meet Mittens at the counter and exchange tickets for plushies and trophies.</p>
            <span className="deck-card__btn">Open Prize Shop →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
