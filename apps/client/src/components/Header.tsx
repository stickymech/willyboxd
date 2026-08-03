import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandMark } from "./BrandMark";

export function Header() {
  const { user, isLoading, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "text-accent" : "text-text-subtle hover:text-text transition-colors";

  return (
    <header className="bg-bg border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-accent">
          <BrandMark className="w-7 h-7" />
          <span className="text-xl font-bold">Willyboxd</span>
        </Link>

        <nav className="flex items-center gap-6">
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
              <Link to={`/users/${user.username}`}>
                <img
                  src={`https://www.gravatar.com/avatar/${user.email}?s=32&d=404`}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://via.placeholder.com/32";
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
