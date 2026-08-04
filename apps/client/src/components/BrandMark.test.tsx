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

  it("renders with the 240x120 viewBox", () => {
    const { container } = render(<BrandMark />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 240 120");
  });

  it("applies a className to the svg", () => {
    const { container } = render(<BrandMark className="w-28 h-14" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("class")).toBe("w-28 h-14");
  });

  it("renders three Letterboxd-style discs in orange, green and blue", () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector("circle[fill='#F57C00']")).not.toBeNull();
    expect(container.querySelector("circle[fill='#44C553']")).not.toBeNull();
    expect(container.querySelector("circle[fill='#29B6F6']")).not.toBeNull();
  });

  it("places a phallic rocket silhouette inside each disc", () => {
    const { container } = render(<BrandMark />);
    const rockets = container.querySelectorAll("svg g[transform]");
    expect(rockets.length).toBe(3);
    rockets.forEach((rocket) => {
      expect(rocket.getAttribute("fill")).toBe("#0F172A");
      expect(rocket.querySelectorAll("rect").length).toBe(0);
      expect(rocket.querySelectorAll("path").length).toBe(4);
      expect(rocket.querySelectorAll("circle").length).toBe(3);
    });
    expect(rockets[0].getAttribute("transform")).toBe("translate(64 44) scale(0.8)");
    expect(rockets[1].getAttribute("transform")).toBe("translate(120 60) scale(0.8)");
    expect(rockets[2].getAttribute("transform")).toBe("translate(176 76) scale(0.8)");
  });
});
