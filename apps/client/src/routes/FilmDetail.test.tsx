import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FilmDetail } from "./FilmDetail";
import { apiFetch } from "../lib/api";
import type { FilmDetail as FilmDetailType } from "@willyboxd/shared";

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, apiFetch: vi.fn() };
});

vi.mock("../lib/auth", () => ({
  useAuth: () => ({ user: null, isLoading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() }),
}));

const mockApi = vi.mocked(apiFetch);

const baseFilm: FilmDetailType = {
  id: 550,
  title: "Fight Club",
  type: "movie",
  poster_path: null,
  backdrop_path: null,
  overview: "An insomniac office worker.",
  release_date: "1999-10-15",
  first_air_date: null,
  original_language: "en",
  vote_average: 8.4,
  genre_ids: [],
  runtime: 139,
  budget: null,
  revenue: null,
  status: "Released",
  number_of_seasons: null,
  number_of_episodes: null,
  last_air_date: null,
  genres: [],
  credits: { cast: [], crew: [] },
  images: { backdrops: [], posters: [] },
  imdb_id: null,
  imdb_rating: null,
  reviews: [],
};

function renderFilmDetail() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/films/550?type=movie"]}>
        <Routes>
          <Route path="/films/:id" element={<FilmDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FilmDetail reviews", () => {
  it("renders a Reviews section when reviews exist", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return {
          film: {
            ...baseFilm,
            reviews: [
              {
                id: "r1",
                author: "Goddard",
                author_avatar_path: null,
                rating: 8,
                content: "Pretty awesome movie.",
                url: "https://www.themoviedb.org/review/r1",
                created_at: "2018-06-09T17:51:53.359Z",
              },
            ],
          },
        };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Reviews")).toBeInTheDocument();
    expect(screen.getByText("Goddard")).toBeInTheDocument();
    expect(screen.getByText("Pretty awesome movie.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /read review/i })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/review/r1",
    );
  });

  it("renders no Reviews section when reviews are empty", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    expect(screen.queryByText("Reviews")).not.toBeInTheDocument();
  });

  it("renders an error state with a retry button when the film query fails", async () => {
    mockApi.mockRejectedValue(new Error("Network error"));

    renderFilmDetail();

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
  });

  it("renders the hero score with Stars on the 0.5–5 scale", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /4\.2 out of 5 stars/i })).toBeInTheDocument();
    expect(screen.queryByText(/\/ 10/i)).not.toBeInTheDocument();
  });

  it("renders a labeled IMDb line when imdb_rating is present", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, imdb_id: "tt0137523", imdb_rating: 8.8, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("IMDb")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /4\.4 out of 5 stars/i })).toBeInTheDocument();
  });

  it("renders no IMDb line when imdb_rating is null", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, imdb_id: null, imdb_rating: null, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    expect(screen.queryByText("IMDb")).not.toBeInTheDocument();
  });

  it("renders View on IMDb and View on TMDB links with correct hrefs", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, imdb_id: "tt0137523", imdb_rating: 8.8, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    const imdbLink = screen.getByRole("link", { name: /view on imdb/i });
    expect(imdbLink).toHaveAttribute("href", "https://www.imdb.com/title/tt0137523");
    expect(imdbLink).toHaveAttribute("target", "_blank");
    expect(imdbLink).toHaveAttribute("rel", "noreferrer");
    const tmdbLink = screen.getByRole("link", { name: /view on tmdb/i });
    expect(tmdbLink).toHaveAttribute("href", "https://www.themoviedb.org/movie/550");
    expect(tmdbLink).toHaveAttribute("target", "_blank");
    expect(tmdbLink).toHaveAttribute("rel", "noreferrer");
  });

  it("renders View on TMDB link but no View on IMDb link when imdb_id is null", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return { film: { ...baseFilm, imdb_id: null, imdb_rating: null, reviews: [] } };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on tmdb/i })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/movie/550",
    );
    expect(screen.queryByRole("link", { name: /view on imdb/i })).not.toBeInTheDocument();
  });

  it("renders a View on TMDB link for a tv title", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return {
          film: { ...baseFilm, id: 123, type: "tv", title: "Cowboy Bebop", imdb_id: null, imdb_rating: null, reviews: [] },
        };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("Cowboy Bebop")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view on tmdb/i })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org/tv/123",
    );
  });

  it("shows no star rating when a review has no rating", async () => {
    mockApi.mockImplementation(async (path: string) => {
      if (path === "/films/550?type=movie") {
        return {
          film: {
            ...baseFilm,
            reviews: [
              {
                id: "r2",
                author: "NoRating",
                author_avatar_path: null,
                rating: null,
                content: "No rating here.",
                url: "https://www.themoviedb.org/review/r2",
                created_at: "2018-06-09T17:51:53.359Z",
              },
            ],
          },
        };
      }
      return { entries: [] };
    });

    renderFilmDetail();

    expect(await screen.findByText("NoRating")).toBeInTheDocument();
    const reviewCard = screen.getByText("NoRating").closest("article");
    expect(reviewCard).not.toBeNull();
    expect(within(reviewCard as HTMLElement).queryByRole("img", { name: /out of 5 stars/i })).not.toBeInTheDocument();
  });
});
