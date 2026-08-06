import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Search } from "./Search";
import { apiFetch } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
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
        <Search />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Search", () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it("renders results for the URL query without an anime filter", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });

    renderSearch(["/?q=naruto"]);

    await screen.findByText("Naruto");
    expect(mockApi).toHaveBeenCalledWith("/films/search?q=naruto");
    expect(mockApi.mock.calls.some(([path]) => String(path).includes("anime=1"))).toBe(false);
  });

  it("does not render an anime toggle", async () => {
    mockApi.mockResolvedValue({ results: [] });

    renderSearch(["/?q=naruto"]);

    expect(screen.queryByLabelText("Anime only")).not.toBeInTheDocument();
  });

  it("refines the query from the inline form", async () => {
    mockApi.mockResolvedValue({ results: [naruto] });

    renderSearch(["/?q=naruto"]);
    await screen.findByText("Naruto");
    mockApi.mockClear();

    const input = screen.getByRole("textbox", { name: "Refine search" });
    await userEvent.clear(input);
    await userEvent.type(input, "bleach");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(mockApi).toHaveBeenCalledWith("/films/search?q=bleach"));
  });
});
