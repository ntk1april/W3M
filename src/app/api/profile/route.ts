import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PATCH /api/profile — update displayName and/or avatarUrl in the Prisma User table
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { displayName, avatarUrl } = body

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: { id: true, displayName: true, avatarUrl: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
