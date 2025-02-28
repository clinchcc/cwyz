import Link from 'next/link';
import { headers } from 'next/headers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';

interface App {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url: string | null;
  category: number;
}

interface SearchResults {
  apps: App[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// 动态生成元数据
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { keyword?: string; page?: string };
}): Promise<Metadata> {
  const { locale } = params;
  const keyword = searchParams.keyword || '';
  const page = Number(searchParams.page) || 1;
  
  // 构建标题
  let title = locale === 'en' ? 'Search Software' : '软件搜索';
  if (keyword) {
    title = locale === 'en' 
      ? `Search results for "${keyword}"${page > 1 ? ` - Page ${page}` : ''}` 
      : `${keyword} 的搜索结果${page > 1 ? ` - 第 ${page} 页` : ''}`;
  }
  
  // 构建描述
  const description = locale === 'en'
    ? `Find software, tools and applications${keyword ? ` related to "${keyword}"` : ''}`
    : `查找软件、工具和应用程序${keyword ? `，与"${keyword}"相关` : ''}`;
  
  // 构建规范URL
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;
  if (locale === 'zh') {
    canonicalUrl += `/search${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}${page > 1 ? `&page=${page}` : ''}`;
  } else {
    canonicalUrl += `/${locale}/search${keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''}${page > 1 ? `&page=${page}` : ''}`;
  }
  
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export default async function SearchPage({
  params,
  searchParams
}: {
  params: { locale: string };
  searchParams: { keyword?: string; page?: string };
}) {
  const { locale } = params;
  const keyword = searchParams.keyword || '';
  const page = Number(searchParams.page) || 1;
  
  let results: SearchResults | null = null;
  let error: string | null = null;
  
  // 执行搜索
  if (keyword.trim()) {
    try {
      const headersList = headers();
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
      const host = headersList.get('host');
      
      // 构建搜索 URL
      const searchUrl = new URL(`${protocol}://${host}/api/app/search`);
      searchUrl.searchParams.set('keyword', keyword);
      searchUrl.searchParams.set('page', page.toString());
      if (locale !== 'zh') {
        searchUrl.searchParams.set('locale', locale);
      }
      
      const response = await fetch(searchUrl.toString(), {
        next: { revalidate: 60 } // 缓存60秒
      });
      
      if (!response.ok) {
        throw new Error(locale === 'en' ? 'Failed to search' : '搜索失败');
      }
      
      results = await response.json();
    } catch (err) {
      console.error('Search error:', err);
      error = locale === 'en' ? 'An error occurred while searching' : '搜索时发生错误';
    }
  }

  // 生成分页按钮
  const getPageNumbers = (current: number, total: number) => {
    const delta = 2; // 当前页前后显示的页数
    const pages: (number | string)[] = [];

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 搜索框 */}
      <div className="mb-8">
        <form 
          action={locale === 'zh' ? "/search" : `/${locale}/search`}
          method="GET"
          className="flex gap-2 max-w-xl mx-auto"
        >
          <Input 
            name="keyword" 
            placeholder={locale === 'en' ? "Search apps..." : "搜索应用..."}
            className="flex-1"
            defaultValue={keyword}
            required
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" />
            {locale === 'en' ? 'Search' : '搜索'}
          </Button>
        </form>
      </div>

      {/* 搜索结果 */}
      <div className="max-w-5xl mx-auto">
        {error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : results ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">
                {locale === 'en' 
                  ? `Search results for "${keyword}" (${results.total} found)` 
                  : `"${keyword}" 的搜索结果 (共 ${results.total} 个)`}
              </h1>
            </div>

            {results.apps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {locale === 'en' ? 'No results found' : '没有找到相关结果'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.apps.map((app) => (
                  <div key={app.appid} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                    <Link href={locale === 'zh' ? `/app/${app.appid}` : `/${locale}/app/${app.appid}`}>
                      <h2 className="text-xl font-semibold mb-2">{app.title}</h2>
                      <div className="text-gray-600 mb-4">
                        {(() => {
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
                          return locale === 'en' ? 'Click to view details...' : '点击查看详情...';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(app.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {results.totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <nav className="inline-flex rounded-md shadow" aria-label={locale === 'en' ? 'Pagination' : '分页'}>
                  <a
                    href={`/${locale === 'zh' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${results.currentPage - 1}`}
                    className={`px-3 py-2 rounded-l-md border ${
                      results.currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-label={locale === 'en' ? 'Previous page' : '上一页'}
                    aria-disabled={results.currentPage === 1}
                  >
                    {locale === 'en' ? 'Previous' : '上一页'}
                  </a>
                  
                  {getPageNumbers(results.currentPage, results.totalPages).map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span 
                        key={`ellipsis-${results.currentPage}-${index}`} 
                        className="px-3 py-2 border-t border-b bg-white text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <a
                        key={`page-${pageNum}`}
                        href={`/${locale === 'zh' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${pageNum}`}
                        className={`px-3 py-2 border-t border-b ${
                          pageNum === results.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                        aria-label={locale === 'en' ? `Page ${pageNum}` : `第 ${pageNum} 页`}
                        aria-current={pageNum === results.currentPage ? 'page' : undefined}
                      >
                        {pageNum}
                      </a>
                    )
                  ))}
                  
                  <a
                    href={`/${locale === 'zh' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${results.currentPage + 1}`}
                    className={`px-3 py-2 rounded-r-md border ${
                      results.currentPage === results.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-label={locale === 'en' ? 'Next page' : '下一页'}
                    aria-disabled={results.currentPage === results.totalPages}
                  >
                    {locale === 'en' ? 'Next' : '下一页'}
                  </a>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {locale === 'en' ? 'Enter a search term to find software' : '请输入关键词搜索软件'}
          </div>
        )}
      </div>
    </div>
  );
}
