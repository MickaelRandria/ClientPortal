"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Send } from "lucide-react";
import { toast } from "sonner";

/* ── Types ───────────────────────────────────────────────────────── */

export interface Message {
  id: string;
  project_id: string;
  sender_type: "client" | "admin";
  sender_name: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Props {
  projectId: string;
  senderType: "client" | "admin";
  senderName: string;
  initialMessages: Message[];
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGroup(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function groupByDate(messages: Message[]) {
  const groups: { dateKey: string; messages: Message[] }[] = [];
  for (const msg of messages) {
    const dateKey = new Date(msg.created_at).toDateString();
    const last = groups[groups.length - 1];
    if (last && last.dateKey === dateKey) {
      last.messages.push(msg);
    } else {
      groups.push({ dateKey, messages: [msg] });
    }
  }
  return groups;
}

/* ── Component ───────────────────────────────────────────────────── */

export default function Chat({ projectId, senderType, senderName, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaContainerRef = useRef<HTMLDivElement>(null);

  // Scroll helpers
  function scrollToBottom(smooth = true) {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }

  // Initial instant scroll
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // Smooth scroll on new messages
  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Mark unread client messages as read when admin opens
  useEffect(() => {
    if (senderType !== "admin") return;
    const supabase = createClient();
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("project_id", projectId)
      .eq("sender_type", "client")
      .eq("is_read", false)
      .then(() => {});
  }, [projectId, senderType]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Admin: mark incoming client message as read immediately
          if (senderType === "admin" && newMsg.sender_type === "client") {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, senderType]);

  // Send message
  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const supabase = createClient();
    const { data: newMsg, error } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        sender_type: senderType,
        sender_name: senderName,
        content,
        is_read: false,
      })
      .select("*")
      .single();

    setSending(false);

    if (error) {
      toast.error("Erreur lors de l'envoi du message.");
      return;
    }

    if (newMsg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    }

    // Notify the other party (fire-and-forget, anti-spam handled server-side)
    fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        senderType,
        senderName,
        messageContent: content,
      }),
    }).catch(() => {});

    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  }

  const groups = groupByDate(messages);
  const canSend = input.trim().length > 0 && !sending;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-[28px]"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 20px 40px rgba(0,0,0,0.04)",
        height: "clamp(340px, 62vh, 680px)",
      }}
    >
      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-sm text-center leading-relaxed"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              Aucun message pour l'instant.
              <br />
              Démarrez la conversation !
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <div key={group.dateKey}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
                  <span
                    className="text-[11px] font-bold uppercase shrink-0"
                    style={{
                      color: "var(--ds-text-tertiary)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {formatDateGroup(group.messages[0].created_at)}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.06)" }} />
                </div>

                {/* Bubbles */}
                <div className="space-y-3">
                  {group.messages.map((msg) => {
                    const isMine = msg.sender_type === senderType;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}
                      >
                        {/* Sender name */}
                        <span
                          className="text-[11px] font-bold px-3"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          {msg.sender_name ??
                            (msg.sender_type === "admin" ? "Admin" : "Client")}
                        </span>

                        {/* Bubble */}
                        <div
                          className="max-w-[75%] px-4 py-2.5 rounded-[18px]"
                          style={
                            isMine
                              ? {
                                  background: "#34D399",
                                  color: "#fff",
                                  borderBottomRightRadius: "5px",
                                }
                              : {
                                  background: "rgba(0,0,0,0.06)",
                                  color: "var(--ds-text-primary)",
                                  borderBottomLeftRadius: "5px",
                                }
                          }
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        </div>

                        {/* Time */}
                        <span
                          className="text-[11px] px-3"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input area ── */}
      <div
        ref={textareaContainerRef}
        className="shrink-0 flex items-end gap-3 px-4 py-3"
        style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Écrire un message… (Entrée pour envoyer)"
          rows={1}
          className="flex-1 resize-none text-sm outline-none bg-transparent leading-relaxed"
          style={{
            color: "var(--ds-text-primary)",
            maxHeight: "120px",
            paddingTop: "8px",
            paddingBottom: "8px",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!canSend}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: canSend ? "#34D399" : "rgba(0,0,0,0.06)",
            transform: canSend ? "scale(1)" : "scale(0.95)",
          }}
        >
          <Send
            size={15}
            strokeWidth={2}
            style={{ color: canSend ? "white" : "var(--ds-text-tertiary)" }}
          />
        </button>
      </div>
    </div>
  );
}
