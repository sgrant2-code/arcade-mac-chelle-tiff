import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame } from "@/lib/games";
import { GraveShiftGame } from "@/components/grave-shift-game";

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  // If a teammate's actual game has been merged and is available, mount it here
  if (game.status === "available" && game.slug === "game-3") {
    return <GraveShiftGame />;
  }

  // Placeholder Game Page (for unmerged / coming soon games)
  return (
    <section className={`coming-soon coming-soon--${game.asset.accent}`}>
      <p className="eyebrow">CABINET STATUS · {game.asset.marqueeLabel}</p>

      <div className="coming-soon__frame">
        {/* Existing Game Artwork */}
        <div className="cabinet-screen" aria-hidden="true">
          <span className="marquee-indicator">READY</span>
          <span className="pixel-orb" />
          <span className="cabinet-screen-icon">{game.asset.icon}</span>
        </div>

        {/* Game Name */}
        <h1>{game.displayName}</h1>

        {/* Coming Soon Notice */}
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

      {/* Return to Arcade Button */}
      <Link className="back-link" href="/">
        ← Return to the Arcade Floor
      </Link>
    </section>
  );
}
