import { getDb } from "@/drizzle/db";
import { apps, appsen, appTags, tags } from "@/drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";


// /api/app/tag/123?refresh=true 刷新缓存
const PAGE_SIZE = 20; // 默认每页显示数量
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days cache

interface TagApp {
  appid: number;
  title: string;
  content: string;
  // download_url: string | null;
  category: number;
  date: Date;
  tag_name: string;
}

interface TagResponse {
  data: TagApp[];
  tag: {
    id: number;
    name: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Cache for tag results
const tagCache = new Map<string, { data: TagResponse; timestamp: number }>();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = new URLSearchParams(request.url.split('?')[1] || '');
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pagesize")) || PAGE_SIZE;
    const locale = searchParams.get("locale");
    const refresh = searchParams.get("refresh") === "true";
    const skip = (page - 1) * pageSize;

    const cacheKey = `tag-${params.id}-${locale || 'en'}-${page}-${pageSize}`;

    if (!refresh) {
      const cachedData = tagCache.get(cacheKey);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        return NextResponse.json(cachedData.data);
      }
    }

    const db = await getDb();
    const targetTable = locale === 'zh' ? appsen : apps;

    // 1. 获取标签信息
    const tagInfo = await db
      .select()
      .from(tags)
      .where(eq(tags.id, Number.parseInt(params.id)))
      .limit(1);

    if (!tagInfo.length) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // 2. 获取带分页的应用列表
    const appsWithTags = await db
      .select({
        app: targetTable,
        tag_name: locale === 'en' ? tags.enname : tags.name,
      })
      .from(appTags)
      .innerJoin(targetTable, eq(appTags.app_id, targetTable.appid))
      .innerJoin(tags, eq(appTags.tag_id, tags.id))
      .where(eq(appTags.tag_id, Number.parseInt(params.id)))
      .orderBy(desc(targetTable.appid))
      .limit(pageSize)
      .offset(skip);

    // 3. 获取总记录数
    const [totalCount] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(appTags)
      .where(eq(appTags.tag_id, Number.parseInt(params.id)));

    const total = totalCount.count;
    const totalPages = Math.ceil(total / pageSize);

    // 4. 格式化返回数据
    const formattedApps = appsWithTags.map(item => ({
      ...item.app,
      tag_name: item.tag_name,
    }));

    const responseData = {
      data: formattedApps,
      total: total,
      tag: {
        id: tagInfo[0].id,
        name: tagInfo[0].name,
        enname: tagInfo[0].enname
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      }
    };

    // Update cache
    tagCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add dynamic configuration
export const dynamic = 'force-dynamic';