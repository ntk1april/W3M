import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/utils'

// GET /api/categories
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in DB
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email! },
      create: { id: user.id, email: user.email! },
    })

    // Seed default categories if none exist
    const count = await prisma.category.count({ where: { userId: user.id } })

    if (count === 0) {
      const expenseData = EXPENSE_CATEGORIES.map((c) => ({
        userId: user.id,
        name: c.name,
        type: 'EXPENSE' as const,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      }))

      const incomeData = INCOME_CATEGORIES.map((c) => ({
        userId: user.id,
        name: c.name,
        type: 'INCOME' as const,
        icon: c.icon,
        color: c.color,
        isDefault: true,
      }))

      await prisma.category.createMany({
        data: [...expenseData, ...incomeData],
      })
    }

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
