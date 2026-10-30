import Link from "next/link";
import { notFound } from "next/navigation";
import { GraveShiftGame } from "@/components/grave-shift-game";
import { games, getGame } from "@/lib/games";
import { PlantsVsZombiesGame } from "@/components/plants-vs-zombies";
import { ZombieNyanCatGame } from "@/components/zombie-nyan-cat";

export function generateStaticParams() {
  return [
    { slug: "plants-vs-zombies" },
    { slug: "zombie-nyan-cat" },
    { slug: "game-1" },
    { slug: "game-2" },
    { slug: "game-3" },
  ];
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  if (slug === "game-3") {
    return <GraveShiftGame />;
  }

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
                g.slug === slug ||
                (slug === "game-1" && g.slug === "plants-vs-zombies") ||
                (slug === "game-2" && g.slug === "zombie-nyan-cat")
                  ? "cabinet-selector-pill--active"
                  : ""
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
          {(slug === "plants-vs-zombies" || slug === "game-1") && <PlantsVsZombiesGame />}
          {(slug === "zombie-nyan-cat" || slug === "game-2") && <ZombieNyanCatGame />}
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
