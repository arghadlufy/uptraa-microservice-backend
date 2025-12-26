import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log("🔄 Starting migration: Enable PostGIS and add location column...");

    // Step 1: Enable PostGIS extension
    console.log("📦 Enabling PostGIS extension...");
    await sql`
      CREATE EXTENSION IF NOT EXISTS postgis;
    `;
    console.log("✅ PostGIS extension enabled");

    // Step 2: Check if location column exists
    const columnExists = await sql`
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'location'
    `;

    if (columnExists.length > 0) {
      console.log("✅ Column location already exists. Skipping column creation.");
      return;
    }

    // Step 3: Add location column as POINT type (PostGIS)
    // POINT stores (longitude, latitude) - note the order!
    console.log("📍 Adding location column to users table...");
    await sql`
      ALTER TABLE users 
      ADD COLUMN location GEOMETRY(POINT, 4326);
    `;

    // Add comment for documentation
    await sql`
      COMMENT ON COLUMN users.location IS 
      'PostGIS POINT geometry storing (longitude, latitude) in WGS84 (SRID 4326). NULL if location not set.';
    `;

    // Step 4: Create spatial index for faster location queries
    console.log("🔍 Creating spatial index for location column...");
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_location 
      ON users USING GIST (location);
    `;

    console.log("✅ Migration completed: location column added with PostGIS support");
    console.log("ℹ️  Note: location is stored as POINT(longitude, latitude) in WGS84 format");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate()
  .then(() => {
    console.log("✅ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });

