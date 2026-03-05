const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function resetAdmin() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL not set in .env.local');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL);
    const db = drizzle(sql);

    try {
        const password = 'demo';
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        console.log(`🌱 Resetting Admin password to "${password}"...`);

        // We can't use Drizzle schema here easily without bundling/TS-node in a simple script
        // So we use raw SQL via the postgres driver directly
        const result = await sql`
      INSERT INTO users (username, password_hash, role, is_active, is_admin, updated_at)
      VALUES ('Admin', ${hash}, 'admin', true, true, NOW())
      ON CONFLICT (username) 
      DO UPDATE SET 
        password_hash = ${hash},
        role = 'admin',
        is_active = true,
        is_admin = true,
        updated_at = NOW()
      RETURNING id, username;
    `;

        if (result.length > 0) {
            console.log(`✅ Admin user (ID: ${result[0].id}) has been reset successfully.`);
            console.log(`👉 Username: Admin`);
            console.log(`👉 Password: ${password}`);
        } else {
            console.error('❌ Failed to reset Admin user.');
        }

    } catch (error) {
        console.error('❌ Error resetting Admin user:', error.message);
    } finally {
        await sql.end();
    }
}

resetAdmin().catch(console.error);
