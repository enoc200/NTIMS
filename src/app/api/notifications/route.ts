import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const notifications = await prisma.notification.findMany({
      where: { OR: [{ targetRole: null }] },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, readAll } = await request.json()

    if (readAll) {
      const role = session.user.role as Role
      await prisma.notification.updateMany({
        where: {
          OR: [
            { targetRole: null },
            { targetRole: role },
          ],
          read: false
        },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      await prisma.notification.update({
        where: { id: Number(id) },
        data: { read: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
