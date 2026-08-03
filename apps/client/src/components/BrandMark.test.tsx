import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("renders a decorative SVG (aria-hidden, focusable false)", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
  });

  it("renders with the 64 viewBox", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 64 64");
  });

  it("applies a className to the svg", () => {
    const { container } = render(<BrandMark className="w-7 h-7" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toBe("w-7 h-7");
  });

  it("renders a slate box and its clipped stripe band", () => {
    const { container } = render(<BrandMark />);
    const rects = container.querySelectorAll("svg rect");
    expect(rects.length).toBe(2);
  });
});
