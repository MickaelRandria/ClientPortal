import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const ALLOWED_TYPES = new Set([
  // Images
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
  // Videos
  "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const fileName = searchParams.get("fileName");
  const fileType = searchParams.get("fileType");
  const category = searchParams.get("category") ?? "other";

  if (!projectId || !fileName || !fileType) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(fileType)) {
    return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 });
  }

  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `${projectId}/${category}/${Date.now()}-${sanitized}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  const publicUrl = `${R2_PUBLIC_URL}/${fileKey}`;

  return NextResponse.json({ uploadUrl, fileKey, publicUrl });
}
