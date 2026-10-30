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
    slug: "plants-vs-zombies",
    title: "Plants vs. Zombies",
    tagline: "Defend your lawn against zombies with sun-powered plants!",
    description: "Classic strategy tower defense. Plant sunflowers and peashooters, collect sun, and hold off the zombie horde.",
    accent: "lime",
    marqueeLabel: "GAME 1",
    icon: "🌻",
    category: "Tower Defense",
    ticketRate: "5 tickets per zombie kill",
  },
  {
    slug: "zombie-nyan-cat",
    title: "Zombie Nyan Cat",
    tagline: "Guide the undead feline through the toxic void and eat brains!",
    description: "Retro pixel-art endless runner. Leap across the graveyard, collect brains, avoid holy water, and ride the corrupted rainbow.",
    accent: "cyan",
    marqueeLabel: "GAME 2",
    icon: "🐱",
    category: "Endless Runner",
    ticketRate: "1 ticket per 5 brains",
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
  if (slug === "game-1") return games.find((g) => g.slug === "plants-vs-zombies") || games[0];
  if (slug === "game-2") return games.find((g) => g.slug === "zombie-nyan-cat") || games[1];
  return games.find((game) => game.slug === slug);
}
