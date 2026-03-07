export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import ClientPortalView from "./ClientPortalView";

interface PageProps {
  params: { slug: string };
}

export default async function ClientPage({ params }: PageProps) {
  const supabase = createServerClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, client_name, slug, status, ai_summary")
    .eq("slug", params.slug)
    .single();

  if (!project) {
    notFound();
  }

  const [{ data: brief }, { data: uploads }, { data: messages }] = await Promise.all([
    supabase.from("briefs").select("*").eq("project_id", project.id).maybeSingle(),
    supabase
      .from("uploads")
      .select("id, file_name, file_url, file_size, file_type, category")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("id, project_id, sender_type, sender_name, content, is_read, created_at")
      .eq("project_id", project.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <ClientPortalView
      project={project}
      initialBrief={brief}
      initialUploads={uploads ?? []}
      initialMessages={messages ?? []}
    />
  );
}
