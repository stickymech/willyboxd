import type { MediaItem } from "@willyboxd/shared";
import { Link } from "react-router-dom";
import { getPosterUrl, toHalfStar, toHundredStarRating, toStarRating } from "@willyboxd/shared";
import { Stars } from "./Stars";

interface FilmCardProps {
  film: MediaItem;
}

export function cardRating(film: MediaItem): number | null {
  let stars: number | null = null;
  if (film.vote_average > 0) {
    stars = toStarRating(film.vote_average);
  } else if (film.imdb_rating !== null && film.imdb_rating > 0) {
    stars = toStarRating(film.imdb_rating);
  } else if (film.rt_rating !== null && film.rt_rating > 0) {
    stars = toHundredStarRating(film.rt_rating);
  } else if (film.metacritic_rating !== null && film.metacritic_rating > 0) {
    stars = toHundredStarRating(film.metacritic_rating);
  }
  return stars === null ? null : toHalfStar(stars);
}

export function FilmCard({ film }: FilmCardProps) {
  const posterUrl = getPosterUrl(film.poster_path, "small");
  const rating = cardRating(film);

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
        {rating !== null && (
          <div className="absolute top-1 right-1 bg-surface/80 backdrop-blur rounded-full px-1.5 py-0.5 text-xs text-accent">
            <Stars value={rating} size="xs" />
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