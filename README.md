# SME Inventory Management System (IMS)

A professional, full-stack inventory and POS solution for SMEs built with Next.js 16 and PostgreSQL.

## Features
- Vibrant dashboard with real-time analytics and metrics
- Fast POS checkout with receipt generation
- Inventory control with smart stock tracking and alerts
- Secure role-based access control
- Automated notifications for sales and low stock

## Getting Started
1. Install dependencies: `npm install`
2. Sync database: `npx prisma db push`
3. Seed data: `npx tsx prisma/seed.ts`
4. Run development server: `npm run dev`

## Local development
The app runs locally with your existing Node.js and PostgreSQL setup.

- Set `DATABASE_URL` in a `.env` file or your shell environment.
- Run `npx prisma db push` to sync the schema.
- Run `npx tsx prisma/seed.ts` to seed demo data.
- Start the app with `npm run dev`.

## Production
For production, set `NEXTAUTH_SECRET` and `DATABASE_URL` in your deployment environment.

## Demo Accounts
| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Staff | `sales` | `sales123` |

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js GitHub repository](https://github.com/vercel/next.js)
