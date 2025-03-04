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
    
    const response = await fetch(url); // 移除 revalidate 配置

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
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
    title: `${data.tag.name} Tag List`,
    description: params.locale === 'en' 
      ? `Software list for tag ${data.tag.name}`
      : `标签 ${data.tag.name} 的软件列表`
  };
}

// 生成分页按钮数组
const getPageNumbers = (current: number, total: number) => {
  const pages: (number | string)[] = [];
  const delta = 2; // 当前页前后显示的页数

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 || // 第一页
      i === total || // 最后一页
      (i >= current - delta && i <= current + delta) // 当前页前后的页数
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return pages;
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

  const pageNumbers = getPageNumbers(data.pagination.page, data.pagination.totalPages);

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
            ? `${data.pagination.total} 个应用`
            : `Found ${data.pagination.total} apps`}
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

      {data.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {pageNumbers.map((pageNum, index) => (
            pageNum === '...' ? (
              <span key="ellipsis" className="px-4 py-2">...</span>
            ) : (
              <Link
                key={pageNum}
                href={`${params.locale === 'zh' ? '/zh' : ''}/tag/${params.id}${pageNum === 1 ? '' : `?page=${pageNum}`}`}
                className={`px-4 py-2 rounded ${
                  pageNum === data.pagination.page
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
