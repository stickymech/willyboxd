import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { RegisterSchema } from "@willyboxd/shared";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
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
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    const parsed = RegisterSchema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      setIsLoading(false);
      return;
    }

    try {
      await register(parsed.data.email, parsed.data.username, parsed.data.password);
      navigate("/");
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">Create Account</h1>
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_-]+"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-slate-400 mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-amber-400 hover:text-amber-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
