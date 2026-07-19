"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Loader2,
  Wallet,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    // Check username availability first
    const lookupRes = await fetch("/api/auth/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: data.username.toLowerCase() }),
    });
    if (lookupRes.ok) {
      toast.error("Username already taken. Please choose another.");
      return;
    }

    // Register the user on the server (handles both Supabase Auth and Prisma DB)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      toast.error(errorData.error || "Failed to create account");
      return;
    }

    toast.success("Account created!");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #1E3A8A 0%, #2563EB 40%, #7C3AED 100%)",
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${100 + i * 80}px`,
                height: `${100 + i * 80}px`,
                background: "white",
                bottom: `${5 + i * 15}%`,
                right: `${-10 + i * 10}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center text-white px-12">
          <div className="flex justify-center mb-8">
            <div
              className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center
              border border-white/30 shadow-2xl"
            >
              <Wallet className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">W3M</h1>
          <p className="text-xl font-medium text-blue-100 mb-2">
            Where Ma Money Missing
          </p>
          <p className="text-blue-200 text-sm max-w-xs mx-auto leading-relaxed">
            Join of user who track finances smarter with W3M.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "✓ Track all your accounts in one place",
              "✓ Beautiful charts and insights",
              "✓ Spending calendar view",
            ].map((f) => (
              <div key={f} className="text-sm text-blue-100 text-left">
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              }}
            >
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">W3M</h1>
              <p className="text-xs text-muted-foreground">
                Where Ma Money Missing
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold">Create account</h2>
            <p className="text-muted-foreground mt-2">
              Start tracking your finances today
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground">
                Sign Up
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                {...register("username")}
                type="text"
                placeholder="e.g. ntk1april"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                  errors.username && "border-destructive",
                )}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Letters, numbers, underscores only
              </p>
              {errors.username && (
                <p className="text-destructive text-xs mt-1.5">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="nanthakorn@example.com"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                  errors.email && "border-destructive",
                )}
              />
              {errors.email && (
                <p className="text-destructive text-xs mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.password && "border-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-xs mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.confirmPassword && "border-destructive",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-xs mt-1.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                transition-all duration-200 disabled:opacity-60 shadow-lg mt-2"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              }}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
