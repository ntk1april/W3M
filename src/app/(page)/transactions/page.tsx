"use client";

import { useState } from "react";
import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Search,
  Trash2,
  Edit2,
  ChevronDown,
  ArrowLeftRight,
} from "lucide-react";
import type { Transaction, Account } from "@/types";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";

const periodOptions = [
  { label: "All Time", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
  { label: "Custom Range", value: "custom" },
];

function getDateRange(period: string): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  ).toISOString();

  switch (period) {
    case "today":
      return {
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).toISOString(),
        endDate: endOfDay,
      };
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day;
      return {
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          diff,
        ).toISOString(),
        endDate: endOfDay,
      };
    }
    case "month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: endOfDay,
      };
    case "year":
      return {
        startDate: new Date(now.getFullYear(), 0, 1).toISOString(),
        endDate: endOfDay,
      };
    default:
      return {};
  }
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("today");
  const [typeFilter, setTypeFilter] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  let dateRange = getDateRange(period);
  if (period === "custom") {
    dateRange = {
      startDate: customStartDate
        ? new Date(`${customStartDate}T00:00:00`).toISOString()
        : undefined,
      endDate: customEndDate
        ? new Date(`${customEndDate}T23:59:59`).toISOString()
        : undefined,
    };
  }
  const { data: accounts = [] } = useAccounts();
  const deleteTransaction = useDeleteTransaction();

  const { data, isLoading } = useTransactions({
    search: debouncedSearch,
    type: typeFilter || undefined,
    accountId: accountFilter || undefined,
    ...dateRange,
    limit: 100,
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;

  // Stats
  const totalIncome = transactions
    .filter((t: Transaction) => t.type === "INCOME")
    .reduce((s: number, t: Transaction) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t: Transaction) => t.type === "EXPENSE")
    .reduce((s: number, t: Transaction) => s + t.amount, 0);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(
      (
        window as typeof window & {
          searchTimeout?: ReturnType<typeof setTimeout>;
        }
      ).searchTimeout,
    );
    (
      window as typeof window & {
        searchTimeout?: ReturnType<typeof setTimeout>;
      }
    ).searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Income</p>
          <p className="text-base sm:text-xl font-bold text-green-600 dark:text-green-400 truncate">
            +{formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Expense</p>
          <p className="text-base sm:text-xl font-bold text-red-600 dark:text-red-400 truncate">
            -{formatCurrency(totalExpense)}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 sm:p-4">
          <p className="text-xs text-muted-foreground mb-1">Net Balance</p>
          <p
            className={cn(
              "text-base sm:text-xl font-bold truncate",
              totalIncome - totalExpense >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400",
            )}
          >
            {totalIncome - totalExpense >= 0 ? "+" : ""}
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
          />
        </div>

        {/* Filter Row */}
        <div className="flex gap-2 flex-wrap">
          {/* Period filter */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {period === "custom" && (
            <div className="flex items-center gap-2 animate-fade-in">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="pl-3 pr-3 py-2 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="pl-3 pr-3 py-2 rounded-xl border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Type filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Account filter */}
          <div className="relative">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border bg-background text-foreground text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
            >
              <option value="">All Accounts</option>
              {accounts.map((acc: Account) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <div className="ml-auto text-sm text-muted-foreground flex items-center">
            {total} transactions
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ArrowLeftRight className="w-10 h-10 mb-3" />
            <p className="font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table Header — desktop only */}
            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Cat.</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Account</div>
              <div className="col-span-2">Date/Time</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1 text-right">Act.</div>
            </div>

            {transactions.map((transaction: Transaction) => (
              <div key={transaction.id}>
                {/* ── Mobile card ──────────────────────────────────── */}
                <div className="sm:hidden flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                    {transaction.type === "TRANSFER"
                      ? "🔄"
                      : transaction.category?.icon || "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {transaction.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {transaction.type === "TRANSFER"
                        ? `${transaction.account?.name} → ${transaction.toAccount?.name}`
                        : transaction.category?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        transaction.type === "INCOME"
                          ? "text-green-600 dark:text-green-400"
                          : transaction.type === "TRANSFER"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {transaction.type === "INCOME"
                        ? "+"
                        : transaction.type === "TRANSFER"
                          ? ""
                          : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex gap-1 justify-end mt-1">
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this transaction?"))
                            deleteTransaction.mutate(transaction.id);
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Desktop table row ─────────────────────────── */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-muted/30 transition-colors group">
                  {/* Category Icon */}
                  <div className="col-span-1">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base">
                      {transaction.type === "TRANSFER"
                        ? "🔄"
                        : transaction.category?.icon || "💸"}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="col-span-4 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {transaction.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full font-medium",
                          transaction.type === "INCOME"
                            ? "badge-income"
                            : transaction.type === "TRANSFER"
                              ? "text-blue-600 dark:text-blue-400 bg-blue-900/10 dark:bg-blue-500/10 border border-blue-600 dark:border-blue-400"
                              : "badge-expense",
                        )}
                      >
                        {transaction.type}
                      </span>
                      {transaction.type === "TRANSFER" ? (
                        <span className="text-xs text-muted-foreground">
                          {transaction.account?.name} →{" "}
                          {transaction.toAccount?.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {transaction.category?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Account */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: transaction.account?.color || "#6B7280",
                        }}
                      />
                      <span className="text-sm truncate">
                        {transaction.account?.name}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(transaction.date)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        transaction.type === "INCOME"
                          ? "text-green-600 dark:text-green-400"
                          : transaction.type === "TRANSFER"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {transaction.type === "INCOME"
                        ? "+"
                        : transaction.type === "TRANSFER"
                          ? ""
                          : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingTransaction(transaction)}
                      className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this transaction?"))
                          deleteTransaction.mutate(transaction.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTransaction && (
        <EditTransactionDialog
          open={!!editingTransaction}
          onOpenChange={(open) => {
            if (!open) setEditingTransaction(null);
          }}
          transactionToEdit={editingTransaction}
        />
      )}
    </div>
  );
}
