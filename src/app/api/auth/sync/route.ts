import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const username = user.user_metadata?.username
    const displayName = user.user_metadata?.display_name

    await prisma.user.upsert({
      where: { id: user.id },
      update: { 
        email: user.email!,
        ...(username && { username }),
        ...(displayName && { displayName }),
      },
      create: { 
        id: user.id, 
        email: user.email!,
        ...(username && { username }),
        ...(displayName && { displayName }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 })
  }
}
