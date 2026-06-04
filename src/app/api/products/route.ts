import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const stockLevel = searchParams.get('stockLevel') || ''

    const products = await prisma.product.findMany({
      where: {
        AND: [
          search ? { name: { contains: search, mode: 'insensitive' } } : {},
          category ? { category } : {},
        ],
      },
      include: { supplier: true },
      orderBy: { name: 'asc' },
    }) as Array<{ id: number; name: string; category: string; price: number; stock: number; minStock: number }>

    let filtered = products
    if (stockLevel === 'low') filtered = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
    else if (stockLevel === 'out') filtered = products.filter(p => p.stock === 0)
    else if (stockLevel === 'ok') filtered = products.filter(p => p.stock > p.minStock)

    return NextResponse.json(filtered)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STORE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { name, category, price, stock, minStock, supplierId } = body

    if (!name || !category || price === undefined || stock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const priceNum = Number(price)
    const stockNum = Number(stock)
    const minStockNum = minStock === undefined ? 10 : Number(minStock)
    const supplierIdNum = supplierId === undefined || supplierId === null || supplierId === '' ? null : Number(supplierId)
    if (!Number.isFinite(priceNum) || priceNum < 0) return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) return NextResponse.json({ error: 'Invalid stock' }, { status: 400 })
    if (!Number.isFinite(minStockNum) || minStockNum < 0 || !Number.isInteger(minStockNum)) return NextResponse.json({ error: 'Invalid minStock' }, { status: 400 })
    if (supplierIdNum !== null && (!Number.isInteger(supplierIdNum) || supplierIdNum <= 0)) {
      return NextResponse.json({ error: 'Invalid supplier' }, { status: 400 })
    }

    if (supplierIdNum !== null) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierIdNum }, select: { id: true } })
      if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const product = await prisma.product.create({
      data: { name, category, price: priceNum, stock: stockNum, minStock: minStockNum, supplierId: supplierIdNum },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
