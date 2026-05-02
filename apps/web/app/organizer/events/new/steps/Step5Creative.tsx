"use client";

import { useRef, useState } from "react";
import { Image, Trash, Video } from "@phosphor-icons/react";
import { useWizard } from "../WizardContext";

async function uploadFile(file: File, path: string): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  try {
    const res = await fetch("/api/upload/cover", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  } catch {
    return null;
  }
}

export function Step5Creative() {
  const { state, setField, dispatch } = useWizard();
  const bannerRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);

  async function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    const url = await uploadFile(file, `events/banner_${Date.now()}`);
    if (url) setField("bannerUrl", url);
    setBannerUploading(false);
    e.target.value = "";
  }

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setGalleryUploading(true);
    for (const file of files.slice(0, 6 - state.galleryUrls.length)) {
      const url = await uploadFile(file, `events/gallery_${Date.now()}`);
      if (url) dispatch({ type: "ADD_GALLERY", url });
    }
    setGalleryUploading(false);
    e.target.value = "";
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Banner image
        </label>
        <div
          className="mt-2 relative overflow-hidden rounded-[16px] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] transition hover:border-[var(--brand)]/40 cursor-pointer"
          style={{ minHeight: state.bannerUrl ? undefined : 140 }}
          onClick={() => bannerRef.current?.click()}
        >
          {state.bannerUrl ? (
            <div className="relative">
              <img
                alt="Event banner"
                className="h-48 w-full rounded-[16px] object-cover"
                src={state.bannerUrl}
              />
              <button
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setField("bannerUrl", null);
                }}
              >
                <Trash size={14} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-8">
              {bannerUploading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              ) : (
                <>
                  <Image size={28} className="text-[var(--text-tertiary)]" weight="thin" />
                  <p className="text-[13px] text-[var(--text-secondary)]">
                    Click to upload banner
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    Recommended: 1200×630px, JPG or PNG
                  </p>
                </>
              )}
            </div>
          )}
          <input
            ref={bannerRef}
            accept="image/*"
            className="sr-only"
            type="file"
            onChange={handleBanner}
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Gallery images{" "}
          <span className="normal-case tracking-normal font-normal text-[var(--text-tertiary)]">
            (up to 6)
          </span>
        </label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {state.galleryUrls.map((url) => (
            <div key={url} className="relative">
              <img
                alt=""
                className="h-24 w-full rounded-[12px] object-cover"
                src={url}
              />
              <button
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                type="button"
                onClick={() => dispatch({ type: "REMOVE_GALLERY", url })}
              >
                <Trash size={12} />
              </button>
            </div>
          ))}
          {state.galleryUrls.length < 6 && (
            <button
              className="flex h-24 items-center justify-center rounded-[12px] border border-dashed border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:border-[var(--brand)]/40 hover:text-[var(--brand)]"
              type="button"
              onClick={() => galleryRef.current?.click()}
            >
              {galleryUploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              ) : (
                <Image size={20} weight="thin" />
              )}
            </button>
          )}
        </div>
        <input
          ref={galleryRef}
          accept="image/*"
          className="sr-only"
          multiple
          type="file"
          onChange={handleGallery}
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">
          Video URL{" "}
          <span className="normal-case tracking-normal font-normal text-[var(--text-tertiary)]">
            (optional — YouTube or Vimeo)
          </span>
        </label>
        <div className="relative mt-2">
          <Video
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            size={16}
          />
          <input
            className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 pl-10 pr-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)]/50 focus:outline-none"
            placeholder="https://youtube.com/..."
            type="url"
            value={state.videoUrl ?? ""}
            onChange={(e) => setField("videoUrl", e.target.value || null)}
          />
        </div>
      </div>
    </div>
  );
}
