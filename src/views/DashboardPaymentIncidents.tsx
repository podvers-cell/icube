"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, RotateCcw } from "lucide-react";
import { getPaymentIncidents, resolvePaymentIncident } from "../api";
import {
  formatMinorAmount,
  incidentSummary,
  type PaymentIncident,
} from "../types/paymentIncident";

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-AE", { dateStyle: "medium", timeStyle: "short" });
}

function IncidentCard({
  incident,
  onResolve,
  busy,
}: {
  incident: PaymentIncident;
  onResolve: (incident: PaymentIncident, next: "open" | "resolved") => void;
  busy: boolean;
}) {
  const { title, action } = incidentSummary(incident.type);
  const open = incident.status !== "resolved";
  const amountsDiffer =
    incident.expected_amount_minor != null &&
    incident.paid_amount_minor != null &&
    incident.expected_amount_minor !== incident.paid_amount_minor;

  return (
    <article
      className={`rounded-sm border p-5 ${
        open ? "border-red-400/40 bg-red-500/5" : "border-white/10 bg-icube-gray"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base font-semibold text-white">{title}</h3>
            {open ? (
              <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-red-300">
                Needs action
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                Resolved
              </span>
            )}
            {incident.refund_status === "required" && open && (
              <span className="rounded-full border border-icube-gold/40 bg-icube-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-icube-gold">
                Refund required
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{action}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-lg font-bold text-white">
            {formatMinorAmount(incident.paid_amount_minor, incident.paid_currency)}
          </p>
          <p className="text-xs text-gray-500">paid</p>
          {amountsDiffer && (
            <p className="mt-1 text-xs text-gray-500">
              expected {formatMinorAmount(incident.expected_amount_minor, incident.expected_currency)}
            </p>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-gray-500">Customer</dt>
          <dd className="min-w-0 truncate text-gray-300">{incident.customer_email || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Phone</dt>
          <dd className="text-gray-300">{incident.customer_phone || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Reference</dt>
          <dd className="min-w-0 truncate font-mono text-xs text-gray-400">{incident.source_id || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-gray-500">Happened</dt>
          <dd className="text-gray-300">{formatDate(incident.created_at)}</dd>
        </div>
      </dl>

      {incident.resolution_note && (
        <p className="mt-3 rounded-sm border border-white/10 bg-black/30 p-3 text-sm text-gray-400">
          {incident.resolution_note}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        {open ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onResolve(incident, "resolved")}
            className="inline-flex items-center gap-2 rounded-sm bg-icube-gold px-4 py-2 text-sm font-semibold text-icube-dark transition-colors hover:bg-icube-gold-light disabled:opacity-50"
          >
            <Check size={16} /> Mark handled
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onResolve(incident, "open")}
            className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:border-icube-gold/50 hover:text-icube-gold disabled:opacity-50"
          >
            <RotateCcw size={16} /> Reopen
          </button>
        )}
      </div>
    </article>
  );
}

export default function DashboardPaymentIncidents() {
  const [incidents, setIncidents] = useState<PaymentIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setIncidents(await getPaymentIncidents());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment incidents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openIncidents = useMemo(() => incidents.filter((i) => i.status !== "resolved"), [incidents]);
  const resolved = useMemo(() => incidents.filter((i) => i.status === "resolved"), [incidents]);

  async function handleResolve(incident: PaymentIncident, next: "open" | "resolved") {
    const note =
      next === "resolved"
        ? (window.prompt("What did you do? (refunded, rebooked, waived…)", "Refunded via Ziina") ?? "")
        : "";
    if (next === "resolved" && note === "") return;

    setBusyId(incident.id);
    try {
      await resolvePaymentIncident(incident.id, next, note);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update the incident.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Payment Issues</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Payments that arrived but could not be honoured — a full or deleted workshop, a slot taken
          first, or an amount that did not match. Each one is a customer waiting on you.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : error ? (
        <div className="rounded-sm border border-red-400/30 bg-red-500/10 p-6">
          <p className="text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-sm border border-white/15 px-4 py-2 text-sm text-gray-300 hover:border-icube-gold/50 hover:text-icube-gold"
          >
            Try again
          </button>
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-sm border border-white/10 bg-icube-gray p-10 text-center">
          <Check size={36} className="mx-auto mb-3 text-emerald-400/60" aria-hidden />
          <p className="font-medium text-gray-300">No payment issues</p>
          <p className="mt-1 text-sm text-gray-500">Every payment so far has been honoured normally.</p>
        </div>
      ) : (
        <>
          {openIncidents.length > 0 && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-300">
              <AlertTriangle size={16} aria-hidden />
              <span>
                {openIncidents.length} {openIncidents.length === 1 ? "payment needs" : "payments need"} your
                attention
              </span>
            </div>
          )}

          <div className="space-y-4">
            {openIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onResolve={handleResolve}
                busy={busyId === incident.id}
              />
            ))}
          </div>

          {openIncidents.length === 0 && (
            <div className="rounded-sm border border-white/10 bg-icube-gray p-8 text-center">
              <Check size={32} className="mx-auto mb-3 text-emerald-400/60" aria-hidden />
              <p className="text-gray-300">Nothing open. All payment issues have been handled.</p>
            </div>
          )}

          {resolved.length > 0 && (
            <div className="mt-10">
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                aria-expanded={showResolved}
                className="text-sm font-semibold text-gray-400 transition-colors hover:text-icube-gold"
              >
                {showResolved ? "Hide" : "Show"} handled ({resolved.length})
              </button>
              {showResolved && (
                <div className="mt-4 space-y-4">
                  {resolved.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onResolve={handleResolve}
                      busy={busyId === incident.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
