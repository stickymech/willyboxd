import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LoginSchema } from "@willyboxd/shared";

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = LoginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      setIsLoading(false);
      return;
    }

    try {
      await login(parsed.data.email, parsed.data.password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-slate-400 mt-4 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-amber-400 hover:text-amber-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
