export type PackageSchedulePreference = "scheduled" | "unscheduled";

type ScheduleInput = {
  schedulePreference?: PackageSchedulePreference;
  bookingDate?: string;
  timeSlot?: string;
};

export function validatePackageSchedule({ schedulePreference, bookingDate, timeSlot }: ScheduleInput): string | null {
  if ((bookingDate && !timeSlot) || (!bookingDate && timeSlot)) {
    return "Date and time must be provided together.";
  }
  if (schedulePreference === "scheduled" && (!bookingDate || !timeSlot)) {
    return "Please choose a date and time for this booking.";
  }
  if (schedulePreference === "unscheduled" && (bookingDate || timeSlot)) {
    return "Unscheduled bookings cannot reserve a date or time.";
  }
  return null;
}
