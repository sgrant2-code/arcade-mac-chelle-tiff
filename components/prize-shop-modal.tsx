"use client";

import { useState } from "react";
import { prizes, type ArcadePrize } from "@/lib/prizes";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

export function PrizeShopModal() {
  const {
    isPrizeShopOpen,
    closePrizeShop,
    tickets,
    claimPrize,
    claimedPrizes,
    openTicketBooth,
  } = useTicketWallet();

  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isPrizeShopOpen) return null;

  function handleRedeem(prize: ArcadePrize) {
    playClickSound();
    if (tickets < prize.cost) {
      alert(`You need ${prize.cost - tickets} more tickets to redeem ${prize.name}!`);
      return;
    }
    const success = claimPrize(prize.id, prize.cost);
    if (success) {
      setSuccessToast(`🎉 You claimed ${prize.name}! Added to your inventory.`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  }

  // Count claimed instances
  const prizeCounts: Record<string, number> = {};
  claimedPrizes.forEach((id) => {
    prizeCounts[id] = (prizeCounts[id] || 0) + 1;
  });

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-shop-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playClickSound();
          closePrizeShop();
        }
      }}
    >
      <div className="pixel-modal prize-shop-modal">
        {/* Header Bar */}
        <div className="pixel-modal__header">
          <div className="pixel-modal__title-wrap">
            <span className="sparkle-icon">🎁</span>
            <h2 id="prize-shop-title">PRIZE SHOP COUNTER</h2>
          </div>
          <button
            type="button"
            className="pixel-modal__close-btn"
            onClick={() => {
              playClickSound();
              closePrizeShop();
            }}
            aria-label="Close Prize Shop"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Cat Clerk Marquee Banner */}
        <div className="cat-clerk-banner">
          <div className="cat-clerk-avatar" aria-hidden="true">
            🐱
            <span className="clerk-cap" />
          </div>
          <div className="cat-clerk-dialogue">
            <p className="clerk-name">MITTENS · CHIEF PRIZE ATTENDANT</p>
            <p className="clerk-speech">
              &quot;Welcome to the counter! Turn your game tickets into real arcade swag! Everything on the shelves is in stock.&quot;
            </p>
          </div>
          <div className="clerk-wallet-box">
            <span className="wallet-label">YOUR TICKETS</span>
            <div className="wallet-tickets-display">
              <span className="ticket-icon">🎟️</span>
              <span className="ticket-amount">{tickets}</span>
            </div>
            <button
              type="button"
              className="buy-more-btn"
              onClick={() => {
                playClickSound();
                closePrizeShop();
                openTicketBooth();
              }}
            >
              + Get Tickets
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="shop-tabs">
          <button
            type="button"
            className={`shop-tab ${activeTab === "shop" ? "shop-tab--active" : ""}`}
            onClick={() => {
              playClickSound();
              setActiveTab("shop");
            }}
          >
            🧸 Counter Shelves ({prizes.length})
          </button>
          <button
            type="button"
            className={`shop-tab ${activeTab === "inventory" ? "shop-tab--active" : ""}`}
            onClick={() => {
              playClickSound();
              setActiveTab("inventory");
            }}
          >
            🎒 My Prize Stash ({claimedPrizes.length})
          </button>
        </div>

        {/* Toast alert */}
        {successToast && (
          <div className="prize-success-banner" role="status">
            {successToast}
          </div>
        )}

        {/* Shelves Content */}
        {activeTab === "shop" ? (
          <div className="prize-modal-shelf">
            {prizes.map((prize) => {
              const canAfford = tickets >= prize.cost;
              const ownedCount = prizeCounts[prize.id] || 0;

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
                      onClick={() => handleRedeem(prize)}
                    >
                      {canAfford ? "REDEEM" : "NEED TICKETS"}
                    </button>
                  </div>
                  {ownedCount > 0 && (
                    <div className="owned-tag">You own {ownedCount}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Inventory Tab */
          <div className="inventory-view">
            {claimedPrizes.length === 0 ? (
              <div className="empty-inventory">
                <span className="empty-icon">📦</span>
                <h3>Your prize stash is currently empty!</h3>
                <p>Play games on the arcade floor or buy ticket packages to claim your first reward.</p>
                <button
                  type="button"
                  className="shop-tab shop-tab--active"
                  onClick={() => {
                    playClickSound();
                    setActiveTab("shop");
                  }}
                >
                  Browse Shelves
                </button>
              </div>
            ) : (
              <div className="inventory-grid">
                {Object.entries(prizeCounts).map(([prizeId, count]) => {
                  const prize = prizes.find((p) => p.id === prizeId);
                  if (!prize) return null;
                  return (
                    <div key={prizeId} className="inventory-card">
                      <span className="inventory-icon">{prize.icon}</span>
                      <div className="inventory-info">
                        <h4>{prize.name}</h4>
                        <span className="inventory-qty">x{count} Claimed</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
