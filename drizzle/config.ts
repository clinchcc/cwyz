import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
 
config({ path: ".env" });
config({ path: ".env.development" });
config({ path: ".env.local" });
 
export default defineConfig({
  out: "./drizzle/mysql/migration",
  schema: "./drizzle/mysql/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: process.env.MYSQL_URL!,
  },
});