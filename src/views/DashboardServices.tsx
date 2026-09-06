"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Pencil, RefreshCcw, Trash2 } from "lucide-react";
import { api } from "../api";
import DashboardModal from "../components/dashboard/DashboardModal";
import { Button } from "../components/dashboard/ui";

type CaseStudyItem = {
  title: string;
  client?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
  image_url?: string;
  video_url?: string;
  metrics?: string[];
};

type Service = {
  id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  case_study_intro?: string;
  case_studies?: string;
};

type ServiceForm = Omit<Service, "case_studies"> & {
  case_studies: CaseStudyItem[];
};

const ICONS = ["Mic", "MonitorPlay", "Share2", "Video", "Clapperboard"];

const DEMO_CASE_STUDIES: CaseStudyItem[] = [
  {
    title: "Podcast launch campaign",
    client: "Tech brand in Dubai",
    challenge: "Needed consistent weekly episodes with fast publishing cadence.",
    solution: "Built a 3-camera production workflow and reusable post templates.",
    outcome: "Delivered 12 episodes in 6 weeks with stable publishing quality.",
    image_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=1400&auto=format&fit=crop",
    metrics: ["12 Episodes", "6 Weeks", "3 Cameras"],
  },
];

function safeParseArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    if (!raw.trim()) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export default function DashboardServices() {
  const [list, setList] = useState<Service[]>([]);
  const [editing, setEditing] = useState<ServiceForm | null>(null);
  const [creating, setCreating] = useState(false);
  const [cleaningLegacy, setCleaningLegacy] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string>("");

  function load() {
    api.get<Service[]>("/dashboard/services").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  const editingPayload = useMemo(() => {
    if (!editing) return null;
    return {
      ...editing,
      case_studies: JSON.stringify(editing.case_studies ?? []),
      remove_legacy_case_study_fields: true,
    };
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
          case_study_intro: editingPayload.case_study_intro ?? "",
          case_studies: editingPayload.case_studies,
        });
      } else {
        await api.put(`/dashboard/services/${editing.id}`, editingPayload);
      }
      setEditing(null);
      setCreating(false);
      load();
      setSaveNotice("Saved to Firebase successfully. Service page content updated.");
      setTimeout(() => setSaveNotice(""), 3000);
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
      case_study_intro: "",
      case_studies: DEMO_CASE_STUDIES,
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

  async function cleanupLegacyFields() {
    if (!list.length) return;
    if (!confirm("This will remove old case study fields from all service documents in Firebase. Continue?")) return;
    setCleaningLegacy(true);
    try {
      for (const s of list) {
        await api.put(`/dashboard/services/${s.id}`, {
          title: s.title,
          description: s.description,
          icon: s.icon,
          sort_order: s.sort_order,
          case_study_intro: s.case_study_intro ?? "",
          case_studies: s.case_studies ?? "[]",
          remove_legacy_case_study_fields: true,
        });
      }
      alert("Legacy case study fields removed from Firebase services collection.");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Legacy cleanup failed");
    } finally {
      setCleaningLegacy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Services</h1>
          <p className="mt-1 text-sm text-gray-500">Manage service cards and the new case study details page content.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cleanupLegacyFields}
            disabled={cleaningLegacy || list.length === 0}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:border-icube-gold hover:text-icube-gold disabled:opacity-50"
          >
            <RefreshCcw size={14} className={cleaningLegacy ? "animate-spin" : ""} />
            Clean legacy case-study fields
          </button>
          <button onClick={openCreate} className="rounded-sm bg-icube-gold px-4 py-2 font-semibold text-icube-dark hover:bg-icube-gold-light">
            Add Service
          </button>
        </div>
      </div>
      {saveNotice ? (
        <div className="mb-4 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveNotice}
        </div>
      ) : null}

      {list.length === 0 ? (
        <div className="rounded-sm border border-dashed border-white/15 bg-icube-gray p-8 text-center text-gray-400">
          <p className="mb-3">No services yet.</p>
          <button onClick={openCreate} className="rounded-sm bg-icube-gold px-4 py-2 font-semibold text-icube-dark hover:bg-icube-gold-light">
            Create the first service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-sm border border-white/10 bg-icube-gray p-4">
              <div>
                <p className="font-semibold text-white">{s.title}</p>
                <p className="line-clamp-1 text-sm text-gray-500">{s.description}</p>
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
                      case_study_intro: s.case_study_intro ?? "",
                      case_studies: safeParseArray<CaseStudyItem>(s.case_studies, DEMO_CASE_STUDIES),
                    });
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-gray-300 transition-colors hover:border-icube-gold hover:text-icube-gold"
                  aria-label="Edit service"
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/5 text-red-400 transition-colors hover:bg-red-500/15"
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
        <DashboardModal
          title={creating ? "Add service" : "Edit service"}
          description="Service cards and their case-study page content."
          size="xl"
          onClose={() => setEditing(null)}
          onSubmit={save}
          footer={
            <>
              <Button type="submit" tone="primary" className="max-sm:flex-1">
                Save service
              </Button>
              <Button type="button" tone="secondary" onClick={() => setEditing(null)} className="max-sm:flex-1">
                Cancel
              </Button>
            </>
          }
        >
              <section className="space-y-3 rounded-sm border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Service card data</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Service title (shown on the card)</label>
                  <input
                    value={editing.title}
                    onChange={(e) => setEditing((x) => (x ? { ...x, title: e.target.value } : null))}
                    className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    placeholder="Example: Podcast Production"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Card description (short summary)</label>
                  <textarea
                    value={editing.description}
                    onChange={(e) => setEditing((x) => (x ? { ...x, description: e.target.value } : null))}
                    rows={3}
                    className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    placeholder="Short summary displayed in Services cards."
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Icon</label>
                    <select
                      value={editing.icon}
                      onChange={(e) => setEditing((x) => (x ? { ...x, icon: e.target.value } : null))}
                      className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    >
                      {ICONS.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-300">Sort order (smaller shows first)</label>
                    <input
                      type="number"
                      value={editing.sort_order}
                      onChange={(e) =>
                        setEditing((x) => (x ? { ...x, sort_order: Number(e.target.value || 0) } : null))
                      }
                      className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-2 rounded-sm border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Service details page intro</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-300">Intro paragraph (top of `/services/[id]` page)</label>
                  <textarea
                    value={editing.case_study_intro ?? ""}
                    onChange={(e) => setEditing((x) => (x ? { ...x, case_study_intro: e.target.value } : null))}
                    rows={3}
                    className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                    placeholder="Add a brief intro for this service details page."
                  />
                </div>
              </section>

              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Case studies</p>
                    <p className="text-xs text-gray-400">Each case study appears as a block in the public service page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing((x) =>
                        x
                          ? {
                              ...x,
                              case_studies: [
                                ...(x.case_studies || []),
                                { title: "", client: "", challenge: "", solution: "", outcome: "", image_url: "", video_url: "", metrics: [] },
                              ],
                            }
                          : null
                      )
                    }
                    className="text-xs font-semibold uppercase tracking-wider text-icube-gold hover:text-icube-gold-light"
                  >
                    + Add case study
                  </button>
                </div>

                {(editing.case_studies || []).map((cs, idx) => (
                  <div key={idx} className="space-y-2 rounded-sm border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Case study {idx + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.filter((_, i) => i != idx) } : null
                          )
                        }
                        className="rounded-sm border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Case title</label>
                      <input
                        value={cs.title}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, title: e.target.value } : v)) } : null
                          )
                        }
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="Example: Product Launch Campaign"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Client name</label>
                      <input
                        value={cs.client ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, client: e.target.value } : v)) } : null
                          )
                        }
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="Example: Brand / Company"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Challenge</label>
                      <textarea
                        value={cs.challenge ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, challenge: e.target.value } : v)) } : null
                          )
                        }
                        rows={2}
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="What problem did the client have?"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Solution</label>
                      <textarea
                        value={cs.solution ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, solution: e.target.value } : v)) } : null
                          )
                        }
                        rows={2}
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="How did your team execute the service?"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Outcome</label>
                      <textarea
                        value={cs.outcome ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, outcome: e.target.value } : v)) } : null
                          )
                        }
                        rows={2}
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="What was the result?"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Case image URL</label>
                      <input
                        value={cs.image_url ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, image_url: e.target.value } : v)) } : null
                          )
                        }
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Case video URL (YouTube/Vimeo or direct link)</label>
                      <input
                        value={cs.video_url ?? ""}
                        onChange={(e) =>
                          setEditing((x) =>
                            x ? { ...x, case_studies: x.case_studies.map((v, i) => (i === idx ? { ...v, video_url: e.target.value } : v)) } : null
                          )
                        }
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-300">Metrics (comma separated)</label>
                      <input
                        value={(cs.metrics || []).join(", ")}
                        onChange={(e) =>
                          setEditing((x) =>
                            x
                              ? {
                                  ...x,
                                  case_studies: x.case_studies.map((v, i) =>
                                    i === idx
                                      ? {
                                          ...v,
                                          metrics: e.target.value
                                            .split(",")
                                            .map((m) => m.trim())
                                            .filter(Boolean),
                                        }
                                      : v
                                  ),
                                }
                              : null
                          )
                        }
                        className="w-full rounded-sm border border-white/10 bg-black/50 p-3 text-white"
                        placeholder="Example: 12 Videos, 4 Weeks, 2M Views"
                      />
                    </div>
                  </div>
                ))}
              </div>        </DashboardModal>
      )}
    </div>
  );
}
