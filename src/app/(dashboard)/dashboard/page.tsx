"use client";

import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency, formatDate, formatTime, getDayKey } from "@/lib/utils";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Loader2,
  Calendar as CalendarIcon,
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useState } from "react";
import type { Account, Transaction } from "@/types";
import { format, getDaysInMonth, startOfMonth, endOfMonth } from "date-fns";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";

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
  const [calendarDate, setCalendarDate] = useState(new Date());

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
          <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
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

            <div className="space-y-3">
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
                        <p className="font-semibold text-sm">{account.name}</p>
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

      {/* Summary Cards */}
      <section>
        <h2 className="text-xl font-bold mb-4">Income & Expense</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Today",
              income: todayIncome,
              expense: todayExpense,
              icon: "📅",
              href: "/transactions?period=today",
            },
            {
              label: "This Month",
              income: monthIncome,
              expense: monthExpense,
              icon: "📆",
              href: "/transactions?period=month",
            },
            {
              label: "This Year",
              income: yearIncome,
              expense: yearExpense,
              icon: "📊",
              href: "/transactions?period=year",
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-card rounded-2xl border border-border p-5 card-hover block"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" /> Income
                  </p>
                  <p
                    className="font-bold text-green-600 dark:text-green-400 text-sm xl:text-base truncate"
                    title={formatCurrency(item.income)}
                  >
                    {formatCurrency(item.income)}
                  </p>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-red-500" /> Expense
                  </p>
                  <p
                    className="font-bold text-red-600 dark:text-red-400 text-sm xl:text-base truncate"
                    title={formatCurrency(item.expense)}
                  >
                    {formatCurrency(item.expense)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
          <h3 className="font-bold mb-4">Spending by Category</h3>
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

      {/* Line Chart - Cash Flow */}
      {monthlyData.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-bold mb-4">Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={monthlyData.map(
                (d: { month: string; income: number; expense: number }) => ({
                  ...d,
                  net: d.income - d.expense,
                }),
              )}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                formatter={(value) => [formatCurrency(Number(value) || 0), ""]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Expense"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#2563EB"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Link
            href="/transactions"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-2xl mb-2">💸</p>
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm">
                Add your first transaction using the + button
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentTransactions.map((transaction: Transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Category Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-muted">
                    {transaction.category?.icon || "💸"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {transaction.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {transaction.category?.name}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.account?.name}
                      </span>
                    </div>
                  </div>

                  {/* Amount & Badge */}
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        transaction.type === "INCOME"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400",
                      )}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(transaction.date)}
                    </p>
                  </div>

                  {/* Type Badge */}
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium shrink-0",
                      transaction.type === "INCOME"
                        ? "badge-income"
                        : "badge-expense",
                    )}
                  >
                    {transaction.type === "INCOME" ? "IN" : "OUT"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Spending Calendar */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Spending Calendar</h2>
          <div className="flex items-center gap-2">
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

        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* Day cells */}
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
                    "aspect-square rounded-lg flex flex-col items-center p-1 cursor-pointer transition-all",
                    isToday
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : "hover:bg-muted",
                    hasActivity && !isToday && "bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium mb-auto text-right w-full",
                      isToday ? "text-primary font-bold" : "",
                    )}
                  >
                    {day}
                  </span>

                  <div className="w-full flex flex-col justify-center items-center gap-1 mt-auto mb-auto">
                    {data.income > 0 && (
                      <span
                        className="text-[10px] font-bold text-green-600 dark:text-green-400 truncate w-full text-center leading-none"
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
                        className="text-[10px] font-bold text-red-600 dark:text-red-400 truncate w-full text-center leading-none"
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
      </section>
    </div>
  );
}
