export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";
import MessagesView from "./MessagesView";

export interface ConversationPreview {
  projectId: string;
  clientName: string;
  lastMessage: {
    content: string;
    created_at: string;
    sender_type: "client" | "admin";
  } | null;
  unreadCount: number;
}

export default async function MessagesPage() {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) redirect("/login");

  const supabase = createServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, client_name")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return <MessagesView conversations={[]} />;
  }

  const projectIds = projects.map((p) => p.id);

  const [unreadRes, messagesRes] = await Promise.all([
    supabase
      .from("messages")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("is_read", false)
      .eq("sender_type", "client"),
    supabase
      .from("messages")
      .select("project_id, content, created_at, sender_type")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false }),
  ]);

  const conversations: ConversationPreview[] = projects.map((p) => {
    const unread = unreadRes.data?.filter((m) => m.project_id === p.id).length ?? 0;
    const lastMsg = messagesRes.data?.find((m) => m.project_id === p.id);
    return {
      projectId: p.id,
      clientName: p.client_name,
      unreadCount: unread,
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            created_at: lastMsg.created_at,
            sender_type: lastMsg.sender_type as "client" | "admin",
          }
        : null,
    };
  });

  // Sort: unread first, then by most recent message
  conversations.sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
    const aTime = a.lastMessage?.created_at ?? "0";
    const bTime = b.lastMessage?.created_at ?? "0";
    return bTime.localeCompare(aTime);
  });

  return <MessagesView conversations={conversations} />;
}
