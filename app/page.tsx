import { GameCard } from "@/components/game-card";
import { games } from "@/lib/games";

export default function HomePage() {
  return (
    <section className="arcade-floor">
      <div className="hero-copy">
        <p className="eyebrow">LEVEL 01 · THE ARCADE FLOOR</p>
        <h1>Pick a cabinet.<br />Chase a high score.</h1>
        <p className="hero-description">
          Every game earns tickets. Save them up, then trade them for prizes at the counter.
        </p>
      </div>

      <div className="floor-lights" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>

      <div className="game-grid" aria-label="Game cabinets">
        {games.map((game) => <GameCard game={game} key={game.slug} />)}
      </div>
    </section>
  );
}
