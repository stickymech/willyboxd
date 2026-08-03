import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { FilmDetail } from "@willyboxd/shared";
import { Header } from "../components/Header";
import { RatingSelect } from "../components/RatingSelect";
import { getPosterUrl, getBackdropUrl } from "@willyboxd/shared";

export function FilmDetail() {
  const { id } = useParams<{ id: string }>();
  const filmId = parseInt(id || "");
  const type = "movie";

  const { data: response, isLoading } = useQuery({
    queryKey: ["film", filmId],
    queryFn: () => apiFetch<{ film: FilmDetail }>(`${API_ENDPOINTS.films.detail(filmId)}?type=${type}`),
    staleTime: 10 * 60 * 1000,
    enabled: !!filmId,
  });

  if (isLoading || !response) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-slate-400">Loading...</p>
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
        <div
          className="h-64 md:h-96 bg-cover bg-center rounded-lg mb-6"
          style={{ backgroundImage: `url(${backdropUrl || "/placeholder-backdrop.jpg"})` }}
        >
          <div className="flex flex-col md:flex-row gap-6">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={film.title}
                className="w-48 h-72 object-cover rounded-lg shadow-xl"
              />
            )}
            <div className="text-white">
              <h1 className="text-3xl font-bold">{film.title}</h1>
              <p className="text-slate-400 mt-2">
                {film.release_date?.slice(0, 4)} • {film.type === "movie" ? "Film" : "TV Series"}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-amber-400">★</span>
                <span>{film.vote_average.toFixed(1)}</span>
              </div>
              {film.runtime && (
                <p className="text-slate-300 mt-2">{film.runtime} minutes</p>
              )}
              {film.overview && (
                <p className="text-slate-300 mt-4 max-w-2xl">{film.overview}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button className="btn btn-primary">Add to Watchlist</button>
          <RatingSelect />
        </div>

        {film.genres.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-2">Genres</h3>
            <div className="flex flex-wrap gap-2">
              {film.genres.map((g) => (
                <span key={g.id} className="px-3 py-1 bg-slate-800 rounded-full text-sm">
                  {g.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {film.credits.cast.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Cast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {film.credits.cast.map((c) => (
                <div key={c.id} className="text-center">
                  <div className="w-16 h-24 mx-auto bg-slate-800 rounded mb-1"></div>
                  <p className="text-sm text-white">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
