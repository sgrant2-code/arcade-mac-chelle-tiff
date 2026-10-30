"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { playCoinSound, playPrizeSound } from "@/lib/sound";

type TicketWallet = {
  tickets: number;
  addTickets: (amount: number) => void;
  spendTickets: (amount: number) => boolean;
  claimedPrizes: string[];
  claimPrize: (prizeId: string, cost: number) => boolean;
  // Modal states
  isPrizeShopOpen: boolean;
  openPrizeShop: () => void;
  closePrizeShop: () => void;
  isTicketBoothOpen: boolean;
  openTicketBooth: () => void;
  closeTicketBooth: () => void;
  isLeaderboardOpen: boolean;
  openLeaderboard: () => void;
  closeLeaderboard: () => void;
};

const TicketWalletContext = createContext<TicketWallet | null>(null);
const STORAGE_KEY = "neon-ticket-arcade-wallet";
const PRIZES_STORAGE_KEY = "neon-ticket-arcade-prizes";
const DEFAULT_STARTING_TICKETS = 120; // Matches screenshot ticket counter: 120

function validAmount(amount: number) {
  return Number.isSafeInteger(amount) && amount > 0;
}

export function TicketWalletProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [tickets, setTickets] = useState(DEFAULT_STARTING_TICKETS);
  const [claimedPrizes, setClaimedPrizes] = useState<string[]>([]);
  const ticketsRef = useRef(DEFAULT_STARTING_TICKETS);

  // Modals
  const [isPrizeShopOpen, setIsPrizeShopOpen] = useState(false);
  const [isTicketBoothOpen, setIsTicketBoothOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  useEffect(() => {
    const savedTickets = window.localStorage.getItem(STORAGE_KEY);
    if (savedTickets !== null) {
      const parsed = Number(savedTickets);
      if (Number.isSafeInteger(parsed) && parsed >= 0) {
        ticketsRef.current = parsed;
        setTickets(parsed);
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, String(DEFAULT_STARTING_TICKETS));
    }

    const savedPrizes = window.localStorage.getItem(PRIZES_STORAGE_KEY);
    if (savedPrizes) {
      try {
        const parsed = JSON.parse(savedPrizes);
        if (Array.isArray(parsed)) {
          setClaimedPrizes(parsed);
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(tickets));
  }, [tickets]);

  useEffect(() => {
    window.localStorage.setItem(PRIZES_STORAGE_KEY, JSON.stringify(claimedPrizes));
  }, [claimedPrizes]);

  const addTickets = useCallback((amount: number) => {
    if (!validAmount(amount)) return;
    ticketsRef.current = Math.min(Number.MAX_SAFE_INTEGER, ticketsRef.current + amount);
    setTickets(ticketsRef.current);
    playCoinSound();
  }, []);

  const spendTickets = useCallback((amount: number) => {
    if (!validAmount(amount) || amount > ticketsRef.current) return false;
    ticketsRef.current -= amount;
    setTickets(ticketsRef.current);
    return true;
  }, []);

  const claimPrize = useCallback((prizeId: string, cost: number) => {
    if (cost > ticketsRef.current) return false;
    ticketsRef.current -= cost;
    setTickets(ticketsRef.current);
    setClaimedPrizes((prev) => [...prev, prizeId]);
    playPrizeSound();
    return true;
  }, []);

  const openPrizeShop = useCallback(() => setIsPrizeShopOpen(true), []);
  const closePrizeShop = useCallback(() => setIsPrizeShopOpen(false), []);
  const openTicketBooth = useCallback(() => setIsTicketBoothOpen(true), []);
  const closeTicketBooth = useCallback(() => setIsTicketBoothOpen(false), []);
  const openLeaderboard = useCallback(() => setIsLeaderboardOpen(true), []);
  const closeLeaderboard = useCallback(() => setIsLeaderboardOpen(false), []);

  const wallet = useMemo(
    () => ({
      tickets,
      addTickets,
      spendTickets,
      claimedPrizes,
      claimPrize,
      isPrizeShopOpen,
      openPrizeShop,
      closePrizeShop,
      isTicketBoothOpen,
      openTicketBooth,
      closeTicketBooth,
      isLeaderboardOpen,
      openLeaderboard,
      closeLeaderboard,
    }),
    [
      tickets,
      addTickets,
      spendTickets,
      claimedPrizes,
      claimPrize,
      isPrizeShopOpen,
      openPrizeShop,
      closePrizeShop,
      isTicketBoothOpen,
      openTicketBooth,
      closeTicketBooth,
      isLeaderboardOpen,
      openLeaderboard,
      closeLeaderboard,
    ],
  );

  return <TicketWalletContext.Provider value={wallet}>{children}</TicketWalletContext.Provider>;
}

export function useTicketWallet() {
  const wallet = useContext(TicketWalletContext);

  if (!wallet) {
    throw new Error("useTicketWallet must be used inside TicketWalletProvider");
  }

  return wallet;
}
