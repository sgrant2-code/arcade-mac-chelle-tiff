import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame } from "@/lib/games";
import { SpaceDefenderGame } from "@/components/games/space-defender-game";
import { NeonSurgeGame } from "@/components/games/neon-surge-game";
import { PixelMatrixGame } from "@/components/games/pixel-matrix-game";

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  return (
    <section className={`cabinet-subpage cabinet-subpage--${game.accent}`}>
      {/* Top Banner Navigation */}
      <div className="cabinet-nav-bar">
        <Link className="back-link" href="/">
          ← Back to Arcade Floor
        </Link>
        <div className="cabinet-selector-pills">
          {games.map((g) => (
            <Link
              key={g.slug}
              href={`/games/${g.slug}`}
              className={`cabinet-selector-pill ${
                g.slug === slug ? "cabinet-selector-pill--active" : ""
              }`}
            >
              {g.marqueeLabel}
            </Link>
          ))}
        </div>
      </div>

      {/* Arcade Cabinet Frame */}
      <div className="arcade-cabinet-frame">
        {/* Glowing Marquee Top */}
        <div className="cabinet-marquee">
          <span className="marquee-sparkle">✦</span>
          <span className="marquee-label">{game.marqueeLabel}</span>
          <h1 className="marquee-title">{game.title}</h1>
          <span className="marquee-sparkle">✦</span>
        </div>

        {/* Subtitle / Ticket rate */}
        <div className="cabinet-sub-marquee">
          <span>{game.tagline}</span>
          <span className="rate-badge">🎟️ {game.ticketRate}</span>
        </div>

        {/* Playable Game Simulator */}
        <div className="cabinet-screen-slot">
          {slug === "game-1" && <SpaceDefenderGame />}
          {slug === "game-2" && <NeonSurgeGame />}
          {slug === "game-3" && <PixelMatrixGame />}
        </div>
      </div>

      {/* Cabinet Details & Manual */}
      <div className="cabinet-manual-card">
        <h3>HOW TO PLAY · {game.title.toUpperCase()}</h3>
        <p>{game.description}</p>
        <div className="manual-tips">
          <div className="tip-item">
            <strong>🎮 Cabinet Category:</strong> {game.category}
          </div>
          <div className="tip-item">
            <strong>🎟️ Ticket Rewards:</strong> Automatic payout straight to your wallet counter!
          </div>
          <div className="tip-item">
            <strong>🏆 High Score:</strong> Saved locally across all sessions.
          </div>
        </div>
      </div>
    </section>
  );
}
