export type ArcadeGame = {
  slug: string;
  title: string;
  description: string;
  accent: "pink" | "cyan" | "lime";
};

/**
 * The arcade roster. Add each new game here and it will appear on the floor.
 */
export const games: ArcadeGame[] = [
  {
    slug: "plants-vs-zombies",
    title: "Plants vs. Zombies",
    description: "Defend your lawn against zombies with sun-powered plants!",
    accent: "lime",
  },
  {
    slug: "zombie-nyan-cat",
    title: "Zombie Nyan Cat",
    description: "Guide the undead feline through the toxic void and eat brains!",
    accent: "cyan",
  },
  {
    slug: "game-3",
    title: "Grave Shift",
    description: "Run the cursed forest before the moon goes out.",
    accent: "lime",
  },
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
