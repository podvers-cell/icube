"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Camera, Pencil, Plus, Trash2 } from "lucide-react";
import { createRentalEquipment, deleteRentalEquipment, getRentalEquipment, updateRentalEquipment } from "../api";
import MediaSlotList from "../components/dashboard/MediaSlotList";
import {
  rentalAvailabilityLabel,
  rentalImages,
  type RentalAvailability,
  type RentalEquipment,
  type RentalPriceUnit,
} from "../types/rentalEquipment";
import DashboardModal from "../components/dashboard/DashboardModal";
import { Button } from "../components/dashboard/ui";
import { cloudinaryImage } from "@/lib/cloudinaryImage";

const emptyEquipment: RentalEquipment = {
  id: "",
  name: "",
  category: "",
  short_description: "",
  details: "",
  image_url: "",
  image_urls: [],
  price_aed: 0,
  price_unit: "day",
  quantity_available: 1,
  availability_status: "available",
  is_featured: false,
  is_published: true,
  sort_order: 0,
};

const statusClasses: Record<RentalAvailability, string> = {
  available: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  on_request: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  unavailable: "border-red-500/30 bg-red-500/10 text-red-300",
};

export default function DashboardRentalEquipment() {
  const [list, setList] = useState<RentalEquipment[]>([]);
  const [editing, setEditing] = useState<RentalEquipment | null>(null);
  const [saving, setSaving] = useState(false);
  const isCreating = editing?.id === "";

  function load() {
    getRentalEquipment(true).then(setList).catch(() => setList([]));
  }

  useEffect(() => load(), []);

  const sorted = useMemo(
    () => [...list].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)),
    [list]
  );
  const categories = useMemo(
    () => Array.from(new Set(list.map((item) => item.category.trim()).filter(Boolean))).sort(),
    [list]
  );

  function openCreate() {
    setEditing({ ...emptyEquipment, sort_order: list.length });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    const images = (editing.image_urls ?? []).map((url) => url.trim()).filter(Boolean).slice(0, 10);
    const payload = {
      name: editing.name.trim(),
      category: editing.category.trim(),
      short_description: editing.short_description?.trim() ?? "",
      details: editing.details?.trim() ?? "",
      image_urls: images,
      image_url: images[0] ?? "",
      price_aed: Math.max(0, Number(editing.price_aed) || 0),
      price_unit: editing.price_unit,
      quantity_available: Math.max(0, Math.floor(Number(editing.quantity_available) || 0)),
      availability_status: editing.availability_status,
      is_featured: Boolean(editing.is_featured),
      is_published: Boolean(editing.is_published),
      sort_order: Math.max(0, Math.floor(Number(editing.sort_order) || 0)),
    };
    try {
      if (isCreating) await createRentalEquipment(payload);
      else await updateRentalEquipment(editing.id, payload);
      setEditing(null);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save equipment.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this rental equipment item?")) return;
    try {
      await deleteRentalEquipment(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete equipment.");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Rental Equipment</h1>
          <p className="text-gray-500 text-sm mt-1">Manage the equipment catalog, pricing, availability, and display order.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          <Plus size={18} /> Add Equipment
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
          <Camera size={32} className="mx-auto text-icube-gold mb-3" />
          <p className="text-gray-300 font-medium">No rental equipment yet.</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">Add the first item when product details and images are ready.</p>
          <button type="button" onClick={openCreate} className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
            Add first item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sorted.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-icube-gray">
              <div className="aspect-[4/3] bg-black/30 overflow-hidden">
                {rentalImages(item)[0] ? (
                  <img src={cloudinaryImage(rentalImages(item)[0], 300)} alt={item.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-600"><Camera size={38} /></div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-icube-gold">{item.category || "Uncategorized"}</p>
                    <h2 className="text-lg font-display font-semibold text-white mt-1 truncate">{item.name}</h2>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusClasses[item.availability_status]}`}>
                    {rentalAvailabilityLabel(item.availability_status)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2 line-clamp-2 min-h-10">{item.short_description || "No description"}</p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-bold text-icube-gold">{item.price_aed.toLocaleString()} AED</p>
                    <p className="text-xs text-gray-500">per {item.price_unit} · qty {item.quantity_available ?? 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditing({ ...item, image_urls: rentalImages(item) })} aria-label={`Edit ${item.name}`} className="p-2 rounded-full border border-white/15 text-gray-300 hover:text-icube-gold hover:border-icube-gold">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`} className="p-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                  {item.is_featured && <span className="rounded-full bg-icube-gold/10 text-icube-gold px-2.5 py-1">Featured</span>}
                  {!item.is_published && <span className="rounded-full bg-white/10 text-gray-400 px-2.5 py-1">Hidden</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <DashboardModal
          title={isCreating ? "Add rental equipment" : "Edit rental equipment"}
          description="Gear customers can rent, shown on the public Rent Equipment page."
          size="lg"
          onClose={() => setEditing(null)}
          onSubmit={save}
          footer={
            <>
              <Button type="submit" tone="primary" disabled={saving} className="max-sm:flex-1">
                {saving ? "Saving…" : "Save equipment"}
              </Button>
              <Button type="button" tone="secondary" onClick={() => setEditing(null)} disabled={saving} className="max-sm:flex-1">
                Cancel
              </Button>
            </>
          }
        >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Name</span>
                  <input required value={editing.name} onChange={(e) => setEditing((x) => x ? { ...x, name: e.target.value } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
                </label>
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Category</span>
                  <input required list="rental-equipment-categories" value={editing.category} onChange={(e) => setEditing((x) => x ? { ...x, category: e.target.value } : null)} placeholder="e.g. Cameras" className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
                  <datalist id="rental-equipment-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
                </label>
              </div>

              <MediaSlotList
                label="Product images"
                hint="The first image is the cover shown in the catalogue. Up to 10."
                values={editing.image_urls ?? []}
                onChange={(image_urls) => setEditing((x) => (x ? { ...x, image_urls } : null))}
                type="image"
                folder="rental-equipment"
                addLabel="Add an image"
                emptyHint="No images yet. The first one you add becomes the cover."
              />

              <label className="block space-y-1.5 text-sm text-gray-400">
                <span>Short description</span>
                <textarea rows={2} value={editing.short_description ?? ""} onChange={(e) => setEditing((x) => x ? { ...x, short_description: e.target.value } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
              </label>
              <label className="block space-y-1.5 text-sm text-gray-400">
                <span>Full details</span>
                <textarea rows={4} value={editing.details ?? ""} onChange={(e) => setEditing((x) => x ? { ...x, details: e.target.value } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Price (AED)</span>
                  <input type="number" min={0} required value={editing.price_aed} onChange={(e) => setEditing((x) => x ? { ...x, price_aed: Number(e.target.value) } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
                </label>
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Price unit</span>
                  <select value={editing.price_unit} onChange={(e) => setEditing((x) => x ? { ...x, price_unit: e.target.value as RentalPriceUnit } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white">
                    <option value="day">Day</option><option value="week">Week</option><option value="session">Session</option><option value="project">Project</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Quantity</span>
                  <input type="number" min={0} value={editing.quantity_available ?? 0} onChange={(e) => setEditing((x) => x ? { ...x, quantity_available: Number(e.target.value) } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
                </label>
                <label className="space-y-1.5 text-sm text-gray-400">
                  <span>Sort order</span>
                  <input type="number" min={0} value={editing.sort_order} onChange={(e) => setEditing((x) => x ? { ...x, sort_order: Number(e.target.value) } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white" />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm text-gray-400">
                <span>Availability</span>
                <select value={editing.availability_status} onChange={(e) => setEditing((x) => x ? { ...x, availability_status: e.target.value as RentalAvailability } : null)} className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white">
                  <option value="available">Available</option><option value="on_request">On request</option><option value="unavailable">Unavailable</option>
                </select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                  <input type="checkbox" checked={editing.is_published} onChange={(e) => setEditing((x) => x ? { ...x, is_published: e.target.checked } : null)} className="accent-[#D4AF37]" /> Published on website
                </label>
                <label className="flex items-center gap-3 rounded-sm border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300">
                  <input type="checkbox" checked={editing.is_featured} onChange={(e) => setEditing((x) => x ? { ...x, is_featured: e.target.checked } : null)} className="accent-[#D4AF37]" /> Featured equipment
                </label>
              </div>        </DashboardModal>
      )}
    </div>
  );
}
