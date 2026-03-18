"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../api";

type CaseStudyStat = { label: string; value: string | number; sub?: string };
type CaseStudyInfographic = { title: string; description?: string; image_url?: string };

type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  case_study_stats?: string;
  case_study_infographics?: string;
};

type ServiceForm = Omit<Service, "case_study_stats" | "case_study_infographics"> & {
  case_study_stats: CaseStudyStat[];
  case_study_infographics: CaseStudyInfographic[];
};

const ICONS = ["Mic", "MonitorPlay", "Share2", "Video", "Clapperboard"];

const DEMO_STATS: CaseStudyStat[] = [
  { label: "Deliverables", value: 24, sub: "Reels & cuts" },
  { label: "Shoot time", value: "6h", sub: "On-set production" },
  { label: "Turnaround", value: "72h", sub: "Edit & delivery" },
  { label: "Platforms", value: 4, sub: "IG / TikTok / YouTube / X" },
];

const DEMO_INFOGRAPHICS: CaseStudyInfographic[] = [
  {
    title: "Audience growth",
    description: "+38% in 30 days after launch",
    image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1400&auto=format&fit=crop",
  },
  {
    title: "Content breakdown",
    description: "Hooks, captions, pacing, and cut patterns used",
    image_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1400&auto=format&fit=crop",
  },
];

function safeParseArray<T>(raw: string | undefined, fallback: T[]): T[] {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export default function DashboardServices() {
  const [list, setList] = useState<Service[]>([]);
  const [editing, setEditing] = useState<ServiceForm | null>(null);
  const [creating, setCreating] = useState(false);

  function load() {
    api.get<Service[]>("/dashboard/services").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  const editingPayload = useMemo(() => {
    if (!editing) return null;
    return {
      ...editing,
      case_study_stats: JSON.stringify(editing.case_study_stats ?? []),
      case_study_infographics: JSON.stringify(editing.case_study_infographics ?? []),
    } as Service;
  }, [editing]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing || !editingPayload) return;
    try {
      if (creating) {
        await api.post("/dashboard/services", {
          title: editingPayload.title,
          description: editingPayload.description,
          icon: editingPayload.icon,
          sort_order: editingPayload.sort_order ?? list.length,
          case_study_stats: editingPayload.case_study_stats,
          case_study_infographics: editingPayload.case_study_infographics,
        });
      } else {
        await api.put(`/dashboard/services/${editingPayload.id}`, editingPayload);
      }
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  function openCreate() {
    setCreating(true);
    setEditing({
      id: "",
      title: "",
      description: "",
      icon: ICONS[0],
      sort_order: list.length,
      case_study_stats: DEMO_STATS,
      case_study_infographics: DEMO_INFOGRAPHICS,
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    try {
      await api.delete(`/dashboard/services/${id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Services</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage the production services shown on the public website.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
        >
          Add Service
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-icube-gray border border-dashed border-white/15 rounded-sm p-8 text-center text-gray-400">
          <p className="mb-3">No services yet.</p>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm hover:bg-icube-gold-light"
          >
            Create the first service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((s) => (
            <div
              key={s.id}
              className="bg-icube-gray border border-white/10 rounded-sm p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="text-gray-500 text-sm line-clamp-1">{s.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setEditing({
                      id: s.id,
                      title: s.title,
                      description: s.description,
                      icon: s.icon,
                      sort_order: s.sort_order,
                      case_study_stats: safeParseArray<CaseStudyStat>(s.case_study_stats, DEMO_STATS),
                      case_study_infographics: safeParseArray<CaseStudyInfographic>(s.case_study_infographics, DEMO_INFOGRAPHICS),
                    });
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/15 text-gray-300 hover:border-icube-gold hover:text-icube-gold transition-colors"
                  aria-label="Edit service"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/5 border border-red-500/30 text-red-400 hover:bg-red-500/15 transition-colors"
                  aria-label="Delete service"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-icube-gray border border-white/10 rounded-sm max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-display font-bold text-white">
                {creating ? "Add Service" : "Edit Service"}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
            <input
              value={editing.title}
              onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Title"
            />
            <textarea
              value={editing.description}
              onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))}
              rows={3}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
              placeholder="Description"
            />
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Case study stats</p>
                <button
                  type="button"
                  onClick={() =>
                    setEditing((x) =>
                      x ? { ...x, case_study_stats: [...(x.case_study_stats || []), { label: "", value: "", sub: "" }] } : null
                    )
                  }
                  className="text-xs font-semibold uppercase tracking-wider text-icube-gold hover:text-icube-gold-light"
                >
                  + Add stat
                </button>
              </div>
              <div className="space-y-2">
                {(editing.case_study_stats || []).map((st, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      value={st.label}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_stats: x.case_study_stats.map((s, i) => (i === idx ? { ...s, label: e.target.value } : s)),
                              }
                            : null
                        )
                      }
                      className="sm:col-span-4 bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Label (e.g. Deliverables)"
                    />
                    <input
                      value={String(st.value ?? "")}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_stats: x.case_study_stats.map((s, i) => (i === idx ? { ...s, value: e.target.value } : s)),
                              }
                            : null
                        )
                      }
                      className="sm:col-span-3 bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Value (e.g. 24)"
                    />
                    <input
                      value={st.sub ?? ""}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_stats: x.case_study_stats.map((s, i) => (i === idx ? { ...s, sub: e.target.value } : s)),
                              }
                            : null
                        )
                      }
                      className="sm:col-span-4 bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Sub text (optional)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((x) =>
                          x ? { ...x, case_study_stats: x.case_study_stats.filter((_, i) => i !== idx) } : null
                        )
                      }
                      className="sm:col-span-1 px-3 py-2 rounded-sm bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
                      aria-label="Remove stat"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Case study infographics</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEditing((x) => {
                        if (!x) return null;
                        const stats = x.case_study_stats || [];
                        const auto = stats
                          .filter((s) => (s.label ?? "").trim())
                          .map((s) => ({
                            title: String(s.label ?? "").trim(),
                            description: [s.value != null && String(s.value).trim() ? String(s.value).trim() : "", (s.sub ?? "").trim()]
                              .filter(Boolean)
                              .join(" · "),
                            image_url: "",
                          }));
                        return { ...x, case_study_infographics: auto.length ? auto : x.case_study_infographics };
                      })
                    }
                    className="text-xs font-semibold uppercase tracking-wider text-gray-300 hover:text-icube-gold transition-colors"
                  >
                    Auto-generate
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing((x) =>
                        x
                          ? {
                              ...x,
                              case_study_infographics: [
                                ...(x.case_study_infographics || []),
                                { title: "", description: "", image_url: "" },
                              ],
                            }
                          : null
                      )
                    }
                    className="text-xs font-semibold uppercase tracking-wider text-icube-gold hover:text-icube-gold-light"
                  >
                    + Add infographic
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {(editing.case_study_infographics || []).map((ig, idx) => (
                  <div key={idx} className="rounded-sm border border-white/10 bg-black/20 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Infographic {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((x) =>
                            x ? { ...x, case_study_infographics: x.case_study_infographics.filter((_, i) => i !== idx) } : null
                          )
                        }
                        className="px-3 py-1.5 rounded-sm bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={ig.title}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_infographics: x.case_study_infographics.map((v, i) => (i === idx ? { ...v, title: e.target.value } : v)),
                              }
                            : null
                        )
                      }
                      className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Title"
                    />
                    <input
                      value={ig.image_url ?? ""}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_infographics: x.case_study_infographics.map((v, i) =>
                                  i === idx ? { ...v, image_url: e.target.value } : v
                                ),
                              }
                            : null
                        )
                      }
                      className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Image URL (optional)"
                    />
                    <textarea
                      value={ig.description ?? ""}
                      onChange={(e) =>
                        setEditing((x) =>
                          x
                            ? {
                                ...x,
                                case_study_infographics: x.case_study_infographics.map((v, i) =>
                                  i === idx ? { ...v, description: e.target.value } : v
                                ),
                              }
                            : null
                        )
                      }
                      rows={2}
                      className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
                      placeholder="Description (optional)"
                    />
                  </div>
                ))}
              </div>
            </div>
            <select
              value={editing.icon}
              onChange={(e) => setEditing((x) => (x ? { ...x, icon: e.target.value } : null))}
              className="w-full bg-black/50 border border-white/10 p-3 rounded-sm text-white"
            >
              {ICONS.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            </div>
            <div className="p-6 border-t border-white/10 flex gap-2 bg-icube-gray/80">
              <button type="submit" className="px-4 py-2 bg-icube-gold text-icube-dark font-semibold rounded-sm">
                Save
              </button>
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 bg-white/10 text-white rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
