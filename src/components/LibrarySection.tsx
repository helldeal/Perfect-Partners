import { ReactNode, useId } from "react";
import { CardGridSkeleton, Skeleton } from "./Skeleton";

export const LibrarySection = ({
  title,
  count,
  loading = false,
  children,
}: {
  title: string;
  count?: number;
  loading?: boolean;
  children?: ReactNode;
}) => {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="space-y-5">
      <div className="flex items-center gap-3">
        <h2 id={titleId} className="text-lg font-semibold sm:text-xl md:text-2xl">{title}</h2>
        {loading ? <Skeleton className="h-6 w-9 rounded-full" /> : count !== undefined && (
          <span className="rounded-full border border-app-border bg-app-surface px-2.5 py-0.5 text-xs text-app-muted">{count}</span>
        )}
        <div aria-hidden="true" className="h-px flex-1 bg-app-border/60" />
      </div>
      {loading ? <CardGridSkeleton /> : children}
    </section>
  );
};
