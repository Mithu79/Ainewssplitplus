import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { CATEGORIES } from "@/lib/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/search", "/sources", "/about"].map((path) => ({
    url: `${config.siteUrl}${path}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: path === "" ? 1 : 0.6,
  }));

  const categoryRoutes = CATEGORIES.map((category) => ({
    url: `${config.siteUrl}${category.href}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
