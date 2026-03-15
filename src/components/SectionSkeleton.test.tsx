import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionSkeleton from "./SectionSkeleton";

describe("SectionSkeleton", () => {
  it("renders with default props", () => {
    render(<SectionSkeleton />);
    const container = document.querySelector(".animate-pulse");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("aria-hidden");
  });

  it("renders header when showHeader is true", () => {
    render(<SectionSkeleton showHeader />);
    const container = document.querySelector(".animate-pulse");
    expect(container?.querySelector(".mb-8")).toBeInTheDocument();
  });

  it("does not render header when showHeader is false", () => {
    render(<SectionSkeleton showHeader={false} />);
    const container = document.querySelector(".animate-pulse");
    expect(container?.querySelector(".mb-8")).not.toBeInTheDocument();
  });

  it("renders the requested number of line placeholders", () => {
    render(<SectionSkeleton lines={5} showHeader={false} />);
    const placeholders = document.querySelectorAll(".space-y-4 > div");
    expect(placeholders).toHaveLength(5);
  });

  it("applies custom className", () => {
    render(<SectionSkeleton className="max-w-md" />);
    const container = document.querySelector(".max-w-md");
    expect(container).toBeInTheDocument();
  });
});
