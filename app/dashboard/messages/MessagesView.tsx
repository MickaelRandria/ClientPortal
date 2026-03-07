"use client";

import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import type { ConversationPreview } from "./page";

function truncate(str: string, max = 80) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function MessagesView({
  conversations,
}: {
  conversations: ConversationPreview[];
}) {
  const router = useRouter();
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <div className="flex flex-col p-8 gap-8 max-w-[1600px] mx-auto w-full">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ds-text-primary)]">
          Messages
        </h1>
        <p className="text-[var(--ds-text-secondary)] mt-1">
          {totalUnread > 0
            ? `${totalUnread} message${totalUnread > 1 ? "s" : ""} non lu${totalUnread > 1 ? "s" : ""}`
            : "Tous les messages sont lus"}
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--ds-mint-bg)" }}
          >
            <MessageSquare size={24} strokeWidth={1.5} style={{ color: "var(--ds-mint-text)" }} />
          </div>
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--ds-text-primary)" }}>
              Aucune conversation
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--ds-text-secondary)" }}>
              Les messages apparaîtront ici une fois que vos clients vous écriront.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-2xl">
          {conversations.map((conv) => (
            <button
              key={conv.projectId}
              onClick={() => router.push(`/dashboard/${conv.projectId}?tab=messages`)}
              className="glass-card p-5 flex items-center gap-4 text-left w-full cursor-pointer"
            >
              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-white text-base"
                style={{ background: "linear-gradient(135deg, #34D399, #06B6D4)" }}
              >
                {conv.clientName.charAt(0).toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>
                    {conv.clientName}
                  </p>
                  {conv.lastMessage && (
                    <span className="text-[11px] shrink-0" style={{ color: "var(--ds-text-tertiary)" }}>
                      {formatRelativeTime(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs truncate"
                  style={{
                    color: conv.unreadCount > 0 ? "var(--ds-text-primary)" : "var(--ds-text-secondary)",
                    fontWeight: conv.unreadCount > 0 ? "600" : "400",
                  }}
                >
                  {conv.lastMessage ? (
                    <>
                      {conv.lastMessage.sender_type === "admin" ? "Vous : " : ""}
                      {truncate(conv.lastMessage.content)}
                    </>
                  ) : (
                    <span style={{ fontStyle: "italic", color: "var(--ds-text-tertiary)" }}>
                      Aucun message
                    </span>
                  )}
                </p>
              </div>

              {/* Unread badge */}
              {conv.unreadCount > 0 && (
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white bg-red-400">
                  {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
