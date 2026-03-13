import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { env } from './env';
import { headers } from 'next/headers';
import { sendEmail } from './email';

export const authInstance = betterAuth({
  baseURL: env.NEXTAUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [env.NEXTAUTH_URL, 'http://localhost:3001'],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'viewer' },
      isActive: { type: 'boolean', required: false, defaultValue: true },
      timezone: { type: 'string', required: false },
      locale: { type: 'string', required: false },
      onboardingStep: { type: 'number', required: false, defaultValue: 0 },
      theme: { type: 'string', required: false, defaultValue: 'dark' },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      // Note: Actual email sending requires a valid RESEND_API_KEY in the environment.
      // In CI or environments without a token, the sendEmail call will log an error but return success: false.
      await sendEmail(
        user.email,
        'Reset your Specdrivr password',
        `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">     
    <h2 style="color: #333;">Reset your Specdrivr password</h2>
    <p style="color: #555; line-height: 1.6;">Hello,</p>
    <p style="color: #555; line-height: 1.6;">We received a request to reset the password for your Specdrivr account. Click the button below to choose a new password:</p>
    <div style="margin: 30px 0; text-align: center;">
    <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #555; font-size: 14px; line-height: 1.6;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
    <p style="color: #888; font-size: 12px; text-align: center;">DAEMON &copy; Specdrivr</p>
    </div>
    `
      );
    },
    sendVerificationEmail: async () => {
      // Not required for MVP — leave as a no-op but add the handler stub
    },
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
