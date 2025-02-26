import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/drizzle/mysql/db";
import { apps, appsen } from "@/drizzle/mysql/schema";
import { cache } from "react";

export interface App {
  appid: number;
  title: string;
  content: string;
  date: Date;
  download_url: string | null;
  category: number;
}

export const getApp = cache(async (id: number, locale = 'zh'): Promise<App | null> => {
  try {
    const db = await getDb();
    const table = locale === 'en' ? appsen : apps;
    const result = await db.select().from(table).where(eq(table.appid, id));
    
    if (!result.length) {
      return null;
    }

    return {
      ...result[0],
      date: new Date(result[0].date),
    };
  } catch (error) {
    console.error('Failed to fetch app:', error);
    return null;
  }
});

export const getApps = cache(async (locale = 'zh'): Promise<App[]> => {
  try {
    const db = await getDb();
    const table = locale === 'en' ? appsen : apps;
    const result = await db
      .select()
      .from(table)
      .orderBy(desc(table.date));

    return result.map(app => ({
      ...app,
      date: new Date(app.date),
    }));
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    return [];
  }
});

export const getAppsByCategory = cache(async (categoryId: number, locale = 'zh'): Promise<App[]> => {
  try {
    const db = await getDb();
    const table = locale === 'en' ? appsen : apps;
    const result = await db
      .select()
      .from(table)
      .where(eq(table.category, categoryId))
      .orderBy(desc(table.date));

    return result.map(app => ({
      ...app,
      date: new Date(app.date),
    }));
  } catch (error) {
    console.error('Failed to fetch apps by category:', error);
    return [];
  }
});

export async function updateApp(
  appid: number,
  updateData: Partial<typeof apps.$inferInsert>,
  locale = 'zh'
) {
  try {
    const db = await getDb();
    const table = locale === 'en' ? appsen : apps;
    
    await db
      .update(table)
      .set(updateData)
      .where(eq(table.appid, appid));

    return updateData;
  } catch (error) {
    console.error('Failed to update app:', error);
    throw error;
  }
} 