import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from 'next/headers';
import Link from "next/link";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cache } from 'react';
import DownloadButton from '@/app/components/download-button';



// 处理 HTML 内容中的图片和注释
function processContent(html: string) {
  // 移除 HTML 注释
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");

  // 处理图片标签，添加安全属性
  const withProcessedImages = withoutComments.replace(
    /<img([^>]*)>/g,
    '<img$1 loading="lazy" decoding="async" referrerpolicy="no-referrer">'
  );

  return withProcessedImages;
}

// 定义分类映射的接口
interface CategoryMap {
  [key: string]: { name: string; slug: string };
}

// 不使用 cache 包装的 getApp 函数
async function getApp(id: string, locale: string) {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    // 构建 URL，如果是英文则添加 locale 参数
    const url = new URL(`${protocol}://${host}/api/app/${id}`);
    if (locale === 'zh') {
      url.searchParams.set('locale', 'zh');
    }
    
    const response = await fetch(url);

    if (!response.ok) {
      // console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // console.error("Failed to fetch app:", error);
    return null;
  }
}

// 中文分类映射
// 中文分类映射
const ZH_CATEGORY_MAP = {
  1:  { name: "连接",    slug: "connectivity" },
  2:  { name: "开发",    slug: "development" },
  3:  { name: "游戏",    slug: "games" },
  4:  { name: "图形",    slug: "graphics" },
  5:  { name: "网络",    slug: "internet" },
  6:  { name: "理财",    slug: "money" },
  7:  { name: "多媒体",   slug: "multimedia" },
  8:  { name: "导航",    slug: "navigation" },
  9:  { name: "电话短信", slug: "phone-sms" },
  10: { name: "阅读",    slug: "reading" },
  11: { name: "科学教育", slug: "science-education" },
  12: { name: "安全",    slug: "security" },
  13: { name: "运动健康", slug: "sports-health" },
  14: { name: "系统",    slug: "system" },
  15: { name: "主题",    slug: "theming" },
  16: { name: "时间",    slug: "time" },
  17: { name: "写作",    slug: "writing" },
  18: { name: "默认",    slug: "default" },
} as const;

// 英文分类映射
const EN_CATEGORY_MAP = {
  1:  { name: "Connectivity",       slug: "connectivity" },
  2:  { name: "Development",        slug: "development" },
  3:  { name: "Games",              slug: "games" },
  4:  { name: "Graphics",           slug: "graphics" },
  5:  { name: "Internet",           slug: "internet" },
  6:  { name: "Money",              slug: "money" },
  7:  { name: "Multimedia",         slug: "multimedia" },
  8:  { name: "Navigation",         slug: "navigation" },
  9:  { name: "Phone & SMS",        slug: "phone-sms" },
  10: { name: "Reading",            slug: "reading" },
  11: { name: "Science & Education",slug: "science-education" },
  12: { name: "Security",           slug: "security" },
  13: { name: "Sports & Health",    slug: "sports-health" },
  14: { name: "System",             slug: "system" },
  15: { name: "Theming",            slug: "theming" },
  16: { name: "Time",               slug: "time" },
  17: { name: "Writing",            slug: "writing" },
  18: { name: "Default",            slug: "default" },
} as const;


// 保留 cache 包装的 getCategory 函数，修复类型问题
const getCategory = cache(async (categoryId: number, locale: string) => {
  // 根据语言选择对应的映射表
  const CATEGORY_MAP: CategoryMap = locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP;
  
  // 将 number 转换为 string 作为键
  const categoryKey = categoryId.toString();
  
  return CATEGORY_MAP[categoryKey] || null;
});

// 修改 getAppTags 函数的返回类型
const getAppTags = cache(async (appId: string, locale: string): Promise<Tag[] | null> => {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    const url = new URL(`${protocol}://${host}/api/app/tag/show`);
    url.searchParams.set('appid', appId);
    
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    // console.error("Failed to fetch app tags:", error);
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
  // download_url?: string;
  category: number;
}

// Add Tag interface
interface Tag {
  id: number;
  name: string;
  enname: string;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; locale: string };
}): Promise<Metadata> {
  const app = await getApp(params.id, params.locale);

  if (!app) {
    return {
      title: "软件不存在",
      description: "请求的软件不存在或已被删除。",
    };
  }

  // 构建 canonical URL
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');
  const canonicalUrl = `${protocol}://${host}${params.locale === 'zh' ? '/zh' : ''}/app/${params.id}`;

  return {
    title: app.intro ? `${app.title} - ${app.intro}` : app.title,
    description: `${app.title} : ${app.intro} ; ${app.content.slice(0, 200)}`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

// 处理截图字符串，返回数组
function processScreenshots(screenshot: string | undefined): string[] {
  if (!screenshot) return [];
  return screenshot.split('@@').filter(url => url.trim());
}

export default async function AppPage({ params }: { 
  params: { id: string; locale: string }
}) {
  const app = await getApp(params.id, params.locale);
  const category = app?.category ? await getCategory(app.category, params.locale) : null;
  const tags: Tag[] | null = await getAppTags(params.id, params.locale);

  if (!app) {
    notFound();
  }

  // 处理截图
  const screenshots = processScreenshots(app.screenshot);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Search Bar */}
      <div className="mb-8">
        <form 
          action={params.locale === 'en' ? "/search" : `/${params.locale}/search`}
          method="GET"
          className="flex gap-2 max-w-xl mx-auto"
        >
          <Input 
            name="keyword" 
            placeholder={params.locale === 'en' ? "Search apps..." : "搜索应用..."}
            className="flex-1"
            required
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            {params.locale === 'en' ? 'Search' : '搜索'}
          </Button>
        </form>
      </div>
      
      {/* App Header Section */}
      <div className="mb-8">
        <div className="flex gap-6">
          {/* App Logo */}
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
          
          {/* Title and Meta Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold tracking-tight mb-3">{app.title}</h1>
            
            {/* Intro */}
            {app.intro && (
              <p className="text-lg text-muted-foreground mb-4">
                {app.intro}
              </p>
            )}

            {/* Meta Info Row - aligned with logo */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Date */}
              <time dateTime={app.date} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {new Date(app.date).toLocaleDateString()}
              </time>
              
              {/* Category */}
              {category && (
                <Link 
                  href={`${params.locale === 'zh' ? '/zh' : ''}/category/${category.slug}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="h-1 w-1 rounded-full bg-green-500" />
                  {category.name}
                </Link>
              )}

              {/* Author */}
              {app.author && (
                <span className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  {app.author}
                </span>
              )}

              {/* Website */}
              {app.website && (
                <a 
                  href={app.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <span className="h-1 w-1 rounded-full bg-blue-500" />
                  {params.locale === 'en' ? 'Official Website' : '官方网站'}
                </a>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <>
                  {tags.map((tag) => (
                    <Link
                      key={`tag-${tag.id}`}
                      href={params.locale === 'en' ? `/tag/${tag.id}` : `/${params.locale}/tag/${tag.id}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span className="h-1 w-1 rounded-full bg-orange-500" />
                      {params.locale === 'en' ? tag.enname : tag.name}
                    </Link>
                  ))}
                </>
              )}
            </div>

            {/* Download Button */}
            {app.appid && (
              <div className="mt-6">
                <DownloadButton 
                  appId={params.id} 
                  locale={params.locale} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content and Screenshots Combined Section */}
      <div className="prose prose-lg dark:prose-invert mx-auto mb-12">
        <div className="rounded-lg border shadow-sm overflow-hidden"> {/* 移除背景色 */}
          {/* Title and Content Section */}
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              {params.locale === 'en' ? 'Description' : '应用介绍'}
            </h2>
            <div
              dangerouslySetInnerHTML={{ 
                __html: processContent(app.content)
              }}
            />
          </div>

          {/* Screenshots Section */}
          {screenshots.length > 0 && (
            <div className="border-t bg-[#F8FAFC]">
              <h2 className="text-2xl font-bold p-8 pb-4">
                {params.locale === 'en' ? 'Screenshots' : '应用截图'}
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
                            {params.locale === 'en' ? 'Click to view full size' : '点击查看原图'}
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