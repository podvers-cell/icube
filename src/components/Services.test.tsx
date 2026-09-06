import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Services from "./Services";

const services = Array.from({ length: 7 }, (_, index) => ({
  id: `service-${index + 1}`,
  icon: "Video",
  title: `Service ${index + 1}`,
  description: `Description ${index + 1}`,
}));

vi.mock("../SiteDataContext", () => ({
  useSiteData: () => ({ services, loading: false }),
}));

vi.mock("../hooks/useSwipeCarousel", () => ({
  useSwipeCarousel: () => ({ onTouchStart: vi.fn(), onTouchEnd: vi.fn() }),
}));

vi.mock("./AnimatedStaggerItem", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("./ScrollReveal", () => ({
  AnimatedSectionHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("Services desktop carousel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows one row of three services and moves through pages with arrows", () => {
    render(<Services />);

    const desktopPage = screen.getByTestId("desktop-services-page");
    expect(within(desktopPage).getAllByRole("link", { name: /learn more/i })).toHaveLength(3);
    expect(within(desktopPage).getByText("Service 1")).toBeInTheDocument();
    expect(within(desktopPage).queryByText("Service 4")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next services" }));

    expect(within(desktopPage).getAllByRole("link", { name: /learn more/i })).toHaveLength(3);
    expect(within(desktopPage).getByText("Service 4")).toBeInTheDocument();
    expect(within(desktopPage).queryByText("Service 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next services" }));

    expect(within(desktopPage).getAllByRole("link", { name: /learn more/i })).toHaveLength(1);
    expect(within(desktopPage).getByText("Service 7")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next services" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous services" })).toBeEnabled();
  });
});
