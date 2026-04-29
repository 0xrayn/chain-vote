"use client";

export function ProposalCardSkeleton() {
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: "340px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
        <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
      </div>
      {/* Title */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
        <div className="h-4 w-1/2 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
      </div>
      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
        <div className="h-3 w-5/6 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
        <div className="h-3 w-4/6 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
      </div>
      {/* Vote bars */}
      <div className="flex flex-col gap-2 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--surface2)", animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-1">
          <div className="h-3 w-20 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
          <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: "var(--surface2)" }} />
        </div>
        <div className="h-7 w-24 rounded-lg animate-pulse" style={{ background: "var(--surface2)" }} />
      </div>
    </div>
  );
}

export function ProposalGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[...Array(count)].map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.05}s` }}>
          <ProposalCardSkeleton />
        </div>
      ))}
    </div>
  );
}
