import { apps } from "@/drizzle/schema";

export type Apps = typeof apps.$inferInsert;
