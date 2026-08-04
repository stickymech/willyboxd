import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { LoginSchema } from "@willyboxd/shared";
import { BrandMark } from "../components/BrandMark";

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
      identifier: formData.get("identifier") as string,
      password: formData.get("password") as string,
    };

    const parsed = LoginSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      setIsLoading(false);
      return;
    }

    try {
      await login(parsed.data.identifier, parsed.data.password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md">
        <BrandMark className="w-14 h-14 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-center mb-8 text-text">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Email or username</label>
            <input
              type="text"
              name="identifier"
              required
              placeholder="you@example.com or username"
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-error text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-text-subtle mt-4 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-accent hover:text-accent-hover">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
