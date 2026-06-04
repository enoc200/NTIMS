import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

function cleanOptional(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

async function authorize() {
  const session = await getServerSession(authOptions)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!['ADMIN', 'STORE_MANAGER'].includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

async function getSupplierId(params: Promise<{ id: string }>) {
  const { id } = await params
  const idNum = Number(id)
  return Number.isInteger(idNum) && idNum > 0 ? idNum : null
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize()
    if (auth.error) return auth.error

    const id = await getSupplierId(params)
    if (!id) return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { products: { orderBy: { name: 'asc' } } },
    })

    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize()
    if (auth.error) return auth.error

    const id = await getSupplierId(params)
    if (!id) return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
    if (body.active !== undefined && typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid active value' }, { status: 400 })
    }

    const existing = await prisma.supplier.findUnique({ where: { id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactPerson: cleanOptional(body.contactPerson),
        phone: cleanOptional(body.phone),
        email: cleanOptional(body.email),
        address: cleanOptional(body.address),
        ...(body.active !== undefined ? { active: body.active } : {}),
      },
    })

    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize()
    if (auth.error) return auth.error

    const id = await getSupplierId(params)
    if (!id) return NextResponse.json({ error: 'Invalid supplier id' }, { status: 400 })

    const productCount = await prisma.product.count({ where: { supplierId: id } })
    if (productCount > 0) {
      return NextResponse.json({ error: 'Cannot delete supplier while products are linked to it. Mark it inactive instead.' }, { status: 400 })
    }

    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ message: 'Supplier deleted' })
  } catch {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
