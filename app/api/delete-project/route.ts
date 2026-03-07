import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch all upload paths to delete from storage
    const { data: uploads } = await supabase
      .from("uploads")
      .select("file_url")
      .eq("project_id", projectId);

    if (uploads && uploads.length > 0) {
      const paths = uploads
        .map((u) => u.file_url.split("/project-files/")[1])
        .filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from("project-files").remove(paths);
      }
    }

    // Delete the project — cascades to briefs, messages, uploads
    const { error, count } = await supabase
      .from("projects")
      .delete({ count: "exact" })
      .eq("id", projectId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json(
        { error: "Aucune ligne supprimée — vérifiez SUPABASE_SERVICE_ROLE_KEY dans .env.local (elle ne doit pas être identique à la clé anon)." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
