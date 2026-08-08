import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Watchlist } from "./Watchlist";
import { apiFetch } from "../lib/api";
import type { WatchlistEntry } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("../lib/auth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "user@test.com", username: "user", avatar: null, created_at: "" },
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const watchlistItem: WatchlistEntry = {
  id: "w1",
  user_id: "u1",
  film_id: 550,
  film: {
    id: 550,
    title: "Fight Club",
    type: "movie",
    poster_path: null,
    backdrop_path: null,
    overview: "",
    release_date: "1999-10-15",
    first_air_date: null,
    original_language: "en",
    vote_average: 8.4,
    genre_ids: [],
  },
  created_at: "2024-01-01 00:00:00",
};

const inceptionItem: WatchlistEntry = {
  id: "w2",
  user_id: "u1",
  film_id: 27205,
  film: {
    id: 27205,
    title: "Inception",
    type: "movie",
    poster_path: null,
    backdrop_path: null,
    overview: "",
    release_date: "2010-07-16",
    first_air_date: null,
    original_language: "en",
    vote_average: 8.4,
    genre_ids: [],
  },
  created_at: "2024-01-02 00:00:00",
};

const mockApi = vi.mocked(apiFetch);

function renderWatchlist() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Watchlist />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Watchlist", () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it("renders watchlist films", async () => {
    mockApi.mockResolvedValue({ entries: [watchlistItem] });
    renderWatchlist();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    mockApi.mockResolvedValue({ entries: [] });
    renderWatchlist();

    expect(await screen.findByText(/Your watchlist is empty/)).toBeInTheDocument();
  });

  it("shows an error with a retry button when loading fails", async () => {
    mockApi.mockRejectedValue(new Error("Network error"));

    renderWatchlist();

    expect(await screen.findByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(screen.queryByText(/watchlist is empty/i)).not.toBeInTheDocument();
  });

  it("removes a film from the watchlist", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/watchlist") return { entries: [watchlistItem] };
      return { success: true };
    });

    renderWatchlist();
    await screen.findByText("Fight Club");

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(mockApi).toHaveBeenCalledWith("/watchlist/550", { method: "DELETE" });
  });

  it("filters the grid by title", async () => {
    mockApi.mockResolvedValue({ entries: [watchlistItem, inceptionItem] });
    renderWatchlist();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter watchlist by title" });
    await userEvent.type(filter, "inception");

    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.queryByText("Fight Club")).not.toBeInTheDocument();
  });

  it("clearing the filter restores all entries", async () => {
    mockApi.mockResolvedValue({ entries: [watchlistItem, inceptionItem] });
    renderWatchlist();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter watchlist by title" });
    await userEvent.type(filter, "inception");
    expect(screen.queryByText("Fight Club")).not.toBeInTheDocument();

    await userEvent.clear(filter);

    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
  });
});
