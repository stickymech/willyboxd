import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Search } from "./Search";
import { apiFetch } from "../lib/api";
import { ThemeProvider } from "../lib/theme";
import type { MediaItem } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}));

vi.mock("../lib/theme", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
  useTheme: () => ({ theme: "amber", setTheme: vi.fn() }),
  THEMES: ["amber", "spotify", "runway", "linear"],
}));

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

const mockApi = vi.mocked(apiFetch);

function renderSearch(initialEntries: string[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider>
          <Search />
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Search", () => {
  it("restores the anime toggle from the URL on load", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });

    renderSearch(["/?q=naruto&anime=1"]);

    const checkbox = screen.getByLabelText("Anime only");
    expect(checkbox).toBeChecked();

    await screen.findByText("Naruto");
    expect(mockApi).toHaveBeenCalledWith("/films/search?q=naruto&anime=1");
  });

  it("adds anime=1 when the toggle is enabled", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });

    renderSearch(["/?q=naruto"]);

    await screen.findByText("Naruto");
    mockApi.mockClear();

    const checkbox = screen.getByLabelText("Anime only");
    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/films/search?q=naruto&anime=1"));
  });

  it("drops anime=1 when the toggle is disabled", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });

    renderSearch(["/?q=naruto&anime=1"]);

    await screen.findByText("Naruto");
    mockApi.mockClear();

    const checkbox = screen.getByLabelText("Anime only");
    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/films/search?q=naruto"));
  });
});
