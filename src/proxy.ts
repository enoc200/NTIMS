import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Only admin can access /dashboard/users
    if (pathname.startsWith('/dashboard/users') && token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Sales attendants cannot access products
    if (pathname.startsWith('/dashboard/products') && token.role === 'SALES_ATTENDANT') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin and store managers can access suppliers
    if (pathname.startsWith('/dashboard/suppliers') && !['ADMIN', 'STORE_MANAGER'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Only sales attendants can access POS
    if (pathname.startsWith('/dashboard/sales') && token.role !== 'SALES_ATTENDANT') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Admin and store managers can access reports
    if (pathname.startsWith('/dashboard/reports') && !['ADMIN', 'STORE_MANAGER'].includes(token.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect logged-in users away from login page
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
