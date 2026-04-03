"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LayoutGrid,
  MessageSquare,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard",          icon: Home,           label: "Accueil"    },
  { href: "/dashboard/projects", icon: LayoutGrid,     label: "Projets"    },
  { href: "/dashboard/messages", icon: MessageSquare,  label: "Messages"   },
];

const BOTTOM_ITEMS = [
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

interface SidebarIconProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  notification?: boolean;
}

function SidebarIcon({ href, icon: Icon, label, isActive, notification }: SidebarIconProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "relative flex items-center justify-center",
        "w-12 h-12 rounded-2xl transition-all duration-300",
        isActive
          ? "bg-[var(--ds-mint)] shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
          : "hover:bg-[var(--ds-surface-hover)]"
      )}
    >
      <Icon
        size={22}
        strokeWidth={isActive ? 2.2 : 1.8}
        className="shrink-0"
        style={{ color: isActive ? "var(--ds-mint-text)" : "var(--ds-text-tertiary)" }}
      />
      {notification && (
        <span
          aria-label="Nouveau message"
          className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"
          style={{ border: "2px solid var(--ds-surface-solid)" }}
        />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openNewProject() {
    window.dispatchEvent(new CustomEvent("open-new-project"));
  }

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex flex-col items-center py-8 gap-4"
        style={{
          width: "80px",
          background: "transparent",
          height: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/dashboard"
          className="w-16 h-12 flex items-center justify-center mb-6 shrink-0 transition-all hover:scale-105"
        >
          <img src="/logo-koko.png" alt="Koko Prod" className="w-full h-full object-contain" />
        </Link>

        <nav className="flex flex-col items-center gap-3 w-full px-3">
          {NAV_ITEMS.map((item) => (
            <SidebarIcon
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
        </nav>

        <div className="flex-1" />

        <nav className="flex flex-col items-center gap-3 w-full px-3 pb-4">
          {BOTTOM_ITEMS.map((item) => (
            <SidebarIcon
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.href)}
            />
          ))}
          <button
            type="button"
            title="Déconnexion"
            onClick={handleLogout}
            className="flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 hover:bg-red-500/10 hover:border hover:border-red-500/20"
          >
            <LogOut size={22} strokeWidth={1.8} className="text-[var(--ds-text-tertiary)] hover:text-red-400" />
          </button>
        </nav>
      </aside>

      {/* ── Mobile bottom nav (hidden on desktop) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{
          height: "64px",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "rgba(9,4,15,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Home */}
        <BottomNavItem href="/dashboard" icon={Home} label="Accueil" isActive={isActive("/dashboard")} />

        {/* Projets */}
        <BottomNavItem href="/dashboard/projects" icon={LayoutGrid} label="Projets" isActive={isActive("/dashboard/projects")} />

        {/* FAB + nouveau projet */}
        <button
          onClick={openNewProject}
          className="flex items-center justify-center rounded-full text-white"
          style={{
            width: "52px",
            height: "52px",
            marginTop: "-16px",
            background: "#34D399",
            boxShadow: "0 4px 16px rgba(52,211,153,0.4)",
          }}
          aria-label="Nouveau projet"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Messages */}
        <BottomNavItem href="/dashboard/messages" icon={MessageSquare} label="Messages" isActive={isActive("/dashboard/messages")} />

        {/* Settings */}
        <BottomNavItem href="/dashboard/settings" icon={Settings} label="Réglages" isActive={isActive("/dashboard/settings")} />
      </nav>
    </>
  );
}

function BottomNavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  const color = isActive ? "#34D399" : "rgba(255,255,255,0.35)";
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-0.5 w-12 h-12">
      <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} style={{ color }} />
      <span className="text-[10px] font-medium" style={{ color }}>
        {label}
      </span>
    </Link>
  );
}
