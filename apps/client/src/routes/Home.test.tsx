import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
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
  imdb_id: null,
  imdb_rating: null,
  rt_rating: null,
  metacritic_rating: null,
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

  it("enriches an unrated title with IMDb ratings from the ratings endpoint", async () => {
    const unrated: MediaItem = {
      ...animeItem,
      id: 7,
      title: "We Are Aliens",
      vote_average: 0,
    };
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/anime?time=week") return { results: [unrated] };
      if (path === "/films/anime") return { results: [] };
      if (String(path).startsWith("/films/ratings")) {
        return { ratings: { "7:tv": { imdb_id: "tt3703338", imdb_rating: 7.7, rt_rating: 64, metacritic_rating: null } } };
      }
      return { results: [] };
    });

    renderHome();

    expect(await screen.findByText("We Are Aliens")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument());
  });

  it("keeps cards scoreless when the ratings request fails", async () => {
    const unrated: MediaItem = {
      ...animeItem,
      id: 8,
      title: "No Score Film",
      vote_average: 0,
    };
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/anime?time=week") return { results: [unrated] };
      if (path === "/films/anime") return { results: [] };
      if (String(path).startsWith("/films/ratings")) throw new Error("boom");
      return { results: [] };
    });

    renderHome();

    expect(await screen.findByText("No Score Film")).toBeInTheDocument();
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it("shows an error with retry instead of infinite loading when a section fails", async () => {
    mockApi.mockRejectedValue(new Error("Failed to load."));

    renderHome();

    expect(await screen.findAllByRole("button", { name: /try again/i })).toHaveLength(4);
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });
});
