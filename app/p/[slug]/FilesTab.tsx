"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase";
import {
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Palette,
  Paperclip,
  Upload as UploadIcon,
  X,
  FolderOpen,
} from "lucide-react";

/* ── Constants ───────────────────────────────────────────────────── */

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ACCEPTED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
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
  ".png,.jpg,.jpeg,.gif,.svg,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv";

const CATEGORIES = [
  {
    id: "charte" as const,
    label: "Charte graphique",
    Icon: Palette,
    description: "Logo, guidelines, codes couleurs, typographies",
  },
  {
    id: "asset" as const,
    label: "Assets visuels",
    Icon: ImageIcon,
    description: "Photos, illustrations, visuels existants",
  },
  {
    id: "contenu" as const,
    label: "Contenus texte",
    Icon: FileText,
    description: "Textes, accroches, copy, scripts",
  },
  {
    id: "other" as const,
    label: "Autres fichiers",
    Icon: Paperclip,
    description: "Tout autre document utile au projet",
  },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  charte: "Charte graphique",
  asset: "Assets visuels",
  contenu: "Contenus texte",
  other: "Autres fichiers",
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

interface PendingFile {
  name: string;
  size: number;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function fileIcon(mimeType: string | null, size = 15) {
  if (!mimeType) return <File size={size} strokeWidth={1.8} />;
  if (mimeType.startsWith("image/")) return <ImageIcon size={size} strokeWidth={1.8} />;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return <FileSpreadsheet size={size} strokeWidth={1.8} />;
  return <FileText size={size} strokeWidth={1.8} />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function storagePath(fileUrl: string): string {
  return fileUrl.split("/project-files/")[1] ?? "";
}

/* ── UploadZone ──────────────────────────────────────────────────── */

interface UploadZoneProps {
  cat: (typeof CATEGORIES)[number];
  projectId: string;
  files: UploadRecord[];
  onFileAdded: (record: UploadRecord) => void;
  onFileDeleted: (id: string) => void;
}

function UploadZone({ cat, projectId, files, onFileAdded, onFileDeleted }: UploadZoneProps) {
  const { Icon, label, description, id: categoryId } = cat;
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList) => {
      const toUpload = Array.from(fileList);

      const valid: File[] = [];
      for (const file of toUpload) {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} dépasse la limite de 10 Mo.`);
          continue;
        }
        if (!ACCEPTED_MIME.has(file.type)) {
          toast.error(`${file.name} : type de fichier non accepté.`);
          continue;
        }
        valid.push(file);
      }
      if (!valid.length) return;

      setPending((p) => [...p, ...valid.map((f) => ({ name: f.name, size: f.size }))]);

      const supabase = createClient();

      for (const file of valid) {
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const path = `${projectId}/${categoryId}/${safeName}`;

        const { error: storageError } = await supabase.storage
          .from("project-files")
          .upload(path, file, { upsert: false });

        if (storageError) {
          toast.error(`Erreur upload : ${file.name}`);
          setPending((p) => p.filter((pf) => pf.name !== file.name));
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(path);

        const { data: record, error: dbError } = await supabase
          .from("uploads")
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            file_type: file.type,
            category: categoryId,
            uploaded_by: "client",
          })
          .select("id, file_name, file_url, file_size, file_type, category")
          .single();

        setPending((p) => p.filter((pf) => pf.name !== file.name));

        if (dbError || !record) {
          toast.error(`Erreur d'enregistrement : ${file.name}`);
        } else {
          onFileAdded(record);
          toast.success(`${file.name} ajouté.`);
        }
      }
    },
    [projectId, categoryId, onFileAdded]
  );

  async function handleDelete(file: UploadRecord) {
    const supabase = createClient();
    const path = storagePath(file.file_url);

    const { error } = await supabase.storage.from("project-files").remove([path]);
    if (error) {
      toast.error("Erreur lors de la suppression.");
      return;
    }

    await supabase.from("uploads").delete().eq("id", file.id);
    onFileDeleted(file.id);
    toast.success("Fichier supprimé.");
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

  const hasContent = files.length > 0 || pending.length > 0;

  return (
    <div
      className="rounded-[20px] p-5 flex flex-col gap-4"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      {/* Zone header */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--ds-mint-bg)" }}
        >
          <Icon size={17} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>
            {label}
          </p>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: "var(--ds-text-tertiary)" }}>
            {description}
          </p>
        </div>
        {files.length > 0 && (
          <span
            className="text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0"
            style={{ background: "var(--ds-mint-bg)", color: "var(--ds-mint-text)" }}
          >
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
          borderColor: dragging ? "var(--ds-mint)" : "rgba(0,0,0,0.09)",
          background: dragging ? "var(--ds-mint-bg)" : "rgba(0,0,0,0.01)",
          outline: "none",
        }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ background: dragging ? "var(--ds-mint-bg-active)" : "rgba(0,0,0,0.04)" }}
        >
          <UploadIcon
            size={16}
            strokeWidth={1.8}
            style={{ color: dragging ? "var(--ds-mint-text)" : "var(--ds-text-tertiary)" }}
          />
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "var(--ds-text-secondary)" }}>
            Glisser-déposer ou{" "}
            <span style={{ color: "var(--ds-mint-text)" }}>parcourir</span>
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ds-text-tertiary)" }}>
            PNG, JPG, PDF, Word, Excel, PPT · Max 10 Mo
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_STRING}
        className="hidden"
        onChange={onInputChange}
      />

      {/* File list */}
      {hasContent && (
        <div className="flex flex-col gap-1.5">
          {pending.map((pf) => (
            <div
              key={pf.name}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{ background: "var(--ds-mint-bg)" }}
            >
              <Loader2
                size={15}
                strokeWidth={1.8}
                className="animate-spin shrink-0"
                style={{ color: "var(--ds-mint-text)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--ds-mint-text)" }}>
                  {pf.name}
                </p>
                <p className="text-[11px]" style={{ color: "var(--ds-mint-text)", opacity: 0.7 }}>
                  Envoi en cours… · {formatSize(pf.size)}
                </p>
              </div>
            </div>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-colors"
              style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
            >
              <div style={{ color: "var(--ds-text-tertiary)", flexShrink: 0 }}>
                {fileIcon(file.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold truncate block hover:underline"
                  style={{ color: "var(--ds-text-primary)" }}
                >
                  {file.file_name}
                </a>
                {file.file_size && (
                  <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                    {formatSize(file.file_size)}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(file)}
                className="opacity-40 group-hover:opacity-100 transition-opacity rounded-lg p-1.5"
                style={{ color: "var(--ds-red-text)" }}
                title="Supprimer"
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

/* ── FilesRecap ──────────────────────────────────────────────────── */

function FilesRecap({ files, onDelete }: { files: UploadRecord[]; onDelete: (id: string) => void }) {
  async function handleDelete(file: UploadRecord) {
    const supabase = createClient();
    const path = storagePath(file.file_url);
    const { error } = await supabase.storage.from("project-files").remove([path]);
    if (error) { toast.error("Erreur lors de la suppression."); return; }
    await supabase.from("uploads").delete().eq("id", file.id);
    onDelete(file.id);
    toast.success("Fichier supprimé.");
  }

  return (
    <div
      className="rounded-[20px] p-5"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--ds-mint-bg)" }}
        >
          <FolderOpen size={17} strokeWidth={1.8} style={{ color: "var(--ds-mint-text)" }} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm" style={{ color: "var(--ds-text-primary)" }}>
            Fichiers envoyés
          </p>
          <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
            {files.length} fichier{files.length > 1 ? "s" : ""} au total
          </p>
        </div>
      </div>

      {/* File list */}
      <div className="flex flex-col gap-1.5">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-colors"
            style={{ background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)" }}
          >
            <div style={{ color: "var(--ds-text-tertiary)", flexShrink: 0 }}>
              {fileIcon(file.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <a
                href={file.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold truncate block hover:underline"
                style={{ color: "var(--ds-text-primary)" }}
              >
                {file.file_name}
              </a>
              <p className="text-[11px]" style={{ color: "var(--ds-text-tertiary)" }}>
                {CATEGORY_LABELS[file.category] ?? file.category}
                {file.file_size ? ` · ${formatSize(file.file_size)}` : ""}
              </p>
            </div>
            <button
              onClick={() => handleDelete(file)}
              className="opacity-40 group-hover:opacity-100 transition-opacity rounded-lg p-1.5"
              style={{ color: "var(--ds-red-text)" }}
              title="Supprimer"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-red-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <X size={13} strokeWidth={2} />
            </button>
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

  function handleFileAdded(record: UploadRecord) {
    setAllFiles((prev) => [record, ...prev]);
  }

  function handleFileDeleted(id: string) {
    setAllFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Recap — only shown if there are files */}
      {allFiles.length > 0 && (
        <FilesRecap files={allFiles} onDelete={handleFileDeleted} />
      )}

      {/* Upload zones by category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <UploadZone
            key={cat.id}
            cat={cat}
            projectId={projectId}
            files={allFiles.filter((f) => f.category === cat.id)}
            onFileAdded={handleFileAdded}
            onFileDeleted={handleFileDeleted}
          />
        ))}
      </div>
    </div>
  );
}
