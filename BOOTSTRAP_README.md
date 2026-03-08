# Bootstrap Script

For fresh Ubuntu containers, use `bootstrap.sh` to set up the environment and build the app.

## Usage

```bash
./bootstrap.sh
```

## What it does

1. Installs nvm (Node Version Manager)
2. Installs Node.js from .nvmrc
3. Installs PostgreSQL 16
4. Creates database and user
5. Installs npm dependencies
6. Sets up .env.local
7. Builds the project

## Post-bootstrap

After running, execute:
- `npm run db:push` (apply schema)
- `npm run db:seed` (optional demo data)
- `npm run dev` (start dev server)

## Requirements

- Ubuntu Linux
- Internet connection
- Git repository cloned
