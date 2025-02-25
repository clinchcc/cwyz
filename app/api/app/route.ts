import { getDb } from "@/drizzle/db";
import { apps, appsen } from "@/drizzle/schema";
import { eq, or, like, and,  sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

// 验证请求数据的 Schema
const appSchema = z.object({
	title: z.string().min(1),
	content: z.string(),
	category: z.number(),
	download_url: z.string().url(),
	date: z.date().default(() => new Date()),
});

// GET - 获取应用列表
export async function GET(request: Request) {
	try {
		const db = await getDb();
		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const category = searchParams.get("category");
		const locale = searchParams.get("locale");
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const pageSize = Number.parseInt(
			searchParams.get("pagesize") || "20",
			10,
		);
		const skip = (page - 1) * pageSize;

		const targetTable = locale === 'en' ? appsen : apps;

		const conditions: SQL[] = [];
		
		if (search) {
			conditions.push(
				sql`${targetTable.title} LIKE ${`%${search}%`} OR ${targetTable.content} LIKE ${`%${search}%`}`
			);
		}
		
		if (category) {
			conditions.push(like(targetTable.category, category));
		}

		const appsList = await db
			.select()
			.from(targetTable)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.limit(pageSize)
			.offset(skip);

		const totalResult = await db.select().from(targetTable);
		const total = totalResult.length;
		const totalPages = Math.ceil(total / pageSize);

		return NextResponse.json({
			data: appsList,
			page,
			pageSize,
			total,
			totalPages,
		});
	} catch (error) {
		console.error("❌ API Error:", error);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}

// POST - 创建新应用
export async function POST(request: Request) {
	try {
		const db = await getDb();
		const data = await request.json();
		const locale = data.locale;
		
		// Convert category to number if it's coming as string
		const parsedData = {
			...data,
				category: typeof data.category === 'string' ? Number.parseInt(data.category, 10) : data.category
		};
		
		// Validate the data
		const validatedData = appSchema.parse(parsedData);

		const targetTable = locale === 'en' ? appsen : apps;

		const newApp = await db.insert(targetTable).values({
			title: validatedData.title,
			content: validatedData.content,
			category: validatedData.category,
			download_url: validatedData.download_url,
			date: new Date(),
		});

		return NextResponse.json({ data: newApp });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		console.error("API Error:", error);
		return NextResponse.json({ error: "Failed to create app" }, { status: 500 });
	}
}

// PUT - 更新应用
export async function PUT(request: Request) {
	try {
		const db = await getDb();
		const data = await request.json();
		const { id, locale, ...updateData } = data;

		if (!id) {
			return NextResponse.json({ error: "App ID is required" }, { status: 400 });
		}

		const validatedData = appSchema.partial().parse(updateData);
		
		// Convert date string to Date object if it exists
		const processedData = {
			...validatedData,
			...(validatedData.date && { date: new Date(validatedData.date) })
		};

		const targetTable = locale === 'en' ? appsen : apps;

		await db
			.update(targetTable)
			.set(processedData)
			.where(eq(targetTable.appid, id));

		// 获取更新后的数据
		const updatedApp = await db
			.select()
			.from(targetTable)
			.where(eq(targetTable.appid, id))
			.limit(1);

		return NextResponse.json({ data: updatedApp[0] });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		console.error("API Error:", error);
		return NextResponse.json({ error: "Failed to update app" }, { status: 500 });
	}
}
