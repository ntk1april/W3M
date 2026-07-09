import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// PUT /api/transactions/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, amount, date, accountId, categoryId, note, receipt } = body

    // Get original transaction to reverse balance change
    const original = await prisma.transaction.findUnique({ where: { id } })
    if (!original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const newAmount = parseFloat(amount)

    // Update in a transaction: reverse old balance change, apply new
    const [transaction] = await prisma.$transaction([
      prisma.transaction.update({
        where: { id, userId: user.id },
        data: { type, title, amount: newAmount, date: new Date(date), accountId, categoryId, note, receipt },
        include: { account: true, category: true },
      }),
      // Reverse original
      prisma.account.update({
        where: { id: original.accountId },
        data: {
          balance: {
            [original.type === 'INCOME' ? 'decrement' : 'increment']: original.amount,
          },
        },
      }),
      // Apply new
      prisma.account.update({
        where: { id: accountId },
        data: {
          balance: {
            [type === 'INCOME' ? 'increment' : 'decrement']: newAmount,
          },
        },
      }),
    ])

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { id } = await params

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.transaction.delete({ where: { id, userId: user.id } }),
      // Reverse balance
      prisma.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            [transaction.type === 'INCOME' ? 'decrement' : 'increment']: transaction.amount,
          },
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
