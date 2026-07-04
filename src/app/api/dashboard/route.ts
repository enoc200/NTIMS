import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Today's sales
    const todaysSales = await prisma.sale.aggregate({
      where: { createdAt: { gte: today, lt: tomorrow } },
      _sum: { total: true },
    })

    // Total products
    const totalProducts = await prisma.product.count()

    // Inventory value
    const products = await prisma.product.findMany()
    const inventoryValue = products.reduce(
      (sum: number, p: { price: number; stock: number }) => sum + p.price * p.stock,
      0
    )

    // Actually compute low stock properly
    const allProducts = await prisma.product.findMany() as Array<{
      id: number
      name: string
      category: string
      price: number
      stock: number
      minStock: number
    }>
    const lowStock = allProducts.filter(p => p.stock > 0 && p.stock <= p.minStock)
    const outOfStock = allProducts.filter(p => p.stock === 0)

    // Sales trend last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const salesLast7Days = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, total: true },
    })

    // Group by date
    const trendMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      trendMap[d.toISOString().slice(0, 10)] = 0
    }
    salesLast7Days.forEach((s: { createdAt: Date; total: number }) => {
      const dateKey = s.createdAt.toISOString().slice(0, 10)
      if (trendMap[dateKey] !== undefined) trendMap[dateKey] += s.total
    })
    const salesTrend = Object.entries(trendMap).map(([date, total]) => ({ date, total }))

    // Low stock items (for display list)
    const lowStockItems = allProducts
      .filter(p => p.stock > 0 && p.stock <= p.minStock)
      .map(p => ({ id: p.id, name: p.name, category: p.category, stock: p.stock, minStock: p.minStock }))

    // Fast-moving products (most sold in last 7 days)
    const saleItemsLast7 = await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: sevenDaysAgo } } },
      include: { product: true },
    })
    const fastMap: Record<number, { name: string; price: number; category: string; stock: number; totalSold: number }> = {}
    saleItemsLast7.forEach((item: {
      productId: number
      productName: string
      quantity: number
      product: { price: number; category: string; stock: number }
    }) => {
      if (!fastMap[item.productId]) {
        fastMap[item.productId] = {
          name: item.productName,
          price: item.product.price,
          category: item.product.category,
          stock: item.product.stock,
          totalSold: 0,
        }
      }
      fastMap[item.productId].totalSold += item.quantity
    })
    const fastMoving = Object.entries(fastMap)
      .map(([id, data]) => ({ id: Number(id), ...data }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)

    // Dead stock (no sales in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const soldProductIds = (await prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: thirtyDaysAgo } } },
      select: { productId: true },
    })).map((s: { productId: number }) => s.productId)

    const deadStock = allProducts
      .filter(p => p.stock > 0 && !soldProductIds.includes(p.id))
      .map(p => ({ id: p.id, name: p.name, category: p.category, stock: p.stock, value: p.price * p.stock }))

    // Out of stock
    const outOfStockItems = outOfStock.map(p => ({ id: p.id, name: p.name, category: p.category }))

    // Category distribution
    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
    })
    const categoryDistribution = categoryStats.map((c: { category: string; _count: { id: number } }) => ({
      category: c.category,
      count: c._count.id
    }))

    // Recent Transactions
    const recentSales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true }
    })

    return NextResponse.json({
      stats: {
        todaysSales: todaysSales._sum.total || 0,
        totalProducts,
        inventoryValue,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
      },
      salesTrend,
      lowStockItems,
      fastMoving,
      deadStock,
      outOfStockItems,
      categoryDistribution,
      recentSales: recentSales.map(s => ({
        id: s.id,
        receiptNumber: s.receiptNumber,
        total: s.total,
        createdAt: s.createdAt,
        itemCount: s.items.length
      }))
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
