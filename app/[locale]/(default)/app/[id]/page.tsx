import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { headers } from 'next/headers';
import Link from "next/link";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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

// 使用 React 的 cache 函数来缓存数据获取
const getApp = cache(async (id: string, locale: string) => {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    // 构建 URL，如果是英文则添加 locale 参数
    const url = new URL(`${protocol}://${host}/api/app/${id}`);
    if (locale === 'en') {
      url.searchParams.set('locale', 'en');
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 添加 next 配置
      next: {
        revalidate: 60 // 缓存 60 秒
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('API response:', data); // 添加日志以便调试
    return data.data;
  } catch (error) {
    console.error("Failed to fetch app:", error);
    return null;
  }
});

// 中文分类映射
const ZH_CATEGORY_MAP = {
  1: { name: "未分类", slug: "uncategorized" },
  2: { name: "装机必备", slug: "software" },
  3: { name: "网络软件", slug: "net" },
  4: { name: "音频视频", slug: "video" },
  5: { name: "编程软件", slug: "code" },
  6: { name: "图像图形", slug: "pic" },
  7: { name: "系统软件", slug: "sys" },
  8: { name: "应用软件", slug: "tools" },
  9: { name: "手机软件", slug: "mobile" },
  13: { name: "资讯", slug: "info" },
  31: { name: "游戏相关", slug: "game" },
  52: { name: "AI软件", slug: "ai" }
} as const;

// 英文分类映射
const EN_CATEGORY_MAP = {
  1: { name: "Uncategorized", slug: "uncategorized" },
  2: { name: "Essential Software", slug: "software" },
  3: { name: "Network Tools", slug: "net" },
  4: { name: "Audio & Video", slug: "video" },
  5: { name: "Programming", slug: "code" },
  6: { name: "Graphics & Design", slug: "pic" },
  7: { name: "System Tools", slug: "sys" },
  8: { name: "Applications", slug: "tools" },
  9: { name: "Mobile Apps", slug: "mobile" },
  13: { name: "News", slug: "info" },
  31: { name: "Gaming", slug: "game" },
  52: { name: "AI Software", slug: "ai" }
} as const;

// 修改获取分类信息的函数
const getCategory = cache(async (categoryId: number, locale: string) => {
  // 根据语言选择对应的映射表
  const CATEGORY_MAP = locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP;
  return CATEGORY_MAP[categoryId as keyof typeof CATEGORY_MAP] || null;
});

// 修改 getAppTags 函数的返回类型
const getAppTags = cache(async (appId: string, locale: string): Promise<Tag[] | null> => {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    const url = new URL(`${protocol}://${host}/api/app/tag/show`);
    url.searchParams.set('appid', appId);
    
    const response = await fetch(url, {
      next: {
        revalidate: 60 // 缓存 60 秒
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Failed to fetch app tags:", error);
    return null;
  }
});

interface App {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url?: string;
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
  const canonicalUrl = `${protocol}://${host}${params.locale === 'en' ? '/en' : ''}/app/${params.id}`;

  return {
    title: app.title,
    description: app.content.slice(0, 200),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function AppPage({ params }: { params: { id: string; locale: string } }) {
  const app = await getApp(params.id, params.locale);
  const category = app?.category ? await getCategory(app.category, params.locale) : null;
  const tags: Tag[] | null = await getAppTags(params.id, params.locale);

  if (!app) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 搜索框 */}
      <div className="mb-8">
        <form 
          action={params.locale === 'zh' ? "/search" : `/${params.locale}/search`}
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
      
      {/* 标题部分 */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{app.title}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground flex-wrap">
          <span className="flex h-1 w-1 rounded-full bg-muted-foreground" />
          <time dateTime={app.date}>
            {new Date(app.date).toLocaleDateString()}
          </time>
          
          {/* 分类显示 */}
          {category && (
            <>
              <span className="flex h-1 w-1 rounded-full bg-muted-foreground" />
              <Link 
                href={`${params.locale === 'en' ? '/en' : ''}/category/${category.slug}`}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {category.name}
              </Link>
            </>
          )}

          {/* 标签显示 */}
          {tags && tags.length > 0 && (
            <>
              <span className="flex h-1 w-1 rounded-full bg-muted-foreground" />
              <div className="flex flex-wrap gap-2 items-center">
                {tags.map((tag: Tag) => (
                  <Link
                    key={tag.id}
                    href={`${params.locale === 'en' ? '/en' : ''}/tag/${tag.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    #{params.locale === 'en' ? tag.enname : tag.name}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* 下载链接相关的分隔点 */}
          {app.download_url && (
            <span className="flex h-1 w-1 rounded-full bg-muted-foreground" />
          )}
        </div>
      </div>

      {/* 内容部分 */}
      <div className="prose prose-lg dark:prose-invert mx-auto">
        <div
          className="rounded-lg border bg-card p-8 shadow-sm"
          // biome-ignore lint/security/noDangerouslySetInnerHTML: 内容已经在服务端处理过
          dangerouslySetInnerHTML={{ 
            __html: processContent(app.content)
          }}
        />
      </div>

      {/* 下载按钮 */}
      {app.download_url && (
        <div className="mt-12 flex justify-center">
          <a
            href={app.download_url}
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-4 text-lg font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:pointer-events-none disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.locale === 'en' ? 'Download Software' : '下载软件'}
          </a>
        </div>
      )}
    </div>
  );
}