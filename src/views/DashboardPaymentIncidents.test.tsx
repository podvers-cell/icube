import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPaymentIncidents from "./DashboardPaymentIncidents";
import type { PaymentIncident } from "../types/paymentIncident";

const apiMocks = vi.hoisted(() => ({
  getPaymentIncidents: vi.fn(),
  resolvePaymentIncident: vi.fn(),
}));

vi.mock("../api", () => apiMocks);

const incident = (overrides: Partial<PaymentIncident> = {}): PaymentIncident => ({
  id: "workshop_abc_capacity_conflict",
  type: "workshop_capacity_conflict",
  status: "open",
  refund_status: "required",
  source_id: "abc",
  customer_email: "customer@example.com",
  customer_phone: "+971500000000",
  paid_amount_minor: 45000,
  paid_currency: "AED",
  created_at: "2026-09-05T10:00:00.000Z",
  ...overrides,
});

describe("DashboardPaymentIncidents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getPaymentIncidents.mockResolvedValue([]);
    apiMocks.resolvePaymentIncident.mockResolvedValue(undefined);
  });

  it("reassures when there is nothing to handle", async () => {
    render(<DashboardPaymentIncidents />);
    expect(await screen.findByText(/no payment issues/i)).toBeInTheDocument();
  });

  it("explains the problem and what to do about it", async () => {
    apiMocks.getPaymentIncidents.mockResolvedValue([incident()]);
    render(<DashboardPaymentIncidents />);

    expect(await screen.findByText(/workshop was full when payment cleared/i)).toBeInTheDocument();
    expect(screen.getByText(/refund, or add a place if you can/i)).toBeInTheDocument();
    expect(screen.getByText("AED 450.00")).toBeInTheDocument();
    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    expect(screen.getByText("Refund required")).toBeInTheDocument();
    expect(screen.getByText(/1 payment needs your attention/i)).toBeInTheDocument();
  });

  it("shows both amounts when they disagree", async () => {
    apiMocks.getPaymentIncidents.mockResolvedValue([
      incident({ type: "amount_mismatch", expected_amount_minor: 90000, expected_currency: "AED" }),
    ]);
    render(<DashboardPaymentIncidents />);

    expect(await screen.findByText(/paid amount does not match/i)).toBeInTheDocument();
    expect(screen.getByText("AED 450.00")).toBeInTheDocument();
    expect(screen.getByText(/expected AED 900.00/)).toBeInTheDocument();
  });

  it("records a note when marking one handled", async () => {
    apiMocks.getPaymentIncidents.mockResolvedValue([incident()]);
    vi.spyOn(window, "prompt").mockReturnValue("Refunded via Ziina");
    render(<DashboardPaymentIncidents />);

    fireEvent.click(await screen.findByRole("button", { name: /mark handled/i }));

    await waitFor(() =>
      expect(apiMocks.resolvePaymentIncident).toHaveBeenCalledWith(
        "workshop_abc_capacity_conflict",
        "resolved",
        "Refunded via Ziina"
      )
    );
  });

  it("does nothing if the note prompt is cancelled", async () => {
    apiMocks.getPaymentIncidents.mockResolvedValue([incident()]);
    vi.spyOn(window, "prompt").mockReturnValue(null);
    render(<DashboardPaymentIncidents />);

    fireEvent.click(await screen.findByRole("button", { name: /mark handled/i }));
    expect(apiMocks.resolvePaymentIncident).not.toHaveBeenCalled();
  });

  it("keeps handled incidents out of the way but reachable", async () => {
    apiMocks.getPaymentIncidents.mockResolvedValue([
      incident({ id: "done", status: "resolved", resolution_note: "Refunded on 5 Sep" }),
    ]);
    render(<DashboardPaymentIncidents />);

    expect(await screen.findByText(/nothing open/i)).toBeInTheDocument();
    expect(screen.queryByText("Refunded on 5 Sep")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show handled \(1\)/i }));
    expect(screen.getByText("Refunded on 5 Sep")).toBeInTheDocument();
  });

  it("surfaces a load failure with a retry", async () => {
    apiMocks.getPaymentIncidents.mockRejectedValue(new Error("Admin access required"));
    render(<DashboardPaymentIncidents />);

    expect(await screen.findByText("Admin access required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(apiMocks.getPaymentIncidents).toHaveBeenCalledTimes(2));
  });
});
