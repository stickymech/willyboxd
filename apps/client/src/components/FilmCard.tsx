import type { MediaItem } from "@willyboxd/shared";
import { Link } from "react-router-dom";
import { getPosterUrl } from "@willyboxd/shared";

interface FilmCardProps {
  film: MediaItem;
}

export function FilmCard({ film }: FilmCardProps) {
  const posterUrl = getPosterUrl(film.poster_path, "small");

  return (
    <Link to={`/films/${film.id}?type=${film.type}`} className="block group">
      <div className="relative aspect-[2/3] bg-surface rounded-lg overflow-hidden mb-2 shadow-card">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={film.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-subtle">
            No image
          </div>
        )}
        {film.vote_average > 0 && (
          <div className="absolute top-1 right-1 bg-surface/80 backdrop-blur rounded-full px-1.5 py-0.5 text-xs text-accent">
            ★ {film.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-text group-hover:text-accent transition-colors">
        {film.title}
      </h3>
      <p className="text-xs text-text-subtle">
        {film.release_date?.slice(0, 4) || film.first_air_date?.slice(0, 4) || ""}
      </p>
    </Link>
  );
}
