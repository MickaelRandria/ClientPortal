import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--ds-bg)" }}>
      <Sidebar />
      {/* pb accounts for mobile bottom nav (64px + safe area) */}
      <main className="flex-1 overflow-auto pb-[80px] md:pb-0" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
        <style>{`@media (min-width: 768px) { main { padding-bottom: 0 !important; } }`}</style>
        {children}
      </main>
    </div>
  );
}
