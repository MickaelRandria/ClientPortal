"use client";

import { useCallback, useRef, useState } from "react";
import { logActivity } from "@/lib/activity";
import { toast } from "sonner";
import {
  File,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Palette,
  Paperclip,
  Upload as UploadIcon,
  X,
  FolderOpen,
  Download,
  PackageCheck,
} from "lucide-react";

/* ── Constants ───────────────────────────────────────────────────── */

const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

const ACCEPTED_MIME = new Set([
  "image/png", "image/jpeg", "image/gif", "image/svg+xml", "image/webp",
  "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo", "video/x-matroska",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
]);

const ACCEPT_STRING =
  ".png,.jpg,.jpeg,.gif,.svg,.webp,.mp4,.mov,.webm,.avi,.mkv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

const CATEGORIES = [
  { id: "charte" as const,  label: "Charte graphique", Icon: Palette,   description: "Logo, guidelines, codes couleurs, typographies" },
  { id: "asset" as const,   label: "Assets visuels",   Icon: ImageIcon,  description: "Photos, illustrations, visuels existants" },
  { id: "contenu" as const, label: "Contenus texte",   Icon: FileText,   description: "Textes, accroches, copy, scripts" },
  { id: "other" as const,   label: "Autres fichiers",  Icon: Paperclip,  description: "Tout autre document utile au projet" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  livraison: "Créations livrées",
  charte:    "Charte graphique",
  asset:     "Assets visuels",
  contenu:   "Contenus texte",
  other:     "Autres fichiers",
};

/* ── Types ───────────────────────────────────────────────────────── */

export interface UploadRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  category: string;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function fileIcon(mimeType: string | null, size = 15) {
  if (!mimeType) return <File size={size} strokeWidth={1.8} />;
  if (mimeType.startsWith("image/")) return <ImageIcon size={size} strokeWidth={1.8} />;
  if (mimeType.startsWith("video/")) return <Film size={size} strokeWidth={1.8} />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return <FileSpreadsheet size={size} strokeWidth={1.8} />;
  return <FileText size={size} strokeWidth={1.8} />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

async function deleteUpload(file: UploadRecord) {
  const R2_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  const isR2 = R2_URL.length > 0 && file.file_url.startsWith(R2_URL);

  if (isR2) {
    const fileKey = file.file_url.slice(R2_URL.length + 1);
    const res = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId: file.id, fileKey }),
    });
    if (!res.ok) throw new Error("Delete failed");
  } else {
    // Legacy Supabase Storage
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const path = file.file_url.split("/project-files/")[1] ?? "";
    const { error } = await supabase.storage.from("project-files").remove([path]);
    if (error) throw error;
    await supabase.from("uploads").delete().eq("id", file.id);
  }
}

/* ── UploadZone ──────────────────────────────────────────────────── */

interface UploadZoneProps {
  cat: (typeof CATEGORIES)[number];
  projectId: string;
  files: UploadRecord[];
  onFileAdded: (record: UploadRecord) => void;
  onFileDeleted: (id: string) => void;
  onFirstUpload?: () => void;
}

function UploadZone({ cat, projectId, files, onFileAdded, onFileDeleted, onFirstUpload }: UploadZoneProps) {
  const { Icon, label, description, id: categoryId } = cat;
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const toUpload = Array.from(fileList);
      const valid: File[] = [];

      for (const file of toUpload) {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} dépasse la limite de 5 Go.`);
          continue;
        }
        const mimeOk = ACCEPTED_MIME.has(file.type) || file.type === "";
        if (!mimeOk) {
          toast.error(`${file.name} : type de fichier non accepté.`);
          continue;
        }
        valid.push(file);
      }
      if (!valid.length) return;

      for (const file of valid) {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

          // 1. Get presigned URL
          const params = new URLSearchParams({
            projectId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            category: categoryId,
          });
          const presignRes = await fetch(`/api/upload/presign?${params}`);
          if (!presignRes.ok) throw new Error("Presign failed");
          const { uploadUrl, fileKey } = await presignRes.json();

          // 2. Upload to R2 with progress tracking
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (ev) => {
              if (ev.lengthComputable) {
                setUploadProgress((prev) => ({
                  ...prev,
                  [file.name]: Math.round((ev.loaded / ev.total) * 100),
                }));
              }
            };
            xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
            xhr.onerror = () => reject(new Error("Erreur réseau"));
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
            xhr.send(file);
          });

          // 3. Confirm in DB
          const confirmRes = await fetch("/api/upload/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              fileKey,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              category: categoryId,
              uploadedBy: "client",
            }),
          });
          if (!confirmRes.ok) throw new Error("Confirm failed");
          const { upload } = await confirmRes.json();
          onFileAdded(upload);
          toast.success(`${file.name} ajouté.`);
          onFirstUpload?.();
        } catch {
          toast.error(`Erreur lors de l'envoi de ${file.name}`);
        } finally {
          setUploadProgress((prev) => { const n = { ...prev }; delete n[file.name]; return n; });
        }
      }
    },
    [projectId, categoryId, onFileAdded, onFirstUpload]
  );

  async function handleDelete(file: UploadRecord) {
    try {
      await deleteUpload(file);
      onFileDeleted(file.id);
      toast.success("Fichier supprimé.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave(e: React.DragEvent) { e.preventDefault(); setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }
  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  const uploadingNames = Object.keys(uploadProgress);
  const hasContent = files.length > 0 || uploadingNames.length > 0;

  return (
    <div
      className="rounded-[20px] p-5 flex flex-col gap-4"
      style={{
        background: "var(--ds-surface)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--ds-border)",
        boxShadow: "var(--ds-shadow-soft)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)" }}>
          <Icon size={17} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>{label}</p>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--ds-text-tertiary)" }}>{description}</p>
        </div>
        {files.length > 0 && (
          <span className="text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0" style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}>
            {files.length}
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 px-4 text-center cursor-pointer select-none transition-all duration-200"
        style={{
          borderColor: dragging ? "var(--ds-mint)" : "rgba(255,255,255,0.08)",
          background: dragging ? "var(--ds-mint-bg)" : "rgba(255,255,255,0.02)",
          outline: "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: dragging ? "var(--ds-mint-bg-active)" : "rgba(255,255,255,0.05)" }}
        >
          <UploadIcon size={16} strokeWidth={1.8} style={{ color: dragging ? "var(--ds-mint-text)" : "var(--ds-text-tertiary)" }} />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "var(--ds-text-secondary)" }}>
            Glisser-déposer ou <span style={{ color: "var(--ds-mint-text)" }}>parcourir</span>
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ds-text-tertiary)" }}>
            Images, vidéos, PDF, Word, Excel · Max 5 Go
          </p>
        </div>
      </div>

      <input ref={inputRef} type="file" multiple accept={ACCEPT_STRING} className="hidden" onChange={onInputChange} />

      {/* Progress bars */}
      {uploadingNames.map((name) => (
        <div key={name} className="rounded-xl p-3" style={{ background: "var(--ds-mint-bg)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold truncate" style={{ color: "var(--ds-mint-text)" }}>{name}</p>
            <p className="text-xs shrink-0 ml-2" style={{ color: "var(--ds-mint-text)" }}>{uploadProgress[name]}%</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full transition-all duration-200" style={{ width: `${uploadProgress[name]}%`, background: "var(--ds-mint-text)" }} />
          </div>
        </div>
      ))}

      {/* File list */}
      {hasContent && files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div style={{ color: "var(--ds-text-tertiary)", flexShrink: 0 }}>{fileIcon(file.file_type)}</div>
              <div className="flex-1 min-w-0">
                <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold truncate block hover:underline" style={{ color: "var(--ds-text-primary)" }}>
                  {file.file_name}
                </a>
                {file.file_size && <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>{formatSize(file.file_size)}</p>}
              </div>
              <button
                onClick={() => handleDelete(file)}
                className="opacity-40 group-hover:opacity-100 transition-opacity rounded-lg p-1.5"
                style={{ color: "var(--ds-red-text)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-red-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── LivraisonsSection ───────────────────────────────────────────── */

function LivraisonsSection({ files }: { files: UploadRecord[] }) {
  if (files.length === 0) return null;
  return (
    <div
      className="rounded-[20px] p-5 flex flex-col gap-3"
      style={{
        background: "rgba(52,211,153,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(52,211,153,0.15)",
        boxShadow: "var(--ds-shadow-soft)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--ds-mint-bg)" }}>
          <PackageCheck size={17} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>Créations livrées</p>
          <p className="text-[11px]" style={{ color: "var(--ds-mint-text)" }}>
            {files.length} fichier{files.length > 1 ? "s" : ""} prêt{files.length > 1 ? "s" : ""} au téléchargement
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.12)" }}
          >
            <div style={{ color: "var(--ds-mint-text)", flexShrink: 0 }}>{fileIcon(file.file_type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "var(--ds-text-primary)" }}>{file.file_name}</p>
              {file.file_size && <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>{formatSize(file.file_size)}</p>}
            </div>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: "var(--ds-mint-bg)" }}
            >
              <Download size={14} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FilesTab ────────────────────────────────────────────────────── */

export default function FilesTab({
  projectId,
  initialFiles,
}: {
  projectId: string;
  initialFiles: UploadRecord[];
}) {
  const [allFiles, setAllFiles] = useState<UploadRecord[]>(initialFiles);
  const hasLoggedUpload = useRef(false);

  function handleFileAdded(record: UploadRecord) {
    setAllFiles((prev) => [record, ...prev]);
  }

  function handleFileDeleted(id: string) {
    setAllFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleFirstUpload() {
    if (!hasLoggedUpload.current) {
      hasLoggedUpload.current = true;
      logActivity({ projectId, actorType: "client", action: "files_uploaded" });
    }
  }

  const livraisonFiles = allFiles.filter((f) => f.category === "livraison");
  const clientFiles = allFiles.filter((f) => f.category !== "livraison");

  return (
    <div className="flex flex-col gap-4">
      {/* Admin deliveries — read only */}
      <LivraisonsSection files={livraisonFiles} />

      {/* Client upload zones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <UploadZone
            key={cat.id}
            cat={cat}
            projectId={projectId}
            files={clientFiles.filter((f) => f.category === cat.id)}
            onFileAdded={handleFileAdded}
            onFileDeleted={handleFileDeleted}
            onFirstUpload={handleFirstUpload}
          />
        ))}
      </div>
    </div>
  );
}
