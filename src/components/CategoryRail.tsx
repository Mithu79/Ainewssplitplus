import { CATEGORY_ICON } from "./Icons";
import { RailScroller } from "./RailScroller";
import { SectionHeading } from "./SectionHeading";
import { StoryCard } from "./StoryCard";
import type { CategoryMeta } from "@/lib/categories";
import type { Article } from "@/lib/types";

export function CategoryRail({
  category,
  articles,
  clusterCounts,
}: {
  category: CategoryMeta;
  articles: Article[];
  clusterCounts?: Map<string, number>;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={`rail-${category.id}`}>
      <SectionHeading
        kicker="Category"
        title={category.label}
        icon={CATEGORY_ICON[category.icon] ?? "newspaper"}
        accent={category.accent}
        href={category.href}
        count={`${articles.length} fresh`}
      />
      <RailScroller>
        {articles.map((article, index) => (
          <StoryCard
            key={article.id}
            article={article}
            variant="rail"
            index={index}
            className="snap-start"
            sourceCount={clusterCounts?.get(article.clusterId)}
          />
        ))}
      </RailScroller>
    </section>
  );
}
