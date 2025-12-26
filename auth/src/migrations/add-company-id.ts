import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log("🔄 Starting migration: Add company_id to users table...");

    // Check if column exists
    const columnExists = await sql`
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'company_id'
    `;

    if (columnExists.length > 0) {
      console.log("✅ Column company_id already exists. Skipping migration.");
      return;
    }

    // Add the column
    await sql`
      ALTER TABLE users 
      ADD COLUMN company_id UUID;
    `;

    // Add comment
    await sql`
      COMMENT ON COLUMN users.company_id IS 
      'Foreign key to companies table. NULL for jobseekers, required for recruiters';
    `;

    console.log("✅ Migration completed: company_id column added successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
