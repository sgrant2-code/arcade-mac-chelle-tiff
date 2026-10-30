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
    slug: "plants-vs-zombies",
    displayName: "Plants vs. Zombies",
    title: "Plants vs. Zombies",
    tagline: "Defend your lawn against zombies with sun-powered plants!",
    description: "Classic strategy tower defense. Plant sunflowers and peashooters, collect sun, and hold off the zombie horde.",
    asset: {
      icon: "🌻",
      accent: "lime",
      marqueeLabel: "GAME 1",
    },
    accent: "lime",
    marqueeLabel: "GAME 1",
    icon: "🌻",
    category: "Tower Defense",
    route: "/games/plants-vs-zombies",
    status: "available",
    entryFee: 0,
    reward: {
      min: 10,
      max: 50,
      description: "5 tickets per zombie kill",
    },
    ticketRate: "5 tickets per zombie kill",
  },
  {
    id: "game-2",
    slug: "zombie-nyan-cat",
    displayName: "Zombie Nyan Cat",
    title: "Zombie Nyan Cat",
    tagline: "Guide the undead feline through the toxic void and eat brains!",
    description: "Retro pixel-art endless runner. Leap across the graveyard, collect brains, avoid holy water, and ride the corrupted rainbow.",
    asset: {
      icon: "🐱",
      accent: "cyan",
      marqueeLabel: "GAME 2",
    },
    accent: "cyan",
    marqueeLabel: "GAME 2",
    icon: "🐱",
    category: "Endless Runner",
    route: "/games/zombie-nyan-cat",
    status: "available",
    entryFee: 0,
    reward: {
      min: 5,
      max: 40,
      description: "1 ticket per 5 brains",
    },
    ticketRate: "1 ticket per 5 brains",
  },
  {
    id: "game-3",
    slug: "game-3",
    displayName: "Grave Shift",
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
  if (slug === "game-1" || slug === "plants-vs-zombies") {
    return games.find((g) => g.id === "game-1" || g.slug === "plants-vs-zombies") || games[0];
  }
  if (slug === "game-2" || slug === "zombie-nyan-cat") {
    return games.find((g) => g.id === "game-2" || g.slug === "zombie-nyan-cat") || games[1];
  }
  return games.find((game) => game.slug === slug || game.id === slug);
}

export function getAllGames(): ArcadeGame[] {
  return games;
}

export function getAvailableGames(): ArcadeGame[] {
  return games.filter((game) => game.status === "available");
}
