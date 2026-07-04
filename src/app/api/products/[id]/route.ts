import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

function isPrismaError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const idNum = Number(id)
    const product = await prisma.product.findUnique({ where: { id: idNum }, include: { supplier: true } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STORE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
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

    const existing = await prisma.product.findUnique({ where: { id: idNum } })
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    if (supplierIdNum !== null) {
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierIdNum }, select: { id: true } })
      if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id: idNum },
      data: { name, category, price: priceNum, stock: stockNum, minStock: minStockNum, supplierId: supplierIdNum },
    })

    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'STORE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({ where: { id: idNum }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await prisma.product.delete({ where: { id: idNum } })
    return NextResponse.json({ message: 'Product deleted' })
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === 'P2003') {
      return NextResponse.json({ error: 'Cannot delete product because it has sales history. Try updating its stock to 0 instead.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
