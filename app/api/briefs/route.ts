import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";

/* ── PATCH /api/briefs — admin sets deadline + livrables ── */
export async function PATCH(request: NextRequest) {
  const sessionClient = createSessionClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, deadline, livrables_attendus } = await request.json();
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("briefs")
    .upsert(
      { project_id: projectId, deadline: deadline || null, livrables_attendus: livrables_attendus || null },
      { onConflict: "project_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
