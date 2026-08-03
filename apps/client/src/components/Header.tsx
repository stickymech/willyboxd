import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Header() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-amber-400">
          Willyboxd
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "text-amber-400" : "text-slate-400 hover:text-white transition-colors"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) =>
              isActive ? "text-amber-400" : "text-slate-400 hover:text-white transition-colors"
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/diary"
            className={({ isActive }) =>
              isActive ? "text-amber-400" : "text-slate-400 hover:text-white transition-colors"
            }
          >
            Diary
          </NavLink>
          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              isActive ? "text-amber-400" : "text-slate-400 hover:text-white transition-colors"
            }
          >
            Watchlist
          </NavLink>

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
                className="text-sm text-slate-400 hover:text-white"
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
