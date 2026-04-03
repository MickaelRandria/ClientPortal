import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-session";

export async function POST(req: NextRequest) {
  const { projectId, fileKey, fileName, fileSize, fileType, category, uploadedBy } =
    await req.json();

  if (!projectId || !fileKey || !fileName) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileKey}`;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ upload: data });
}
