"use client";

import Link from "next/link";
import { prizes } from "@/lib/prizes";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

export default function PrizeCounterPage() {
  const { tickets, claimPrize, claimedPrizes } = useTicketWallet();

  const handleRedeem = (id: string, cost: number, name: string) => {
    playClickSound();
    if (tickets < cost) {
      alert(`You need ${cost - tickets} more tickets to redeem ${name}!`);
      return;
    }
    claimPrize(id, cost);
  };

  const prizeCounts: Record<string, number> = {};
  claimedPrizes.forEach((id) => {
    prizeCounts[id] = (prizeCounts[id] || 0) + 1;
  });

  return (
    <section className="prize-shop-page">
      <div className="prize-shop-hero">
        <p className="eyebrow">TICKET EXCHANGE · COUNTER OPEN</p>
        <h1>PRIZE COUNTER</h1>
        <p className="shop-intro">
          Trade your game tickets for plushies, glowing retro trophies, and arcade collectibles!
        </p>

        {/* Counter Attendant Banner */}
        <div className="cat-clerk-banner">
          <div className="cat-clerk-avatar" aria-hidden="true">
            🐱
            <span className="clerk-cap" />
          </div>
          <div className="cat-clerk-dialogue">
            <p className="clerk-name">MITTENS · PRIZE MASTER</p>
            <p className="clerk-speech">
              &quot;Welcome to the counter! Turn your tickets into real arcade swag. Check your personal collection over on the Prize Shelf!&quot;
            </p>
          </div>
          <div className="clerk-wallet-box">
            <span className="wallet-label">YOUR TICKETS</span>
            <div className="wallet-tickets-display">
              <span className="ticket-icon">🎟️</span>
              <span className="ticket-amount">{tickets}</span>
            </div>
            <Link href="/wallet" className="buy-more-btn" onClick={playClickSound}>
              + Refill in Wallet
            </Link>
          </div>
        </div>

        {/* Navigation Switcher between Counter and Shelf */}
        <div className="shop-tabs">
          <Link href="/prize-counter" className="shop-tab shop-tab--active" onClick={playClickSound}>
            🧸 Counter Shelves ({prizes.length})
          </Link>
          <Link href="/prize-shelf" className="shop-tab" onClick={playClickSound}>
            🎒 My Prize Shelf ({claimedPrizes.length})
          </Link>
        </div>
      </div>

      {/* Prize Shelf Grid */}
      <div className="prize-modal-shelf">
        {prizes.map((prize) => {
          const canAfford = tickets >= prize.cost;
          const owned = prizeCounts[prize.id] || 0;

          return (
            <div
              key={prize.id}
              className={`prize-card prize-card--${prize.accent} ${
                canAfford ? "prize-card--affordable" : "prize-card--locked"
              }`}
            >
              {prize.badge && <span className="prize-card__badge">{prize.badge}</span>}
              <div className="prize-card__icon" aria-hidden="true">
                <span>{prize.icon}</span>
              </div>
              <div className="prize-card__details">
                <span className="prize-card__category">{prize.category}</span>
                <h3 className="prize-card__name">{prize.name}</h3>
                <p className="prize-card__desc">{prize.description}</p>
              </div>
              <div className="prize-card__footer">
                <div className="prize-cost">
                  <span className="ticket-symbol">🎟️</span>
                  <span className="cost-number">{prize.cost}</span>
                  <span className="cost-text">tickets</span>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  className="redeem-btn"
                  onClick={() => handleRedeem(prize.id, prize.cost, prize.name)}
                >
                  {canAfford ? "REDEEM" : "NEED TICKETS"}
                </button>
              </div>
              {owned > 0 && <div className="owned-tag">You own {owned}</div>}
            </div>
          );
        })}
      </div>

      <div className="shop-page-footer">
        <Link className="back-link" href="/">
          ← Back to the Arcade Floor
        </Link>
      </div>
    </section>
  );
}
