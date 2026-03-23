export default function DashboardLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg)" }}>
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#09040F]/80 backdrop-blur-2xl px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="h-8 w-28 rounded-xl bg-white/5 animate-pulse" />
          <div className="flex gap-3">
            <div className="h-10 w-36 rounded-full bg-white/5 animate-pulse" />
            <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 py-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-[20px] p-5 border border-white/5 bg-white/[0.02] animate-pulse">
              <div className="h-3 w-16 rounded-full bg-white/10 mb-3" />
              <div className="h-7 w-10 rounded-lg bg-white/10" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Project cards */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-32 rounded-full bg-white/10 animate-pulse" />
              <div className="h-9 w-48 rounded-full bg-white/5 animate-pulse" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-[20px] p-5 border border-white/5 animate-pulse"
                style={{ background: "var(--ds-surface)", animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-[1.25rem] bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded-full bg-white/10" />
                    <div className="h-3 w-28 rounded-full bg-white/[0.06]" />
                  </div>
                  <div className="h-7 w-16 rounded-full bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="rounded-[20px] p-5 border border-white/5 animate-pulse" style={{ background: "var(--ds-surface)" }}>
              <div className="h-4 w-28 rounded-full bg-white/10 mb-4" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="w-7 h-7 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-full rounded-full bg-white/10" />
                    <div className="h-2.5 w-20 rounded-full bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
