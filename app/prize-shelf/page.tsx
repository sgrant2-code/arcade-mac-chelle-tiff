"use client";

import Link from "next/link";
import { prizes } from "@/lib/prizes";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

export default function PrizeShelfPage() {
  const { claimedPrizes, tickets } = useTicketWallet();

  const prizeCounts: Record<string, number> = {};
  claimedPrizes.forEach((id) => {
    prizeCounts[id] = (prizeCounts[id] || 0) + 1;
  });

  return (
    <section className="prize-shop-page">
      <div className="prize-shop-hero">
        <p className="eyebrow">PERSONAL COLLECTION · TROPHY DISPLAY</p>
        <h1>MY PRIZE SHELF</h1>
        <p className="shop-intro">
          All the retro swag, plushies, and arcade awards you have redeemed with your tickets!
        </p>

        {/* Navigation Switcher */}
        <div className="shop-tabs">
          <Link href="/prize-counter" className="shop-tab" onClick={playClickSound}>
            🧸 Counter Shelves ({prizes.length})
          </Link>
          <Link href="/prize-shelf" className="shop-tab shop-tab--active" onClick={playClickSound}>
            🎒 My Prize Shelf ({claimedPrizes.length})
          </Link>
        </div>
      </div>

      <div className="prize-shelf-showcase">
        {claimedPrizes.length === 0 ? (
          <div className="empty-shelf-card">
            <span className="empty-shelf-icon">📦</span>
            <h2>Your prize shelf is waiting for its first trophy!</h2>
            <p>
              You currently have <strong className="highlight-tickets">{tickets} tickets</strong> in your wallet.
              Head over to the Prize Counter to redeem plushies, or play arcade games on the floor to earn more.
            </p>
            <div className="empty-shelf-actions">
              <Link href="/prize-counter" className="shell-action-btn shell-action-btn--primary" onClick={playClickSound}>
                Browse Prize Counter →
              </Link>
              <Link href="/games" className="shell-action-btn shell-action-btn--secondary" onClick={playClickSound}>
                Play Games to Earn Tickets
              </Link>
            </div>
          </div>
        ) : (
          <div className="claimed-shelf-grid">
            {Object.entries(prizeCounts).map(([prizeId, count]) => {
              const prize = prizes.find((p) => p.id === prizeId);
              if (!prize) return null;

              return (
                <div key={prizeId} className={`shelf-trophy-card shelf-trophy-card--${prize.accent}`}>
                  <span className="trophy-qty-badge">x{count} OWNED</span>
                  <div className="trophy-icon">{prize.icon}</div>
                  <h3 className="trophy-name">{prize.name}</h3>
                  <span className="trophy-category">{prize.category}</span>
                  <p className="trophy-desc">{prize.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shop-page-footer">
        <Link className="back-link" href="/">
          ← Back to the Arcade Floor
        </Link>
      </div>
    </section>
  );
}
