"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Search,
  Settings,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/accounts", icon: Wallet, label: "Accounts" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/search", icon: Search, label: "Search" },
];

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[260px] border-r border-border bg-card h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              }}
            >
              💸
            </div>
            <div>
              <span className="font-bold text-lg leading-none">W3M</span>
              <p className="text-xs text-muted-foreground leading-none mt-0.5">
                Finance Tracker
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sidebar-link", isActive && "active")}
              >
                <item.icon className="w-4.5 h-4.5 shrink-0" size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
              Account
            </p>
            <Link
              href="/settings"
              className={cn(
                "sidebar-link",
                pathname === "/settings" && "active",
              )}
            >
              <Settings size={18} />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="sidebar-link w-full text-left hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              }}
            >
              {getInitials(
                user.user_metadata?.display_name || user.email || "U",
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.user_metadata?.display_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-colors min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.icon size={22} />
              <span className="text-[10px] font-medium truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
        {/* Settings shortcut */}
        <Link
          href="/settings"
          className={cn(
            "flex flex-col items-center gap-0.5 py-3 px-3 rounded-xl transition-colors min-w-0 flex-1",
            pathname === "/settings"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings size={22} />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </>
  );
}
