import { getDb } from "@/drizzle/db";
import { tags } from "@/drizzle/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const PAGE_SIZE = 20; // 默认每页显示数量
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days cache

interface TagItem {
  id: number;
  name: string;
  enname: string;
}

interface TagListResponse {
  data: TagItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Cache for tag list results
const tagListCache = new Map<string, { data: TagListResponse; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const searchParams = new URLSearchParams(request.url.split('?')[1] || '');
    const page = Number(searchParams.get("page")) || 1;
    const pageSize = Number(searchParams.get("pagesize")) || PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    // Create cache key
    const cacheKey = `tag-list-${page}-${pageSize}`;

    // Check cache
    const cachedData = tagListCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    const db = await getDb();

    // Get tags with pagination
    const tagsList = await db
      .select({
        id: tags.id,
        name: tags.name,
        enname: tags.enname,
      })
      .from(tags)
      .orderBy(sql`${tags.id} DESC`)
      .limit(pageSize)
      .offset(skip);

    // Get total count
    const [totalCount] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(tags);

    const total = totalCount.count;
    const totalPages = Math.ceil(total / pageSize);

    const responseData = {
      data: tagsList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      }
    };

    // Update cache
    tagListCache.set(cacheKey, {
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
