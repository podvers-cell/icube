export function parseGroupSizeMax(raw: unknown): number | null {
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return null;
  const nums = s.match(/\d+/g)?.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0) ?? [];
  if (!nums.length) return null;
  return Math.max(...nums);
}

export function isWorkshopSoldOut(workshop: {
  sold_out?: boolean | null;
  sold_out_override?: boolean | null;
  group_size_max?: number | null;
  group_size_label?: string | null;
  paid_enrollments_count?: number | null;
}): boolean {
  if (Boolean(workshop.sold_out_override ?? workshop.sold_out)) return true;
  const max = Number(workshop.group_size_max ?? 0) || parseGroupSizeMax(workshop.group_size_label) || 0;
  if (!Number.isFinite(max) || max <= 0) return false;
  const paid = Number(workshop.paid_enrollments_count ?? 0) || 0;
  return paid >= max;
}

