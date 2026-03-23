export default function ProjectLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg)" }}>
      {/* Header skeleton */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#09040F]/80 backdrop-blur-2xl px-8 py-5">
        <div className="max-w-[1600px] mx-auto flex items-center gap-6">
          <div className="h-8 w-8 rounded-xl bg-white/5 animate-pulse" />
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-[1.5rem] bg-white/10 animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded-full bg-white/10 animate-pulse" />
              <div className="h-3 w-28 rounded-full bg-white/[0.06] animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 rounded-full bg-white/5 animate-pulse" />
            <div className="h-10 w-28 rounded-full bg-white/5 animate-pulse" />
            <div className="h-10 w-28 rounded-full bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main content */}
          <div className="col-span-12 lg:col-span-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-24 rounded-full bg-white/5 animate-pulse" />
              ))}
            </div>
            {/* Brief card skeleton */}
            <div className="rounded-[28px] p-10 border border-white/5 animate-pulse" style={{ background: "var(--ds-surface)" }}>
              <div className="h-6 w-40 rounded-full bg-white/10 mb-8" />
              <div className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="h-2.5 w-20 rounded-full bg-white/[0.06]" />
                    <div className="h-16 rounded-[1.25rem] bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-[28px] p-8 border border-white/5 animate-pulse" style={{ background: "var(--ds-surface)" }}>
              <div className="h-4 w-32 rounded-full bg-white/10 mb-6" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
