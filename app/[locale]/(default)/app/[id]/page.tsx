import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { cache } from "react";
import DownloadButton from "@/app/components/download-button";
import Markdown from "@/components/markdown";

// 处理 HTML 内容中的图片和注释
function processContent(content: string) {
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtml) {
    const withoutComments = content.replace(/<!--[\s\S]*?-->/g, "");
    return withoutComments.replace(
      /<img([^>]*)>/g,
      '<img$1 loading="lazy" decoding="async" referrerpolicy="no-referrer">'
    );
  }
  return content;
}

interface CategoryMap {
  [key: string]: { name: string; slug: string };
}

async function getApp(id: string, locale: string) {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = headersList.get("host");
    const url = new URL(`${protocol}://${host}/api/app/${id}`);
    if (locale === "zh") {
      url.searchParams.set("locale", "zh");
    }
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

const ZH_CATEGORY_MAP = {
  1: { name: "连接", slug: "connectivity" },
  2: { name: "开发", slug: "development" },
  3: { name: "游戏", slug: "games" },
  4: { name: "图形", slug: "graphics" },
  5: { name: "网络", slug: "internet" },
  6: { name: "理财", slug: "money" },
  7: { name: "多媒体", slug: "multimedia" },
  8: { name: "导航", slug: "navigation" },
  9: { name: "电话短信", slug: "phone-sms" },
  10: { name: "阅读", slug: "reading" },
  11: { name: "科学教育", slug: "science-education" },
  12: { name: "安全", slug: "security" },
  13: { name: "运动健康", slug: "sports-health" },
  14: { name: "系统", slug: "system" },
  15: { name: "主题", slug: "theming" },
  16: { name: "时间", slug: "time" },
  17: { name: "写作", slug: "writing" },
  18: { name: "APP", slug: "app" },
} as const;

const EN_CATEGORY_MAP = {
  1: { name: "Connectivity", slug: "connectivity" },
  2: { name: "Development", slug: "development" },
  3: { name: "Games", slug: "games" },
  4: { name: "Graphics", slug: "graphics" },
  5: { name: "Internet", slug: "internet" },
  6: { name: "Money", slug: "money" },
  7: { name: "Multimedia", slug: "multimedia" },
  8: { name: "Navigation", slug: "navigation" },
  9: { name: "Phone & SMS", slug: "phone-sms" },
  10: { name: "Reading", slug: "reading" },
  11: { name: "Science & Education", slug: "science-education" },
  12: { name: "Security", slug: "security" },
  13: { name: "Sports & Health", slug: "sports-health" },
  14: { name: "System", slug: "system" },
  15: { name: "Theming", slug: "theming" },
  16: { name: "Time", slug: "time" },
  17: { name: "Writing", slug: "writing" },
  18: { name: "App", slug: "app" },
} as const;

const getCategory = cache(async (categoryId: number, locale: string) => {
  const CATEGORY_MAP: CategoryMap = locale === "en" ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP;
  return CATEGORY_MAP[categoryId.toString()] || null;
});

const getAppTags = cache(async (appId: string, locale: string): Promise<Tag[] | null> => {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const host = headersList.get("host");
    const url = new URL(`${protocol}://${host}/api/app/tag/show`);
    url.searchParams.set("appid", appId);
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
});

interface App {
  appid: string;
  title: string;
  intro?: string;
  content: string;
  date: string;
  author?: string;
  website?: string;
  logo?: string;
  screenshot?: string;
  category: number;
}

interface Tag {
  id: number;
  name: string;
  enname: string;
}

export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  const app = await getApp(params.id, params.locale);
  if (!app) {
    return {
      title: "软件不存在",
      description: "请求的软件不存在或已被删除。",
    };
  }
  const headersList = headers();
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = headersList.get("host");
  const canonicalUrl = `${protocol}://${host}${params.locale === "zh" ? "/zh" : ""}/app/${params.id}`;
  return {
    title: app.intro ? `${app.title} - ${app.intro}` : app.title,
    description: `${app.title} : ${app.intro} ; ${app.content.slice(0, 200)}`,
    alternates: { canonical: canonicalUrl },
  };
}

function processScreenshots(screenshot: string | undefined): string[] {
  if (!screenshot) return [];
  return screenshot.split("@@").filter((url) => url.trim());
}

export default async function AppPage({ params }: { params: { id: string; locale: string } }) {
  const app = await getApp(params.id, params.locale);
  const category = app?.category ? await getCategory(app.category, params.locale) : null;
  const tags: Tag[] | null = await getAppTags(params.id, params.locale);

  if (!app) notFound();

  const screenshots = processScreenshots(app.screenshot);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 搜索栏 */}
      {/* ...你原本的搜索表单区域不变... */}

      {/* 页面头部 */}
      {/* ...你原本的 App Header 区域不变... */}

      {/* 描述区 */}
      <div className="prose prose-lg dark:prose-invert mx-auto mb-12">
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {params.locale === "en" ? "Description" : "应用介绍"}
            </h2>
            {/<[a-z][\s\S]*>/i.test(app.content) ? (
              <div dangerouslySetInnerHTML={{ __html: processContent(app.content) }} />
            ) : (
              <Markdown content={app.content} />
            )}

            {/* ✅ Google 广告位 */}
            <div className="my-6">
              <ins
                className="adsbygoogle"
                style={{ display: "block", textAlign: "center" }}
                data-ad-layout="in-article"
                data-ad-format="fluid"
                data-ad-client="ca-pub-8675172969605348"
                data-ad-slot="6552032065"
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    (adsbygoogle = window.adsbygoogle || []).push({});
                  `,
                }}
              />
            </div>
          </div>

          {/* 截图区域 */}
          {screenshots.length > 0 && (
            <div className="border-t bg-[#F8FAFC]">
              {/* ...截图渲染逻辑保留原样... */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
