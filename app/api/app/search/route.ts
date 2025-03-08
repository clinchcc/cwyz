import { getDb } from "@/drizzle/db";
import { apps, appsen } from "@/drizzle/schema";
import { desc, or, like, and, sql, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { MySql2Database } from "drizzle-orm/mysql2";

// Define types for our app data
interface App {
  appid: number;
  title: string;
  content: string;
  date: Date;
  logo: string | null;
  intro: string | null;
  // download_url: string | null;
  category: number;
  status: number;
}

interface FormattedApp {
  appid: string;
  title: string;
  content: string;
  date: string;
  logo: string | null;
  intro: string | null;
  // download_url: string | null;
  category: number;
}

// Define the response data structure
interface SearchResponseData {
  apps: FormattedApp[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Cache configuration
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const PAGE_SIZE = 20; // Default page size

// Cache for search results with proper typing
const searchCache = new Map<string, { data: SearchResponseData; timestamp: number }>();

// 添加配置，告诉 Next.js 这是一个动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 使用 URL 构造函数解析请求 URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const keyword = searchParams.get("keyword") || "";
    const locale = searchParams.get("locale");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || PAGE_SIZE;
    
    // Return early if no keyword provided
    if (!keyword.trim()) {
      return NextResponse.json({
        apps: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      });
    }
    
    // Create cache key
    const cacheKey = `search-${keyword}-${locale || 'en'}-${page}-${limit}`;
    
    // Check cache
    const cachedData = searchCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }
    
    const db = await getDb();
    const targetTable = locale === 'zh' ? appsen : apps;
    
    // 优化: 先只搜索标题
    let appsList = await searchTitleOnly(db, targetTable, keyword, page, limit);
    let total = await countTitleOnlyResults(db, targetTable, keyword);
    
    // 如果标题搜索没有结果，再搜索内容
    if (appsList.length === 0) {
      appsList = await searchContent(db, targetTable, keyword, page, limit);
      total = await countContentResults(db, targetTable, keyword);
    }
    
    // 如果仍然没有结果，尝试标题分词搜索（不搜索内容）
    if (appsList.length === 0 && keyword.includes(' ')) {
      const keywordParts = keyword.split(' ').filter(part => part.trim().length > 0);
      
      if (keywordParts.length > 1) {
        appsList = await searchTitleWithKeywordParts(db, targetTable, keywordParts, page, limit);
        total = await countTitleResultsWithParts(db, targetTable, keywordParts);
      }
    }
    
    // Format the results
    const formattedApps: FormattedApp[] = appsList.map(app => ({
      appid: app.appid.toString(),
      title: app.title,
      content: app.content,
      logo: app.logo,
      intro: app.intro,
      date: app.date.toISOString(),
      // download_url: app.download_url,
      category: app.category,
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    const responseData = {
      apps: formattedApps,
      total,
      totalPages,
      currentPage: page,
    };
    
    // Update cache
    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Failed to search apps" },
      { status: 500 }
    );
  }
}

// Helper function to search only in title
async function searchTitleOnly(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keyword: string, 
  page: number, 
  limit: number
): Promise<App[]> {
  const offset = (page - 1) * limit;
  
  return db.select()
    .from(table)
    .where(
      and(
        like(table.title, `%${keyword}%`),
        eq(table.status, 1) // Only return approved apps
      )
    )
    .orderBy(desc(table.date))
    .limit(limit)
    .offset(offset) as Promise<App[]>;
}

// Helper function to count results with title only
async function countTitleOnlyResults(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keyword: string
): Promise<number> {
  const [result] = await db.select({
    count: sql<number>`count(*)`.mapWith(Number)
  })
  .from(table)
  .where(
    and(
      like(table.title, `%${keyword}%`),
      eq(table.status, 1) // Only count approved apps
    )
  );
  
  return result.count;
}

// Helper function to search in content
async function searchContent(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keyword: string, 
  page: number, 
  limit: number
): Promise<App[]> {
  const offset = (page - 1) * limit;
  
  return db.select()
    .from(table)
    .where(
      and(
        like(table.content, `%${keyword}%`),
        eq(table.status, 1) // Only return approved apps
      )
    )
    .orderBy(desc(table.date))
    .limit(limit)
    .offset(offset) as Promise<App[]>;
}

// Helper function to count results in content
async function countContentResults(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keyword: string
): Promise<number> {
  const [result] = await db.select({
    count: sql<number>`count(*)`.mapWith(Number)
  })
  .from(table)
  .where(
    and(
      like(table.content, `%${keyword}%`),
      eq(table.status, 1) // Only count approved apps
    )
  );
  
  return result.count;
}

// Helper function to search with multiple keyword parts in title
async function searchTitleWithKeywordParts(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keywordParts: string[], 
  page: number, 
  limit: number
): Promise<App[]> {
  const offset = (page - 1) * limit;
  const conditions = keywordParts.map(part => 
    like(table.title, `%${part}%`)
  );
  
  return db.select()
    .from(table)
    .where(
      and(
        or(...conditions),
        eq(table.status, 1) // Only return approved apps
      )
    )
    .orderBy(desc(table.date))
    .limit(limit)
    .offset(offset) as Promise<App[]>;
}

// Helper function to count results with multiple keyword parts in title
async function countTitleResultsWithParts(
  db: MySql2Database, 
  table: typeof apps | typeof appsen, 
  keywordParts: string[]
): Promise<number> {
  const conditions = keywordParts.map(part => 
    like(table.title, `%${part}%`)
  );
  
  const [result] = await db.select({
    count: sql<number>`count(*)`.mapWith(Number)
  })
  .from(table)
  .where(
    and(
      or(...conditions),
      eq(table.status, 1) // Only count approved apps
    )
  );
  
  return result.count;
}
