import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SALES_ATTENDANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sales = await prisma.sale.findMany({
      where: { userId: Number(session.user.id) },
      include: { user: true, items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(sales)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role !== 'SALES_ATTENDANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { items, receiptNumber } = body

    if (!receiptNumber || typeof receiptNumber !== 'string') {
      return NextResponse.json({ error: 'Missing receipt number' }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const normalized = new Map<number, { productId: number; productName?: string; price: number; quantity: number }>()

    for (const rawItem of items) {
      const productId = Number(rawItem?.productId)
      const quantity = Number(rawItem?.quantity)
      const price = Number(rawItem?.price)
      const productName = typeof rawItem?.productName === 'string' ? rawItem.productName : undefined

      if (!Number.isInteger(productId) || productId <= 0) return NextResponse.json({ error: 'Invalid product id' }, { status: 400 })
      if (!Number.isInteger(quantity) || quantity <= 0) return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
      if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: 'Invalid item price' }, { status: 400 })

      const existing = normalized.get(productId)
      if (existing) existing.quantity += quantity
      else normalized.set(productId, { productId, productName, price, quantity })
    }

    if (normalized.size === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const itemsNormalized = Array.from(normalized.values())

    const subtotal = itemsNormalized.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const tax = subtotal * 0.08
    const total = subtotal + tax

    const userId = Number(session.user.id)
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const sale = await prisma.$transaction(async (tx: { product: typeof prisma.product; sale: typeof prisma.sale }) => {
      const productIds = itemsNormalized.map(i => i.productId)
      const products = await tx.product.findMany({ where: { id: { in: productIds } } })
      const productMap = new Map<number, { id: number; name: string; stock: number }>(
        products.map((p: { id: number; name: string; stock: number }) => [p.id, p])
      )

      // Validate inside the transaction.
      for (const item of itemsNormalized) {
        const product = productMap.get(item.productId)
        if (!product) {
          throw Object.assign(new Error(`Product not found: ${item.productId}`), { name: 'PRODUCT_NOT_FOUND' })
        }
        if (product.stock < item.quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { name: 'INSUFFICIENT_STOCK' })
        }
      }

      // Conditional decrement to prevent negative stock under concurrency.
      for (const item of itemsNormalized) {
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (result.count !== 1) {
          throw Object.assign(new Error('Insufficient stock'), { name: 'INSUFFICIENT_STOCK' })
        }
      }

      return tx.sale.create({
        data: {
          receiptNumber,
          subtotal,
          tax,
          total,
          userId,
          items: {
            create: itemsNormalized.map(i => ({
              productId: i.productId,
              productName: i.productName || productMap.get(i.productId)?.name || 'Unknown',
              quantity: i.quantity,
              price: i.price,
              total: i.price * i.quantity,
            })),
          },
        },
        include: { items: true, user: true },
      })
    })

    // Post-sale notifications
    try {
      // 1. Create a notification for the new sale
      await prisma.notification.create({
        data: {
          title: 'New Sale Completed',
          message: `${sale.receiptNumber} - ${formatKES(sale.total)} by ${session.user.name}`,
          type: 'SALE',
          targetRole: null // Visible to all roles
        }
      })

      // 2. Check for low stock items and notify
      const productIds = sale.items.map(i => i.productId)
      const products = await prisma.product.findMany({ where: { id: { in: productIds } } })
      
      for (const p of products) {
        if (p.stock <= p.minStock) {
          await prisma.notification.create({
            data: {
              title: 'Low Stock Alert',
              message: `${p.name} is low on stock (${p.stock} remaining)`,
              type: 'LOW_STOCK',
              targetRole: 'STORE_MANAGER'
            }
          })
        }
      }
    } catch (notifyError) {
      console.error('Failed to generate notifications:', notifyError)
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    const anyErr = error as unknown as { name?: string; code?: string; message?: string }

    if (anyErr?.name === 'INSUFFICIENT_STOCK') {
      return NextResponse.json({ error: anyErr?.message || 'Insufficient stock' }, { status: 400 })
    }
    if (anyErr?.name === 'PRODUCT_NOT_FOUND') {
      return NextResponse.json({ error: anyErr?.message || 'Product not found' }, { status: 400 })
    }
    // Prisma unique constraint violation (receiptNumber)
    if (anyErr?.code === 'P2002') {
      return NextResponse.json({ error: 'Receipt number already exists' }, { status: 409 })
    }

    console.error(error)
    return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
  }
}

// Helper for formatting currency in notifications
function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`
}
