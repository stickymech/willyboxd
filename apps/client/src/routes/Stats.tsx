import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiFetch, API_ENDPOINTS } from "../lib/api";
import type { StatsOverview } from "@willyboxd/shared";
import { formatMinutes, formatScore } from "@willyboxd/shared";
import { Header } from "../components/Header";
import { InlineError } from "../components/InlineError";
import { Stars } from "../components/Stars";
import { useAuth } from "../lib/auth";

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-text-subtle">{label}</p>
      <div className="text-2xl font-bold text-text mt-1">{children}</div>
    </div>
  );
}

function BarChart({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <h3 className="font-semibold text-text mb-3">{title}</h3>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text">{row.label}</span>
              <span className="text-text-subtle">{row.count}</span>
            </div>
            <div className="h-2 bg-bg rounded overflow-hidden">
              <div className="h-full bg-accent rounded" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Stats() {
  const { user } = useAuth();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<{ stats: StatsOverview }>(API_ENDPOINTS.stats.overview),
    enabled: !!user,
  });

  const stats = data?.stats;
  const hours = stats ? formatMinutes(stats.total_minutes) : null;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Your Stats</h1>

        {!user ? (
          <p className="text-text-subtle">
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>{" "}
            to see your stats.
          </p>
        ) : isError ? (
          <InlineError
            message={error instanceof Error ? error.message : "Failed to load stats."}
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <p className="text-text-subtle">Loading...</p>
        ) : !stats || stats.total_watched === 0 ? (
          <p className="text-text-subtle">
            No stats yet —{" "}
            <Link to="/diary" className="text-accent hover:underline">
              log your first film
            </Link>{" "}
            and come back.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Films">{stats.total_films}</StatCard>
              <StatCard label="Entries">{stats.total_watched}</StatCard>
              <StatCard label="Hours">
                {hours ? `${hours.hours}h ${hours.minutes}m` : "—"}
              </StatCard>
              <StatCard label="Avg rating">
                <span className="flex items-center gap-2">
                  <Stars value={stats.average_rating} size="sm" />
                  <span className="text-sm text-text-subtle">{formatScore(stats.average_rating)}</span>
                </span>
              </StatCard>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <BarChart title="Top genres" rows={stats.genres.map((g) => ({ label: g.name, count: g.count }))} />
              <BarChart title="By year" rows={stats.years.map((y) => ({ label: String(y.year), count: y.count }))} />
              <BarChart
                title="By decade"
                rows={stats.decades.map((d) => ({ label: `${d.decade}s`, count: d.count }))}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}
