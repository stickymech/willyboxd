export type MediaItem = {
  id: number;
  title: string;
  type: "movie" | "tv";
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  release_date: string | null;
  first_air_date: string | null;
  original_language: string | null;
  vote_average: number;
  genre_ids: number[];
};

export type Genre = {
  id: number;
  name: string;
};

export type FilmDetail = MediaItem & {
  runtime: number | null;
  budget: number | null;
  revenue: number | null;
  status: string;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  last_air_date: string | null;
  genres: Genre[];
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  images: {
    backdrops: { file_path: string }[];
    posters: { file_path: string }[];
  };
  imdb_id: string | null;
  imdb_rating: number | null;
  rt_rating: number | null;
  metacritic_rating: number | null;
  reviews: Review[];
};

export type Review = {
  id: string;
  author: string;
  author_avatar_path: string | null;
  rating: number | null;
  content: string;
  url: string;
  created_at: string;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
};

export type User = {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  created_at: string;
};

export type DiaryEntry = {
  id: string;
  user_id: string;
  film_id: number;
  film: MediaItem | null;
  watched_date: string;
  rating: number | null;
  review: string | null;
  rewatch: boolean;
  tags: string[];
  created_at: string;
};

export type WatchlistEntry = {
  id: string;
  user_id: string;
  film_id: number;
  film: MediaItem | null;
  created_at: string;
};

export type List = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  is_ranked: boolean;
  created_at: string;
  items: ListItem[];
};

export type ListItem = {
  id: string;
  list_id: string;
  film_id: number;
  film: MediaItem | null;
  position: number;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  author: User | null;
  diary_entry_id: string | null;
  content: string;
  created_at: string;
};

export type Like = {
  id: string;
  user_id: string;
  diary_entry_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type Activity = {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
  film: MediaItem | null;
};

export type StatsOverview = {
  total_watched: number;
  total_minutes: number;
  average_rating: number;
  genres: { name: string; count: number }[];
  years: { year: number; count: number }[];
  decades: { decade: number; count: number }[];
};
