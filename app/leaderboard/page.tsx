import Link from "next/link";
import { games } from "@/lib/games";

const HIGH_SCORES = [
  { rank: 1, initials: "MIC", score: 98500, game: "Game 1", ticketsWon: 450, medal: "🥇" },
  { rank: 2, initials: "TIF", score: 87400, game: "Game 3 (Grave Shift)", ticketsWon: 390, medal: "🥈" },
  { rank: 3, initials: "NEO", score: 82100, game: "Game 2", ticketsWon: 350, medal: "🥉" },
  { rank: 4, initials: "CAT", score: 65200, game: "Game 1", ticketsWon: 280, medal: "🎖️" },
  { rank: 5, initials: "ACE", score: 54900, game: "Game 2", ticketsWon: 210, medal: "🎖️" },
  { rank: 6, initials: "ZOM", score: 48200, game: "Game 3 (Grave Shift)", ticketsWon: 190, medal: "🎖️" },
];

export default function LeaderboardPage() {
  return (
    <section className="leaderboard-page">
      <div className="directory-hero">
        <p className="eyebrow">HALL OF FAME · ALL-TIME TOP SCORES</p>
        <h1>ARCADE LEADERBOARD</h1>
        <p className="hero-description">
          The highest score chasers in the neon realm. Top pilots earn bragging rights and VIP ticket rewards!
        </p>
      </div>

      <div className="leaderboard-table-container">
        <div className="leaderboard-table-header">
          <span className="trophy-lead-icon">🏆</span>
          <h2>GLOBAL HIGH SCORES</h2>
        </div>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>PILOT</th>
                <th>CABINET</th>
                <th>HIGH SCORE</th>
                <th>TICKETS EARNED</th>
              </tr>
            </thead>
            <tbody>
              {HIGH_SCORES.map((entry) => (
                <tr key={`${entry.rank}-${entry.initials}`}>
                  <td className="rank-cell">
                    <span className="medal-emoji">{entry.medal}</span> #{entry.rank}
                  </td>
                  <td className="pilot-cell">{entry.initials}</td>
                  <td className="game-cell">{entry.game}</td>
                  <td className="score-cell">{entry.score.toLocaleString()}</td>
                  <td className="tickets-cell">🎟️ {entry.ticketsWon}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="leaderboard-cta-card">
          <h3>CHALLENGE THE LEADERBOARD</h3>
          <p>Play any available cabinet to submit your high score and climb the ranks!</p>
          <div className="leaderboard-games-row">
            {games.map((g) => (
              <Link key={g.id} href={g.route} className="mini-cabinet-link">
                {g.asset.icon} {g.displayName} →
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="directory-footer">
        <Link href="/" className="back-link">
          ← Return to Arcade Floor View
        </Link>
      </div>
    </section>
  );
}
