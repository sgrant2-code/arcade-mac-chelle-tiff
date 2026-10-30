import Link from "next/link";
import type { ArcadeGame } from "@/lib/games";

export function GameCard({ game }: { game: ArcadeGame }) {
  return (
    <Link className={`game-card game-card--${game.accent}`} href={`/games/${game.slug}`}>
      <div className="cabinet-screen" aria-hidden="true">
        <span>READY</span>
        <span className="pixel-orb" />
      </div>
      <div className="cabinet-controls" aria-hidden="true">
        <span className="joystick" />
        <span className="button" />
        <span className="button" />
      </div>
      <div className="game-card__copy">
        <p className="game-card__title">{game.title}</p>
        <p>{game.description}</p>
      </div>
      <span className="play-prompt">View cabinet →</span>
    </Link>
  );
}
