import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingSchedulePage from "./BookingSchedulePage";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  setPreference: vi.fn(),
  setDate: vi.fn(),
  setTime: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

vi.mock("@/BookingContext", () => ({
  useBooking: () => ({
    selectedPackage: {
      id: "package-1",
      name: "Content Package",
      price_aed: 1200,
      duration: "1 session",
      requires_schedule: true,
    },
    packageSchedulePreference: null,
    setPackageSchedulePreference: mocks.setPreference,
    setSelectedDate: mocks.setDate,
    setSelectedTimeSlot: mocks.setTime,
  }),
}));

vi.mock("@/components/Navbar", () => ({ default: () => <div>Navbar</div> }));
vi.mock("@/components/Footer", () => ({ default: () => <div>Footer</div> }));
vi.mock("@/components/BookingProgress", () => ({ default: () => <div>Progress</div> }));

describe("BookingSchedulePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes scheduled bookings to date and time selection", () => {
    render(<BookingSchedulePage />);

    fireEvent.click(screen.getByRole("button", { name: /yes, choose a date and time/i }));

    expect(mocks.setPreference).toHaveBeenCalledWith("scheduled");
    expect(mocks.setDate).toHaveBeenCalledWith(null);
    expect(mocks.setTime).toHaveBeenCalledWith(null);
    expect(mocks.push).toHaveBeenCalledWith("/packages/date-time");
  });

  it("routes unscheduled bookings to add-ons without a slot", () => {
    render(<BookingSchedulePage />);

    fireEvent.click(screen.getByRole("button", { name: /no, continue without a schedule/i }));

    expect(mocks.setPreference).toHaveBeenCalledWith("unscheduled");
    expect(mocks.setDate).toHaveBeenCalledWith(null);
    expect(mocks.setTime).toHaveBeenCalledWith(null);
    expect(mocks.push).toHaveBeenCalledWith("/packages/add-ons");
  });
});
