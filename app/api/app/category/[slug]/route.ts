import { getDb } from "@/drizzle/db";
import { apps, appsen } from "@/drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// 缓存配置
const CACHE_DURATION = 24 * 60 * 60 * 1000 * 3; // 3天
const PAGE_SIZE = 20; // 每页显示的数量

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

// 中文分类映射
const ZH_CATEGORY_MAP = {
  1: { term_id: 1, name: "默认", slug: "uncategorized" },
  2: { term_id: 2, name: "装机", slug: "software" },
  3: { term_id: 3, name: "网络软件", slug: "net" },
  4: { term_id: 4, name: "媒体", slug: "video" },
  5: { term_id: 5, name: "编程软件", slug: "code" },
  6: { term_id: 6, name: "图像", slug: "pic" },
  7: { term_id: 7, name: "系统软件", slug: "sys" },
  8: { term_id: 8, name: "应用软件", slug: "tools" },
  9: { term_id: 9, name: "手机软件", slug: "mobile" },
  13: { term_id: 13, name: "资讯", slug: "info" },
  31: { term_id: 31, name: "游戏", slug: "game" },
  52: { term_id: 52, name: "AI", slug: "ai" }
} as const;

// 英文分类映射
const EN_CATEGORY_MAP = {
  1: { term_id: 1, name: "Uncategorized", slug: "uncategorized" },
  2: { term_id: 2, name: "Essential Software", slug: "software" },
  3: { term_id: 3, name: "Network Tools", slug: "net" },
  4: { term_id: 4, name: "Media", slug: "video" },
  5: { term_id: 5, name: "Programming", slug: "code" },
  6: { term_id: 6, name: "Graphics", slug: "pic" },
  7: { term_id: 7, name: "System Tools", slug: "sys" },
  8: { term_id: 8, name: "Applications", slug: "tools" },
  9: { term_id: 9, name: "Mobile Apps", slug: "mobile" },
  13: { term_id: 13, name: "News", slug: "info" },
  31: { term_id: 31, name: "Games", slug: "game" },
  52: { term_id: 52, name: "AI", slug: "ai" }
} as const;

// 只保留 appsCache
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
    const locale = searchParams.get("locale");
    const db = await getDb();
    
    const targetTable = locale === 'en' ? appsen : apps;
    const CATEGORY_MAP = locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP;

    // 修改缓存 key，确保包含 locale 信息
    const cacheKey = `category-${params.slug}-${page}-${locale || 'zh'}`;
    const cachedData = appsCache.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    // 查找对应的分类
    const term = Object.values(CATEGORY_MAP).find(term => term.slug === params.slug);

    if (!term && params.slug !== "all" && params.slug !== "0") {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 当 slug 为 "all" 时，返回所有软件列表
    if (params.slug === "all") {
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(targetTable);  // 使用目标表

      const total = countResult.count;

      const appsList = await db.select({
        appid: targetTable.appid,
        title: targetTable.title,
        content: targetTable.content,
        date: targetTable.date,
        download_url: targetTable.download_url,
        category: targetTable.category,
      })
      .from(targetTable)  // 使用目标表
      .orderBy(desc(targetTable.date))
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

      const responseData = {
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: locale === 'en' ? "All Software" : "全部软件", slug: "all" }
      };

      // 更新缓存
      appsCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);
    }

    // 当 slug 为 "0" 时，返回最新软件列表
    if (params.slug === "0") {
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(targetTable);  // 使用目标表

      const total = countResult.count;

      const appsList = await db.select({
        appid: targetTable.appid,
        title: targetTable.title,
        content: targetTable.content,
        date: targetTable.date,
        download_url: targetTable.download_url,
        category: targetTable.category,
      })
      .from(targetTable)  // 使用目标表
      .orderBy(desc(targetTable.date))
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

      const responseData = {
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: locale === 'en' ? "Latest Software" : "最新软件", slug: "0" }
      };

      // 更新缓存
      appsCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);
    }

    // 获取应用列表
    const appsCacheKey = `${term.term_id.toString()}-${page}-${locale || 'default'}`;  // 修改缓存key
    const cachedApps = appsCache.get(appsCacheKey);

    let appsData: AppsData;
    if (cachedApps && Date.now() - cachedApps.timestamp < CACHE_DURATION) {
      appsData = cachedApps.data;
    } else {
      const [countResult] = await db.select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(targetTable)  // 使用目标表
      .where(eq(targetTable.category, term.term_id));

      const total = countResult.count;

      const appsList = await db.select()
        .from(targetTable)  // 使用目标表
        .where(eq(targetTable.category, term.term_id))
        .orderBy(desc(targetTable.date))
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

    const responseData = {
      apps: appsData.apps,
      total: appsData.total,
      totalPages: appsData.totalPages,
      currentPage: appsData.currentPage,
      term: term || {
        term_id: 0,
        name: locale === 'en' ? 'All Software' : '全部软件',
        slug: 'all'
      }
    };

    // 更新缓存
    appsCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

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