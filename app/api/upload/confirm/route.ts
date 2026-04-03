import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { projectId, fileKey, fileName, fileSize, fileType, category, uploadedBy } =
      await req.json();

    if (!projectId || !fileKey || !fileName) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const r2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
    const publicUrl = r2BaseUrl ? `${r2BaseUrl.replace(/\/$/, "")}/${fileKey}` : fileKey;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("uploads")
      .insert({
        project_id: projectId,
        file_name: fileName,
        file_url: publicUrl,
        file_size: fileSize ?? null,
        file_type: fileType ?? null,
        category: category ?? "other",
        uploaded_by: uploadedBy ?? "client",
      })
      .select("id, file_name, file_url, file_size, file_type, category")
      .single();

    if (error) {
      console.error("upload/confirm supabase error:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ upload: data });
  } catch (err) {
    console.error("upload/confirm unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
