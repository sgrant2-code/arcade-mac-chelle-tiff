import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame } from "@/lib/games";
import { GraveShiftGame } from "@/components/grave-shift-game";
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

  // Route 3: Grave Shift
  if (slug === "game-3") {
    return <GraveShiftGame />;
  }

  // Active / Merged Teammate Games
  if (slug === "plants-vs-zombies" || slug === "game-1") {
    return (
      <section className={`cabinet-subpage cabinet-subpage--${game.asset.accent}`}>
        <div className="cabinet-nav-bar">
          <Link className="back-link" href="/">
            ← Back to Arcade Floor
          </Link>
          <div className="cabinet-selector-pills">
            {games.map((g) => (
              <Link
                key={g.slug}
                href={g.route}
                className={`cabinet-selector-pill ${
                  g.slug === game.slug ? "cabinet-selector-pill--active" : ""
                }`}
              >
                {g.asset.marqueeLabel}
              </Link>
            ))}
          </div>
        </div>

        <div className="arcade-cabinet-frame">
          <div className="cabinet-marquee">
            <span className="marquee-sparkle">✦</span>
            <span className="marquee-label">{game.asset.marqueeLabel}</span>
            <h1 className="marquee-title">{game.displayName}</h1>
            <span className="marquee-sparkle">✦</span>
          </div>

          <div className="cabinet-sub-marquee">
            <span>{game.tagline}</span>
            <span className="rate-badge">🎟️ {game.ticketRate}</span>
          </div>

          <div className="cabinet-screen-slot">
            <PlantsVsZombiesGame />
          </div>
        </div>

        <div className="cabinet-manual-card">
          <h3>HOW TO PLAY · {game.displayName.toUpperCase()}</h3>
          <p>{game.description}</p>
          <div className="manual-tips">
            <div className="tip-item">
              <strong>🎮 Category:</strong> {game.category}
            </div>
            <div className="tip-item">
              <strong>🎟️ Rewards:</strong> {game.reward.description}
            </div>
            <div className="tip-item">
              <strong>🏆 High Score:</strong> Saved across all sessions.
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "zombie-nyan-cat" || slug === "game-2") {
    return (
      <section className={`cabinet-subpage cabinet-subpage--${game.asset.accent}`}>
        <div className="cabinet-nav-bar">
          <Link className="back-link" href="/">
            ← Back to Arcade Floor
          </Link>
          <div className="cabinet-selector-pills">
            {games.map((g) => (
              <Link
                key={g.slug}
                href={g.route}
                className={`cabinet-selector-pill ${
                  g.slug === game.slug ? "cabinet-selector-pill--active" : ""
                }`}
              >
                {g.asset.marqueeLabel}
              </Link>
            ))}
          </div>
        </div>

        <div className="arcade-cabinet-frame">
          <div className="cabinet-marquee">
            <span className="marquee-sparkle">✦</span>
            <span className="marquee-label">{game.asset.marqueeLabel}</span>
            <h1 className="marquee-title">{game.displayName}</h1>
            <span className="marquee-sparkle">✦</span>
          </div>

          <div className="cabinet-sub-marquee">
            <span>{game.tagline}</span>
            <span className="rate-badge">🎟️ {game.ticketRate}</span>
          </div>

          <div className="cabinet-screen-slot">
            <ZombieNyanCatGame />
          </div>
        </div>

        <div className="cabinet-manual-card">
          <h3>HOW TO PLAY · {game.displayName.toUpperCase()}</h3>
          <p>{game.description}</p>
          <div className="manual-tips">
            <div className="tip-item">
              <strong>🎮 Category:</strong> {game.category}
            </div>
            <div className="tip-item">
              <strong>🎟️ Rewards:</strong> {game.reward.description}
            </div>
            <div className="tip-item">
              <strong>🏆 High Score:</strong> Saved across all sessions.
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Placeholder Game Page (for unmerged / coming soon games)
  return (
    <section className={`coming-soon coming-soon--${game.asset.accent}`}>
      <p className="eyebrow">CABINET STATUS · {game.asset.marqueeLabel}</p>

      <div className="coming-soon__frame">
        <div className="cabinet-screen" aria-hidden="true">
          <span className="marquee-indicator">READY</span>
          <span className="pixel-orb" />
          <span className="cabinet-screen-icon">{game.asset.icon}</span>
        </div>

        <h1>{game.displayName}</h1>
        <div className="coming-soon-badge">COMING SOON</div>
        <p className="coming-soon-desc">
          {game.description} This cabinet is currently being wired up by the development team.
        </p>

        <div className="cabinet-specs-preview">
          <span className="spec-item"><strong>Category:</strong> {game.category}</span>
          <span className="spec-item"><strong>Entry Fee:</strong> {game.entryFee === 0 ? "Free Play" : `${game.entryFee} Tickets`}</span>
          <span className="spec-item"><strong>Target Reward:</strong> {game.reward.description}</span>
        </div>
      </div>

      <Link className="back-link" href="/">
        ← Return to the Arcade Floor
      </Link>
    </section>
  );
}
