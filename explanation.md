The `MissingSecret` error occurs due to a combination of upgrading to NextAuth v5 (Auth.js) and the way Playwright's `webServer` spawns the application process.

Here is the step-by-step breakdown of why this happens:

1. **NextAuth v5 Environment Variable Change:** The project is using `next-auth@^5.0.0-beta.19`. In NextAuth v5, the default environment variable it automatically looks for to sign sessions was changed from `NEXTAUTH_SECRET` to `AUTH_SECRET`.
2. **Codebase is Still Using v4 Conventions:** Your local environment file and your validation schema in `src/lib/env.ts` are both still explicitly defining and using the old `NEXTAUTH_SECRET` variable.
3. **No Explicit Secret Mapping:** Inside `src/auth.ts`, the NextAuth configuration object does not explicitly define the `secret` property (e.g., `secret: process.env.NEXTAUTH_SECRET`). Because it's omitted, NextAuth falls back to looking for `process.env.AUTH_SECRET`.
4. **Playwright `webServer` Strictness:** In standard local `development` mode, NextAuth v5 sometimes skips the strict secret check by auto-generating a dummy secret on the fly so your app doesn't crash. However, when the Playwright verification script runs, it uses the `webServer` configuration to spawn `PORT=3001 npm run dev` in a separate background shell. During this automated execution, the testing context triggers NextAuth to strictly enforce the presence of a valid secret. Since it looks for `AUTH_SECRET` and cannot find it, it throws the `MissingSecret` error, causing the background server to fail to start.

**To resolve this:**
You simply need to explicitly pass the secret in your `src/auth.ts` file like this: `secret: process.env.NEXTAUTH_SECRET`, or rename the variable in your `.env` and `src/lib/env.ts` files to `AUTH_SECRET`.
