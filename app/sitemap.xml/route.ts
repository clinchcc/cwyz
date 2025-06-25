import { getDb } from "@/drizzle/db";
import { apps, appsen } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

const LIMIT = 25000;

function createUrlElement(loc: string, lastmod: string, changefreq: string, priority: string) {
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
  try {
    const db = await getDb();
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'localhost:3000';
    const currentDate = new Date().toISOString();

    // 获取英文应用
    const enApps = await db
      .select({
        appid: apps.appid,
        date: apps.date,
      })
      .from(apps)
      .where(eq(apps.status, 1))
      .orderBy(desc(apps.date))
      .limit(LIMIT);

    // 获取中文应用
    const zhApps = await db
      .select({
        appid: appsen.appid,
        date: appsen.date,
      })
      .from(appsen)
      .where(eq(appsen.status, 1))
      .orderBy(desc(appsen.date))
      .limit(LIMIT);

    const urls = [
      createUrlElement(baseUrl, currentDate, 'daily', '1.0'),
      createUrlElement(`${baseUrl}/zh`, currentDate, 'daily', '1.0'),
      createUrlElement(`${baseUrl}/category`, currentDate, 'daily', '0.9'),
      createUrlElement(`${baseUrl}/zh/category`, currentDate, 'daily', '0.9'),
      ...enApps.map(app => createUrlElement(
        `${baseUrl}/app/${app.appid}`,
        app.date.toISOString(),
        'monthly',
        '0.8'
      )),
      ...zhApps.map(app => createUrlElement(
        `${baseUrl}/zh/app/${app.appid}`,
        app.date.toISOString(),
        'monthly',
        '0.8'
      ))
    ].join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}

export const revalidate = 3600; 