import type { MediaItem } from "@willyboxd/shared";
import { Link } from "react-router-dom";
import { getPosterUrl } from "@willyboxd/shared";

interface FilmCardProps {
  film: MediaItem;
}

export function FilmCard({ film }: FilmCardProps) {
  const posterUrl = getPosterUrl(film.poster_path, "small");

  return (
    <Link to={`/films/${film.id}`} className="block group">
      <div className="relative aspect-[2/3] bg-slate-800 rounded-lg overflow-hidden mb-2">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={film.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            No image
          </div>
        )}
        {film.vote_average > 0 && (
          <div className="absolute top-1 right-1 bg-slate-800/80 backdrop-blur rounded-full px-1.5 py-0.5 text-xs text-amber-400">
            ★ {film.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">
        {film.title}
      </h3>
      <p className="text-xs text-slate-500">
        {film.release_date?.slice(0, 4) || film.first_air_date?.slice(0, 4) || ""}
      </p>
    </Link>
  );
}
