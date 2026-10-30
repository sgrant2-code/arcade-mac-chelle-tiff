import Link from "next/link";
import { games } from "@/lib/games";

export default function GamesDirectoryPage() {
  return (
    <section className="games-directory">
      <div className="directory-hero">
        <p className="eyebrow">NEON ARCADE ROSTER · LEVEL 01</p>
        <h1>ALL ARCADE CABINETS</h1>
        <p className="hero-description">
          Step right up to any cabinet on the floor. Every run you play awards arcade tickets
          that you can exchange at the prize counter!
        </p>
      </div>

      <div className="cabinets-showcase-grid">
        {games.map((game) => (
          <div key={game.slug} className={`cabinet-box cabinet-box--${game.accent}`}>
            <div className="cabinet-box__marquee">
              <span className="box-marquee-label">{game.marqueeLabel}</span>
              <span className="box-icon">{game.icon}</span>
            </div>

            <div className="cabinet-box__body">
              <span className="cabinet-category">{game.category}</span>
              <h2>{game.title}</h2>
              <p>{game.description}</p>
              <div className="ticket-rate-tag">
                <span>🎟️ Payout:</span>
                <strong>{game.ticketRate}</strong>
              </div>
            </div>

            <div className="cabinet-box__action">
              <Link href={`/games/${game.slug}`} className="play-cabinet-btn">
                PLAY CABINET NOW →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="directory-footer">
        <Link href="/" className="back-link">
          ← Return to Arcade Floor View
        </Link>
      </div>
    </section>
  );
}
