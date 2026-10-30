"use client";

import Link from "next/link";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound, playCoinSound } from "@/lib/sound";

const TICKET_PACKAGES = [
  { amount: 10, price: "$1", label: "Starter Pack", tag: "Casual" },
  { amount: 50, price: "$5", label: "Gamer Bundle", tag: "Popular" },
  { amount: 120, price: "$10", label: "Arcade Master", tag: "Best Value" },
  { amount: 250, price: "$20", label: "Neon High Roller", tag: "VIP Bonus" },
];

export default function WalletPage() {
  const { tickets, addTickets, claimedPrizes } = useTicketWallet();

  const handleBuy = (amount: number) => {
    playCoinSound();
    addTickets(amount);
  };

  return (
    <section className="wallet-page">
      <div className="directory-hero">
        <p className="eyebrow">NEON TICKET EXCHANGE · ARCADE POUCH</p>
        <h1>TICKET WALLET</h1>
        <p className="hero-description">
          Your centralized ticket pouch. Use your tickets to enter tournament cabinets and redeem
          swag at the prize counter!
        </p>
      </div>

      {/* Main Wallet Hero Card */}
      <div className="wallet-hero-card">
        <div className="wallet-balance-display">
          <span className="wallet-icon-large">🎟️</span>
          <div className="balance-info">
            <span className="balance-label">CURRENT BALANCE</span>
            <span className="balance-number">{tickets} TICKETS</span>
          </div>
        </div>

        <div className="wallet-quick-stats">
          <div className="wallet-stat-item">
            <span className="stat-label">PRIZES REDEEMED</span>
            <span className="stat-val">{claimedPrizes.length}</span>
          </div>
          <div className="wallet-stat-item">
            <span className="stat-label">ACCOUNT STATUS</span>
            <span className="stat-val stat-val--lime">ACTIVE VIP</span>
          </div>
        </div>

        <div className="wallet-shortcuts">
          <Link href="/prize-counter" className="shell-action-btn shell-action-btn--primary" onClick={playClickSound}>
            🎁 Go to Prize Counter
          </Link>
          <Link href="/games" className="shell-action-btn shell-action-btn--secondary" onClick={playClickSound}>
            🕹️ Play Games on Floor
          </Link>
        </div>
      </div>

      {/* Ticket Purchase / Refill Packages */}
      <div className="wallet-packages-section">
        <div className="packages-header">
          <p className="eyebrow">REFILL STATION · DEMO COINS ENABLED</p>
          <h2>TICKET PACKAGES</h2>
        </div>

        <div className="packages-grid">
          {TICKET_PACKAGES.map((pkg) => (
            <div key={pkg.amount} className="package-card">
              <span className="package-tag">{pkg.tag}</span>
              <div className="package-ticket-icon">🎟️</div>
              <h3 className="package-amount">{pkg.amount} TICKETS</h3>
              <p className="package-label">{pkg.label}</p>
              <div className="package-price">{pkg.price}</div>
              <button
                type="button"
                className="buy-package-btn"
                onClick={() => handleBuy(pkg.amount)}
              >
                + ADD {pkg.amount} TICKETS
              </button>
            </div>
          ))}
        </div>

        {/* Daily Stipend Box */}
        <div className="daily-reward-box">
          <div className="daily-reward-copy">
            <h4>DAILY ARCADE STIPEND</h4>
            <p>Every floor guest receives 25 complimentary tickets every visit!</p>
          </div>
          <button
            type="button"
            className="claim-daily-btn"
            onClick={() => handleBuy(25)}
          >
            CLAIM +25 FREE TICKETS
          </button>
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
