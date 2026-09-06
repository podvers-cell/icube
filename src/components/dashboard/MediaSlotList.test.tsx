import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MediaSlotList from "./MediaSlotList";

vi.mock("../CloudinaryUploadField", () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="url" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

function setup(values: string[]) {
  const onChange = vi.fn();
  render(
    <MediaSlotList
      label="Project videos"
      values={values}
      onChange={onChange}
      type="video"
      folder="portfolio/videos"
      addLabel="Add a video"
      emptyHint="No videos yet."
    />
  );
  return onChange;
}

describe("MediaSlotList", () => {
  it("gives every entry its own field", () => {
    setup(["https://a.com/1", "https://b.com/2"]);
    expect(screen.getAllByLabelText("url")).toHaveLength(2);
    expect(screen.getByText("2 items")).toBeInTheDocument();
  });

  it("guides when empty", () => {
    setup([]);
    expect(screen.getByText("No videos yet.")).toBeInTheDocument();
    expect(screen.queryByLabelText("url")).not.toBeInTheDocument();
  });

  it("adds an empty slot on demand", () => {
    const onChange = setup(["https://a.com/1"]);
    fireEvent.click(screen.getByRole("button", { name: /add a video/i }));
    expect(onChange).toHaveBeenCalledWith(["https://a.com/1", ""]);
  });

  it("edits only the slot that changed", () => {
    const onChange = setup(["https://a.com/1", "https://b.com/2"]);
    fireEvent.change(screen.getAllByLabelText("url")[1], { target: { value: "https://c.com/3" } });
    expect(onChange).toHaveBeenCalledWith(["https://a.com/1", "https://c.com/3"]);
  });

  it("removes a single slot", () => {
    const onChange = setup(["a", "b", "c"]);
    fireEvent.click(screen.getByRole("button", { name: /remove project videos 2/i }));
    expect(onChange).toHaveBeenCalledWith(["a", "c"]);
  });

  it("reorders without retyping", () => {
    const onChange = setup(["a", "b", "c"]);
    fireEvent.click(screen.getByRole("button", { name: /move project videos 3 up/i }));
    expect(onChange).toHaveBeenCalledWith(["a", "c", "b"]);

    fireEvent.click(screen.getByRole("button", { name: /move project videos 1 down/i }));
    expect(onChange).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("disables the moves that would fall off the ends", () => {
    setup(["a", "b"]);
    expect(screen.getByRole("button", { name: /move project videos 1 up/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move project videos 2 down/i })).toBeDisabled();
  });

  // The thumbnail carries no information the URL field does not, so it is decorative and its alt
  // is deliberately empty — which also keeps it out of the "img" role.
  it("previews an image slot but not a video slot", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(
      <MediaSlotList
        label="Gallery images"
        values={["https://res.cloudinary.com/a.jpg"]}
        onChange={onChange}
        type="image"
        folder="portfolio/gallery"
        addLabel="Add an image"
        emptyHint="none"
      />
    );
    expect(container.querySelectorAll("img")).toHaveLength(1);

    rerender(
      <MediaSlotList
        label="Gallery images"
        values={["https://youtube.com/watch?v=x"]}
        onChange={onChange}
        type="video"
        folder="portfolio/videos"
        addLabel="Add a video"
        emptyHint="none"
      />
    );
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });
});
