import { z } from "zod";

export const Rating = z
  .number({ message: "Rating must be a number" })
  .min(0.5, { message: "Minimum rating is 0.5" })
  .max(5, { message: "Maximum rating is 5" })
  .refine((val) => val % 0.5 === 0, { message: "Rating must be in 0.5 increments" });

export type RatingInput = z.infer<typeof Rating>;

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be at most 30 characters" })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, hyphens, and underscores" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128, { message: "Password must be at most 128 characters" }),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const DiaryEntrySchema = z.object({
  film_id: z.number().int().positive(),
  watched_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }),
  rating: Rating.optional(),
  review: z.string().max(5000, { message: "Review must be at most 5000 characters" }).optional(),
  rewatch: z.boolean().default(false),
  tags: z.array(z.string().min(1)).max(20, { message: "Maximum 20 tags" }).default([]),
});

export type DiaryEntryInput = z.infer<typeof DiaryEntrySchema>;

export const CommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty" })
    .max(1000, { message: "Comment must be at most 1000 characters" }),
});

export type CommentInput = z.infer<typeof CommentSchema>;

export const ListSchema = z.object({
  name: z
    .string()
    .min(1, { message: "List name is required" })
    .max(100, { message: "List name must be at most 100 characters" }),
  description: z
    .string()
    .max(500, { message: "Description must be at most 500 characters" })
    .optional(),
  is_public: z.boolean().default(true),
  is_ranked: z.boolean().default(false),
});

export type ListInput = z.infer<typeof ListSchema>;
