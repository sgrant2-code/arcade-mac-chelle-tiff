"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTicketWallet } from "@/components/ticket-wallet";
import { playClickSound } from "@/lib/sound";

export function Header() {
  const { tickets } = useTicketWallet();
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
            className={`nav-btn nav-btn--games ${pathname.startsWith("/games") ? "nav-btn--active" : ""}`}
            onClick={playClickSound}
          >
            <span className="nav-icon" aria-hidden="true">🏠</span>
            <span>GAMES</span>
          </Link>

          <Link
            href="/leaderboard"
            className={`nav-btn nav-btn--leaderboard ${pathname === "/leaderboard" ? "nav-btn--active" : ""}`}
            onClick={playClickSound}
          >
            <span className="nav-icon" aria-hidden="true">🏆</span>
            <span>LEADERBOARD</span>
          </Link>

          <Link
            href="/prize-counter"
            className={`nav-btn nav-btn--prizes ${pathname === "/prize-counter" || pathname === "/prize-shelf" ? "nav-btn--active" : ""}`}
            onClick={playClickSound}
          >
            <span className="nav-icon" aria-hidden="true">🎁</span>
            <span>PRIZE SHOP</span>
          </Link>

          {/* Ticket Counter Pill linked to Wallet */}
          <Link
            href="/wallet"
            className="ticket-wallet-pill"
            onClick={playClickSound}
            title="View Ticket Wallet & Refill"
            aria-label={`${tickets} tickets in wallet`}
          >
            <span className="ticket-pill-icon" aria-hidden="true">🎟️</span>
            <span className="ticket-pill-count">{tickets}</span>
            <span className="ticket-pill-plus" aria-hidden="true">+</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
