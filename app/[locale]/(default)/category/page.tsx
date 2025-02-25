import { headers } from 'next/headers';
import Link from 'next/link';

// Add interface definition at the top of the file after imports
interface App {
  appid: string;
  title: string;
  content: string;
  date: string;
}

// 添加分类映射关系
const CATEGORY_MAP = {
  1: { name: "默认", slug: "uncategorized" },
  2: { name: "装机", slug: "software" },
  3: { name: "网络软件", slug: "net" },
  4: { name: "媒体", slug: "video" },
  5: { name: "编程软件", slug: "code" },
  6: { name: "图像", slug: "pic" },
  7: { name: "系统软件", slug: "sys" },
  8: { name: "应用软件", slug: "tools" },
  9: { name: "手机软件", slug: "mobile" },
  13: { name: "资讯", slug: "info" },
  31: { name: "游戏", slug: "game" },
  52: { name: "AI", slug: "ai" }
} as const;

export function generateMetadata() {
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');
  
  const canonicalUrl = `${protocol}://${host}/category`;

  return {
    title: '绿软软件分类',
    description: '绿盟提供各种类型软件下载，包括系统工具、办公软件、图像处理、音视频工具、编程开发等多个分类的优质软件',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: '绿软软件分类',
      description: '绿盟提供各种类型软件下载，包括系统工具、办公软件、图像处理、音视频工具、编程开发等多个分类的优质软件',
      url: canonicalUrl,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || '软件下载',
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  };
}

export default async function CategoryPage({ 
  searchParams 
}: { 
  searchParams: { 
    page?: string;
    category?: string;
  } 
}) {
  const currentPage = Number(searchParams.page) || 1;
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  const response = await fetch(
    `${protocol}://${host}/api/app/category/all?page=${currentPage}`,
    { next: { revalidate: 3600 } }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch apps');
  }

  const { apps, total, totalPages }: { 
    apps: App[];
    total: number;
    totalPages: number;
  } = await response.json();

  // 添加分页按钮生成函数
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
      {/* 分类导航 */}
      <div className="mb-8 overflow-x-auto scrollbar-hide md:overflow-x-visible">
        <div className="flex gap-3 min-w-max md:min-w-0 md:flex-wrap md:justify-center bg-card p-4 rounded-lg shadow-sm">
          <Link
            href="/category"
            className={`px-4 py-2 rounded-full transition-colors
              ${!searchParams.category 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted hover:bg-muted/80'}`}
          >
            全部
          </Link>
          {Object.entries(CATEGORY_MAP).map(([id, category]) => (
            <Link
              key={id}
              href={`/category/${category.slug}`}
              className={`px-4 py-2 rounded-full transition-colors
                ${searchParams.category === category.slug 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">全部软件</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.appid} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
            <Link href={`/app/${app.appid}`}>
              <h3 className="text-xl font-semibold mb-2">{app.title}</h3>
              <div className="text-gray-600 mb-4" >
              {`${app.content
                  .split('</p>')[0]
                  .replace(/<\/?[^>]+(>|$)/g, '')
                  .replace(/^\s+|\s+$/g, '')  // 移除首尾空白
                  .substring(0, 100)
                  .replace(/[\u4e00-\u9fa5]$/, '')}...`}  
              </div>
            </Link>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {new Date(app.date).toLocaleDateString()}
              </span>
              <Link
                href={`/app/${app.appid}`}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                下载
              </Link>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center space-x-2 mt-4">
          {getPageNumbers(currentPage, totalPages).map((page) => (
            page === '...' ? (
              <span key={`ellipsis-${currentPage}-${page}-${Math.random()}`} className="px-4 py-2">
                {page}
              </span>
            ) : (
              <Link
                key={`page-${page}`}
                href={`/category?page=${page}`}
                className={`px-4 py-2 border rounded hover:bg-gray-100 ${
                  currentPage === page ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                }`}
              >
                {page}
              </Link>
            )
          ))}
        </nav>
      )}
    </div>
  );
}
