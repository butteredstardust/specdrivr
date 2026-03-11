import 'server-only';
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "./env";
import { headers } from "next/headers";

export const authInstance = betterAuth({
  baseURL: env.NEXTAUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [env.NEXTAUTH_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "viewer" },
      isActive: { type: "boolean", required: false, defaultValue: true },
      timezone: { type: "string", required: false },
      locale: { type: "string", required: false },
      onboardingStep: { type: "number", required: false, defaultValue: 0 },
      theme: { type: "string", required: false, defaultValue: "dark" },
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
    crossSubDomainCookies: {
      enabled: false,
    },
  },
  secret: env.NEXTAUTH_SECRET,
});

export const auth = async () => {
  return await authInstance.api.getSession({
    headers: await headers(),
  });
};
