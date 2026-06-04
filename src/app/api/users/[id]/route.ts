import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'
import type { Role } from '@/types'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: idNum },
      select: { id: true, name: true, username: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    const body = await request.json()
    const { name, username, email, password, role, active } = body

    if (!name || !username || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ADMIN', 'STORE_MANAGER', 'SALES_ATTENDANT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (active !== undefined && typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid active value' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: idNum },
      select: { id: true, username: true, email: true },
    })
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Prevent unique constraint violations with a friendly 409.
    const conflict = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
        NOT: { id: idNum },
      },
      select: { id: true },
    })
    if (conflict) return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 })

    const roleValue = role as Role
    const updateData: { name: string; username: string; email: string; role: Role; active?: boolean; password?: string } = {
      name,
      username,
      email,
      role: roleValue,
      ...(active !== undefined ? { active } : {}),
    }
    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id: idNum },
      data: updateData,
      select: { id: true, name: true, username: true, email: true, role: true, active: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: idNum } })
    return NextResponse.json({ message: 'User deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
