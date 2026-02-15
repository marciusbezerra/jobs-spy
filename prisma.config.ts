import "dotenv/config";

// Prisma expects a `prisma.config.ts` exporting a default config
// that supplies the connection URL for migrations.
// This file uses `DATABASE_URL` from the project's .env.

const config = {
  datasource: {
    db: {
      url: process.env.DATABASE_URL || "",
      shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL || "",
    },
  },
};

export default config;
