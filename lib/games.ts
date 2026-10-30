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
    slug: "game-1",
    title: "<game 1>",
    description: "An arcade cabinet is warming up.",
    accent: "pink",
  },
  {
    slug: "game-2",
    title: "<game 2>",
    description: "Insert creativity to begin.",
    accent: "cyan",
  },
  {
    slug: "game-3",
    title: "<game 3>",
    description: "A new high score is waiting.",
    accent: "lime",
  },
];

export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
