"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

export function Header() {
  const { tickets, openPrizeShop, openTicketBooth, openLeaderboard } = useTicketWallet();
  const pathname = usePathname();

  return (
    <header className="retro-header">
      <div className="retro-header__inner">
        {/* Left Logo */}
        <Link
          className="retro-header__logo"
          href="/"
          onClick={playClickSound}
          aria-label="Neon Arcade Home"
        >
          <span className="logo-sparkle" aria-hidden="true">✦</span>
          <span className="logo-neon">NEON</span>
          <span className="logo-arcade">ARCADE</span>
        </Link>

        {/* Center / Right Nav */}
        <nav className="retro-header__nav" aria-label="Arcade navigation">
          <Link
            href="/games"
            className={`nav-btn nav-btn--games ${pathname === "/games" ? "nav-btn--active" : ""}`}
            onClick={playClickSound}
          >
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span>GAMES</span>
          </Link>

          <button
            type="button"
            className="nav-btn nav-btn--leaderboard"
            onClick={() => {
              playClickSound();
              openLeaderboard();
            }}
          >
            <span className="nav-icon" aria-hidden="true">🏆</span>
            <span>LEADERBOARD</span>
          </button>

          <button
            type="button"
            className={`nav-btn nav-btn--prizes ${pathname === "/prizes" ? "nav-btn--active" : ""}`}
            onClick={() => {
              playClickSound();
              openPrizeShop();
            }}
          >
            <span className="nav-icon" aria-hidden="true">🎁</span>
            <span>PRIZE SHOP</span>
          </button>

          {/* Ticket Counter Pill */}
          <button
            type="button"
            className="ticket-wallet-pill"
            onClick={() => {
              playClickSound();
              openTicketBooth();
            }}
            title="Click to Buy / Refill Tickets"
            aria-label={`${tickets} tickets. Click to buy more`}
          >
            <span className="ticket-pill-icon" aria-hidden="true">🎟️</span>
            <span className="ticket-pill-count">{tickets}</span>
            <span className="ticket-pill-plus" aria-hidden="true">+</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
