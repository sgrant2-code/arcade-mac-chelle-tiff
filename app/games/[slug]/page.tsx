import Link from "next/link";
import { notFound } from "next/navigation";
import { GraveShiftGame } from "@/components/grave-shift-game";
import { games, getGame } from "@/lib/games";
import { PlantsVsZombiesGame } from "@/components/plants-vs-zombies";
import { ZombieNyanCatGame } from "@/components/zombie-nyan-cat";

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = getGame(slug);

  if (!game) notFound();

  if (slug === "plants-vs-zombies") {
    return (
      <section className="arcade-floor" style={{ padding: "2rem 0 4rem" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className="eyebrow" style={{ margin: "0 0 0.5rem" }}>CABINET ACTIVE · LEVEL 01</p>
            <h1 style={{ fontSize: "1.8rem" }}>{game.title}</h1>
          </div>
          <Link className="back-link" style={{ marginTop: 0 }} href="/">
            ← Back to the arcade floor
          </Link>
        </div>

        <PlantsVsZombiesGame />
      </section>
    );
  }

  if (slug === "zombie-nyan-cat") {
    return (
      <section className="arcade-floor" style={{ padding: "2rem 0 4rem" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className="eyebrow" style={{ margin: "0 0 0.5rem" }}>CABINET ACTIVE · LEVEL 02</p>
            <h1 style={{ fontSize: "1.8rem" }}>{game.title}</h1>
          </div>
          <Link className="back-link" style={{ marginTop: 0 }} href="/">
            ← Back to the arcade floor
          </Link>
        </div>

        <ZombieNyanCatGame />
      </section>
    );
  }

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
