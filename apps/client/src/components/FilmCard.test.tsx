import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FilmCard, cardRating } from "./FilmCard";
import type { MediaItem } from "@willyboxd/shared";

function makeFilm(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: 1,
    title: "Test Film",
    type: "movie",
    poster_path: null,
    backdrop_path: null,
    overview: "",
    release_date: "2020-01-01",
    first_air_date: null,
    original_language: "en",
    vote_average: 0,
    genre_ids: [],
    imdb_id: null,
    imdb_rating: null,
    rt_rating: null,
    metacritic_rating: null,
    ...overrides,
  };
}

function renderCard(film: MediaItem) {
  return render(
    <MemoryRouter>
      <FilmCard film={film} />
    </MemoryRouter>,
  );
}

describe("FilmCard rating badge", () => {
  it("renders a half-star badge from the TMDB rating", () => {
    renderCard(makeFilm({ vote_average: 8.5 }));
    expect(screen.getByRole("img", { name: "4.5 out of 5 stars" })).toBeInTheDocument();
  });

  it("falls back to the IMDb rating when vote_average is 0", () => {
    renderCard(makeFilm({ vote_average: 0, imdb_rating: 7.7 }));
    expect(screen.getByRole("img", { name: "4 out of 5 stars" })).toBeInTheDocument();
  });

  it("falls back to the RT rating when vote_average and imdb are absent", () => {
    renderCard(makeFilm({ vote_average: 0, imdb_rating: null, rt_rating: 64 }));
    expect(screen.getByRole("img", { name: "3 out of 5 stars" })).toBeInTheDocument();
  });

  it("falls back to the Metacritic rating when all others are absent", () => {
    renderCard(makeFilm({ vote_average: 0, imdb_rating: null, rt_rating: null, metacritic_rating: 66 }));
    expect(screen.getByRole("img", { name: "3.5 out of 5 stars" })).toBeInTheDocument();
  });

  it("rounds scores to the nearest half star", () => {
    renderCard(makeFilm({ vote_average: 8.6 }));
    expect(screen.getByRole("img", { name: "4.5 out of 5 stars" })).toBeInTheDocument();
  });

  it("renders no badge when no score exists", () => {
    renderCard(makeFilm());
    expect(screen.queryByRole("img", { name: /out of 5 stars/ })).not.toBeInTheDocument();
  });

  it("cardRating returns null when no source is available", () => {
    expect(cardRating(makeFilm())).toBeNull();
  });
});