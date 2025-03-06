import { headers } from "next/headers";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

// Add this interface near the top of the file, after the imports
interface AppData {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url?: string;
}

interface TagAppsResponse {
  data: AppData[];
  total: number;
  tag: {
    name: string;
    enname: string;
  };
}

// 设置页面级别的 ISR 缓存为一周
export const revalidate = 604800; // 7 days in seconds (7 * 24 * 60 * 60)

// 获取标签相关的应用列表
const getTagApps = cache(async (id: string, locale: string, page = 1) => {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    const url = new URL(`${protocol}://${host}/api/app/tag/${id}`);
    if (locale === 'zh') {
      url.searchParams.set('locale', 'zh');
    }
    url.searchParams.set('page', page.toString());
    
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return await response.json() as TagAppsResponse;
  } catch (error) {
    console.error("Failed to fetch tag apps:", error);
    return null;
  }
});

// 生成动态元数据
export async function generateMetadata({ params }: { params: { id: string; locale: string } }): Promise<Metadata> {
  const data = await getTagApps(params.id, params.locale);
  
  if (!data) {
    return {
      title: params.locale === 'en' ? 'Tag Not Found' : '标签未找到'
    };
  }

  return {
    title: params.locale === 'en' ? `${data.tag.enname} Tag List` : `${data.tag.name} 标签列表`,
    description: params.locale === 'en' 
      ? `Software list for tag ${data.tag.enname}`
      : `标签 ${data.tag.name} 的软件列表`
  };
}

// 更新分页函数
const getPageNumbers = (current: number, total: number) => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }

  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }

  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default async function TagPage({ 
  params,
  searchParams 
}: { 
  params: { id: string; locale: string };
  searchParams: { page?: string } 
}) {
  const currentPage = Number(searchParams.page) || 1;
  const data = await getTagApps(params.id, params.locale, currentPage);

  if (!data) {
    notFound();
  }

  const ITEMS_PER_PAGE = 20; // 添加每页项目数常量
  const pageCount = Math.ceil(data.total / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          <Link 
            href={`${params.locale === 'zh' ? '/zh' : ''}/tag`}
            className="hover:text-primary"
          >
            {params.locale === 'zh' ? '标签' : 'Tags'}
          </Link>
          <span className="mx-2">›</span>
          <span>{params.locale === 'zh' ? data.tag.name : data.tag.enname}</span>
        </h1>
        <p className="text-center text-muted-foreground">
          {params.locale === 'zh' 
            ? `${data.total} 个应用`
            : `Found ${data.total} apps`}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.data.map((app: AppData) => (
          <Link
            key={app.appid}
            href={`${params.locale === 'zh' ? '/zh' : ''}/app/${app.appid}`}
            className="block p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 line-clamp-1">{app.title}</h2>
            <p className="text-sm text-muted-foreground line-clamp-2">{(() => {
                  // 处理可能的 HTML 内容
                  const plainText = app.content
                    .replace(/<\/?[^>]+(>|$)/g, ' ') // 替换所有HTML标签为空格
                    .replace(/\s+/g, ' ')           // 合并多个空格
                    .trim();                        // 移除首尾空白
                  
                  // 确保有足够的文字
                  if (plainText.length > 10) {
                    // 截取适当长度，避免在中文字符中间截断
                    let excerpt = plainText.substring(0, 100);
                    if (/[\u4e00-\u9fa5]$/.test(excerpt)) {
                      excerpt = excerpt.replace(/[\u4e00-\u9fa5]$/, '');
                    }
                    return `${excerpt}...`;
                  }
                  
                  // 如果提取失败，显示默认文本
                  return params.locale === 'en' ? 'Click to view details...' : '点击查看详情...';
                })()}</p>
            <div className="mt-2 flex items-center justify-between text-sm">
              <time className="text-muted-foreground">
                {new Date(app.date).toLocaleDateString()}
              </time>
              {app.download_url && (
                <span className="text-primary">
                  {params.locale === 'en' ? 'Download' : '下载'}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {getPageNumbers(currentPage, pageCount).map((pageNum, index) => (
            typeof pageNum === 'string' ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2">
                ...
              </span>
            ) : (
              <Link
                key={pageNum}
                href={`${params.locale === 'zh' ? '/zh' : ''}/tag/${params.id}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
                className={`px-4 py-2 rounded ${
                  pageNum === currentPage
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {pageNum}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}
