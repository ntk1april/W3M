"use client";

import { useDashboard } from "@/hooks/useDashboard";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getDayKey,
} from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Plus,
  Loader2,
  Edit2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState } from "react";
import type { Account, Transaction } from "@/types";
import { format, getDaysInMonth, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

const COLORS = [
  "#2563EB",
  "#7C3AED",
  "#EC4899",
  "#EF4444",
  "#F59E0B",
  "#22C55E",
  "#14B8A6",
  "#6366F1",
];

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const deleteTransaction = useDeleteTransaction();
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [editingFromCalendar, setEditingFromCalendar] = useState<Transaction | null>(null);

  const { data: calendarTxData } = useTransactions({
    startDate: startOfMonth(calendarDate).toISOString(),
    endDate: endOfMonth(calendarDate).toISOString(),
    limit: 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    accounts = [],
    totalBalance = 0,
    todayIncome = 0,
    todayExpense = 0,
    weekIncome = 0,
    weekExpense = 0,
    monthIncome = 0,
    monthExpense = 0,
    yearIncome = 0,
    yearExpense = 0,
    recentTransactions = [],
    monthlyData = [],
  } = data;

  // Build calendar data
  const calendarTransactions = calendarTxData?.transactions || [];
  const calendarDataByDay: Record<string, { income: number; expense: number }> =
    {};

  calendarTransactions.forEach((t: Transaction) => {
    if (t.type === "TRANSFER") return; // transfers don't count as income/expense
    const key = getDayKey(t.date);
    if (!calendarDataByDay[key]) {
      calendarDataByDay[key] = { income: 0, expense: 0 };
    }
    if (t.type === "INCOME") {
      calendarDataByDay[key].income += t.amount;
    } else {
      calendarDataByDay[key].expense += t.amount;
    }
  });

  // Category spending for pie chart
  const categorySpending: Record<
    string,
    { name: string; icon: string; amount: number }
  > = {};
  recentTransactions.forEach((t: Transaction) => {
    if (t.type === "EXPENSE" && t.category) {
      const key = t.category.name;
      if (!categorySpending[key]) {
        categorySpending[key] = { name: key, icon: t.category.icon, amount: 0 };
      }
      categorySpending[key].amount += t.amount;
    }
  });
  const pieData = Object.values(categorySpending)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  // Calendar grid
  const daysInMonth = getDaysInMonth(calendarDate);
  const firstDayOfMonth = startOfMonth(calendarDate).getDay();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Accounts</h2>
            <Link
              href="/accounts"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold">No accounts yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first account to start tracking
              </p>
              <Link
                href="/accounts"
                className="text-primary font-medium hover:underline text-sm"
              >
                Add Account →
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 lg:p-6 h-100 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-border shrink-0">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Balance
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Your Accounts
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {accounts.map((account: Account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/80 transition-colors border border-transparent hover:border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: `${account.color}22` }}
                        >
                          {account.type === "BANK"
                            ? "🏦"
                            : account.type === "WALLET"
                              ? "👛"
                              : "💵"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {account.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {account.type}
                          </p>
                        </div>
                      </div>
                      <p className="font-bold">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Today's Transactions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today&apos;s Transactions</h2>
            <Link
              href="/transactions"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden h-100 flex flex-col">
            {recentTransactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <p className="text-2xl mb-2">💸</p>
                <p className="font-medium">No transactions yet</p>
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Add your first transaction <Plus className="w-3 h-3" />
                </button>
                {/* <p className="text-sm">
                  Add your first transaction using the + button
                </p> */}
              </div>
            ) : (
              <div className="divide-y divide-border overflow-y-auto flex-1 min-h-0">
                {recentTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="group flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Category Icon */}
                    <div className="col-span-1">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-base">
                        {transaction.type === "TRANSFER"
                          ? "🔄"
                          : transaction.category?.icon || "💸"}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {transaction.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
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
                        {transaction.type !== "TRANSFER" && (
                          <>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground">
                              {transaction.account?.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Amount & Badge */}
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(transaction.date)}
                      </p>
                    </div>

                    <div className="col-span-1 flex justify-end gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium shrink-0",
                          transaction.type === "INCOME"
                            ? "badge-income"
                            : transaction.type === "TRANSFER"
                              ? "text-blue-600 dark:text-blue-400 bg-blue-900/10 dark:bg-blue-500/10 border border-blue-600 dark:border-blue-400"
                              : "badge-expense",
                        )}
                      >
                        {transaction.type === "INCOME"
                          ? "IN"
                          : transaction.type === "TRANSFER"
                            ? "TRF"
                            : "OUT"}
                      </span>
                      <button
                        onClick={() => setEditingTransaction(transaction)}
                        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this transaction?")) {
                            deleteTransaction.mutate(transaction.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Monthly Income vs Expense */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold mb-4">Monthly Overview</h3>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [
                    formatCurrency(Number(value) || 0),
                    "",
                  ]}
                />
                <Legend />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#22C55E"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Category Spending */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold mb-4">Today&apos;s Spending by Category</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No expense data yet
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value) || 0),
                      "Amount",
                    ]}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2 pt-2">
                {pieData.slice(0, 5).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spending Calendar + Income & Expense */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Spending Calendar</h2>
            <div className="flex items-center gap-2 border border-border rounded-xl">
              <button
                onClick={() =>
                  setCalendarDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1),
                  )
                }
                className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                ←
              </button>
              <span className="text-sm font-medium">
                {format(calendarDate, "MMMM yyyy")}
              </span>
              <button
                onClick={() =>
                  setCalendarDate(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1),
                  )
                }
                className="text-sm px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                →
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = format(
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth(),
                    day,
                  ),
                  "yyyy-MM-dd",
                );
                const data = calendarDataByDay[dateKey] || {
                  income: 0,
                  expense: 0,
                };
                const hasActivity = data.income > 0 || data.expense > 0;
                const isToday =
                  new Date().toDateString() ===
                  new Date(
                    calendarDate.getFullYear(),
                    calendarDate.getMonth(),
                    day,
                  ).toDateString();

                return (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square rounded-lg sm:rounded-2xl flex flex-col items-center p-0.5 sm:p-1 cursor-pointer transition-all",
                      isToday
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "hover:bg-muted",
                      hasActivity && !isToday && "bg-muted/30",
                    )}
                    onClick={() => {
                      setSelectedCalendarDate(
                        new Date(
                          calendarDate.getFullYear(),
                          calendarDate.getMonth(),
                          day,
                        ),
                      );
                    }}
                  >
                    <span
                      className={cn(
                        "text-right w-full pr-0.5 sm:pr-2 mt-0.5",
                        isToday
                          ? "text-primary font-bold text-[10px] sm:text-[18px]"
                          : "font-medium text-[9px] sm:text-[13px]",
                      )}
                    >
                      {day}
                    </span>
                    <div className="w-full flex flex-col justify-center items-center gap-0.5 mt-auto mb-auto">
                      {data.income > 0 && (
                        <span
                          className="text-[7px] sm:text-[14px] font-bold text-green-600 dark:text-green-400 truncate w-full text-center leading-none"
                          title={formatCurrency(data.income)}
                        >
                          +
                          {data.income >= 1000
                            ? `${(data.income / 1000).toFixed(1)}k`
                            : data.income.toFixed(0)}
                        </span>
                      )}
                      {data.expense > 0 && (
                        <span
                          className="text-[7px] sm:text-[14px] font-bold text-red-600 dark:text-red-400 truncate w-full text-center leading-none"
                          title={formatCurrency(data.expense)}
                        >
                          -
                          {data.expense >= 1000
                            ? `${(data.expense / 1000).toFixed(1)}k`
                            : data.expense.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Income & Expense Summary Cards */}
        <div className="xl:w-80 shrink-0">
          <h2 className="text-xl font-bold mb-4">Income &amp; Expense</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
            {[
              {
                label: "This Week",
                income: weekIncome,
                expense: weekExpense,
                icon: "🗓️",
              },
              {
                label: "This Month",
                income: monthIncome,
                expense: monthExpense,
                icon: "📆",
              },
              {
                label: "This Year",
                income: yearIncome,
                expense: yearExpense,
                icon: "📊",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-card rounded-2xl border border-border p-4 card-hover"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-r border-border pr-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-green-500" /> Income
                    </p>
                    <p
                      className="font-bold text-green-600 dark:text-green-400 text-sm truncate"
                      title={formatCurrency(item.income)}
                    >
                      {formatCurrency(item.income)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-red-500" /> Expense
                    </p>
                    <p
                      className="font-bold text-red-600 dark:text-red-400 text-sm truncate"
                      title={formatCurrency(item.expense)}
                    >
                      {formatCurrency(item.expense)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isAddDialogOpen && (
        <AddTransactionDialog
          open={!!isAddDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsAddDialogOpen(false);
          }}
        />
      )}

      {selectedCalendarDate && (
        <TransactionDialog
          open={!!selectedCalendarDate}
          onOpenChange={(open) => {
            if (!open) setSelectedCalendarDate(null);
          }}
          date={selectedCalendarDate}
          onEdit={(transaction) => {
            setSelectedCalendarDate(null);
            setEditingFromCalendar(transaction);
          }}
        />
      )}

      {editingFromCalendar && (
        <EditTransactionDialog
          open={!!editingFromCalendar}
          onOpenChange={(open) => {
            if (!open) setEditingFromCalendar(null);
          }}
          transactionToEdit={editingFromCalendar}
        />
      )}
    </div>
  );
}
