import Link from 'next/link';
import { headers } from 'next/headers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';

interface App {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url: string | null;
  category: number;
  logo?: string;
}

interface SearchResults {
  apps: App[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// 设置页面级别的 ISR 缓存为半天
export const revalidate = 43200; // 12 hours in seconds (12 * 60 * 60)

// 定义随机标签颜色
const TAG_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
  'bg-orange-100 text-orange-800',
] as const;

// 获取随机颜色的函数
const getRandomTagColor = () => {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
};

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
      if (locale !== 'en') {
        searchUrl.searchParams.set('locale', locale);
      }
      
      const response = await fetch(searchUrl.toString()); // 移除 revalidate 配置
      
      if (!response.ok) {
        throw new Error(locale === 'en' ? 'Failed to search' : '搜索失败');
      }
      
      results = await response.json();
    } catch (err) {
      console.error('Search error:', err);
      error = locale === 'en' ? 'An error occurred while searching' : '搜索时发生错误';
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          {locale === 'en' ? 'Search Software' : '搜索软件'}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {locale === 'en' ? 'Find your next favorite app!' : '发现你的下一个最爱应用！'}
        </p>
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-md mx-auto mb-12">
        <form 
          action={locale === 'en' ? "/search" : `/${locale}/search`}
          method="GET"
          className="relative"
        >
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input 
            name="keyword" 
            placeholder={locale === 'en' ? "Search apps..." : "搜索应用..."}
            className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            defaultValue={keyword}
            required
          />
        </form>
      </div>

      {/* 搜索结果 */}
      <div className="max-w-7xl mx-auto">
        {error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : results ? (
          <>
            {results.apps.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {locale === 'en' ? 'No results found' : '没有找到相关结果'}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl text-gray-600">
                    {locale === 'en' 
                      ? `Found ${results.total} results for "${keyword}"` 
                      : `找到 ${results.total} 个与"${keyword}"相关的结果`}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {results.apps.map((app) => (
                    <Link
                      key={app.appid}
                      href={locale === 'en' ? `/app/${app.appid}` : `/${locale}/app/${app.appid}`}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
                    >
                      <div className="p-6">
                        {/* App Icon and Title */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="flex-shrink-0">
                            <Image
                              src={app.logo || "/placeholder.svg"}
                              alt={app.title}
                              width={56}
                              height={56}
                              className="rounded-xl"
                              style={{
                                width: '56px',
                                height: '56px',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 truncate">
                              {app.title}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {app.content.replace(/<[^>]+>/g, '')}
                            </p>
                          </div>
                        </div>

                        {/* Date */}
                        <div className="text-sm text-gray-500 mt-2">
                          {new Date(app.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {/* 更新分页部分 */}
            {results.totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <nav className="flex items-center space-x-2" aria-label={locale === 'en' ? 'Pagination' : '分页'}>
                  <Link
                    href={`/${locale === 'en' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${results.currentPage - 1}`}
                    className={`px-4 py-2 border rounded ${
                      results.currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-disabled={results.currentPage === 1}
                  >
                    {locale === 'en' ? 'Previous' : '上一页'}
                  </Link>
                  
                  {getPageNumbers(results.currentPage, results.totalPages).map((pageNum, index) => (
                    typeof pageNum === 'string' ? (
                      <span 
                        key={`ellipsis-${index}`} 
                        className="px-4 py-2 text-gray-500"
                      >
                        ...
                      </span>
                    ) : (
                      <Link
                        key={`page-${pageNum}`}
                        href={`/${locale === 'en' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${pageNum}`}
                        className={`px-4 py-2 border rounded ${
                          pageNum === results.currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-50'
                        }`}
                        aria-current={pageNum === results.currentPage ? 'page' : undefined}
                      >
                        {pageNum}
                      </Link>
                    )
                  ))}
                  
                  <Link
                    href={`/${locale === 'en' ? '' : `${locale}/`}search?keyword=${encodeURIComponent(keyword)}&page=${results.currentPage + 1}`}
                    className={`px-4 py-2 border rounded ${
                      results.currentPage === results.totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                        : 'bg-white text-blue-600 hover:bg-blue-50'
                    }`}
                    aria-disabled={results.currentPage === results.totalPages}
                  >
                    {locale === 'en' ? 'Next' : '下一页'}
                  </Link>
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
