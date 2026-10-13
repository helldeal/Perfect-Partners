export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div aria-hidden="true" className={`rounded-lg bg-app-surface-elevated motion-safe:animate-pulse ${className}`} />
);

export const CardGridSkeleton = ({ compact = false }: { compact?: boolean }) => (
  <div role="status" aria-busy="true">
    <span className="sr-only">Chargement des éléments…</span>
    <div aria-hidden="true" className={compact
      ? "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
      : "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 lg:gap-12 xl:grid-cols-6"}>
      {Array.from({ length: compact ? 5 : 6 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[2/3] w-full rounded-xl" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

export const RelatedSkeleton = ({ title }: { title: string }) => (
  <section className="mt-6">
    <h2 className="mb-4 text-xl sm:text-2xl">{title}</h2>
    <CardGridSkeleton compact />
  </section>
);
