import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";
import DashboardView, { type ProjectWithStats } from "./DashboardView";

export default async function DashboardPage() {
  // 1. Get the current user from session cookie
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) redirect("/login");

  // 2. Fetch data with service role client (bypasses RLS)
  const supabase = createServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, client_name, client_email, client_phone, slug, status, created_at")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  if (!projects || projects.length === 0) {
    return <DashboardView projects={[]} adminId={user.id} />;
  }

  const projectIds = projects.map((p) => p.id);

  // 3. Batch fetch counts + last messages in parallel
  const [uploadsRes, unreadRes, messagesRes] = await Promise.all([
    supabase.from("uploads").select("project_id").in("project_id", projectIds),
    supabase
      .from("messages")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("is_read", false)
      .eq("sender_type", "client"),
    supabase
      .from("messages")
      .select("project_id, content, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false }),
  ]);

  // 4. Compute per-project stats in JS
  const uploadCounts: Record<string, number> = {};
  const unreadCounts: Record<string, number> = {};
  const lastMessages: Record<string, { content: string; created_at: string }> = {};

  for (const id of projectIds) {
    uploadCounts[id] = uploadsRes.data?.filter((u) => u.project_id === id).length ?? 0;
    unreadCounts[id] = unreadRes.data?.filter((m) => m.project_id === id).length ?? 0;
    const msg = messagesRes.data?.find((m) => m.project_id === id);
    if (msg) lastMessages[id] = { content: msg.content, created_at: msg.created_at };
  }

  const projectsWithStats: ProjectWithStats[] = projects.map((p) => ({
    ...p,
    uploadsCount: uploadCounts[p.id] ?? 0,
    unreadCount: unreadCounts[p.id] ?? 0,
    lastMessage: lastMessages[p.id] ?? null,
  }));

  return <DashboardView projects={projectsWithStats} adminId={user.id} />;
}
