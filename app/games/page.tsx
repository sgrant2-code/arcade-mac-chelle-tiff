import Link from "next/link";
import { games } from "@/lib/games";

export default function GamesDirectoryPage() {
  return (
    <section className="games-directory">
      <div className="directory-hero">
        <p className="eyebrow">NEON ARCADE ROSTER · CENTRAL REGISTRY</p>
        <h1>ALL ARCADE CABINETS</h1>
        <p className="hero-description">
          Step right up to any cabinet on the floor. Every registered game connects to the
          shared ticket wallet and records high scores!
        </p>
      </div>

      <div className="cabinets-showcase-grid">
        {games.map((game) => (
          <div key={game.id} className={`cabinet-box cabinet-box--${game.asset.accent}`}>
            <div className="cabinet-box__marquee">
              <span className="box-marquee-label">{game.asset.marqueeLabel}</span>
              <span className="box-icon">{game.asset.icon}</span>
            </div>

            <div className="cabinet-box__body">
              <div className="cabinet-meta-line">
                <span className="cabinet-category">{game.category}</span>
                <span className={`status-pill status-pill--${game.status}`}>
                  {game.status === "available" ? "ONLINE" : game.status === "coming_soon" ? "COMING SOON" : "MAINTENANCE"}
                </span>
              </div>

              <h2>{game.displayName}</h2>
              <p>{game.description}</p>

              <div className="cabinet-economics">
                <div className="economic-item">
                  <span className="economic-label">Entry Fee:</span>
                  <span className="economic-val">{game.entryFee === 0 ? "FREE PLAY" : `🎟️ ${game.entryFee}`}</span>
                </div>
                <div className="economic-item">
                  <span className="economic-label">Reward:</span>
                  <span className="economic-val economic-val--reward">{game.reward.description}</span>
                </div>
              </div>
            </div>

            <div className="cabinet-box__action">
              <Link href={game.route} className="play-cabinet-btn">
                {game.status === "available" ? "PLAY CABINET NOW →" : "VIEW CABINET →"}
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
