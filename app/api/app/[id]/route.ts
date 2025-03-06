import { getDb } from "@/drizzle/db";
import { apps, appsen } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface CachedApp {
	appid: string;
	title: string;
	content: string;
	category: number;
	date: string;
	logo: string;
	author: string | null;
	website: string | null;
	intro: string | null;
	screenshot: string | null;
}

const cache = new Map<string, { data: CachedApp; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000 * 365; // 365天的缓存时间

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const { searchParams } = new URL(request.url);
		const forceRefresh = searchParams.get("refresh") === "true";
		const locale = searchParams.get("locale");

		const cacheKey = `app-${params.id}-${locale || 'en'}`;

		// 检查缓存
		if (!forceRefresh) {
			const cachedData = cache.get(cacheKey);
			if (
				cachedData &&
				Date.now() - cachedData.timestamp < CACHE_DURATION
			) {
				return NextResponse.json({ data: cachedData.data });
			}
		}

		// 如果不是强制刷新，设置较长的缓存时间（24小时）
		const headers = new Headers();
		if (!forceRefresh) {
			headers.set(
				"Cache-Control",
				"public, s-maxage=86400, stale-while-revalidate=43200"
			);
		} else {
			headers.set("Cache-Control", "no-cache");
		}

		const db = await getDb();
		const targetTable = locale === 'zh' ? appsen : apps;
		const data = await db
			.select({
				appid: targetTable.appid,
				title: targetTable.title,
				content: targetTable.content,
				date: targetTable.date,
				category: targetTable.category,
				author: targetTable.author,
				website: targetTable.website,
				logo: targetTable.logo,
				intro: targetTable.intro,
				screenshot: targetTable.screenshot,
			})
			.from(targetTable)
			.where(eq(targetTable.appid, Number.parseInt(params.id)))
			.limit(1);

		const app = data[0];
		if (!app) {
			return NextResponse.json(
				{ error: "App not found" },
				{ status: 404 }
			);
		}

		const formattedApp: CachedApp = {
			...app,
			appid: app.appid.toString(),
			date: app.date.toISOString(),
			logo: app.logo || '',
			intro: app.intro || null,
			screenshot: app.screenshot || null,
		};

		// 更新缓存
		cache.set(cacheKey, {
			data: formattedApp,
			timestamp: Date.now(),
		});
		

		return NextResponse.json({ data: formattedApp }, { headers });
	} catch (error) {
		console.error("❌ API Error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{
				error: "Server error",
				details: errorMessage,
				stack:
					process.env.NODE_ENV === "development"
						? (error as Error).stack
						: undefined,
			},
			{ status: 500 }
		);
	}
}
