export type GameStatus = "coming_soon" | "available" | "disabled";

export type ArcadeGameAsset = {
  thumbnail?: string;
  cabinetArt?: string;
  icon: string;
  accent: "pink" | "cyan" | "lime" | "gold" | "purple";
  marqueeLabel: string;
};

export type ArcadeGameReward = {
  min: number;
  max: number;
  description: string;
};

export type ArcadeGame = {
  id: string;
  slug: string;
  displayName: string;
  title: string; // Alias for displayName for backward compatibility
  tagline: string;
  description: string;
  asset: ArcadeGameAsset;
  accent: "pink" | "cyan" | "lime"; // Alias for asset.accent
  marqueeLabel: string; // Alias for asset.marqueeLabel
  icon: string; // Alias for asset.icon
  category: string;
  route: string;
  status: GameStatus;
  entryFee: number;
  reward: ArcadeGameReward;
  ticketRate: string; // Formatted display string for reward rate
};

/**
 * Central game registry for NEON ARCADE.
 * All platform components (homepage, game directory, router, etc.) read from here.
 * Mini-game titles, status, fees, and assets can be adjusted here without touching platform logic.
 */
export const games: ArcadeGame[] = [
  {
    id: "game-1",
    slug: "game-1",
    displayName: "Game 1",
    title: "Game 1",
    tagline: "An arcade cabinet is warming up.",
    description: "Cabinet 01 is currently in development. Check back after the next service round for high-score space action.",
    asset: {
      icon: "👾",
      accent: "pink",
      marqueeLabel: "GAME 1",
    },
    accent: "pink",
    marqueeLabel: "GAME 1",
    icon: "👾",
    category: "Space Shooter",
    route: "/games/game-1",
    status: "coming_soon",
    entryFee: 0,
    reward: {
      min: 10,
      max: 50,
      description: "10-50 tickets per run",
    },
    ticketRate: "10-50 tickets per run",
  },
  {
    id: "game-2",
    slug: "game-2",
    displayName: "Game 2",
    title: "Game 2",
    tagline: "Insert creativity to begin.",
    description: "Cabinet 02 is wired for fast-twitch reflexes. Stay tuned for when the neon grid goes live.",
    asset: {
      icon: "⚡",
      accent: "cyan",
      marqueeLabel: "GAME 2",
    },
    accent: "cyan",
    marqueeLabel: "GAME 2",
    icon: "⚡",
    category: "Reflex Action",
    route: "/games/game-2",
    status: "coming_soon",
    entryFee: 0,
    reward: {
      min: 5,
      max: 30,
      description: "5-30 tickets per wave",
    },
    ticketRate: "5-30 tickets per wave",
  },
  {
    id: "game-3",
    slug: "game-3",
    displayName: "Game 3",
    title: "Game 3 (Grave Shift)",
    tagline: "Run the cursed forest before the moon goes out.",
    description: "A newly undead hero has one shift left: outrun the fog, stomp the wisps, and reach the exit gate before dawn.",
    asset: {
      icon: "🪦",
      accent: "lime",
      marqueeLabel: "GAME 3",
    },
    accent: "lime",
    marqueeLabel: "GAME 3",
    icon: "🪦",
    category: "Action Platformer",
    route: "/games/game-3",
    status: "available",
    entryFee: 0,
    reward: {
      min: 25,
      max: 25,
      description: "25 tickets on shift survival",
    },
    ticketRate: "25 tickets on clear",
  },
];

export function getGame(slug: string): ArcadeGame | undefined {
  return games.find((game) => game.slug === slug || game.id === slug);
}

export function getAllGames(): ArcadeGame[] {
  return games;
}

export function getAvailableGames(): ArcadeGame[] {
  return games.filter((game) => game.status === "available");
}
