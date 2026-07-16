import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type')
    const accountId = searchParams.get('accountId')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId: user.id }
    if (type) where.type = type
    if (accountId) {
      // Show transfer if the selected account is either source OR destination
      where.OR = [
        { accountId },
        { toAccountId: accountId },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (search) where.title = { contains: search, mode: 'insensitive' }
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: true,
          toAccount: true,
          category: true,
        },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ transactions, total })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST /api/transactions
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, amount, date, accountId, toAccountId, categoryId, note, receipt } = body
    const parsedAmount = parseFloat(amount)

    // ── Balance check for TRANSFER ─────────────────────────────────
    if (type === 'TRANSFER' && toAccountId) {
      const sourceAccount = await prisma.account.findUnique({
        where: { id: accountId, userId: user.id },
        select: { balance: true, name: true },
      })
      if (!sourceAccount) {
        return NextResponse.json({ error: 'Source account not found' }, { status: 404 })
      }
      if (sourceAccount.balance < parsedAmount) {
        return NextResponse.json(
          {
            error: `Insufficient balance in "${sourceAccount.name}". Available: ${sourceAccount.balance.toFixed(2)}, Required: ${parsedAmount.toFixed(2)}`,
          },
          { status: 400 },
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbOperations: any[] = [
      prisma.transaction.create({
        data: {
          userId: user.id,
          accountId,
          toAccountId: type === 'TRANSFER' && toAccountId ? toAccountId : null,
          categoryId: type === 'TRANSFER' ? null : (categoryId || null),
          type,
          title,
          amount: parsedAmount,
          note: note || null,
          receipt: receipt || null,
          date: new Date(date),
        },
        include: { account: true, toAccount: true, category: true },
      })
    ]

    if (type === 'TRANSFER' && toAccountId) {
      dbOperations.push(
        prisma.account.update({
          where: { id: accountId, userId: user.id },
          data: { balance: { decrement: parsedAmount } },
        }),
        prisma.account.update({
          where: { id: toAccountId, userId: user.id },
          data: { balance: { increment: parsedAmount } },
        })
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: accountId, userId: user.id },
          data: {
            balance: {
              [type === 'INCOME' ? 'increment' : 'decrement']: parsedAmount,
            },
          },
        })
      )
    }

    const [transaction] = await prisma.$transaction(dbOperations)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
