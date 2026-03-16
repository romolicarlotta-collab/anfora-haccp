import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true }
        });

        if (!user) return null;

        // MVP: confronto diretto password — in produzione usare bcrypt/argon2
        if (user.passwordHash !== credentials.password) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          roleKey: user.role.key
        };
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
        token.roleKey = (user as { roleKey: string }).roleKey;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id as string;
        (session.user as Record<string, unknown>).role = token.role as string;
        (session.user as Record<string, unknown>).roleKey = token.roleKey as string;
      }
      return session;
    }
  }
});
