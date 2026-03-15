"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  LayoutGrid,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Accueil" },
  { href: "/dashboard/projects", icon: LayoutGrid, label: "Projets" },
  {
    href: "/dashboard/messages",
    icon: MessageSquare,
    label: "Messages",
  },
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

function SidebarIcon({
  href,
  icon: Icon,
  label,
  isActive,
  notification,
}: SidebarIconProps) {
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "relative flex items-center justify-center",
        "w-12 h-12 rounded-2xl transition-all duration-300",
        isActive ? "bg-[var(--ds-mint)] shadow-[0_4px_16px_rgba(139,92,246,0.3)]" : "hover:bg-[var(--ds-surface-hover)]"
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

  return (
    <aside
      className="flex flex-col items-center py-8 gap-4"
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

      {/* Main nav */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
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

        {/* Logout */}
        <button
          type="button"
          title="Déconnexion"
          onClick={handleLogout}
          className="flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 hover:bg-red-500/10 hover:border hover:border-red-500/20"
        >
          <LogOut
            size={22}
            strokeWidth={1.8}
            className="text-[var(--ds-text-tertiary)] hover:text-red-400"
          />
        </button>
      </nav>
    </aside>
  );
}
