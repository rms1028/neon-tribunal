export default function HallOfFameLoading() {
  const skeletonCards = Array.from({ length: 6 });

  return (
    <main className="relative min-h-screen overflow-hidden bg-dark-bg pt-24 pb-16">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/4 right-1/3 h-72 w-72 rounded-full bg-neon-pink/8 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-neon-purple/8 blur-[120px]" />
      </div>

      <div className="cyber-grid fixed inset-0 opacity-20" />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Header skeleton */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="skeleton-line h-8 w-56 rounded" />
          <div className="skeleton-line h-4 w-72 rounded" />

          {/* Sort buttons skeleton */}
          <div className="mt-4 flex gap-3">
            <div className="skeleton-line h-9 w-24 rounded cyber-clip-btn" />
            <div className="skeleton-line h-9 w-24 rounded cyber-clip-btn" />
          </div>
        </div>

        {/* Holo divider */}
        <div className="holo-line mx-auto mb-8 w-full max-w-md" />

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skeletonCards.map((_, i) => (
            <div
              key={i}
              className="glass-card cyber-clip rounded-lg p-5"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Judge badge */}
              <div className="mb-3 flex items-center gap-2">
                <div className="skeleton-line h-6 w-6 rounded-full" />
                <div className="skeleton-line h-4 w-24 rounded" />
              </div>

              {/* Title line */}
              <div className="skeleton-line mb-3 h-5 w-full rounded" />

              {/* Content lines */}
              <div className="space-y-2">
                <div className="skeleton-line h-3 w-full rounded" />
                <div className="skeleton-line h-3 w-5/6 rounded" />
                <div className="skeleton-line h-3 w-4/6 rounded" />
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-dark-border pt-3">
                <div className="skeleton-line h-3 w-16 rounded" />
                <div className="skeleton-line h-3 w-12 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Center loading indicator */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 rounded-full border-2 border-neon-pink/20"
            style={{
              borderTopColor: "var(--color-neon-pink)",
              animation: "spin-slow 1.5s linear infinite",
            }}
          />
          <p
            className="font-[var(--font-share-tech)] text-xs tracking-[0.25em] text-neon-pink/70 animate-neon-pulse"
            style={{
              fontFamily: "var(--font-share-tech), monospace",
              textShadow: "0 0 7px rgba(255,45,149,0.3)",
            }}
          >
            DATA_LOADING...
          </p>
        </div>
      </div>
    </main>
  );
}
