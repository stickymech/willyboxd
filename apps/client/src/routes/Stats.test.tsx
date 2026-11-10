import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stats } from "./Stats";
import { apiFetch } from "../lib/api";
import type { StatsOverview } from "@willyboxd/shared";

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

const mockedApiFetch = vi.mocked(apiFetch);

const overview: StatsOverview = {
  total_watched: 3,
  total_films: 2,
  total_minutes: 339,
  average_rating: 3.5,
  genres: [
    { name: "Drama", count: 2 },
    { name: "Thriller", count: 1 },
  ],
  years: [{ year: 2024, count: 3 }],
  decades: [{ decade: 2020, count: 3 }],
};

function renderStats() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Stats />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Stats page", () => {
  it("renders summary cards and charts from the stats endpoint", async () => {
    mockedApiFetch.mockResolvedValue({ stats: overview });

    renderStats();

    await screen.findByText("Top genres");

    expect(screen.getByText("Films").parentElement).toHaveTextContent("2");
    expect(screen.getByText("Entries").parentElement).toHaveTextContent("3");
    expect(screen.getByText("Hours").parentElement).toHaveTextContent("5h 39m");
    expect(screen.getByText("Avg rating").parentElement).toHaveTextContent("3.5/5");

    expect(screen.getByText("Drama")).toBeInTheDocument();
    expect(screen.getByText("Thriller")).toBeInTheDocument();
    expect(screen.getByText("By year")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
    expect(screen.getByText("By decade")).toBeInTheDocument();
    expect(screen.getByText("2020s")).toBeInTheDocument();
  });

  it("shows the empty state when nothing has been logged", async () => {
    mockedApiFetch.mockResolvedValue({
      stats: {
        total_watched: 0,
        total_films: 0,
        total_minutes: 0,
        average_rating: 0,
        genres: [],
        years: [],
        decades: [],
      },
    });

    renderStats();

    expect(await screen.findByText(/log your first film/i)).toBeInTheDocument();
  });

  it("shows an error with retry when the request fails", async () => {
    mockedApiFetch.mockRejectedValue(new Error("Failed to load stats."));

    renderStats();

    expect(await screen.findByText("Failed to load stats.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
