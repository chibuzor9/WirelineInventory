import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' :
    process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

dotenv.config({ path: envFile });

if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL not found in ${ envFile }. Ensure the database is provisioned and environment variables are set correctly.`);
}

export default defineConfig({
    out: "./migrations",
    schema: "./shared/schema.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
