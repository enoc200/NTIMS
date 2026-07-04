import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

type SupplierRow = {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    products: number
  }
}

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

export async function GET(request: NextRequest) {
  try {
    const auth = await authorize()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim() || ''
    const status = searchParams.get('status') || ''

    const suppliers = await prisma.supplier.findMany({
      where: {
        AND: [
          search
            ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
            : {},
          status === 'active' ? { active: true } : {},
          status === 'inactive' ? { active: false } : {},
        ],
      },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(suppliers.map((supplier: SupplierRow) => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      active: supplier.active,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      productCount: supplier._count.products,
    })))
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorize()
    if (auth.error) return auth.error

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: cleanOptional(body.contactPerson),
        phone: cleanOptional(body.phone),
        email: cleanOptional(body.email),
        address: cleanOptional(body.address),
        active: body.active === undefined ? true : Boolean(body.active),
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
