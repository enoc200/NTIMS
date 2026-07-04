import type { DefaultSession, DefaultUser } from 'next-auth'
import type { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string
    username: string
    role: string
  }

  interface Session extends DefaultSession {
    user: DefaultSession['user'] & {
      id: string
      username: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    username: string
    role: string
  }
}
