import { useRef, useState } from "react";
import { useAuth } from "../lib/auth";
import { apiFetch, apiFetchFormData, API_ENDPOINTS, resolveAvatarUrl } from "../lib/api";
import { ChangePasswordSchema } from "@willyboxd/shared";
import { Header } from "../components/Header";
import { useQueryClient } from "@tanstack/react-query";

export function Settings() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [avatarStatus, setAvatarStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-text-subtle">Loading...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-text-subtle">
            You must be{" "}
            <a href="/login" className="text-accent hover:underline">
              signed in
            </a>{" "}
            to view settings.
          </p>
        </main>
      </>
    );
  }

  const avatarUrl = resolveAvatarUrl(user.avatar) ?? "/placeholder-avatar.svg";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    setAvatarStatus("uploading");
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("avatar", file);
      await apiFetchFormData(API_ENDPOINTS.auth.upload, form);
      setAvatarStatus("idle");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err) {
      setAvatarStatus("error");
      setUploadError((err as Error).message);
    }
  };

  const removeAvatar = async () => {
    setAvatarStatus("uploading");
    setUploadError(null);
    try {
      await apiFetch(API_ENDPOINTS.auth.update, {
        method: "PUT",
        body: JSON.stringify({ avatar: null }),
      });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch {
      setAvatarStatus("error");
      setUploadError("Failed to remove avatar");
    }
  };

  const savePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordStatus("idle");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const parsed = ChangePasswordSchema.safeParse({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    if (!parsed.success) {
      setPasswordError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    setPasswordStatus("saving");
    try {
      await apiFetch(API_ENDPOINTS.auth.updatePassword, {
        method: "PUT",
        body: JSON.stringify(parsed.data),
      });
      setPasswordStatus("saved");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordStatus("error");
      setPasswordError((err as Error).message);
    }
  };

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-text mb-8">Settings</h1>

        <section className="mb-10 pb-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={avatarUrl}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-avatar.svg";
              }}
              alt={user.username}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-text">{user.username}</p>
              <p className="text-sm text-text-subtle">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              disabled={avatarStatus === "uploading"}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarStatus === "uploading"}
              className="btn btn-secondary"
            >
              {avatarStatus === "uploading" ? "Uploading…" : user.avatar ? "Change avatar" : "Upload image"}
            </button>
            {user.avatar && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={avatarStatus === "uploading"}
                className="btn btn-secondary"
              >
                Remove avatar
              </button>
            )}
          </div>
          {avatarStatus === "error" && <p className="mt-2 text-sm text-error">{uploadError || "Upload failed"}</p>}
          <p className="mt-2 text-xs text-text-subtle">
            Upload a PNG or JPEG image (max 2MB). When none is set, a local placeholder is shown.
          </p>
        </section>

        <section className="pb-6">
          <h2 className="text-xl font-semibold text-text mb-4">Change Password</h2>
          <form onSubmit={savePassword} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Current password</label>
              <input
                type="password"
                name="currentPassword"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">New password</label>
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Confirm new password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded text-text focus:outline-none focus:border-accent"
              />
            </div>
            {passwordError && <p className="text-sm text-error">{passwordError}</p>}
            {passwordStatus === "saved" && <p className="text-sm text-accent">Password changed</p>}
            <button
              type="submit"
              disabled={passwordStatus === "saving"}
              className="btn btn-primary"
            >
              {passwordStatus === "saving" ? "Saving..." : "Change Password"}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
