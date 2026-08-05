import { test, expect, describe } from "vitest";
import { md5 } from "js-md5";
import {
  ratingLabel,
  formatMinutes,
  getPosterUrl,
  getBackdropUrl,
  getProfileImageUrl,
  RATING_OPTIONS,
} from "@willyboxd/shared";

describe("Shared Utilities", () => {
  test("ratingLabel returns correct star display", () => {
    expect(ratingLabel(0.5)).toBe("½");
    expect(ratingLabel(3)).toBe("★★★");
    expect(ratingLabel(5)).toBe("★★★★★");
    expect(ratingLabel(0)).toBe("No rating");
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

  test("getProfileImageUrl returns Gravatar URL", () => {
    const url = getProfileImageUrl("test@example.com");
    expect(url).toContain("gravatar.com/avatar/");
    expect(url).toContain("s=200");
  });

  test("getProfileImageUrl hashes the email and omits the raw address", () => {
    const url = getProfileImageUrl("Test@Example.com");
    expect(url).toContain("gravatar.com/avatar/");
    expect(url).not.toContain("Test@Example"); // raw email must not leak
    expect(url).toContain(md5("test@example.com"));
    expect(url).toContain("s=200");
  });

  test("getProfileImageUrl honors the size option", () => {
    const url = getProfileImageUrl("test@example.com", 32);
    expect(url).toContain("s=32");
    expect(url).not.toContain("s=200");
  });

  test("getProfileImageUrl returns null for null email", () => {
    expect(getProfileImageUrl(null)).toBe(null);
    expect(getProfileImageUrl(undefined)).toBe(null);
    expect(getProfileImageUrl("")).toBe(null);
  });
});
