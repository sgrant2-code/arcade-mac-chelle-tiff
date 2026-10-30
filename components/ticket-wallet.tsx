"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type TicketWallet = {
  tickets: number;
  addTickets: (amount: number) => void;
  spendTickets: (amount: number) => boolean;
};

const TicketWalletContext = createContext<TicketWallet | null>(null);
const STORAGE_KEY = "neon-ticket-arcade-wallet";

function validAmount(amount: number) {
  return Number.isSafeInteger(amount) && amount > 0;
}

export function TicketWalletProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [tickets, setTickets] = useState(0);
  const ticketsRef = useRef(0);

  useEffect(() => {
    const savedTickets = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isSafeInteger(savedTickets) && savedTickets >= 0) {
      ticketsRef.current = savedTickets;
      setTickets(savedTickets);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(tickets));
  }, [tickets]);

  const addTickets = useCallback((amount: number) => {
    if (!validAmount(amount)) return;
    ticketsRef.current = Math.min(Number.MAX_SAFE_INTEGER, ticketsRef.current + amount);
    setTickets(ticketsRef.current);
  }, []);

  const spendTickets = useCallback((amount: number) => {
    if (!validAmount(amount) || amount > ticketsRef.current) return false;
    ticketsRef.current -= amount;
    setTickets(ticketsRef.current);
    return true;
  }, []);

  const wallet = useMemo(
    () => ({ tickets, addTickets, spendTickets }),
    [tickets, addTickets, spendTickets],
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
