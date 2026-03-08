
## 2024-03-08 - Fixed invalid seed script path
**Learning:** The documentation and package.json pointed to `db/seed.ts` which did not exist, but no seed script actually existed anywhere. We updated the scripts to point to the correct placeholder path or create the seed script.
**Action:** Always verify that scripts mentioned in `package.json` and `README.md` actually point to existing files.
## 2024-03-08 - Added missing env vars to schema
**Learning:** Found that `AGENT_TOKEN` and `APP_URL` were in `.env.example` but missing from `src/lib/env.ts` which is the central place where environment variables are defined.
**Action:** Adding these variables to `src/lib/env.ts` to make sure they are checked and typed.
