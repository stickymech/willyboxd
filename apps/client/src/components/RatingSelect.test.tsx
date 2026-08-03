import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RatingSelect } from "../components/RatingSelect";

describe("RatingSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 10 rating options", () => {
    render(<RatingSelect />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(10);
  });

  it("renders clear button when a value is selected", () => {
    render(<RatingSelect value={3} />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("does not render clear button when no value selected", () => {
    render(<RatingSelect />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("calls onChange when rating is clicked", () => {
    const onChange = vi.fn();
    render(<RatingSelect value={undefined} onChange={onChange} />);
    const buttons = screen.getAllByRole("button");
    const firstStar = buttons[0];
    fireEvent.click(firstStar);
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  it("calls onChange with undefined when clear is clicked", () => {
    const onChange = vi.fn();
    render(<RatingSelect value={3} onChange={onChange} />);
    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
