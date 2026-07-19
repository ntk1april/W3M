import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// POST /api/auth/lookup — resolve username → email for login
export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { email: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Username not found' }, { status: 404 })
    }

    return NextResponse.json({ email: user.email })
  } catch (error) {
    console.error('Lookup error:', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
