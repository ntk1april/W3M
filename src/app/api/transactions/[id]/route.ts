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
    const newAmount = parseFloat(amount)

    // Get original transaction to reverse balance change
    const original = await prisma.transaction.findUnique({
      where: { id },
      select: { type: true, amount: true, accountId: true, toAccountId: true },
    })
    if (!original) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Balance check for EXPENSE and TRANSFER — fetch account in parallel with nothing else to wait on
    if (type === 'EXPENSE' || (type === 'TRANSFER' && toAccountId)) {
      const sourceAccount = await prisma.account.findUnique({
        where: { id: accountId, userId: user.id },
        select: { balance: true, name: true },
      })
      if (!sourceAccount) {
        return NextResponse.json({ error: 'Source account not found' }, { status: 404 })
      }

      let availableBalance = sourceAccount.balance
      if (original.accountId === accountId) {
        if (original.type === 'EXPENSE' || original.type === 'TRANSFER') {
          availableBalance += original.amount
        } else if (original.type === 'INCOME') {
          availableBalance -= original.amount
        }
      }

      if (availableBalance < newAmount) {
        return NextResponse.json(
          { error: `Insufficient balance in "${sourceAccount.name}". Available: ${availableBalance.toFixed(2)}, Required: ${newAmount.toFixed(2)}` },
          { status: 400 },
        )
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbOperations: any[] = [
      prisma.transaction.update({
        where: { id, userId: user.id },
        data: {
          type, title, amount: newAmount, date: new Date(date),
          accountId,
          toAccountId: type === 'TRANSFER' ? (toAccountId || null) : null,
          categoryId: type === 'TRANSFER' ? null : (categoryId || null),
          note, receipt,
        },
        // Only return scalar fields — no JOINs needed, client invalidates cache
        select: { id: true, type: true, amount: true, title: true, date: true, accountId: true, toAccountId: true, categoryId: true },
      }),
    ]

    // Reverse original balance
    if (original.type === 'TRANSFER' && original.toAccountId) {
      dbOperations.push(
        prisma.account.update({ where: { id: original.accountId }, data: { balance: { increment: original.amount } } }),
        prisma.account.update({ where: { id: original.toAccountId }, data: { balance: { decrement: original.amount } } }),
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: original.accountId },
          data: { balance: { [original.type === 'INCOME' ? 'decrement' : 'increment']: original.amount } },
        }),
      )
    }

    // Apply new balance
    if (type === 'TRANSFER' && toAccountId) {
      dbOperations.push(
        prisma.account.update({ where: { id: accountId }, data: { balance: { decrement: newAmount } } }),
        prisma.account.update({ where: { id: toAccountId }, data: { balance: { increment: newAmount } } }),
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: accountId },
          data: { balance: { [type === 'INCOME' ? 'increment' : 'decrement']: newAmount } },
        }),
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

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { type: true, amount: true, accountId: true, toAccountId: true },
    })
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbOperations: any[] = [
      prisma.transaction.delete({ where: { id, userId: user.id } }),
    ]

    if (transaction.type === 'TRANSFER' && transaction.toAccountId) {
      dbOperations.push(
        prisma.account.update({ where: { id: transaction.accountId }, data: { balance: { increment: transaction.amount } } }),
        prisma.account.update({ where: { id: transaction.toAccountId }, data: { balance: { decrement: transaction.amount } } }),
      )
    } else {
      dbOperations.push(
        prisma.account.update({
          where: { id: transaction.accountId },
          data: { balance: { [transaction.type === 'INCOME' ? 'decrement' : 'increment']: transaction.amount } },
        }),
      )
    }

    await prisma.$transaction(dbOperations)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}
