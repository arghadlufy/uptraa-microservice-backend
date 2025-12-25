import "dotenv/config";
import app from "./app.js";
import { sql } from "./utils/db.js";
import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL as string,
});

redisClient
  .connect()
  .then(() => {
    console.log("✅ [AUTH SERVICE] Redis connected successfully");
  })
  .catch((error) => {
    console.error("❌ [AUTH SERVICE] Error connecting to Redis:", error);
  });

async function initDb() {
  try {
    await sql`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter');
            END IF;
        END $$;
        `;

    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255),
            phone_number VARCHAR(20) NOT NULL,
            role user_role NOT NULL,
            bio TEXT,
            resume VARCHAR(255),
            resume_public_id VARCHAR(255),
            profile_pic VARCHAR(255),
            profile_pic_public_id VARCHAR(255),
            subscription TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS skills (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS user_skills (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, skill_id)
        )
    `;

    console.log("✅ [AUTH SERVICE] Database initialized successfully");
  } catch (error) {
    console.error("❌ [AUTH SERVICE] Error initializing database:", error);
  }
}

const PORT = process.env.PORT;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[AUTH SERVICE] is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ [AUTH SERVICE] Error initializing database:", error);
  });
