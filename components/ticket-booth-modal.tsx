"use client";

import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound, playCoinSound } from "@/lib/sound";

const TICKET_PACKAGES = [
  { amount: 10, price: "$1", label: "Starter Pack", tag: "Casual" },
  { amount: 50, price: "$5", label: "Gamer Bundle", tag: "Popular" },
  { amount: 120, price: "$10", label: "Arcade Master", tag: "Best Value" },
  { amount: 250, price: "$20", label: "Neon High Roller", tag: "VIP Bonus" },
];

export function TicketBoothModal() {
  const { isTicketBoothOpen, closeTicketBooth, addTickets, tickets } = useTicketWallet();

  if (!isTicketBoothOpen) return null;

  function handleBuy(amount: number) {
    playCoinSound();
    addTickets(amount);
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-booth-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClickSound();
          closeTicketBooth();
        }
      }}
    >
      <div className="pixel-modal ticket-booth-modal">
        <div className="pixel-modal__header">
          <div className="pixel-modal__title-wrap">
            <span className="sparkle-icon">🎟️</span>
            <h2 id="ticket-booth-title">BUY TICKETS · EXCHANGE COUNTER</h2>
          </div>
          <button
            type="button"
            className="pixel-modal__close-btn"
            onClick={() => {
              playClickSound();
              closeTicketBooth();
            }}
            aria-label="Close Ticket Booth"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="booth-intro">
          <p className="eyebrow">NEON ARCADE OFFICIAL CASHIER</p>
          <p>
            Current Balance: <strong className="highlight-tickets">{tickets} Tickets</strong>. Select a ticket package to refill your arcade pouch immediately! (Demo free credits enabled).
          </p>
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
    </div>
  );
}
