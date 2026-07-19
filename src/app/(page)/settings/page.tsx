"use client";

import { useTheme } from "next-themes";
import { Download, Database, Shield, Palette, User, Link, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; user_metadata: Record<string, string> } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (user) {
        setCurrentUser(user as typeof currentUser);
        const savedName = user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setDisplayName(savedName);
        const url = user.user_metadata?.avatar_url || null;
        setAvatarUrl(url);
        setAvatarUrlInput(url || "");
      }
    });
  }, []);

  const handleSaveAvatarUrl = async () => {
    if (!currentUser) return;
    setSavingAvatar(true);
    try {
      const url = avatarUrlInput.trim() || null;
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (error) throw new Error(error.message);

      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: url }),
      });

      setAvatarUrl(url);
      toast.success(url ? "Avatar updated!" : "Avatar removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setSavingAvatar(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw new Error(error.message);

      // Also sync to Prisma User table
      const apiRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!apiRes.ok) {
        const body = await apiRes.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to sync display name');
      }

      toast.success("Name updated!");
      router.refresh(); // refresh server session so header greeting updates
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch("/api/transactions?limit=10000");
      const data = await res.json();
      const transactions = data.transactions || [];

      const csv = [
        ["Date", "Type", "Title", "Amount", "Category", "Account", "Note"],
        ...transactions.map(
          (t: {
            date: string;
            type: string;
            title: string;
            amount: number;
            category?: { name: string };
            account?: { name: string };
            note?: string;
          }) => [
            new Date(t.date).toLocaleDateString(),
            t.type,
            t.title,
            t.amount,
            t.category?.name || "",
            t.account?.name || "",
            t.note || "",
          ],
        ),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `w3m-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully!");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Fallback: 1 letter from display name or email prefix
  const fallbackLetter = (
    currentUser?.user_metadata?.display_name?.[0] ||
    currentUser?.email?.split("@")[0]?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your W3M experience
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Profile</h2>
        </div>
        <div className="p-5 space-y-5">
          {/* Avatar */}
          <div className="flex items-start gap-5">
            {/* Preview */}
            <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border shrink-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover"
                  onError={() => setAvatarUrl(null)} />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}
                >
                  {fallbackLetter}
                </div>
              )}
            </div>
            {/* URL input */}
            <div className="flex-1 space-y-2">
              <p className="font-medium text-sm">{currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "—"}</p>
              <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveAvatarUrl()}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border bg-background text-foreground text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <button
                  onClick={handleSaveAvatarUrl}
                  disabled={savingAvatar}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {savingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Paste any public image URL. Clear and save to remove.</p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Display Name</label>
            <div className="flex gap-2">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveDisplayName()}
                placeholder="Your name"
                className="flex-1 px-3 py-2 rounded-xl border bg-background text-foreground text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                onClick={handleSaveDisplayName}
                disabled={savingName}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium
                  hover:opacity-90 transition-all disabled:opacity-60"
              >
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Appearance</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">Dark Mode</p>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between light and dark themes</p>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                theme === "dark" ? "bg-primary" : "bg-muted",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  theme === "dark" ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Data & Export */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Data &amp; Export</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">Export as CSV</p>
              <p className="text-xs text-muted-foreground mt-0.5">Download all transactions as CSV file</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">Backup Database</p>
              <p className="text-xs text-muted-foreground mt-0.5">Export all data as JSON backup</p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch("/api/transactions?limit=100000");
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `w3m-backup-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Backup downloaded!");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/70 transition-colors"
            >
              <Database className="w-3.5 h-3.5" />
              Backup
            </button>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Account</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-sm">Sign Out</p>
              <p className="text-xs text-muted-foreground mt-0.5">Log out of your W3M account</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <div
          className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
          style={{ background: "linear-gradient(135deg, #2563EB22, #7C3AED22)" }}
        >
          💸
        </div>
        <p className="font-bold text-lg gradient-text">W3M</p>
        <p className="text-xs text-muted-foreground mt-1">Where Ma Money Missing</p>
        <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0</p>
      </div>
    </div>
  );
}
