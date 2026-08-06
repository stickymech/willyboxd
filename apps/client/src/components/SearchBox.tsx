import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import { getPosterUrl } from "@willyboxd/shared";
import type { MediaItem } from "@willyboxd/shared";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);
  return debounced;
}

export function SearchBox() {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(value.trim(), 250);

  const { data, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () =>
      apiFetch<{ results: MediaItem[] }>(
        `${API_ENDPOINTS.films.search}?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: debouncedQuery.length >= 1,
    staleTime: 5 * 60 * 1000,
  });

  const results = (data?.results ?? []).slice(0, 6);
  const hasQuery = value.trim().length > 0;
  const showDropdown = isOpen && hasQuery;

  useEffect(() => {
    if (!showDropdown) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [showDropdown]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, data]);

  const closeDropdown = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const openMatch = (film: MediaItem) => {
    closeDropdown();
    navigate(`/films/${film.id}?type=${film.type}`);
  };

  const submitSearch = () => {
    const q = value.trim();
    closeDropdown();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) return;
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length === 0) return;
      setIsOpen(true);
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        openMatch(results[activeIndex]);
      } else {
        submitSearch();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-56">
      <form
        role="search"
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle"
        >
          <circle cx="9" cy="9" r="5.5" />
          <path d="M13.5 13.5L17 17" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setActiveIndex(-1);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder="Search films and TV..."
          aria-label="Search films and TV"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={
            showDropdown && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          className="w-full py-2 pl-9 pr-4 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
        />
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded shadow-card z-50">
          {isFetching ? (
            <div className="px-4 py-3 text-sm text-text-subtle">Searching...</div>
          ) : results.length > 0 ? (
            <ul id={listboxId} role="listbox" aria-label="Search results" className="max-h-96 overflow-y-auto py-1">
              {results.map((film, index) => {
                const posterUrl = getPosterUrl(film.poster_path, "small");
                return (
                  <li
                    key={film.id}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openMatch(film)}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${activeIndex === index ? "bg-surface-2" : ""}`}
                  >
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt=""
                        className="w-10 h-14 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-14 rounded shrink-0 bg-surface-2 flex items-center justify-center text-[10px] text-text-subtle">
                        No image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text text-sm truncate">{film.title}</span>
                        <span className="shrink-0 text-xs px-1.5 py-0.5 bg-surface rounded text-text-subtle">
                          {film.type === "tv" ? "TV" : "Movie"}
                        </span>
                      </div>
                      <p className="text-xs text-text-subtle">
                        {film.release_date?.slice(0, 4) || film.first_air_date?.slice(0, 4) || ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-text-subtle">No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}
