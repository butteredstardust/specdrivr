ALTER TABLE "accounts" ADD COLUMN "issuer" text DEFAULT '' NOT NULL;
--> statement-breakpoint
-- Backfill: better-auth >= 1.7 matches the credential account on
-- `issuer = createLocalAccountIssuer('credential')`, which is 'local:credential'.
-- Rows created before this column existed have the '' default and would never
-- match, locking every existing user out of password sign-in.
UPDATE "accounts" SET "issuer" = 'local:credential' WHERE "provider_id" = 'credential' AND "issuer" = '';
--> statement-breakpoint
-- OAuth accounts use a distinct namespace keyed by their provider id.
UPDATE "accounts" SET "issuer" = 'local:' || "provider_id" WHERE "provider_id" <> 'credential' AND "issuer" = '';
