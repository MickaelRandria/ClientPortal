export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";
import AdminProjectView from "./AdminProjectView";
import type { Message } from "@/components/Chat";

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("projects")
    .select("client_name")
    .eq("id", params.id)
    .single();
  return { title: data?.client_name ?? "Projet" };
}

export default async function AdminProjectPage({ params, searchParams }: PageProps) {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_name, client_email, client_phone, slug, status, created_at, admin_id, ai_summary")
    .eq("id", params.id)
    .single();

  if (!project || project.admin_id !== user.id) {
    notFound();
  }

  const [{ data: brief }, { data: uploads }, { data: messages }] = await Promise.all([
    supabase.from("briefs").select("*").eq("project_id", project.id).maybeSingle(),
    supabase
      .from("uploads")
      .select("id, file_name, file_url, file_size, file_type, category, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("id, project_id, sender_type, sender_name, content, is_read, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <AdminProjectView
      project={project}
      initialBrief={brief}
      initialUploads={uploads ?? []}
      initialMessages={(messages ?? []) as Message[]}
      adminName={user.email ?? "Admin"}
      defaultTab={searchParams.tab ?? "brief"}
    />
  );
}
