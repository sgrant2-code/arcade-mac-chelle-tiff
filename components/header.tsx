"use client";

import Link from "next/link";
import { useTicketWallet } from "@/components/ticket-wallet";

export function Header() {
  const { tickets } = useTicketWallet();

  return (
    <header className="site-header">
      <Link className="arcade-logo" href="/" aria-label="Neon Ticket Arcade home">
        <span>NEON</span>
        <span>TICKET ARCADE</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/">Floor</Link>
        <Link href="/prizes">Prize Shop</Link>
      </nav>
      <div className="ticket-counter" aria-label={`${tickets} tickets`}>
        <span className="ticket-icon" aria-hidden="true">★</span>
        <span>{tickets}</span>
        <span className="ticket-label">tickets</span>
      </div>
    </header>
  );
}
