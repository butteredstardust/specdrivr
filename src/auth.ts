import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET || "fakesecret123",
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.username || !credentials?.password) return null;

                // This is a minimal example; you can adjust according to your actual DB schema
                const result = await db.select().from(users).where(eq(users.username, credentials.username as string)).limit(1);
                const user = result[0];

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);
                if (!isValid) return null;

                return { id: user.id.toString(), name: user.username, role: user.role };
            },
        }),
    ],
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = user.id;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role as string;
                (session.user as any).id = token.id as string;
            }
            return session;
        }
    }
})
