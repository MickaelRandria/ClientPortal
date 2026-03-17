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
    .select("id, brief_field, content, field_status")
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
  if (!projectId || !briefField)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createServerClient();

  // Check if a record already exists for this field
  const { data: existing } = await supabase
    .from("brief_comments")
    .select("id")
    .eq("project_id", projectId)
    .eq("brief_field", briefField)
    .maybeSingle();

  let result;
  if (existing?.id) {
    result = await supabase
      .from("brief_comments")
      .update({ content })
      .eq("id", existing.id)
      .select("id, brief_field, content, field_status")
      .single();
  } else {
    result = await supabase
      .from("brief_comments")
      .insert({
        project_id: projectId,
        brief_field: briefField,
        content,
        field_status: "pending",
      })
      .select("id, brief_field, content, field_status")
      .single();
  }

  if (result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ data: result.data });
}

/* ── PATCH /api/brief-comments — update field_status OR brief_status ── */
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

  // Field-level status update (✓ / ✕ per section)
  if (!briefField || !fieldStatus)
    return NextResponse.json({ error: "Missing briefField or fieldStatus" }, { status: 400 });

  const { data: existing } = await supabase
    .from("brief_comments")
    .select("id, content")
    .eq("project_id", projectId)
    .eq("brief_field", briefField)
    .maybeSingle();

  let data, error;
  if (existing?.id) {
    // Update field_status, preserve existing content
    ({ data, error } = await supabase
      .from("brief_comments")
      .update({ field_status: fieldStatus })
      .eq("id", existing.id)
      .select("id, brief_field, content, field_status")
      .single());
  } else {
    // Insert new record with empty content
    ({ data, error } = await supabase
      .from("brief_comments")
      .insert({
        project_id: projectId,
        brief_field: briefField,
        content: "",
        field_status: fieldStatus,
      })
      .select("id, brief_field, content, field_status")
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
