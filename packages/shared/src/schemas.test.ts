import { test, expect, describe } from "vitest";
import { RegisterSchema, LoginSchema, DiaryEntrySchema, Rating, ChangePasswordSchema, AvatarSchema } from "@willyboxd/shared";

describe("Schema Validation", () => {
  test("valid registration data passes", () => {
    expect(RegisterSchema.safeParse({ email: "test@test.com", username: "testuser", password: "password123" }).success).toBe(true);
  });

  test("invalid email fails", () => {
    expect(RegisterSchema.safeParse({ email: "not-an-email", username: "testuser", password: "password123" }).success).toBe(false);
  });

  test("short username fails", () => {
    expect(RegisterSchema.safeParse({ email: "test@test.com", username: "ab", password: "password123" }).success).toBe(false);
  });

  test("short password fails", () => {
    expect(RegisterSchema.safeParse({ email: "test@test.com", username: "testuser", password: "short" }).success).toBe(false);
  });

  test("valid login schema", () => {
    expect(LoginSchema.safeParse({ identifier: "test@test.com", password: "password123" }).success).toBe(true);
    expect(LoginSchema.safeParse({ identifier: "testuser", password: "password123" }).success).toBe(true);
    expect(LoginSchema.safeParse({ identifier: "", password: "password123" }).success).toBe(false);
  });

  test("rating validates 0.5 steps", () => {
    expect(Rating.safeParse(0.5).success).toBe(true);
    expect(Rating.safeParse(3.5).success).toBe(true);
    expect(Rating.safeParse(3.7).success).toBe(false);
    expect(Rating.safeParse(0).success).toBe(false);
    expect(Rating.safeParse(6).success).toBe(false);
  });

  test("diary entry validation", () => {
    expect(
      DiaryEntrySchema.safeParse({
        film_id: 123,
        watched_date: "2024-01-15",
        rating: 4,
        review: "Great movie",
        rewatch: false,
        tags: ["action", "fun"],
      }).success,
    ).toBe(true);
  });

  test("AvatarSchema accepts a valid URL or null", () => {
    expect(AvatarSchema.safeParse({ avatar: "https://example.com/a.png" }).success).toBe(true);
    expect(AvatarSchema.safeParse({ avatar: null }).success).toBe(true);
  });

  test("AvatarSchema rejects an invalid URL and empty string", () => {
    expect(AvatarSchema.safeParse({ avatar: "not-a-url" }).success).toBe(false);
    expect(AvatarSchema.safeParse({ avatar: "" }).success).toBe(false);
  });

  test("ChangePasswordSchema accepts valid input", () => {
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: "password123",
        newPassword: "newpassword123",
      }).success,
    ).toBe(true);
  });

  test("ChangePasswordSchema rejects short new password", () => {
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: "password123",
        newPassword: "short",
      }).success,
    ).toBe(false);
  });

  test("ChangePasswordSchema rejects empty current password", () => {
    expect(
      ChangePasswordSchema.safeParse({
        currentPassword: "",
        newPassword: "newpassword123",
      }).success,
    ).toBe(false);
  });
});
