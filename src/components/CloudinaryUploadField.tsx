"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { uploadToCloudinaryWithProgress } from "../lib/uploadCloudinary";

type Props = {
  value: string;
  onChange: (url: string) => void;
  type: "image" | "video";
  folder?: string;
  label?: string;
  placeholder?: string;
  className?: string;
};

export default function CloudinaryUploadField({
  value,
  onChange,
  type,
  folder = "icube",
  label,
  placeholder,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadToCloudinaryWithProgress(file, {
        folder,
        type,
        onProgress: (p) => setProgress(p),
      });
      onChange(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = "";
    }
  }

  return (
    <div className={className}>
      {label && <label className="block text-sm text-gray-400 mb-1">{label}</label>}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black/50 border border-white/10 p-3 rounded-sm text-white min-w-0"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-white/10 border border-white/10 rounded-sm text-sm text-gray-200 hover:bg-white/15 disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          {uploading ? `${progress}%` : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={type === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {uploading && (
        <div className="mt-2">
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-icube-gold rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Uploading… {progress}% {progress < 100 ? "(sending to server)" : "(processing)"}
          </p>
        </div>
      )}
    </div>
  );
}
