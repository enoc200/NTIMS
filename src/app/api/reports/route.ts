import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import type { ProductReportItem } from '@/types'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['ADMIN', 'STORE_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const products: Array<{
      id: number
      name: string
      category: string
      supplier: { name: string } | null
      price: number
      stock: number
      minStock: number
    }> = await prisma.product.findMany({
      include: { supplier: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    const soldItems = await prisma.saleItem.findMany({
      select: { productId: true, quantity: true },
    })

    const soldByProduct = new Map<number, number>()
    soldItems.forEach((item: { productId: number; quantity: number }) => {
      soldByProduct.set(item.productId, (soldByProduct.get(item.productId) || 0) + item.quantity)
    })
    const productRows: ProductReportItem[] = products.map((product: {
      id: number
      name: string
      category: string
      supplier: { name: string } | null
      price: number
      stock: number
      minStock: number
    }) => {
      const stockStatus =
        product.stock === 0 ? 'Out of Stock' :
          product.stock <= product.minStock ? 'Low Stock' :
            'Healthy'

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        supplierName: product.supplier?.name || null,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        inventoryValue: product.price * product.stock,
        totalSold: soldByProduct.get(product.id) || 0,
        stockStatus,
      }
    })

    const categoryStats = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { category: 'asc' },
    })

    const productReport = {
      totalProducts: products.length,
      totalInventoryValue: productRows.reduce((sum, product) => sum + product.inventoryValue, 0),
      lowStockCount: productRows.filter(product => product.stockStatus === 'Low Stock').length,
      outOfStockCount: productRows.filter(product => product.stockStatus === 'Out of Stock').length,
      categoryCount: categoryStats.length,
      products: productRows,
      categoryDistribution: categoryStats.map((category: {
        category: string
        _count: { id: number }
      }) => ({
        category: category.category,
        count: category._count.id,
      })),
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({
        canViewSalesReport: false,
        productReport,
      })
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const [salesSummary, itemsSummary, recentSales, salesInRange] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { total: true, tax: true },
        _count: { id: true },
      }),
      prisma.saleItem.aggregate({
        _sum: { quantity: true },
      }),
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { items: true },
      }),
      prisma.sale.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, total: true },
      }),
    ])

    const dailyMap: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      dailyMap[date.toISOString().slice(0, 10)] = 0
    }

    salesInRange.forEach(sale => {
      const dateKey = sale.createdAt.toISOString().slice(0, 10)
      if (dailyMap[dateKey] !== undefined) dailyMap[dateKey] += sale.total
    })

    const totalRevenue = salesSummary._sum.total || 0
    const totalSales = salesSummary._count.id

    return NextResponse.json({
      canViewSalesReport: true,
      salesReport: {
        totalRevenue,
        totalSales,
        totalItemsSold: itemsSummary._sum.quantity || 0,
        averageSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
        taxCollected: salesSummary._sum.tax || 0,
      recentSales: recentSales.map((sale: {
        id: number
        receiptNumber: string
        total: number
        createdAt: Date
        items: Array<unknown>
      }) => ({
        id: sale.id,
        receiptNumber: sale.receiptNumber,
        total: sale.total,
          createdAt: sale.createdAt,
          itemCount: sale.items.length,
        })),
        dailySales: Object.entries(dailyMap).map(([date, total]) => ({ date, total })),
      },
      productReport,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}
