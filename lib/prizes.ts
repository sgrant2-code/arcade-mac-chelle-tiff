export type ArcadePrize = {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: "Plushie" | "Collectible" | "Trophy" | "Toy" | "Mystery";
  icon: string;
  accent: "pink" | "cyan" | "gold" | "green" | "purple";
  badge?: string;
};

export const prizes: ArcadePrize[] = [
  {
    id: "teddy-bear",
    name: "Retro Teddy Bear",
    description: "Classic huggable plush bear with an 8-bit bowtie and stitched paws.",
    cost: 50,
    category: "Plushie",
    icon: "🧸",
    accent: "gold",
    badge: "Popular",
  },
  {
    id: "neon-dino",
    name: "Cyber Neon Dino",
    description: "Glowing green stegosaurus crafted from retro synth-wave polymer.",
    cost: 80,
    category: "Collectible",
    icon: "🦖",
    accent: "green",
    badge: "Fan Favorite",
  },
  {
    id: "gold-star",
    name: "Arcade Master Star",
    description: "High-polished neon star trophy awarded to distinguished arcade legends.",
    cost: 100,
    category: "Trophy",
    icon: "⭐",
    accent: "gold",
  },
  {
    id: "cyber-bot",
    name: "Bipedal Droid Bot",
    description: "Miniature arcade robot with dual flashing LED visor and moving joints.",
    cost: 120,
    category: "Toy",
    icon: "🤖",
    accent: "pink",
    badge: "Featured",
  },
  {
    id: "arcade-crown",
    name: "High Score Crown",
    description: "Gilded neon sovereign crown that signifies the true king of the floor.",
    cost: 200,
    category: "Trophy",
    icon: "👑",
    accent: "gold",
    badge: "Legendary",
  },
  {
    id: "mystery-box",
    name: "Mystery Gift Box",
    description: "Contains surprises, bonus tickets, and limited pixel stickers!",
    cost: 40,
    category: "Mystery",
    icon: "🎁",
    accent: "purple",
    badge: "Lucky Pick",
  },
];

export function getPrize(id: string) {
  return prizes.find((p) => p.id === id);
}
