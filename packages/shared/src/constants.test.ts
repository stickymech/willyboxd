import { test, expect, describe } from "vitest";
import {
  ratingLabel,
  formatMinutes,
  getPosterUrl,
  getBackdropUrl,
  getImdbUrl,
  getTmdbUrl,
  RATING_OPTIONS,
  toStarRating,
} from "@willyboxd/shared";

describe("Shared Utilities", () => {
  test("ratingLabel returns correct star display", () => {
    expect(ratingLabel(0.5)).toBe("½");
    expect(ratingLabel(3)).toBe("★★★");
    expect(ratingLabel(5)).toBe("★★★★★");
    expect(ratingLabel(0)).toBe("No rating");
  });

  test("toStarRating normalizes a 0–10 score to the 0.5–5 scale", () => {
    expect(toStarRating(8.4)).toBe(4.2);
    expect(toStarRating(10)).toBe(5);
    expect(toStarRating(0)).toBe(0);
    expect(toStarRating(8.8)).toBe(4.4);
  });

  test("formatMinutes converts correctly", () => {
    expect(formatMinutes(120)).toEqual({ hours: 2, minutes: 0 });
    expect(formatMinutes(95)).toEqual({ hours: 1, minutes: 35 });
    expect(formatMinutes(0)).toEqual({ hours: 0, minutes: 0 });
  });

  test("RATING_OPTIONS has correct values", () => {
    expect(RATING_OPTIONS).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]);
  });

  test("getPosterUrl returns null for null path", () => {
    expect(getPosterUrl(null)).toBe(null);
  });

  test("getPosterUrl constructs correct URL", () => {
    expect(getPosterUrl("/path/to/poster.jpg", "small")).toBe("https://image.tmdb.org/t/p/w185/path/to/poster.jpg");
  });

  test("getBackdropUrl constructs correct URL", () => {
    expect(getBackdropUrl("/backdrop.jpg", "large")).toBe("https://image.tmdb.org/t/p/w1280/backdrop.jpg");
  });

  test("getImdbUrl constructs the IMDb title URL", () => {
    expect(getImdbUrl("tt0137523")).toBe("https://www.imdb.com/title/tt0137523");
  });

  test("getTmdbUrl constructs movie and tv URLs", () => {
    expect(getTmdbUrl(550, "movie")).toBe("https://www.themoviedb.org/movie/550");
    expect(getTmdbUrl(123, "tv")).toBe("https://www.themoviedb.org/tv/123");
  });

});
