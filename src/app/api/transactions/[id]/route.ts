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
    const { type, title, amount, date, accountId, toAccountId, categoryId, note, receipt } = body

    // Get original transaction to reverse balance change
    const original = await prisma.transaction.findUnique({ where: { id } })
    if (!original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const newAmount = parseFloat(amount)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbOperations: any[] = [
      prisma.transaction.update({
        where: { id, userId: user.id },
        data: { 
          type, title, amount: newAmount, date: new Date(date), 
          accountId, toAccountId, categoryId: type === 'TRANSFER' ? null : categoryId, note, receipt 
        },
        include: { account: true, toAccount: true, category: true },
      })
    ]

    // Reverse original
    if (original.type === 'TRANSFER' && original.toAccountId) {
      dbOperations.push(
        prisma.account.update({
          where: { id: original.accountId },
          data: { balance: { increment: original.amount } },
        }),
        prisma.account.update({
          where: { id: original.toAccountId },
          data: { balance: { decrement: original.amount } },
        })
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: original.accountId },
          data: {
            balance: {
              [original.type === 'INCOME' ? 'decrement' : 'increment']: original.amount,
            },
          },
        })
      )
    }

    // Apply new
    if (type === 'TRANSFER' && toAccountId) {
      dbOperations.push(
        prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: newAmount } },
        }),
        prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: newAmount } },
        })
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: accountId },
          data: {
            balance: {
              [type === 'INCOME' ? 'increment' : 'decrement']: newAmount,
            },
          },
        })
      )
    }

    const [transaction] = await prisma.$transaction(dbOperations)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbOperations: any[] = [
      prisma.transaction.delete({ where: { id, userId: user.id } })
    ]

    // Reverse balance
    if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
      dbOperations.push(
        prisma.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } },
        }),
        prisma.account.update({
          where: { id: transaction.toAccountId },
          data: { balance: { decrement: transaction.amount } },
        })
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: transaction.accountId },
          data: {
            balance: {
              [transaction.type === 'INCOME' ? 'decrement' : 'increment']: transaction.amount,
            },
          },
        })
      )
    }

    await prisma.$transaction(dbOperations)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
