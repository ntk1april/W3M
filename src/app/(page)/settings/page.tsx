"use client";

import { useTheme } from "next-themes";
import { Download, Database, Shield, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();

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

  const sections = [
    {
      title: "Appearance",
      icon: Palette,
      items: [
        {
          label: "Dark Mode",
          description: "Switch between light and dark themes",
          action: (
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
          ),
        },
      ],
    },
    {
      title: "Data & Export",
      icon: Database,
      items: [
        {
          label: "Export as CSV",
          description: "Download all transactions as CSV file",
          action: (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          ),
        },
        {
          label: "Backup Database",
          description: "Export all data as JSON backup",
          action: (
            <button
              onClick={async () => {
                const res = await fetch("/api/transactions?limit=100000");
                const data = await res.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: "application/json",
                });
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
          ),
        },
      ],
    },
    {
      title: "Account",
      icon: Shield,
      items: [
        {
          label: "Sign Out",
          description: "Log out of your W3M account",
          action: (
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              Sign Out
            </button>
          ),
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your W3M experience
        </p>
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/20">
            <section.icon className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{section.title}</h2>
          </div>
          <div className="divide-y divide-border">
            {section.items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
                <div className="ml-4 shrink-0">{item.action}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* App Info */}
      <div className="bg-card rounded-2xl border border-border p-5 text-center">
        <div
          className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
          style={{
            background: "linear-gradient(135deg, #2563EB22, #7C3AED22)",
          }}
        >
          💸
        </div>
        <p className="font-bold text-lg gradient-text">W3M</p>
        <p className="text-xs text-muted-foreground mt-1">
          Where Ma Money Missing
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Version 1.0.0</p>
      </div>
    </div>
  );
}
