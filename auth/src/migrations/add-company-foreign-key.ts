import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function addCompanyForeignKey() {
  try {
    // First create companies table
    await sql`
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE,
          website VARCHAR(255),
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;

    // Add foreign key constraint
    await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_users_company_id'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT fk_users_company_id 
            FOREIGN KEY (company_id) 
            REFERENCES companies(id) 
            ON DELETE SET NULL;
            
            RAISE NOTICE 'Foreign key constraint added';
          END IF;
        END $$;
      `;

    // Optional: Add check constraint (only recruiters can have company_id)
    await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE constraint_name = 'check_recruiter_company'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT check_recruiter_company 
            CHECK (
              (role = 'recruiter' AND company_id IS NOT NULL) OR 
              (role = 'jobseeker' AND company_id IS NULL)
            );
            
            RAISE NOTICE 'Check constraint added';
          END IF;
        END $$;
      `;
  } catch (error) {
    console.error("❌ Error adding constraints:", error);
  }
}

addCompanyForeignKey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
