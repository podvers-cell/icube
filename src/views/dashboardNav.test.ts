import { readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { navGroups } from "./DashboardLayoutNext";

/**
 * Two dashboard pages once shipped unreachable: /dashboard/why-us had no navigation entry, and the
 * Videos admin screen existed with no route at all while its content rendered on the public
 * homepage. Both were invisible to the owner. These tests make that class of mistake fail loudly.
 */

const DASHBOARD_DIR = resolve(__dirname, "../../app/dashboard");

function routeSegments(): string[] {
  return readdirSync(DASHBOARD_DIR).filter((entry) =>
    statSync(resolve(DASHBOARD_DIR, entry)).isDirectory()
  );
}

const navHrefs = navGroups.flatMap((group) => group.items.map((item) => item.href));

describe("dashboard navigation", () => {
  it("has a navigation entry for every dashboard route", () => {
    const missing = routeSegments()
      .map((segment) => `/dashboard/${segment}`)
      .filter((href) => !navHrefs.includes(href));

    expect(missing, `dashboard pages with no way to reach them: ${missing.join(", ")}`).toEqual([]);
  });

  it("has a real route behind every navigation entry", () => {
    const segments = new Set(routeSegments());
    const broken = navHrefs
      .filter((href) => href !== "/dashboard")
      .filter((href) => !segments.has(href.replace("/dashboard/", "")));

    expect(broken, `navigation links to nowhere: ${broken.join(", ")}`).toEqual([]);
  });

  it("never lists the same destination twice", () => {
    expect(new Set(navHrefs).size).toBe(navHrefs.length);
  });

  it("gives every entry its own icon, so the list stays scannable", () => {
    const icons = navGroups.flatMap((group) => group.items.map((item) => item.icon));
    expect(new Set(icons).size).toBe(icons.length);
  });

  it("puts the daily work first", () => {
    expect(navGroups[0].title).toBe("Today");
    expect(navGroups[0].items[0].href).toBe("/dashboard");
  });
});
