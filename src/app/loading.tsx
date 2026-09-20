import { StoryGridSkeleton } from "@/components/StoryCard";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-4 py-8 sm:px-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <div className="skeleton aspect-[16/9] w-full rounded-[14px]" />
          <div className="skeleton h-8 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-2/3 rounded" />
        </div>
        <div className="flex flex-col gap-5">
          <div className="skeleton h-40 w-full rounded-[14px]" />
          <div className="skeleton h-72 w-full rounded-[14px]" />
        </div>
      </div>
      <StoryGridSkeleton count={6} />
    </div>
  );
}
