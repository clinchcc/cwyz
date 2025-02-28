import { getDb } from "@/drizzle/db";
import { appTags, tags } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

//GET /api/app/tag/show?appid=2774
export const dynamic = 'force-dynamic';
// Cache configuration
const CACHE_DURATION = 70 * 24 * 60 * 60 * 1000; // 70 days

interface TagInfo {
  id: number;
  name: string;
  enname: string;
}

interface TagsResponse {
  data: TagInfo[];
}

const tagsCache = new Map<string, { data: TagsResponse; timestamp: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appid");

    if (!appId) {
      return NextResponse.json(
        { error: "App ID is required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `app-tags-${appId}`;
    const cachedData = tagsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData.data);
    }

    const db = await getDb();

    // Add explicit type annotation for tagResults
    const tagResults: TagInfo[] = await db
      .select({
        id: tags.id,
        name: tags.name,
        enname: tags.enname,
      })
      .from(tags)
      .innerJoin(appTags, eq(appTags.tag_id, tags.id))
      .where(eq(appTags.app_id, Number.parseInt(appId)));

    const responseData = {
      data: tagResults
    };

    // Update cache
    tagsCache.set(cacheKey, {
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
