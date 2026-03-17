import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { createServerClient } from "@/lib/supabase";

// MIME types Gemini supports natively
const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif",
  "application/pdf",
  "text/plain", "text/html", "text/csv", "text/markdown",
]);

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file

async function fetchFileAsPart(url: string, mimeType: string | null, fileName: string): Promise<Part | null> {
  try {
    const mime = mimeType ?? "application/octet-stream";
    if (!SUPPORTED_MIME_TYPES.has(mime)) return null;

    const response = await fetch(url);
    if (!response.ok) return null;

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_FILE_BYTES) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_BYTES) return null;

    // Text files: include as plain text in the prompt
    if (mime.startsWith("text/")) {
      const text = new TextDecoder().decode(buffer);
      return { text: `\n--- Fichier : ${fileName} ---\n${text}\n---\n` };
    }

    // Images & PDFs: send as base64 inline data
    const base64 = Buffer.from(buffer).toString("base64");
    return { inlineData: { mimeType: mime, data: base64 } };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Fetch all context data in parallel
    const [{ data: project }, { data: brief }, { data: messages }, { data: uploads }] = await Promise.all([
      supabase.from("projects").select("client_name, client_email").eq("id", project_id).single(),
      supabase.from("briefs").select("*").eq("project_id", project_id).maybeSingle(),
      supabase
        .from("messages")
        .select("sender_type, content")
        .eq("project_id", project_id)
        .order("created_at", { ascending: true }),
      supabase
        .from("uploads")
        .select("file_name, file_url, file_type, category")
        .eq("project_id", project_id),
    ]);

    // Build text sections
    const briefText = brief
      ? `
- Vision / Idée : ${brief.objectif || "Non renseigné"}
- Cible visée : ${brief.cible || "Non renseigné"}
- Ton souhaité : ${brief.ton_souhaite || "Non renseigné"}
- Format souhaité : ${brief.format_souhaite || "Non renseigné"}
- Livrables attendus : ${brief.livrables_attendus || "Non renseigné"}
- Dialogues / Voix off : ${brief.dialogues || "Non fourni"}
- Deadline : ${brief.deadline || "Non renseignée"}
- Notes libres : ${brief.notes_libres || "Aucune"}`
      : "Aucun brief rempli par le client.";

    const messagesText =
      messages && messages.length > 0
        ? messages.map((m) => `[${m.sender_type === "client" ? "Client" : "Admin"}] ${m.content}`).join("\n")
        : "Aucun échange de messages.";

    const uploadsText =
      uploads && uploads.length > 0
        ? uploads.map((u) => `- ${u.file_name} (catégorie : ${u.category}, type : ${u.file_type ?? "inconnu"})`).join("\n")
        : "Aucun fichier déposé.";

    const promptText = `Tu es un assistant spécialisé dans l'analyse de briefs créatifs pour une agence de production de contenu marketing (vidéo, visuel, réseaux sociaux).

Voici les informations d'un projet client. Analyse-les et produis un résumé structuré.

CLIENT : ${project?.client_name ?? "Inconnu"}

BRIEF DU CLIENT :
${briefText}

FICHIERS DÉPOSÉS :
${uploadsText}

HISTORIQUE DES ÉCHANGES (derniers messages) :
${messagesText}

Les fichiers sont joints ci-dessous. Analyse leur contenu pour enrichir le résumé.

Réponds UNIQUEMENT avec un JSON valide (sans backticks, sans texte autour) avec cette structure :
{
  "recap_clair": "En 2-3 phrases, résume clairement et simplement ce que le client veut. Cette phrase doit être compréhensible par n'importe qui dans l'équipe sans lire le reste du brief. Exemple : 'Le client souhaite une vidéo verticale de 30 secondes pour promouvoir sa nouvelle collection de bijoux sur Instagram, avec un ton élégant et des tons pastels.'",
  "objectif": "résumé détaillé de la vision et de l'objectif du projet",
  "cible": "description de la cible visée",
  "ton": "ton et style souhaités pour les livrables",
  "format": "format technique demandé (16:9, 9:16, etc.) et ses implications pour la production",
  "livrables_attendus": "liste des livrables attendus sous forme narrative",
  "deadline": "date ou période mentionnée, ou null",
  "dialogues_resume": "résumé des dialogues/voix off fournis par le client, ou 'Non fourni' si absent",
  "points_attention": ["point important 1", "point 2"],
  "resume_echanges": "synthèse des points importants discutés dans le chat"
}`;

    // Download files and build Gemini parts (failures are silently ignored)
    const fileParts: Part[] = [];
    if (uploads && uploads.length > 0) {
      const results = await Promise.all(
        uploads.map((u) => fetchFileAsPart(u.file_url, u.file_type, u.file_name))
      );
      fileParts.push(...results.filter((p): p is Part => p !== null));
    }

    const parts: Part[] = [{ text: promptText }, ...fileParts];

    // Call Gemini with multimodal content
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const text = result.response.text().trim();

    // Parse JSON (strip potential markdown fences)
    const clean = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const summary = JSON.parse(clean);

    // Store in projects.ai_summary
    await supabase.from("projects").update({ ai_summary: summary }).eq("id", project_id);

    return NextResponse.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("generate-summary error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
