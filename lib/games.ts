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
    title: "Grave Shift",
    tagline: "Run the cursed forest before the moon goes out!",
    description: "Run the cursed forest before the moon goes out. Dash, jump, and collect lanterns to vanquish specters and earn tickets.",
    accent: "lime",
    marqueeLabel: "GAME 3",
    icon: "🪦",
    category: "Action Platformer",
    ticketRate: "25 tickets on clear",
  },
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
