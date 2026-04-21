"use client";

import { useRef, useState } from "react";
import { Camera } from "@phosphor-icons/react";
import { compressForUpload } from "../../lib/compress-image";

type ImageType = "avatar" | "banner" | "logo" | "snippet";

const UPLOAD_ENDPOINTS: Record<ImageType, string> = {
  avatar:  "/api/upload/avatar",
  banner:  "/api/upload/banner",
  logo:    "/api/upload/logo",
  snippet: "/api/upload/banner",
};

type Props = {
  type: ImageType;
  onUpload: (url: string) => void;
  className?: string;
  children?: React.ReactNode;
};

export function ImageUploadButton({ type, onUpload, className, children }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await compressForUpload(file, type);
      const fd = new FormData();
      fd.append("file", compressed, `upload.webp`);
      const res = await fetch(UPLOAD_ENDPOINTS[type], { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json() as { url: string };
      onUpload(url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={className}
      >
        {children ?? (
          <span className="flex items-center gap-1.5">
            {uploading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Camera size={14} />
            )}
            {uploading ? "Uploading…" : "Upload photo"}
          </span>
        )}
      </button>
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </>
  );
}
