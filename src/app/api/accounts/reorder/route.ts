import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accountIds } = await request.json()

    if (!Array.isArray(accountIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Update the order for each account in a transaction
    await prisma.$transaction(
      accountIds.map((id, index) => 
        prisma.account.updateMany({
          where: { id, userId: user.id },
          data: { order: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to reorder accounts:', error)
    return NextResponse.json(
      { error: 'Failed to reorder accounts' },
      { status: 500 }
    )
  }
}
