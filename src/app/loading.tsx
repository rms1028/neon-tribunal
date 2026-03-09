export default function Loading() {
  return (
<<<<<<< HEAD
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-neon-blue/10 blur-[100px]" />
        <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-neon-purple/10 blur-[100px]" />
      </div>

      {/* Cyber grid */}
      <div className="cyber-grid absolute inset-0 opacity-30" />

      {/* Center block */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Spinner ring */}
        <div className="relative h-20 w-20">
          {/* Outer ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-neon-blue/20"
            style={{
              borderTopColor: "var(--color-neon-blue)",
              animation: "spin-slow 1.5s linear infinite",
            }}
          />
          {/* Inner ring — reverse spin */}
          <div
            className="absolute inset-2 rounded-full border-2 border-neon-purple/20"
            style={{
              borderBottomColor: "var(--color-neon-purple)",
              animation: "spin-slow 1s linear infinite reverse",
            }}
          />
          {/* Core dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-neon-blue shadow-[0_0_12px_var(--color-neon-blue)] animate-neon-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col items-center gap-2">
          <p
            className="font-cyber text-sm tracking-[0.3em] text-neon-blue animate-neon-pulse"
            style={{
              textShadow:
                "0 0 7px var(--color-neon-blue), 0 0 30px rgba(0,240,255,0.3)",
            }}
          >
            LOADING
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1 w-1 rounded-full bg-neon-blue"
                style={{
                  animation: `neon-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom holo line */}
        <div className="holo-line w-48" />
      </div>
    </div>
  );
=======
    <div className="min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_10%,rgba(34,211,238,0.08),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-white/5" />
          <div className="flex gap-2">
            <div className="size-8 animate-pulse rounded-lg bg-white/5" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-white/5" />
          </div>
        </div>

        {/* card skeletons */}
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-black/30 p-4"
            >
              <div className="mb-3 flex gap-2">
                <div className="h-5 w-12 animate-pulse rounded-full bg-white/5" />
                <div className="h-5 w-10 animate-pulse rounded-full bg-white/5" />
              </div>
              <div className="mb-4 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-white/5" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
              </div>
              <div className="mb-3 flex justify-between">
                <div className="h-8 w-16 animate-pulse rounded bg-white/5" />
                <div className="h-8 w-16 animate-pulse rounded bg-white/5" />
              </div>
              <div className="h-2 w-full animate-pulse rounded-full bg-white/5" />
              <div className="mt-4 flex gap-2">
                <div className="h-8 flex-1 animate-pulse rounded-lg bg-white/5" />
                <div className="h-8 flex-1 animate-pulse rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
>>>>>>> fa6b4c1b2ce350bb3dba5b3fd22e8596f3bbefc5
}
