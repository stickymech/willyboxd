import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Watchlist } from "./Watchlist";
import { apiFetch } from "../lib/api";
import { ThemeProvider } from "../lib/theme";
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

vi.mock("../lib/theme", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => ({ theme: "amber", setTheme: vi.fn() }),
  THEMES: ["amber", "spotify", "runway", "linear"],
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

const mockApi = vi.mocked(apiFetch);

function renderWatchlist() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ThemeProvider>
          <Watchlist />
        </ThemeProvider>
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
});
