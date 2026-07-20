"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Wallet, ArrowRight, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    let email = data.identifier.trim();

    // If it doesn't look like an email, assume it's a username and look up the email
    if (!email.includes("@")) {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email }),
      });

      if (!res.ok) {
        toast.error("Username not found");
        return;
      }

      const lookupData = await res.json();
      email = lookupData.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Welcome back! 👋");
    window.location.reload();
    router.push("/dashboard");
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
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: `${120 + i * 60}px`,
                height: `${120 + i * 60}px`,
                background: "white",
                top: `${10 + i * 12}%`,
                left: `${-20 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: "white", transform: "translate(40%, 40%)" }}
          />
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
          <h1 className="text-5xl font-bold mb-4 tracking-tight">W3M</h1>
          <p className="text-xl font-medium text-blue-100 mb-2">
            Where Ma Money Missing
          </p>
          <p className="text-blue-200 text-sm max-w-xs mx-auto leading-relaxed">
            Your all-in-one personal finance tracker. Know exactly where every
            baht goes.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            {[
              { label: "Track", desc: "Every transaction" },
              { label: "Analyze", desc: "Spending patterns" },
              { label: "Grow", desc: "Your savings" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <div className="font-bold text-lg">{item.label}</div>
                <div className="text-xs text-blue-200">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
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
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-background text-muted-foreground">
                Login
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email or Username
              </label>
              <input
                {...register("identifier")}
                type="text"
                placeholder="you@example.com or username"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                  errors.identifier &&
                    "border-destructive focus:ring-destructive/30",
                )}
              />
              {errors.identifier && (
                <p className="text-destructive text-xs mt-1.5">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all",
                    errors.password &&
                      "border-destructive focus:ring-destructive/30",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2
                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              }}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
