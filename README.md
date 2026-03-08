# Specdrivr

Simple AI-native orchestration platform demo.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up database:
   ```bash
   # Copy .env.example to .env.local and configure DATABASE_URL
   npm run db:push
   npm run db:seed  # Optional: seed demo data
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app.
