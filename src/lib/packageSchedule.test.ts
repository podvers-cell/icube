import { describe, expect, it } from "vitest";
import { validatePackageSchedule } from "./packageSchedule";

describe("validatePackageSchedule", () => {
  it("accepts a scheduled package with both date and time", () => {
    expect(
      validatePackageSchedule({ schedulePreference: "scheduled", bookingDate: "2026-09-10", timeSlot: "14:00" })
    ).toBeNull();
  });

  it("accepts an unscheduled package without reserving a slot", () => {
    expect(validatePackageSchedule({ schedulePreference: "unscheduled" })).toBeNull();
  });

  it("requires date and time for a scheduled package", () => {
    expect(validatePackageSchedule({ schedulePreference: "scheduled" })).toBe(
      "Please choose a date and time for this booking."
    );
  });

  it("rejects date or time on an unscheduled package", () => {
    expect(
      validatePackageSchedule({ schedulePreference: "unscheduled", bookingDate: "2026-09-10", timeSlot: "14:00" })
    ).toBe("Unscheduled bookings cannot reserve a date or time.");
  });

  it("rejects partial schedule data", () => {
    expect(validatePackageSchedule({ bookingDate: "2026-09-10" })).toBe("Date and time must be provided together.");
  });
});
