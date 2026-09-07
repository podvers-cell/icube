import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import DashboardModal from "./DashboardModal";

function open(props: Partial<React.ComponentProps<typeof DashboardModal>> = {}) {
  const onClose = vi.fn();
  const utils = render(
    <DashboardModal title="Edit project" onClose={onClose} {...props}>
      <input aria-label="title" />
    </DashboardModal>
  );
  return { onClose, ...utils };
}

describe("DashboardModal", () => {
  it("exposes itself as a labelled dialog", () => {
    open({ description: "A project is one case study." });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Edit project");
    expect(dialog).toHaveAccessibleDescription("A project is one case study.");
  });

  it("closes on Escape", () => {
    const { onClose } = open();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the header close button", () => {
    const { onClose } = open();
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the press starts on the backdrop", () => {
    const { onClose } = open();
    const backdrop = screen.getByRole("dialog").parentElement!;
    fireEvent.mouseDown(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // A drag that starts inside a text field and ends on the backdrop must not discard the form.
  it("stays open when the press starts inside the dialog", () => {
    const { onClose } = open();
    fireEvent.mouseDown(screen.getByLabelText("title"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("holds the page still while open and releases it after", () => {
    const { unmount } = open();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("moves focus into the dialog", () => {
    open();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("renders as a form and submits when given onSubmit", () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <DashboardModal
        title="Edit"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        footer={<button type="submit">Save</button>}
      >
        <input aria-label="title" />
      </DashboardModal>
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // The bug this guards: onClose was in the effect's dependency list, callers pass an inline
  // arrow, so every keystroke re-ran the effect and re-focused the panel — you could only type one
  // character at a time. The original tests never re-rendered, so they missed it.
  it("keeps focus in the field while typing, across re-renders", () => {
    function Host() {
      const [value, setValue] = useState("");
      return (
        <DashboardModal title="Edit project" onClose={() => setValue("")}>
          <input aria-label="title" value={value} onChange={(e) => setValue(e.target.value)} />
        </DashboardModal>
      );
    }

    render(<Host />);
    const input = screen.getByLabelText("title");
    input.focus();
    expect(input).toHaveFocus();

    for (const char of "hello") {
      fireEvent.change(input, { target: { value: (input as HTMLInputElement).value + char } });
      expect(input).toHaveFocus();
    }
    expect(input).toHaveValue("hello");
  });

  it("still closes on Escape after re-rendering", () => {
    const onClose = vi.fn();
    function Host() {
      const [value, setValue] = useState("");
      return (
        <DashboardModal title="Edit" onClose={onClose}>
          <input aria-label="title" value={value} onChange={(e) => setValue(e.target.value)} />
        </DashboardModal>
      );
    }
    render(<Host />);
    fireEvent.change(screen.getByLabelText("title"), { target: { value: "x" } });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the footer when no actions are given", () => {
    const { container } = render(
      <DashboardModal title="Read only" onClose={vi.fn()}>
        <p>Details</p>
      </DashboardModal>
    );
    expect(container.querySelector("footer")).toBeNull();
  });
});
