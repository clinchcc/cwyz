import { getDb } from "@/drizzle/db";
import { apps, terms } from "@/drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// 缓存配置
const CACHE_DURATION = 24 * 60 * 60 * 1000 * 3; // 3天
const PAGE_SIZE = 20; // 每页显示的数量

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// 定义数据库返回类型
interface Term {
  term_id: number;  // 修改为 number，与数据库类型匹配
  name: string;
  slug: string;
  term_group: number;
}

interface App {
  appid: number;  // 修改为 number
  title: string;
  content: string;
  date: Date;
  download_url: string | null;
  category: number;
}

// 缓存实例
const termCache = new Map<string, CacheItem<Term>>();
const appsCache = new Map<string, CacheItem<{
  apps: FormattedApp[];
  total: number;
  totalPages: number;
  currentPage: number;
}>>();

// 定义返回类型接口
interface FormattedApp {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url: string | null;
  category: number;
}

// Define the interface for the apps data structure
interface AppsData {
  apps: FormattedApp[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const db = await getDb();

    // 当 slug 为 "all" 时，返回所有软件列表（用于 /category 路径）
    if (params.slug === "all") {
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(apps);

      const total = countResult.count;

      const appsList = await db.select({
        appid: apps.appid,
        title: apps.title,
        content: apps.content,
        date: apps.date,
        download_url: apps.download_url,
        category: apps.category,
      })
      .from(apps)
      .orderBy(desc(apps.date))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

      const formattedApps = appsList.map(app => ({
        appid: app.appid.toString(),
        title: app.title,
        content: app.content,
        date: app.date.toISOString(),
        download_url: app.download_url,
        category: app.category,
      }));

      return NextResponse.json({
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: "全部软件", slug: "all" }
      });
    }

    // 当 slug 为 "0" 时，返回最新软件列表
    if (params.slug === "0") {
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(apps);

      const total = countResult.count;

      const appsList = await db.select({
        appid: apps.appid,
        title: apps.title,
        content: apps.content,
        date: apps.date,
        download_url: apps.download_url,
        category: apps.category,
      })
      .from(apps)
      .orderBy(desc(apps.date))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

      const formattedApps = appsList.map(app => ({
        appid: app.appid.toString(),
        title: app.title,
        content: app.content,
        date: app.date.toISOString(),
        download_url: app.download_url,
        category: app.category,
      }));

      return NextResponse.json({
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: "最新软件", slug: "0" }
      });
    }

    // 原有的分类查询逻辑
    const term = await db.select()
      .from(terms)
      .where(eq(terms.slug, params.slug))
      .limit(1)
      .then(rows => rows[0]);

    if (!term) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 获取应用列表
    const appsCacheKey = `${term.term_id.toString()}-${page}`;
    const cachedApps = appsCache.get(appsCacheKey);

    let appsData: AppsData;
    if (cachedApps && Date.now() - cachedApps.timestamp < CACHE_DURATION) {
      appsData = cachedApps.data;
    } else {
      // 使用 sql 计数
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(apps)
      .where(eq(apps.category, term.term_id));

      const total = countResult.count;

      const appsList = await db.select()
        .from(apps)
        .where(eq(apps.category, term.term_id))
        .orderBy(desc(apps.date))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE);

      const formattedApps: FormattedApp[] = appsList.map((app) => ({
        appid: app.appid.toString(),
        title: app.title,
        content: app.content,
        date: app.date.toISOString(),
        download_url: app.download_url,
        category: app.category,
      }));

      appsData = {
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
      };

      appsCache.set(appsCacheKey, {
        data: appsData,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({
      term,
      ...appsData,
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { 
        error: "Server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 