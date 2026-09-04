-- Corrects the OAuth half of 0019's `issuer` backfill.
--
-- 0019 wrote `local:<provider_id>` for every non-credential account, but that is
-- better-auth's *local* account namespace. A provider that declares no issuer of
-- its own gets `local:oauth:<provider_id>` (createOAuthAccountIssuer), so those
-- rows were written into a namespace the adapter never looks in and would be
-- relinked or duplicated on the next callback.
--
-- Only the generic form is reconstructible here: built-in providers that declare
-- a real issuer (Google's `https://accounts.google.com`, for example) cannot be
-- derived from provider_id and would need an explicit mapping. That is currently
-- moot — `src/lib/auth.ts` configures no socialProviders, so no OAuth rows exist
-- and this statement is a no-op on every present database.
UPDATE "accounts"
SET "issuer" = 'local:oauth:' || "provider_id"
WHERE "provider_id" <> 'credential'
  AND "issuer" = 'local:' || "provider_id";
--> statement-breakpoint
-- better-auth 1.7 declares (issuer, account_id) as the account identity
-- constraint; 0019 added the column but not the index.
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "accounts" USING btree ("issuer","account_id");
