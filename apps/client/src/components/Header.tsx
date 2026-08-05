import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { resolveAvatarUrl } from "../lib/api";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandMark } from "./BrandMark";

export function Header() {
  const { user, isLoading, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-accent" : "text-text-subtle hover:text-text transition-colors";

  return (
    <header className="bg-bg border-b border-border">
      <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <Link to="/" className="flex items-center gap-3 text-accent">
          <BrandMark className="w-28 h-14" />
          <span className="text-4xl md:text-5xl font-bold tracking-tight">Willyboxd</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <NavLink to="/" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/search" className={navLinkClass}>
            Search
          </NavLink>
          <NavLink to="/diary" className={navLinkClass}>
            Diary
          </NavLink>
          <NavLink to="/watchlist" className={navLinkClass}>
            Watchlist
          </NavLink>

          <ThemeSwitcher />

          {isLoading ? null : user ? (
            <div className="flex items-center gap-3">
              <Link to="/settings">
                <img
                  src={resolveAvatarUrl(user.avatar) ?? "/placeholder-avatar.svg"}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-avatar.svg";
                  }}
                />
              </Link>
              <button
                onClick={() => logout()}
                className="text-sm text-text-subtle hover:text-text"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
