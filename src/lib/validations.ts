import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters (if u forget password dm me on instagram: ntk1april) wait for reset password function",
    ),
});

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    displayName: z.string().min(2, "Name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["BANK", "WALLET", "CASH"]),
  balance: z.number().min(0, "Balance must be positive"),
  color: z.string(),
  icon: z.string(),
});

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  title: z.string().min(1, "Title is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.date(),
  accountId: z.string().min(1, "Account is required"),
  toAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  note: z.string().optional(),
  receipt: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string(),
  color: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
