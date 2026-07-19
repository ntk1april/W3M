import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, username } = await request.json()

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // 1. Sign up the user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          display_name: username,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Signup failed' }, { status: 400 })
    }

    // 2. Immediately create the user in the Prisma database so username lookup works for login
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email!,
        username: username.toLowerCase(),
        displayName: username,
      },
      create: {
        id: data.user.id,
        email: data.user.email!,
        username: username.toLowerCase(),
        displayName: username,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error during registration:', error)
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 })
  }
}
