import { cache } from "react";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/drizzle/mysql/db";
import { apps, appsen } from "@/drizzle/mysql/schema";

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

export const getApps = cache(async (
  locale = 'zh',
  page?: number,
  pageSize = 20
): Promise<{ data: App[], total: number }> => {
  try {
    const db = await getDb();
    const table = locale === 'en' ? appsen : apps;
    
    // 获取总记录数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(table);
    const total = Number(totalResult[0].count);

    // 构建基础查询
    const baseQuery = db
      .select()
      .from(table)
      .orderBy(desc(table.date));

    // 执行查询
    const result = await (page 
      ? baseQuery.limit(pageSize).offset((page - 1) * pageSize)
      : baseQuery.limit(pageSize));

    return {
      data: result.map(app => ({
        ...app,
        date: new Date(app.date),
      })),
      total
    };
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    return { data: [], total: 0 };
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