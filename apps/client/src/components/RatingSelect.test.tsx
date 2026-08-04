import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RatingSelect, starValueFromClick } from "../components/RatingSelect";

describe("RatingSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 5 star buttons", () => {
    render(<RatingSelect />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("renders clear button when a value is selected", () => {
    render(<RatingSelect value={3} />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("does not render clear button when no value selected", () => {
    render(<RatingSelect />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("calls onChange with a whole star when a star is clicked", () => {
    const onChange = vi.fn();
    render(<RatingSelect value={undefined} onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onChange with undefined when the current rating is clicked again", () => {
    const onChange = vi.fn();
    render(<RatingSelect value={3} onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("calls onChange with undefined when clear is clicked", () => {
    const onChange = vi.fn();
    render(<RatingSelect value={3} onChange={onChange} />);
    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("maps a click on the left half of a star to a half rating", () => {
    expect(starValueFromClick(3, 5, 20)).toBe(2.5);
    expect(starValueFromClick(1, 1, 20)).toBe(0.5);
  });

  it("maps a click on the right half of a star to a whole rating", () => {
    expect(starValueFromClick(3, 15, 20)).toBe(3);
    expect(starValueFromClick(5, 20, 20)).toBe(5);
  });
});
