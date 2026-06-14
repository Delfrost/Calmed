import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Module augmentation — extend NextAuth types with our custom fields
// ---------------------------------------------------------------------------

declare module 'next-auth' {
  interface User {
    role?: string;
    clinicId?: string;
    firstName?: string;
    lastName?: string;
    doctorProfileId?: string | null;
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
      clinicId: string;
      firstName: string;
      lastName: string;
      doctorProfileId: string | null;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role?: string;
    clinicId?: string;
    firstName?: string;
    lastName?: string;
    doctorProfileId?: string | null;
  }
}

// ---------------------------------------------------------------------------
// NextAuth configuration
// ---------------------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { doctorProfile: true },
        });

        if (!user || !user.isActive) return null;

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          clinicId: user.clinicId,
          firstName: user.firstName,
          lastName: user.lastName,
          doctorProfileId: user.doctorProfile?.id || null,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.doctorProfileId = user.doctorProfileId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.clinicId = token.clinicId as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.doctorProfileId =
          (token.doctorProfileId as string | null) ?? null;
      }
      return session;
    },
  },
});
