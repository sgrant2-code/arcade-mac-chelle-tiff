import type { Metadata } from "next";
import "@fontsource/press-start-2p/400.css";
import "./globals.css";
import { Header } from "@/components/header";
import { TicketWalletProvider } from "@/components/ticket-wallet";
import { PrizeShopModal } from "@/components/prize-shop-modal";
import { TicketBoothModal } from "@/components/ticket-booth-modal";
import { LeaderboardModal } from "@/components/leaderboard-modal";

export const metadata: Metadata = {
  title: "Neon Arcade · Play Games, Earn Tickets, Get Prizes",
  description: "A retro cyberpunk arcade where high scores earn tickets for prizes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TicketWalletProvider>
          <Header />
          <main>{children}</main>
          <PrizeShopModal />
          <TicketBoothModal />
          <LeaderboardModal />
        </TicketWalletProvider>
      </body>
    </html>
  );
}
