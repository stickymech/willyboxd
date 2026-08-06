import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SearchBox } from "./SearchBox";
import { apiFetch } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

const naruto: MediaItem = {
  id: 1,
  title: "Naruto",
  type: "tv",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: null,
  first_air_date: "2002-10-03",
  original_language: "ja",
  vote_average: 8,
  genre_ids: [16],
};

const bleach: MediaItem = {
  id: 2,
  title: "Bleach",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: "2004-10-06",
  first_air_date: null,
  original_language: "ja",
  vote_average: 7,
  genre_ids: [16],
};

const mockApi = vi.mocked(apiFetch);

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
}

function renderSearchBox() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SearchBox />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SearchBox", () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it("shows matches when the user types", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });
    renderSearchBox();

    await userEvent.type(screen.getByRole("combobox"), "naruto");

    await screen.findByText("Naruto");
    expect(mockApi).toHaveBeenCalledWith("/films/search?q=naruto");
  });

  it("shows no dropdown for an empty query", () => {
    mockApi.mockResolvedValue({ results: [] });
    renderSearchBox();

    expect(screen.getByRole("combobox")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens the selected match on Enter", async () => {
    mockApi.mockResolvedValue({ results: [naruto, bleach] });
    renderSearchBox();

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "nar");
    await screen.findByText("Naruto");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/films/1?type=tv"),
    );
  });

  it("navigates to results on Enter without a selection", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });
    renderSearchBox();

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "naruto");
    await screen.findByText("Naruto");

    await userEvent.keyboard("{Enter}");

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("/search?q=naruto"),
    );
  });

  it("closes the dropdown on Escape", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });
    renderSearchBox();

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "naruto");
    await screen.findByText("Naruto");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });

  it("closes the dropdown on outside click", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });
    renderSearchBox();

    const input = screen.getByRole("combobox");
    await userEvent.type(input, "naruto");
    await screen.findByText("Naruto");
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await userEvent.click(document.body);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});
