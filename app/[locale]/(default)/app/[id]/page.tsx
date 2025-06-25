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
      <div className="mb-8">
        <form
          action={params.locale === "en" ? "/search" : `/${params.locale}/search`}
          method="GET"
          className="flex gap-2 max-w-xl mx-auto"
        >
          <Input
            name="keyword"
            placeholder={params.locale === "en" ? "Search apps..." : "搜索应用..."}
            className="flex-1"
            required
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            {params.locale === "en" ? "Search" : "搜索"}
          </Button>
        </form>
      </div>

      {/* 页面头部 */}
      <div className="mb-8">
        <div className="flex gap-6">
          <div className="flex-none">
            {app.logo && (
              <img
                src={app.logo}
                alt={app.title}
                className="w-24 h-24 rounded-lg shadow-md object-cover"
                loading="lazy"
              />
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-3">{app.title}</h1>

            {app.intro && <p className="text-lg text-muted-foreground mb-4">{app.intro}</p>}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <time dateTime={app.date} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {new Date(app.date).toLocaleDateString()}
              </time>

              {category && (
                <Link
                  href={`${params.locale === "zh" ? "/zh" : ""}/category/${category.slug}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="h-1 w-1 rounded-full bg-green-500" />
                  {category.name}
                </Link>
              )}

              {app.author && (
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  {app.author}
                </span>
              )}

              {app.website && (
                <a
                  href={app.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                  {params.locale === "en" ? "Official Website" : "官方网站"}
                </a>
              )}

              {tags &&
                tags.length > 0 &&
                tags.map((tag) => (
                  <Link
                    key={`tag-${tag.id}`}
                    href={params.locale === "en" ? `/tag/${tag.id}` : `/${params.locale}/tag/${tag.id}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <span className="h-1 w-1 rounded-full bg-orange-500" />
                    {params.locale === "en" ? tag.enname : tag.name}
                  </Link>
                ))}
            </div>

            {app.appid && (
              <div className="mt-6">
                <DownloadButton appId={params.id} locale={params.locale} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 内容区 */}
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

          {screenshots.length > 0 && (
            <div className="border-t bg-[#F8FAFC]">
              <h2 className="text-2xl font-bold p-8 pb-4">
                {params.locale === "en" ? "Screenshots" : "应用截图"}
              </h2>
              <div className="relative">
                <div className="overflow-x-auto pb-4 px-8">
                  <div className="flex gap-4 min-w-0">
                    {screenshots.map((screenshot) => (
                      <div
                        key={screenshot}
                        className="relative group flex-none w-[300px]"
                      >
                        <img
                          src={screenshot}
                          alt={`${app.title} screenshot`}
                          className="rounded-lg shadow-lg w-full h-auto hover:opacity-95 transition-opacity"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm">
                            {params.locale === "en" ? "Click to view full size" : "点击查看原图"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {screenshots.length > 2 && (
                  <>
                    <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#F8FAFC] to-transparent pointer-events-none" />
                    <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#F8FAFC] to-transparent pointer-events-none" />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
