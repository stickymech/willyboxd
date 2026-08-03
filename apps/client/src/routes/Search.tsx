import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { MediaItem } from "@willyboxd/shared";
import { FilmCard } from "../components/FilmCard";
import { Header } from "../components/Header";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const anime = searchParams.get("anime") === "1";
  const [inputValue, setInputValue] = useState(query);

  const { data, isFetching } = useQuery({
    queryKey: ["search", query, anime],
    queryFn: () =>
      query
        ? apiFetch<{ results: MediaItem[] }>(
            `${API_ENDPOINTS.films.search}?q=${encodeURIComponent(query)}${anime ? "&anime=1" : ""}`,
          )
        : null,
    staleTime: 5 * 60 * 1000,
    enabled: !!query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: inputValue, ...(anime ? { anime: "1" } : {}) });
  };

  const toggleAnime = () => {
    setSearchParams({ q: query, ...(anime ? {} : { anime: "1" }) });
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value as string)}
              placeholder="Search for films or TV shows..."
              className="flex-1 px-4 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-text-subtle cursor-pointer select-none">
            <input
              type="checkbox"
              checked={anime}
              onChange={toggleAnime}
              aria-label="Anime only"
              className="h-4 w-4 rounded border-border bg-surface focus:outline-none focus:border-accent"
              style={{ accentColor: "var(--color-accent)" }}
            />
            Anime only
          </label>
        </form>

        {query && (
          <h2 className="text-lg font-semibold mb-4 text-text">
            Results for "{query}"{anime ? " (anime)" : ""}
          </h2>
        )}

        {isFetching ? (
          <p className="text-text-subtle">Searching...</p>
        ) : data && data.results?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.results.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        ) : query ? (
          <p className="text-text-subtle">No results found.</p>
        ) : (
          <p className="text-text-subtle">Enter a search term above.</p>
        )}
      </main>
    </>
  );
}
