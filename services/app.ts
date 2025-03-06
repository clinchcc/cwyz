import { getDb } from "@/drizzle/db";
import { apps } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function getAppDownloadUrl(appId: string): Promise<string | null> {
  try {
    // console.log('getAppDownloadUrl called with appId:', appId); // 调试日志
    
    const db = await getDb();
    const data = await db
      .select()
      .from(apps)
      .where(eq(apps.appid, Number.parseInt(appId)))
      .limit(1);

    // console.log('Database query result:', data); // 调试日志

    return data.length > 0 ? data[0].download_url : null;
  } catch (error) {
    console.error('Error getting app download URL:', error);
    return null;
  }
} 