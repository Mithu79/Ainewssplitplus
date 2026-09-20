import type { CategoryId } from "./types";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  tagline: string;
  /** Accent hue used for chips, rails and hero art. */
  accent: string;
  icon: string;
  href: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "world",
    label: "World",
    short: "World",
    tagline: "Conflicts, diplomacy and the stories moving the planet.",
    accent: "#ef4444",
    icon: "globe",
    href: "/category/world",
  },
  {
    id: "tech",
    label: "Tech",
    short: "Tech",
    tagline: "AI, gadgets, platforms and the people building them.",
    accent: "#6366f1",
    icon: "chip",
    href: "/category/tech",
  },
  {
    id: "business",
    label: "Business",
    short: "Business",
    tagline: "Markets, companies, economies and your money.",
    accent: "#10b981",
    icon: "briefcase",
    href: "/category/business",
  },
  {
    id: "sports",
    label: "Sports",
    short: "Sports",
    tagline: "Results, transfers and the moments people replay.",
    accent: "#f97316",
    icon: "trophy",
    href: "/category/sports",
  },
  {
    id: "science",
    label: "Science",
    short: "Science",
    tagline: "Discovery, space, climate and the natural world.",
    accent: "#8b5cf6",
    icon: "flask",
    href: "/category/science",
  },
  {
    id: "health",
    label: "Health",
    short: "Health",
    tagline: "Medicine, public health and living well.",
    accent: "#ec4899",
    icon: "heart",
    href: "/category/health",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    short: "Entertainment",
    tagline: "Film, music, streaming and culture.",
    accent: "#eab308",
    icon: "film",
    href: "/category/entertainment",
  },
  {
    id: "local",
    label: "Local News",
    short: "Local",
    tagline: "What is happening where you are — pick your region.",
    accent: "#06b6d4",
    icon: "pin",
    href: "/category/local",
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const BY_ID = new Map<CategoryId, CategoryMeta>(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string | undefined | null): CategoryMeta | undefined {
  if (!id) return undefined;
  return BY_ID.get(id.toLowerCase() as CategoryId);
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && BY_ID.has(value.toLowerCase() as CategoryId);
}

export function categoryAccent(id: CategoryId): string {
  return BY_ID.get(id)?.accent ?? "#64748b";
}
