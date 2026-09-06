import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardRentalEquipment from "./DashboardRentalEquipment";

const apiMocks = vi.hoisted(() => ({
  getRentalEquipment: vi.fn(),
  createRentalEquipment: vi.fn(),
  updateRentalEquipment: vi.fn(),
  deleteRentalEquipment: vi.fn(),
}));

vi.mock("../api", () => apiMocks);
vi.mock("../components/CloudinaryUploadField", () => ({
  default: ({ label }: { label?: string }) => <div>{label}</div>,
}));

describe("DashboardRentalEquipment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getRentalEquipment.mockResolvedValue([]);
    apiMocks.createRentalEquipment.mockResolvedValue({ id: "equipment-1" });
  });

  it("creates a catalog item with safe defaults", async () => {
    render(<DashboardRentalEquipment />);

    fireEvent.click(screen.getByRole("button", { name: /add equipment/i }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Sony A7 IV" } });
    fireEvent.change(screen.getByLabelText("Category"), { target: { value: "Cameras" } });
    fireEvent.change(screen.getByLabelText("Price (AED)"), { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(apiMocks.createRentalEquipment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Sony A7 IV",
          category: "Cameras",
          price_aed: 250,
          price_unit: "day",
          quantity_available: 1,
          availability_status: "available",
          is_published: true,
        })
      );
    });
  });
});
