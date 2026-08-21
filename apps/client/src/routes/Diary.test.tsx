import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Diary } from "./Diary";
import { apiFetch } from "../lib/api";
import type { DiaryEntry } from "@willyboxd/shared";

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

const fightClub: DiaryEntry = {
  id: "d1",
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
    imdb_id: null,
    imdb_rating: null,
    rt_rating: null,
    metacritic_rating: null,
  },
  watched_date: "2024-01-15",
  rating: 4,
  review: "The first rule of Fight Club is you do not talk about it.",
  rewatch: false,
  tags: ["thriller"],
  created_at: "2024-01-15 00:00:00",
};

const inception: DiaryEntry = {
  id: "d2",
  user_id: "u1",
  film_id: 27205,
  film: {
    id: 27205,
    title: "Inception",
    type: "movie",
    poster_path: null,
    backdrop_path: null,
    overview: "",
    release_date: "2010-07-16",
    first_air_date: null,
    original_language: "en",
    vote_average: 8.4,
    genre_ids: [],
    imdb_id: null,
    imdb_rating: null,
    rt_rating: null,
    metacritic_rating: null,
  },
  watched_date: "2024-01-16",
  rating: 5,
  review: null,
  rewatch: true,
  tags: ["sci-fi", "heist"],
  created_at: "2024-01-16 00:00:00",
};

const mockApi = vi.mocked(apiFetch);

function renderDiary() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Diary />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Diary", () => {
  beforeEach(() => {
    mockApi.mockReset();
  });

  it("filters diary entries by film title", async () => {
    mockApi.mockResolvedValue({ entries: [fightClub, inception] });
    renderDiary();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter diary entries" });
    await userEvent.type(filter, "inception");

    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.queryByText("Fight Club")).not.toBeInTheDocument();
  });

  it("filters diary entries by tag", async () => {
    mockApi.mockResolvedValue({ entries: [fightClub, inception] });
    renderDiary();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter diary entries" });
    await userEvent.type(filter, "thriller");

    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.queryByText("Inception")).not.toBeInTheDocument();
  });

  it("filters diary entries by review text", async () => {
    mockApi.mockResolvedValue({ entries: [fightClub, inception] });
    renderDiary();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter diary entries" });
    await userEvent.type(filter, "first rule");

    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.queryByText("Inception")).not.toBeInTheDocument();
  });

  it("clearing the filter restores all entries", async () => {
    mockApi.mockResolvedValue({ entries: [fightClub, inception] });
    renderDiary();

    await screen.findByText("Fight Club");
    const filter = screen.getByRole("textbox", { name: "Filter diary entries" });
    await userEvent.type(filter, "inception");
    expect(screen.queryByText("Fight Club")).not.toBeInTheDocument();

    await userEvent.clear(filter);

    expect(screen.getByText("Fight Club")).toBeInTheDocument();
    expect(screen.getByText("Inception")).toBeInTheDocument();
  });
});
