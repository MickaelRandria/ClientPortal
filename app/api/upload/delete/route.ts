import { NextRequest, NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createServerClient } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  const { uploadId, fileKey } = await req.json();

  if (!uploadId || !fileKey) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  // Delete from R2
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: fileKey }));

  // Delete from DB
  const supabase = createServerClient();
  const { error } = await supabase.from("uploads").delete().eq("id", uploadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
