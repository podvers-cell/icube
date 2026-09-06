"use client";

import { useId } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Film, ImageIcon, Plus, Trash2 } from "lucide-react";
import CloudinaryUploadField from "../CloudinaryUploadField";

/**
 * One slot per item, instead of a textarea of newline-separated URLs.
 *
 * The old form asked the studio to paste every video and every gallery image into a single text
 * box, one per line. Nothing showed what had been added, a stray line break silently created a
 * broken entry, and reordering meant retyping. Each entry now owns a row it can be previewed,
 * replaced, reordered and removed in.
 */

type Props = {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
  type: "image" | "video";
  folder: string;
  addLabel: string;
  emptyHint: string;
};

function isImageish(url: string): boolean {
  return /^https?:\/\//i.test(url) && /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(url);
}

export default function MediaSlotList({
  label,
  hint,
  values,
  onChange,
  type,
  folder,
  addLabel,
  emptyHint,
}: Props) {
  const groupId = useId();
  const Icon = type === "video" ? Film : ImageIcon;

  function update(index: number, url: string) {
    onChange(values.map((value, i) => (i === index ? url : value)));
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <section aria-labelledby={groupId}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div>
          <h3 id={groupId} className="text-sm font-semibold text-white">
            {label}
          </h3>
          {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        <span className="shrink-0 text-xs text-gray-500">
          {values.length} {values.length === 1 ? "item" : "items"}
        </span>
      </div>

      {values.length === 0 ? (
        <p className="rounded-sm border border-dashed border-white/15 p-4 text-center text-xs text-gray-500">
          {emptyHint}
        </p>
      ) : (
        <ol className="space-y-2">
          {values.map((value, index) => (
            <li
              key={index}
              /* The URL field drops to its own line below sm: sharing one row with the thumbnail,
                 the upload button and four controls left it a few pixels wide on a phone. */
              className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-3"
            >
              <span className="w-5 shrink-0 text-center text-xs font-semibold text-gray-500">
                {index + 1}
              </span>

              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/50">
                {type === "image" && isImageish(value) ? (
                  <Image src={value} alt="" fill sizes="64px" className="object-cover" unoptimized />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-white/25">
                    <Icon size={18} aria-hidden />
                  </span>
                )}
              </div>

              <div className="order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1">
                <CloudinaryUploadField
                  value={value}
                  onChange={(url) => update(index, url)}
                  type={type}
                  folder={folder}
                  placeholder="https://… or click Upload"
                />
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${label} ${index + 1} up`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors hover:border-icube-gold hover:text-icube-gold disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-gray-400"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === values.length - 1}
                  aria-label={`Move ${label} ${index + 1} down`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-gray-400 transition-colors hover:border-icube-gold hover:text-icube-gold disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-gray-400"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove ${label} ${index + 1}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-500/30 bg-red-500/5 text-red-400 transition-colors hover:bg-red-500/15"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="mt-2 inline-flex items-center gap-2 rounded-sm border border-white/15 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:border-icube-gold/50 hover:text-icube-gold"
      >
        <Plus size={15} /> {addLabel}
      </button>
    </section>
  );
}
