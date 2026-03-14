"use client";

import { usePathname } from "next/navigation";
import CustomCursor from "./CustomCursor";

/** Renders CustomCursor only on public pages (not dashboard / login) so the cursor looks the same site-wide. */
export default function CustomCursorGate() {
  const pathname = usePathname() ?? "";
  const isPublic = !pathname.startsWith("/dashboard") && pathname !== "/login";
  if (!isPublic) return null;
  return <CustomCursor />;
}
