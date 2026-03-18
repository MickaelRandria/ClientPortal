import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";

/* ── GET /api/brief-comments?projectId=xxx ── */
export async function GET(request: NextRequest) {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("brief_comments")
    .select("id, section, comment, status")
    .eq("project_id", projectId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/* ── POST /api/brief-comments — save / update a comment ── */
export async function POST(request: NextRequest) {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, briefField, content } = await request.json();
  if (!projectId || !briefField || !content?.trim())
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServerClient();

  // Fetch brief_id for this project (required FK)
  const { data: brief, error: briefError } = await supabase
    .from("briefs")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (briefError) return NextResponse.json({ error: briefError.message }, { status: 500 });

  // Check if a record already exists for this section
  const { data: existing } = await supabase
    .from("brief_comments")
    .select("id")
    .eq("project_id", projectId)
    .eq("section", briefField)
    .maybeSingle();

  let result;
  if (existing?.id) {
    result = await supabase
      .from("brief_comments")
      .update({ comment: content.trim(), status: "comment" })
      .eq("id", existing.id)
      .select("id, section, comment, status")
      .single();
  } else {
    result = await supabase
      .from("brief_comments")
      .insert({
        project_id: projectId,
        ...(brief?.id ? { brief_id: brief.id } : {}),
        section: briefField,
        comment: content.trim(),
        status: "comment",
      })
      .select("id, section, comment, status")
      .single();
  }

  if (result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ data: result.data });
}

/* ── PATCH /api/brief-comments — update status per section OR brief_status ── */
export async function PATCH(request: NextRequest) {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, briefField, fieldStatus, briefStatus } = await request.json();
  if (!projectId)
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const supabase = createServerClient();

  // Brief-level status update (review / approve)
  if (briefStatus) {
    const { error } = await supabase
      .from("briefs")
      .update({ brief_status: briefStatus })
      .eq("project_id", projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  // Field-level status update (✓ approved / ✕ rejected)
  if (!briefField || !fieldStatus)
    return NextResponse.json({ error: "Missing briefField or fieldStatus" }, { status: 400 });

  // status CHECK constraint only allows: comment, approved, rejected
  const validStatuses = ["approved", "rejected"];
  if (!validStatuses.includes(fieldStatus))
    return NextResponse.json({ error: "Invalid fieldStatus" }, { status: 400 });

  const { data: existing } = await supabase
    .from("brief_comments")
    .select("id, comment")
    .eq("project_id", projectId)
    .eq("section", briefField)
    .maybeSingle();

  let data, error;
  if (existing?.id) {
    ({ data, error } = await supabase
      .from("brief_comments")
      .update({ status: fieldStatus })
      .eq("id", existing.id)
      .select("id, section, comment, status")
      .single());
  } else {
    // Fetch brief_id for new record
    const { data: brief } = await supabase
      .from("briefs")
      .select("id")
      .eq("project_id", projectId)
      .maybeSingle();

    ({ data, error } = await supabase
      .from("brief_comments")
      .insert({
        project_id: projectId,
        ...(brief?.id ? { brief_id: brief.id } : {}),
        section: briefField,
        comment: "-",
        status: fieldStatus,
      })
      .select("id, section, comment, status")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
