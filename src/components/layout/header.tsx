"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getInitials } from "@/lib/utils";
import { useState, useEffect } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/accounts": "Accounts",
  "/transactions": "Transactions",
  "/search": "Search",
  "/settings": "Settings",
};

interface HeaderProps {
  user: User;
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  const title = pageTitles[pathname] || "W3M";

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = user.user_metadata?.display_name?.split(" ")[0] || "there";

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 sm:px-6 gap-4 shrink-0 sticky top-0 z-30">
      {/* Mobile brand */}
      <div className="lg:hidden flex items-center gap-2 shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
        >
          💸
        </div>
        <span className="font-bold text-base leading-none">W3M</span>
      </div>

      {/* Left - Title/Greeting */}
      <div className="flex-1 min-w-0 hidden lg:block">
        <h1 className="text-lg font-semibold text-foreground truncate">
          {title}
        </h1>
        {pathname === "/dashboard" && (
          <p className="text-xs text-muted-foreground">
            {mounted ? greeting : "Welcome"}, {name}! 👋
          </p>
        )}
      </div>

      {/* Right Actions */}
      <div className="ml-auto">
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground
            hover:bg-muted hover:text-foreground transition-all"
            title="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4.5 h-4.5" size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>

          {/* User Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
          >
            {getInitials(user.user_metadata?.display_name || user.email || "U")}
          </div>
        </div>
      </div>
    </header>
  );
}
