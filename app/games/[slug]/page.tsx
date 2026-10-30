import Link from "next/link";
import { notFound } from "next/navigation";
import { GraveShiftGame } from "@/components/grave-shift-game";
import { games, getGame } from "@/lib/games";

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  if (game.slug === "game-3") {
    return <GraveShiftGame />;
  }

  return (
    <section className={`coming-soon coming-soon--${game.accent}`}>
      <p className="eyebrow">CABINET STATUS · {game.title}</p>
      <div className="coming-soon__frame">
        <span className="pixel-orb" aria-hidden="true" />
        <h1>Coming soon</h1>
        <p>This cabinet is still being wired up. Check back after the next service round.</p>
      </div>
      <Link className="back-link" href="/">← Back to the arcade floor</Link>
    </section>
  );
}
