import type { Metadata } from "next";
import "@fontsource/press-start-2p/400.css";
import "./globals.css";
import { Header } from "@/components/header";
import { TicketWalletProvider } from "@/components/ticket-wallet";

export const metadata: Metadata = {
  title: "Neon Ticket Arcade",
  description: "A classic arcade where high scores earn prizes.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <TicketWalletProvider>
          <Header />
          <main>{children}</main>
        </TicketWalletProvider>
      </body>
    </html>
  );
}
