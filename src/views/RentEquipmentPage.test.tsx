import { fireEvent, render, screen, within } from "@testing-library/react";
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

/** The card control, found by the accessible name a screen reader would hear for that product. */
const viewDetailsFor = (product: string) =>
  screen.getByRole("button", { name: `View details for ${product}` });

/**
 * A pointer press, including the focus move that jsdom does not implement.
 *
 * A real browser follows an unprevented pointerdown with a mousedown that focuses what was
 * pressed; the backdrop is not focusable, so focus lands on the body. jsdom fires neither, so the
 * default is modelled here — without it the bug this guards cannot be reproduced at all.
 */
function press(target: HTMLElement) {
  const notPrevented = fireEvent.pointerDown(target);
  if (notPrevented) (document.activeElement as HTMLElement | null)?.blur();
}

/** Opens the dialog the way a user does — from a control that has focus — and returns both. */
function openDetails(trigger: HTMLElement) {
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog") };
}

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

  describe("card summary and actions", () => {
    const detailed = item({
      name: "Sony FX6",
      short_description: "Full-frame cinema camera.",
      details: "Includes two batteries.\nCard reader on request.",
    });

    it("shows the summary on the card and keeps the full details out of it", () => {
      render(<RentEquipmentPage items={[detailed]} />);

      expect(screen.getByText("Full-frame cinema camera.")).toBeInTheDocument();
      expect(screen.queryByText(/includes two batteries/i)).not.toBeInTheDocument();
    });

    // Cards are a fixed height in a grid; an unclamped summary pushes the actions out of line.
    it("clamps the summary to two lines", () => {
      render(<RentEquipmentPage items={[detailed]} />);

      expect(screen.getByText("Full-frame cinema camera.")).toHaveClass("line-clamp-2");
    });

    it("offers both actions on every card", () => {
      render(<RentEquipmentPage items={catalogue} />);

      expect(screen.getAllByRole("button", { name: /^view details for/i })).toHaveLength(3);
      expect(screen.getAllByRole("link", { name: /request to rent/i })).toHaveLength(3);
    });

    // Three cards side by side repeat the same visible text, so the name has to carry the product.
    it("names each card action after its own product", () => {
      render(<RentEquipmentPage items={catalogue} />);

      for (const product of ["Sony FX6", "Aputure 600D", "Rode NTG5"]) {
        expect(viewDetailsFor(product)).toBeInTheDocument();
      }
      expect(screen.getByRole("link", { name: "Request to rent Sony FX6" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Request to rent Aputure 600D" })).toBeInTheDocument();
    });

    // WCAG 2.5.3: a voice-control user says what is written on the button, so the accessible
    // name has to start with it rather than replace it.
    it("keeps the visible label at the front of the accessible name", () => {
      render(<RentEquipmentPage items={catalogue} />);

      const link = screen.getByRole("link", { name: "Request to rent Sony FX6" });
      expect(link.textContent).toContain("Request to rent");
      expect(viewDetailsFor("Sony FX6").textContent).toContain("View details");
    });

    it("opens the details from the product name as well as the button", () => {
      render(<RentEquipmentPage items={[detailed]} />);

      openDetails(screen.getByRole("button", { name: "Sony FX6" }));
      expect(screen.getByRole("dialog")).toHaveAccessibleName("Sony FX6");
    });
  });

  describe("details dialog", () => {
    const detailed = item({
      name: "Sony FX6",
      short_description: "Full-frame cinema camera.",
      details: "Includes two batteries.\nCard reader on request.",
      quantity_available: 2,
      price_aed: 900,
    });

    it("shows the full record once opened", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(within(dialog).getByText(/includes two batteries/i)).toBeInTheDocument();
      expect(within(dialog).getByText("Cameras")).toBeInTheDocument();
      expect(within(dialog).getByText("Available")).toBeInTheDocument();
      expect(within(dialog).getByText("AED 900")).toBeInTheDocument();
      expect(within(dialog).getByText("per day")).toBeInTheDocument();
      expect(within(dialog).getByText("2 available")).toBeInTheDocument();
      expect(within(dialog).getByText("Full-frame cinema camera.")).toBeInTheDocument();
    });

    // The dashboard stores details as free text, so a typed line break has to survive to the page.
    it("keeps the line breaks in the details text", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      const details = within(dialog).getByText(/includes two batteries/i);
      expect(details.textContent).toBe("Includes two batteries.\nCard reader on request.");
      expect(details).toHaveClass("whitespace-pre-line");
    });

    it("holds the page still while open and releases it on close", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      openDetails(viewDetailsFor("Sony FX6"));
      expect(document.body.style.overflow).toBe("hidden");

      fireEvent.click(screen.getByRole("button", { name: /close details/i }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe("hidden");
    });

    it("closes on Escape", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      openDetails(viewDetailsFor("Sony FX6"));

      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Pointer, not mouse: a tap must close on the touch itself, not on the emulated mouse event.
    it("closes when the press starts on the backdrop", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      press(dialog.parentElement!);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // A drag that starts inside and ends on the backdrop must not dismiss what is being read.
    it("stays open when the press starts inside the panel", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      press(dialog);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("hands focus back to the control that opened it", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { trigger } = openDetails(viewDetailsFor("Sony FX6"));

      fireEvent.keyDown(document, { key: "Escape" });
      expect(trigger).toHaveFocus();
    });

    // Closing on the backdrop used to strand focus on the body while Escape restored it properly:
    // the press's own default focus move landed after the trap had handed focus back.
    it("hands focus back after a backdrop press too", () => {
      render(<RentEquipmentPage items={[detailed]} />);
      const { trigger, dialog } = openDetails(viewDetailsFor("Sony FX6"));

      press(dialog.parentElement!);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("switches the shown image from the thumbnails", () => {
      render(
        <RentEquipmentPage
          items={[
            item({
              name: "Sony FX6",
              image_urls: ["https://res.cloudinary.com/a.jpg", "https://res.cloudinary.com/b.jpg"],
            }),
          ]}
        />
      );
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      expect(within(dialog).getByAltText("Sony FX6 — image 1 of 2")).toBeInTheDocument();

      fireEvent.click(within(dialog).getByRole("button", { name: "Show image 2 of 2" }));

      const shown = within(dialog).getByAltText("Sony FX6 — image 2 of 2");
      expect(shown).toHaveAttribute("src", expect.stringContaining("b.jpg"));
    });
  });

  describe("WhatsApp enquiry", () => {
    it("prefills the chat with the product name, URL-encoded", () => {
      render(<RentEquipmentPage items={[item({ name: "Sony FX6 & Rig" })]} />);

      const href = screen.getByRole("link", { name: /request to rent/i }).getAttribute("href")!;
      expect(href.startsWith("https://wa.me/971589965005?text=")).toBe(true);

      // The raw name would truncate the message at the ampersand; the decoded text must carry it.
      expect(href).not.toContain("Sony FX6 & Rig");
      expect(decodeURIComponent(href.split("?text=")[1])).toContain("Sony FX6 & Rig");
    });

    // Nothing here reserves anything, so an out-of-stock item must not read as a booking.
    it("asks about availability instead of promising a rental when unavailable", () => {
      render(<RentEquipmentPage items={[item({ name: "Sony FX6", availability_status: "unavailable" })]} />);

      const link = screen.getByRole("link", { name: "Ask about availability of Sony FX6" });
      expect(screen.queryByRole("link", { name: /request to rent/i })).not.toBeInTheDocument();
      expect(decodeURIComponent(link.getAttribute("href")!)).toContain("availability of Sony FX6");
    });

    it("opens the chat in a new tab without handing over the opener", () => {
      render(<RentEquipmentPage items={[item({ name: "Sony FX6" })]} />);

      const link = screen.getByRole("link", { name: /request to rent/i });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    });

    it("repeats the enquiry inside the dialog", () => {
      render(<RentEquipmentPage items={[item({ name: "Sony FX6" })]} />);
      const { dialog } = openDetails(viewDetailsFor("Sony FX6"));

      expect(within(dialog).getByRole("link", { name: /request to rent/i })).toBeInTheDocument();
    });
  });
});
