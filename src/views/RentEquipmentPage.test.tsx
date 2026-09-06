import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RentEquipmentPage from "./RentEquipmentPage";
import { toPublicEquipment } from "../lib/rentalEquipmentQuery";

vi.mock("../components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("../components/Footer", () => ({ default: () => <footer /> }));
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const item = (overrides: Record<string, unknown>) =>
  toPublicEquipment(String(overrides.name ?? "id"), {
    name: "Item",
    category: "Cameras",
    price_aed: 100,
    price_unit: "day",
    availability_status: "available",
    is_published: true,
    sort_order: 0,
    ...overrides,
  });

const catalogue = [
  item({ name: "Sony FX6", category: "Cameras", price_aed: 900, is_featured: true, quantity_available: 2 }),
  item({ name: "Aputure 600D", category: "Lighting", price_aed: 350, price_unit: "week" }),
  item({ name: "Rode NTG5", category: "Audio", price_aed: 120, availability_status: "on_request" }),
];

describe("RentEquipmentPage", () => {
  it("shows the empty state and a contact route when nothing is published", () => {
    render(<RentEquipmentPage items={[]} />);

    expect(screen.getByText(/catalogue coming soon/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ask about equipment/i })).toHaveAttribute("href", "/contact");
    expect(screen.queryByRole("group", { name: /filter by category/i })).not.toBeInTheDocument();
  });

  it("renders every published item with its price and unit", () => {
    render(<RentEquipmentPage items={catalogue} />);

    expect(screen.getByText("Sony FX6")).toBeInTheDocument();
    expect(screen.getByText("AED 900")).toBeInTheDocument();
    expect(screen.getAllByText("per day")).toHaveLength(2);
    expect(screen.getByText("AED 350")).toBeInTheDocument();
    expect(screen.getByText("per week")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("marks featured items and shows availability", () => {
    render(<RentEquipmentPage items={catalogue} />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
    expect(screen.getAllByText("Available")).toHaveLength(2);
    expect(screen.getByText("On request")).toBeInTheDocument();
    expect(screen.getByText("2 available")).toBeInTheDocument();
  });

  it("filters by category and back to all", () => {
    render(<RentEquipmentPage items={catalogue} />);

    fireEvent.click(screen.getByRole("button", { name: "Lighting" }));
    expect(screen.getByText("Aputure 600D")).toBeInTheDocument();
    expect(screen.queryByText("Sony FX6")).not.toBeInTheDocument();
    expect(screen.getByText("1 item in Lighting")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByText("Sony FX6")).toBeInTheDocument();
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("renders an image only when one is set", () => {
    render(
      <RentEquipmentPage
        items={[
          item({ name: "With image", image_url: "https://res.cloudinary.com/a.jpg" }),
          item({ name: "No image" }),
        ]}
      />
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("alt", "With image");
  });
});
