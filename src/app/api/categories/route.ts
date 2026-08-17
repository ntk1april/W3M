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

    // Fetch categories; if empty, seed defaults in the same round trip
    let categories = await prisma.category.findMany({
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    if (categories.length === 0) {
      const expenseData = EXPENSE_CATEGORIES.map((c) => ({
        name: c.name, type: 'EXPENSE' as const, icon: c.icon, color: c.color, isDefault: true,
      }))
      const incomeData = INCOME_CATEGORIES.map((c) => ({
        name: c.name, type: 'INCOME' as const, icon: c.icon, color: c.color, isDefault: true,
      }))

      // skipDuplicates prevents errors if another request seeded concurrently
      await prisma.category.createMany({
        data: [...expenseData, ...incomeData],
        skipDuplicates: true,
      })

      categories = await prisma.category.findMany({
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      })
    }

    return NextResponse.json(categories, {
      headers: {
        // Categories rarely change — cache aggressively
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}
