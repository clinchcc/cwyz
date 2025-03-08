import { getDb } from "@/drizzle/db";
import { apps, appsen, appTags, tags } from "@/drizzle/schema";
import { desc, eq, sql, and } from "drizzle-orm";
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
  1:  { term_id: 1,  name: "连接",    slug: "connectivity" },
  2:  { term_id: 2,  name: "开发",    slug: "development" },
  3:  { term_id: 3,  name: "游戏",    slug: "games" },
  4:  { term_id: 4,  name: "图形",    slug: "graphics" },
  5:  { term_id: 5,  name: "网络",    slug: "internet" },
  6:  { term_id: 6,  name: "理财",    slug: "money" },
  7:  { term_id: 7,  name: "多媒体",   slug: "multimedia" },
  8:  { term_id: 8,  name: "导航",    slug: "navigation" },
  9:  { term_id: 9,  name: "电话短信", slug: "phone-sms" },
  10: { term_id: 10, name: "阅读",    slug: "reading" },
  11: { term_id: 11, name: "科学教育", slug: "science-education" },
  12: { term_id: 12, name: "安全",    slug: "security" },
  13: { term_id: 13, name: "运动健康", slug: "sports-health" },
  14: { term_id: 14, name: "系统",    slug: "system" },
  15: { term_id: 15, name: "主题",    slug: "theming" },
  16: { term_id: 16, name: "时间",    slug: "time" },
  17: { term_id: 17, name: "写作",    slug: "writing" },
  18: { term_id: 18, name: "默认",    slug: "default" },
} as const;

// 英文分类映射
const EN_CATEGORY_MAP = {
  1:  { term_id: 1,  name: "Connectivity",       slug: "connectivity" },
  2:  { term_id: 2,  name: "Development",        slug: "development" },
  3:  { term_id: 3,  name: "Games",              slug: "games" },
  4:  { term_id: 4,  name: "Graphics",           slug: "graphics" },
  5:  { term_id: 5,  name: "Internet",           slug: "internet" },
  6:  { term_id: 6,  name: "Money",              slug: "money" },
  7:  { term_id: 7,  name: "Multimedia",         slug: "multimedia" },
  8:  { term_id: 8,  name: "Navigation",         slug: "navigation" },
  9:  { term_id: 9,  name: "Phone & SMS",        slug: "phone-sms" },
  10: { term_id: 10, name: "Reading",            slug: "reading" },
  11: { term_id: 11, name: "Science & Education",slug: "science-education" },
  12: { term_id: 12, name: "Security",           slug: "security" },
  13: { term_id: 13, name: "Sports & Health",    slug: "sports-health" },
  14: { term_id: 14, name: "System",             slug: "system" },
  15: { term_id: 15, name: "Theming",            slug: "theming" },
  16: { term_id: 16, name: "Time",               slug: "time" },
  17: { term_id: 17, name: "Writing",            slug: "writing" },
  18: { term_id: 18, name: "Default",            slug: "default" },
} as const;

// 修改 appsCache 的 key 生成方式,加入 locale 参数
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
  // download_url: string | null;
  logo: string | null;
  intro: string | null;
  tags: string[];
  category: number;
}

// Define the interface for the apps data structure
interface AppsData {
  apps: FormattedApp[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// 添加查询结果的接口定义
interface AppQueryResult {
  appid: number;
  title: string;
  content: string;
  date: Date;
  // download_url: string | null;
  logo: string | null;
  intro: string | null;
  category: number;
  tags: string[];
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
    
    const targetTable = locale === 'zh' ? appsen : apps;
    const CATEGORY_MAP = locale === 'zh' ? ZH_CATEGORY_MAP : EN_CATEGORY_MAP;

    // 修改缓存 key,加入 locale 参数
    const cacheKey = `apps-${params.slug}-${page}-${locale || 'en'}`;
    
    // 检查缓存
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
      .from(targetTable)
      .where(eq(targetTable.status, 1));

      const total = countResult.count;

      if (total === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            total: 0,
            pageSize: PAGE_SIZE,
            current: page,
            lastPage: 1,
          },
        });
      }

      const appsList = await db
        .select({
          appid: targetTable.appid,
          title: targetTable.title,
          content: targetTable.content,
          intro: targetTable.intro,
          logo: targetTable.logo,
          date: targetTable.date,
          // download_url: targetTable.download_url,
          category: targetTable.category,
          tags: sql<string[]>`
            COALESCE(
              GROUP_CONCAT(${locale === 'zh' ? tags.name : tags.enname}),
              ''
            )
          `.mapWith((value) => value ? value.split(',') : [])
        })
        .from(targetTable)
        .leftJoin(appTags, eq(appTags.app_id, targetTable.appid))
        .leftJoin(tags, eq(tags.id, appTags.tag_id))
        .where(eq(targetTable.status, 1)) // 只返回已审核的应用 (status = 1)
        .groupBy(targetTable.appid)
        .orderBy(desc(targetTable.date))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE);

      const formattedApps: FormattedApp[] = (appsList as AppQueryResult[]).map((app) => ({
        appid: app.appid.toString(),
        title: app.title,
        content: app.content,
        date: app.date.toISOString(),
        // download_url: app.download_url,
        logo: app.logo,
        intro: app.intro,
        category: app.category,
        tags: app.tags || [],
      }));

      const responseData = {
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: locale === 'zh' ? "全部软件" : "All Software", slug: "all" }
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
      .from(targetTable)
      .where(eq(targetTable.status, 1));

      const total = countResult.count;

      if (total === 0) {
        return NextResponse.json({
          data: [],
          pagination: {
            total: 0,
            pageSize: PAGE_SIZE,
            current: page,
            lastPage: 1,
          },
        });
      }

      const appsList = await db
        .select({
          appid: targetTable.appid,
          title: targetTable.title,
          content: targetTable.content,
          date: targetTable.date,
          category: targetTable.category,
          tags: sql<string[]>`
            COALESCE(
              GROUP_CONCAT(${locale === 'zh' ? tags.name : tags.enname}),
              ''
            )
          `.mapWith((value) => value ? value.split(',') : [])
        })
        .from(targetTable)
        .leftJoin(appTags, eq(appTags.app_id, targetTable.appid))
        .leftJoin(tags, eq(tags.id, appTags.tag_id))
        .where(eq(targetTable.status, 1)) // 只返回已审核的应用 (status = 1)
        .groupBy(targetTable.appid)
        .orderBy(desc(targetTable.date))
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE);

      const formattedApps: FormattedApp[] = (appsList as AppQueryResult[]).map((app) => ({
        appid: app.appid.toString(),
        title: app.title,
        content: app.content,
        date: app.date.toISOString(),
        // download_url: app.download_url,
        logo: app.logo,
        intro: app.intro,
        category: app.category,
        tags: app.tags || [], // 确保即使没有标签也返回空数组
      }));

      const responseData = {
        apps: formattedApps,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
        currentPage: page,
        term: { name: locale === 'zh' ? "最新软件" : "Latest Software", slug: "0" }
      };

      // 更新缓存
      appsCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json(responseData);
    }

    // 对于特定分类，修改计数逻辑
    const [countResult] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(targetTable)
      .where(
        and(
          term ? eq(targetTable.category, term.term_id) : undefined,
          eq(targetTable.status, 1)
        )
      );

    const total = countResult.count;

    if (total === 0) {
      return NextResponse.json({
        data: [],
        pagination: {
          total: 0,
          pageSize: PAGE_SIZE,
          current: page,
          lastPage: 1,
        },
      });
    }

    const appsList = await db
      .select({
        appid: targetTable.appid,
        title: targetTable.title,
        content: targetTable.content,
        intro: targetTable.intro,
        logo: targetTable.logo,
        date: targetTable.date,
        category: targetTable.category,
        tags: sql<string[]>`
          COALESCE(
            GROUP_CONCAT(${locale === 'zh' ? tags.name : tags.enname}),
            ''
          )
        `.mapWith((value) => value ? value.split(',') : [])
      })
      .from(targetTable)
      .leftJoin(appTags, eq(appTags.app_id, targetTable.appid))
      .leftJoin(tags, eq(tags.id, appTags.tag_id))
      .where(eq(targetTable.status, 1)) // 只返回已审核的应用 (status = 1)
      .groupBy(targetTable.appid)
      .orderBy(desc(targetTable.date))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const formattedApps: FormattedApp[] = (appsList as AppQueryResult[]).map((app) => ({
      appid: app.appid.toString(),
      title: app.title,
      content: app.content,
      date: app.date.toISOString(),
      logo: app.logo,
      intro: app.intro,
      category: app.category,
      tags: app.tags || [],
    }));

    const responseData = {
      apps: formattedApps,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
      currentPage: page,
      term: term || {
        term_id: 0,
        name: locale === 'zh' ? '全部软件' : 'All Software',
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