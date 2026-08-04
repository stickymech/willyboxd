const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData: { error?: string } = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiFetchFormData(path: string, formData: FormData): Promise<unknown> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData: { error?: string } = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const API_ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  films: {
    search: "/films/search",
    popular: "/films/popular",
    trending: "/films/trending",
    anime: "/films/anime",
    detail: (id: number) => `/films/${id}`,
    recommendations: (id: number) => `/films/${id}/recommendations`,
  },
  diary: {
    list: "/diary",
    create: "/diary",
    detail: (id: string) => `/diary/${id}`,
    update: (id: string) => `/diary/${id}`,
    delete: (id: string) => `/diary/${id}`,
  },
  watchlist: {
    list: "/watchlist",
    add: (filmId: number, type?: string) =>
      `/watchlist/${filmId}${type ? `?type=${type}` : ""}`,
    remove: (filmId: number) => `/watchlist/${filmId}`,
  },
  lists: {
    list: "/lists",
    create: "/lists",
    detail: (id: string) => `/lists/${id}`,
    update: (id: string) => `/lists/${id}`,
    delete: (id: string) => `/lists/${id}`,
  },
  social: {
    profile: (username: string) => `/users/${username}`,
    follow: (username: string) => `/users/${username}/follow`,
    feed: "/feed",
  },
  stats: {
    overview: "/stats",
  },
};
