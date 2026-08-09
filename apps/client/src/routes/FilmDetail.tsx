import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { FilmDetail, Review, DiaryEntry, WatchlistEntry } from "@willyboxd/shared";
import { Header } from "../components/Header";
import { RatingSelect } from "../components/RatingSelect";
import { Stars } from "../components/Stars";
import { useAuth } from "../lib/auth";
import { getPosterUrl, getBackdropUrl, getProfileUrl, toStarRating, getReviewSourceLabel } from "@willyboxd/shared";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function reviewStarValue(rating: number | null): number | null {
  return rating === null ? null : Math.round((rating / 2) * 2) / 2;
}

function formatReviewDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const starValue = reviewStarValue(review.rating);
  const sourceLabel = getReviewSourceLabel(review.url);
  const avatarUrl = review.author_avatar_path?.startsWith("/") && !review.author_avatar_path.includes("http")
    ? getProfileUrl(review.author_avatar_path, "small")
    : null;

  return (
    <article className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-bg shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-subtle">
              {review.author.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <p className="font-semibold text-text truncate">{review.author}</p>
            <p className="text-xs text-text-subtle shrink-0">{formatReviewDate(review.created_at)}</p>
          </div>
          {starValue !== null && (
            <div className="mt-1">
              <Stars value={starValue} size="sm" />
            </div>
          )}
          <p className={`text-sm text-text-muted mt-2 whitespace-pre-line ${expanded ? "" : "line-clamp-4"}`}>
            {review.content}
          </p>
          {review.content.length > 280 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-sm text-accent hover:underline mt-1"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
          {sourceLabel && <p className="text-xs text-text-subtle mt-2">via {sourceLabel}</p>}
          <a
            href={review.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-accent hover:underline mt-2"
          >
            Read review ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export function FilmDetail() {
  const { id } = useParams<{ id: string }>();
  const filmId = parseInt(id || "");
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") as "movie" | "tv") || "movie";
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [watchedDate, setWatchedDate] = useState(today());
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [review, setReview] = useState("");
  const [rewatch, setRewatch] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const initialized = useRef(false);

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["film", filmId],
    queryFn: () => apiFetch<{ film: FilmDetail }>(`${API_ENDPOINTS.films.detail(filmId)}?type=${type}`),
    staleTime: 10 * 60 * 1000,
    retry: false,
    enabled: !!filmId,
  });

  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => apiFetch<{ entries: WatchlistEntry[] }>(API_ENDPOINTS.watchlist.list),
    enabled: !!user && !!filmId,
  });
  const isInWatchlist = watchlistData?.entries.some((e) => e.film_id === filmId) ?? false;

  const { data: diaryData } = useQuery({
    queryKey: ["diary"],
    queryFn: () => apiFetch<{ entries: DiaryEntry[] }>(API_ENDPOINTS.diary.list),
    enabled: !!user && !!filmId,
  });
  const existingEntry = diaryData?.entries.find((e) => e.film_id === filmId);

  useEffect(() => {
    if (existingEntry && !initialized.current) {
      initialized.current = true;
      setWatchedDate(existingEntry.watched_date);
      setRating(existingEntry.rating ?? undefined);
      setReview(existingEntry.review ?? "");
      setRewatch(existingEntry.rewatch);
    }
  }, [existingEntry]);

  const watchlistMutation = useMutation({
    mutationFn: () =>
      isInWatchlist
        ? apiFetch(API_ENDPOINTS.watchlist.remove(filmId), { method: "DELETE" })
        : apiFetch(API_ENDPOINTS.watchlist.add(filmId, type), { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const diaryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        watched_date: watchedDate,
        rating: rating ?? null,
        review: review.trim() === "" ? null : review,
        rewatch,
      };
      if (existingEntry) {
        return apiFetch(API_ENDPOINTS.diary.update(existingEntry.id), {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      return apiFetch(API_ENDPOINTS.diary.create, {
        method: "POST",
        body: JSON.stringify({ ...payload, film_id: filmId, type, tags: [] }),
      });
    },
    onSuccess: () => {
      initialized.current = true;
      setSaveMessage(existingEntry ? "Entry updated." : "Logged to your diary.");
      queryClient.invalidateQueries({ queryKey: ["diary"] });
    },
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-text-subtle">Loading...</p>
        </main>
      </>
    );
  }

  if (isError || !response) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-text-muted">
            {error instanceof Error ? error.message : "Something went wrong loading this title."}
          </p>
          <button type="button" onClick={() => refetch()} className="btn btn-primary mt-4">
            Try again
          </button>
        </main>
      </>
    );
  }

  const { film } = response;
  const posterUrl = getPosterUrl(film.poster_path, "large");
  const backdropUrl = getBackdropUrl(film.backdrop_path, "large");

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="relative min-h-72 md:min-h-96 rounded-lg mb-6 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backdropUrl || "/placeholder-backdrop.jpg"})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/25" />
          <div className="relative z-10 flex flex-col md:flex-row gap-6 p-5 md:p-8 items-start md:items-end">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={film.title}
                className="w-48 h-72 md:w-56 md:h-[21rem] object-cover rounded-lg shadow-xl ring-1 ring-white/10 shrink-0"
              />
            )}
            <div className="text-text drop-shadow-md">
              <h1 className="text-3xl md:text-4xl font-bold">{film.title}</h1>
              <p className="text-text-muted mt-2">
                {film.release_date?.slice(0, 4)} • {film.type === "movie" ? "Film" : "TV Series"}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Stars value={toStarRating(film.vote_average)} />
              </div>
              {film.imdb_rating !== null && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm text-text-subtle">IMDb</span>
                  <Stars value={toStarRating(film.imdb_rating)} size="sm" />
                </div>
              )}
              {film.runtime && (
                <p className="text-text-muted mt-2">{film.runtime} minutes</p>
              )}
              {film.overview && (
                <p className="text-text-muted mt-4 max-w-2xl">{film.overview}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-text mb-3">Watchlist</h3>
            {user ? (
              <button
                onClick={() => watchlistMutation.mutate()}
                disabled={watchlistMutation.isPending}
                className="btn btn-primary"
              >
                {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>
            ) : (
              <p className="text-text-subtle">
                <Link to="/login" className="text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to add this to your watchlist.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text mb-3">
              {existingEntry ? "Diary entry" : "Log it in your diary"}
            </h3>
            {user ? (
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSaveMessage(null);
                  diaryMutation.mutate();
                }}
              >
                <div>
                  <label className="block text-sm text-text-subtle mb-1">Watched date</label>
                  <input
                    type="date"
                    value={watchedDate}
                    onChange={(e) => setWatchedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-subtle mb-1">Rating</label>
                  <RatingSelect value={rating} onChange={setRating} size="lg" />
                </div>
                <label className="flex items-center gap-2 text-sm text-text-muted">
                  <input
                    type="checkbox"
                    checked={rewatch}
                    onChange={(e) => setRewatch(e.target.checked)}
                    className="rounded border-border bg-surface"
                  />
                  Rewatch
                </label>
                <div>
                  <label className="block text-sm text-text-subtle mb-1">Review</label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={4}
                    placeholder="What did you think?"
                    className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
                  />
                </div>
                <button type="submit" disabled={diaryMutation.isPending} className="btn btn-primary">
                  {diaryMutation.isPending ? "Saving..." : existingEntry ? "Update entry" : "Log it"}
                </button>
                {saveMessage && <p className="text-sm text-accent">{saveMessage}</p>}
                {diaryMutation.isError && (
                  <p className="text-sm text-error">{(diaryMutation.error as Error).message}</p>
                )}
              </form>
            ) : (
              <p className="text-text-subtle">
                <Link to="/login" className="text-accent hover:underline">
                  Sign in
                </Link>{" "}
                to log this film in your diary.
              </p>
            )}
          </div>
        </div>

        {film.genres.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {film.genres.map((g) => (
                <span key={g.id} className="px-3 py-1 bg-surface rounded-full text-sm">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {film.credits.cast.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text mb-4">Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {film.credits.cast.map((c) => {
                const profileUrl = getProfileUrl(c.profile_path, "medium");
                return (
                  <a
                    key={c.id}
                    href={`https://www.themoviedb.org/person/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-center group"
                  >
                    <div className="w-16 h-24 mx-auto rounded mb-1 overflow-hidden bg-surface">
                      {profileUrl ? (
                        <img
                          src={profileUrl}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-text-subtle">
                          {c.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-text group-hover:text-accent transition-colors">{c.name}</p>
                    <p className="text-xs text-text-subtle">{c.character}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {film.reviews.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-text mb-4">Reviews</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {film.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
