export default function ClientPortalLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--ds-bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-[#09040F]/90 backdrop-blur-2xl px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 rounded-xl bg-white/5 animate-pulse" />
            <div className="w-px h-5 bg-white/10" />
            <div className="space-y-1.5">
              <div className="h-4 w-32 rounded-full bg-white/10 animate-pulse" />
              <div className="h-2.5 w-20 rounded-full bg-white/[0.06] animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-24 rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>

      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Main column */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Brief section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-6 w-36 rounded-full bg-white/10 animate-pulse" />
              </div>
              <div className="rounded-[24px] p-8 border border-white/5 animate-pulse" style={{ background: "var(--ds-surface)" }}>
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="h-2.5 w-24 rounded-full bg-white/[0.06]" />
                      <div className="h-20 rounded-[1.25rem] bg-white/[0.04]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Files section */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
                <div className="h-6 w-28 rounded-full bg-white/10 animate-pulse" />
              </div>
              <div className="h-40 rounded-[24px] border border-white/5 bg-white/[0.02] animate-pulse" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-5">
            <div className="rounded-2xl p-5 border border-white/5 animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="h-3 w-28 rounded-full bg-white/10 mb-4" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 h-3 rounded-full bg-white/[0.06]" />
                  <div className="h-2.5 w-12 rounded-full bg-white/[0.04]" />
                </div>
              ))}
            </div>
            <div className="rounded-[20px] p-6 border border-white/5 animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }}>
              <div className="h-4 w-48 rounded-full bg-white/10 mb-2" />
              <div className="h-3 w-40 rounded-full bg-white/[0.06] mb-5" />
              <div className="h-10 w-full rounded-full bg-white/[0.06]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
