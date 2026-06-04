import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log(' Seeding database...')

  // Clear existing data
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPass = await bcrypt.hash('admin123', 10)
  const managerPass = await bcrypt.hash('manager123', 10)
  const salesPass = await bcrypt.hash('sales123', 10)

  const admin = await prisma.user.create({
    data: {
      name: 'John Admin',
      username: 'admin',
      email: 'admin@store.com',
      password: adminPass,
      role: 'ADMIN',
      active: true,
    },
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Manager',
      username: 'manager',
      email: 'manager@store.com',
      password: managerPass,
      role: 'STORE_MANAGER',
      active: true,
    },
  })

  await prisma.user.create({
    data: {
      name: 'Mike Attendant',
      username: 'sales',
      email: 'sales@store.com',
      password: salesPass,
      role: 'SALES_ATTENDANT',
      active: true,
    },
  })

  // Create suppliers
  const [techSupplier, officeSupplier, accessoriesSupplier] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Nairobi Tech Distributors',
        contactPerson: 'Grace Wanjiku',
        phone: '+254 700 111 222',
        email: 'sales@nairobitech.example',
        address: 'Industrial Area, Nairobi',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'OfficePro Kenya',
        contactPerson: 'Peter Otieno',
        phone: '+254 711 333 444',
        email: 'orders@officepro.example',
        address: 'Mombasa Road, Nairobi',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Daily Goods Supply',
        contactPerson: 'Amina Hassan',
        phone: '+254 722 555 666',
        email: 'hello@dailygoods.example',
        address: 'Westlands, Nairobi',
      },
    }),
  ])

  // Create products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Laptop - Dell XPS 15', category: 'Electronics', price: 129999, stock: 5, minStock: 10, supplierId: techSupplier.id } }),
    prisma.product.create({ data: { name: 'Wireless Mouse', category: 'Electronics', price: 2999, stock: 45, minStock: 20, supplierId: techSupplier.id } }),
    prisma.product.create({ data: { name: 'Office Chair', category: 'Furniture', price: 24999, stock: 3, minStock: 5, supplierId: officeSupplier.id } }),
    prisma.product.create({ data: { name: 'Desk Lamp', category: 'Furniture', price: 3999, stock: 15, minStock: 10, supplierId: officeSupplier.id } }),
    prisma.product.create({ data: { name: 'USB-C Cable', category: 'Accessories', price: 1299, stock: 2, minStock: 15, supplierId: accessoriesSupplier.id } }),
    prisma.product.create({ data: { name: 'Notebook Set', category: 'Stationery', price: 899, stock: 100, minStock: 30, supplierId: officeSupplier.id } }),
    prisma.product.create({ data: { name: 'Headphones', category: 'Electronics', price: 8999, stock: 25, minStock: 10, supplierId: techSupplier.id } }),
    prisma.product.create({ data: { name: 'Desk Organizer', category: 'Furniture', price: 2499, stock: 8, minStock: 10, supplierId: officeSupplier.id } }),
    prisma.product.create({ data: { name: 'Pen Pack (10)', category: 'Stationery', price: 599, stock: 50, minStock: 30, supplierId: officeSupplier.id } }),
    prisma.product.create({ data: { name: 'Water Bottle', category: 'Accessories', price: 1500, stock: 0, minStock: 10, supplierId: accessoriesSupplier.id } }),
  ])

  // Create sample sales for last 7 days
  const today = new Date()
  const saleData = [
    { daysAgo: 3, qty: 1, productIdx: 1, userId: admin.id },   // Wireless Mouse
    { daysAgo: 3, qty: 2, productIdx: 5, userId: admin.id },   // Notebook Set
    { daysAgo: 4, qty: 1, productIdx: 3, userId: manager.id }, // Desk Lamp
    { daysAgo: 4, qty: 3, productIdx: 8, userId: manager.id }, // Pen Pack
    { daysAgo: 1, qty: 1, productIdx: 0, userId: admin.id },   // Laptop
    { daysAgo: 1, qty: 2, productIdx: 6, userId: admin.id },   // Headphones
    { daysAgo: 0, qty: 1, productIdx: 2, userId: manager.id }, // Office Chair
  ]

  let receiptCount = 1
  for (const s of saleData) {
    const product = products[s.productIdx]
    const subtotal = product.price * s.qty
    const tax = subtotal * 0.08
    const total = subtotal + tax
    const saleDate = new Date(today)
    saleDate.setDate(saleDate.getDate() - s.daysAgo)
    const dateStr = saleDate.toISOString().slice(0, 10).replace(/-/g, '')
    const receiptNumber = `RCP-${dateStr}-${String(receiptCount).padStart(4, '0')}`
    receiptCount++

    await prisma.sale.create({
      data: {
        receiptNumber,
        subtotal,
        tax,
        total,
        userId: s.userId,
        createdAt: saleDate,
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            quantity: s.qty,
            price: product.price,
            total: subtotal,
          },
        },
      },
    })
  }

  console.log(' Seed complete!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
