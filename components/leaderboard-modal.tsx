"use client";

import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

const HIGH_SCORES = [
  { rank: 1, initials: "MIC", score: 98500, game: "Space Defender", ticketsWon: 450, medal: "🥇" },
  { rank: 2, initials: "TIF", score: 87400, game: "Pixel Matrix", ticketsWon: 390, medal: "🥈" },
  { rank: 3, initials: "NEO", score: 82100, game: "Neon Surge", ticketsWon: 350, medal: "🥉" },
  { rank: 4, initials: "CAT", score: 65200, game: "Space Defender", ticketsWon: 280, medal: "🎖️" },
  { rank: 5, initials: "ACE", score: 54900, game: "Neon Surge", ticketsWon: 210, medal: "🎖️" },
];

export function LeaderboardModal() {
  const { isLeaderboardOpen, closeLeaderboard } = useTicketWallet();

  if (!isLeaderboardOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClickSound();
          closeLeaderboard();
        }
      }}
    >
      <div className="pixel-modal leaderboard-modal">
        <div className="pixel-modal__header">
          <div className="pixel-modal__title-wrap">
            <span className="sparkle-icon">🏆</span>
            <h2 id="leaderboard-title">HALL OF FAME · HIGH SCORES</h2>
          </div>
          <button
            type="button"
            className="pixel-modal__close-btn"
            onClick={() => {
              playClickSound();
              closeLeaderboard();
            }}
            aria-label="Close Leaderboard"
          >
            ✕ CLOSE
          </button>
        </div>

        <p className="eyebrow">ALL-TIME CABINET MASTERS</p>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>PILOT</th>
                <th>GAME</th>
                <th>SCORE</th>
                <th>TICKETS</th>
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

        <div className="leaderboard-footer">
          <p>Play games at any cabinet to record your initials and claim your spot!</p>
        </div>
      </div>
    </div>
  );
}
