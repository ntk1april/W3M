import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const TIMEZONE = "Asia/Bangkok";
    const now = new Date();
    const zonedNow = toZonedTime(now, TIMEZONE);

    // Calculate start/end dates in Bangkok time, then convert back to true UTC
    const todayStart = fromZonedTime(startOfDay(zonedNow), TIMEZONE);
    const todayEnd = fromZonedTime(endOfDay(zonedNow), TIMEZONE);
    const weekStart = fromZonedTime(startOfWeek(zonedNow, { weekStartsOn: 1 }), TIMEZONE); // Week starts on Monday
    const weekEnd = fromZonedTime(endOfWeek(zonedNow, { weekStartsOn: 1 }), TIMEZONE);
    const monthStart = fromZonedTime(startOfMonth(zonedNow), TIMEZONE);
    const monthEnd = fromZonedTime(endOfMonth(zonedNow), TIMEZONE);
    const yearStart = fromZonedTime(startOfYear(zonedNow), TIMEZONE);
    const yearEnd = fromZonedTime(endOfYear(zonedNow), TIMEZONE);

    const [
      accounts,
      todayStats,
      weekStats,
      monthStats,
      yearStats,
      recentTransactions,
      monthlyData,
    ] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where: { userId: user.id, date: { gte: yearStart, lte: yearEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
        include: { account: true, toAccount: true, category: true },
        orderBy: { date: "desc" },
      }),
      // Monthly data for the last 6 months (converted to Bangkok time for accurate grouping)
      prisma.$queryRaw`
          SELECT 
            TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok', 'Mon YYYY') as month,
            DATE_TRUNC('month', date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') as month_date,
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
          FROM "Transaction"
          WHERE "userId" = ${user.id}
            AND date >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
          GROUP BY month, month_date
          ORDER BY month_date ASC
        `,
    ]);

    const getStat = (
      stats: { type: string; _sum: { amount: number | null } }[],
      type: string,
    ) => stats.find((s) => s.type === type)?._sum.amount || 0;

    return NextResponse.json({
      accounts,
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      todayIncome: getStat(todayStats, "INCOME"),
      todayExpense: getStat(todayStats, "EXPENSE"),
      weekIncome: getStat(weekStats, "INCOME"),
      weekExpense: getStat(weekStats, "EXPENSE"),
      monthIncome: getStat(monthStats, "INCOME"),
      monthExpense: getStat(monthStats, "EXPENSE"),
      yearIncome: getStat(yearStats, "INCOME"),
      yearExpense: getStat(yearStats, "EXPENSE"),
      recentTransactions,
      monthlyData,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
