import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home } from "./Home";
import { apiFetch } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}));

const animeItem: MediaItem = {
  id: 1,
  title: "Frieren: Beyond Journey's End",
  type: "tv",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: null,
  first_air_date: "2023-09-29",
  original_language: "ja",
  vote_average: 9,
  genre_ids: [16],
};

const topAnimeItem: MediaItem = {
  id: 2,
  title: "Fullmetal Alchemist: Brotherhood",
  type: "tv",
  poster_path: null,
  backdrop_path: null,
  overview: "",
  release_date: null,
  first_air_date: "2009-04-05",
  original_language: "ja",
  vote_average: 9,
  genre_ids: [16],
};

const mockApi = vi.mocked(apiFetch);

function renderHome() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe("Home", () => {
  it("renders Trending Anime and Top Anime sections", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/anime?time=week") return { results: [animeItem] };
      if (path === "/films/anime") return { results: [topAnimeItem] };
      return { results: [] };
    });

    renderHome();

    expect(screen.getByText("Trending Anime")).toBeInTheDocument();
    expect(screen.getByText("Top Anime")).toBeInTheDocument();

    expect(await screen.findByText("Frieren: Beyond Journey's End")).toBeInTheDocument();
    expect(await screen.findByText("Fullmetal Alchemist: Brotherhood")).toBeInTheDocument();
  });

  it("requests trending anime and top anime from the anime endpoint", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/anime?time=week") return { results: [animeItem] };
      if (path === "/films/anime") return { results: [topAnimeItem] };
      return { results: [] };
    });

    renderHome();

    await screen.findByText("Frieren: Beyond Journey's End");
    expect(mockApi).toHaveBeenCalledWith("/films/anime?time=week");
    expect(mockApi).toHaveBeenCalledWith("/films/anime");
  });

  it("renders the header search box", () => {
    mockApi.mockResolvedValue({ results: [] });
    renderHome();

    expect(screen.getByRole("combobox", { name: "Search films and TV" })).toBeInTheDocument();
  });
});
