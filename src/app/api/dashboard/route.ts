import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)

    const [accounts, todayStats, monthStats, yearStats, recentTransactions, monthlyData] =
      await Promise.all([
        prisma.account.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: user.id, date: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: { userId: user.id, date: { gte: yearStart, lte: yearEnd } },
          _sum: { amount: true },
        }),
        prisma.transaction.findMany({
          where: { userId: user.id },
          include: { account: true, category: true },
          orderBy: { date: 'desc' },
          take: 10,
        }),
        // Monthly data for the last 6 months
        prisma.$queryRaw`
          SELECT 
            TO_CHAR(date, 'Mon YYYY') as month,
            DATE_TRUNC('month', date) as month_date,
            SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
          FROM "Transaction"
          WHERE "userId" = ${user.id}
            AND date >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
          GROUP BY month, month_date
          ORDER BY month_date ASC
        `,
      ])

    const getStat = (stats: any[], type: string) => stats.find(s => s.type === type)?._sum.amount || 0

    return NextResponse.json({
      accounts,
      totalBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      todayIncome: getStat(todayStats, 'INCOME'),
      todayExpense: getStat(todayStats, 'EXPENSE'),
      monthIncome: getStat(monthStats, 'INCOME'),
      monthExpense: getStat(monthStats, 'EXPENSE'),
      yearIncome: getStat(yearStats, 'INCOME'),
      yearExpense: getStat(yearStats, 'EXPENSE'),
      recentTransactions,
      monthlyData,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
