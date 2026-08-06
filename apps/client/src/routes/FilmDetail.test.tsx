import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
    expect(screen.queryByRole("img", { name: /out of 5 stars/i })).not.toBeInTheDocument();
  });
});
