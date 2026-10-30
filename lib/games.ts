export type ArcadeGame = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  accent: "pink" | "cyan" | "lime";
  marqueeLabel: string;
  icon: string;
  category: string;
  ticketRate: string;
};

export const games: ArcadeGame[] = [
  {
    slug: "game-1",
    title: "Space Defender",
    tagline: "Blast the pixel alien armada before they reach Earth!",
    description: "Classic retro arcade shoot 'em up. Defend the cosmos, rack up multiplier combos, and claim your tickets.",
    accent: "pink",
    marqueeLabel: "GAME 1",
    icon: "👾",
    category: "Space Shooter",
    ticketRate: "10 tickets per 100 pts",
  },
  {
    slug: "game-2",
    title: "Neon Surge",
    tagline: "Test your lightning-fast reflexes against cyber overloads!",
    description: "High-octane reflex test. Tap the surging neon nodes before the capacitor blows up to earn ticket bonuses.",
    accent: "cyan",
    marqueeLabel: "GAME 2",
    icon: "⚡",
    category: "Reflex Action",
    ticketRate: "5 tickets per wave",
  },
  {
    slug: "game-3",
    title: "Pixel Matrix",
    tagline: "Memorize and repeat the glowing 4-tile neon sequence!",
    description: "Electrifying memory puzzle. Follow the flashing color patterns and climb the leaderboard rounds for big prizes.",
    accent: "lime",
    marqueeLabel: "GAME 3",
    icon: "🟪",
    category: "Memory Puzzle",
    ticketRate: "15 tickets per round",
  },
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
