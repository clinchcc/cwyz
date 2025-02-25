import { headers } from 'next/headers';
import Link from 'next/link';

interface CategoryPageProps {
  params: {
    slug: string
    locale: string
  }
  searchParams: {
    page?: string
  }
}

// 每页显示的应用数量
const ITEMS_PER_PAGE = 12

interface apps {
  appid: string
  title: string
  date: string
  content: string
  download_url: string
  category: number
  // 根据实际的应用数据结构添加其他必要的字段
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

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = params
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');
  
  const canonicalUrl = `${protocol}://${host}/category/${slug}`

  // 从映射表中找到对应的分类名称
  const category = Object.values(CATEGORY_MAP).find(cat => cat.slug === slug);
  const categoryName = category?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  
  return {
    title: `${categoryName}列表`,
    description: `绿盟提供${categoryName}分类下载`,
    alternates: {
      canonical: canonicalUrl,
    }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const currentPage = Number(searchParams.page) || 1
  const { slug } = params
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  const response = await fetch(
    `${protocol}://${host}/api/app/category/${slug}?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch category apps')
  }

  const { apps, total, term } = await response.json() as { apps: apps[], total: number, term: { name: string } }
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // 生成分页按钮数组，带省略号
  const getPageNumbers = (current: number, total: number) => {
    const pages: (number | string)[] = []
    const delta = 2 // 当前页前后显示的页数

    for (let i = 1; i <= total; i++) {
      if (
        i === 1 || // 第一页
        i === total || // 最后一页
        (i >= current - delta && i <= current + delta) // 当前页前后的页数
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }

    return pages
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 分类导航 */}
      <div className="mb-8 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max bg-card p-4 rounded-lg shadow-sm">
          <Link
            href="/category"
            className={`px-4 py-2 rounded-full transition-colors
              ${!params.slug 
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
                ${params.slug === category.slug 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-center">{term.name}列表</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((apps) => (
          <div key={apps.appid} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
            <Link href={`/app/${apps.appid}`}>
              <h3 className="text-xl font-semibold mb-2">{apps.title}</h3>
              <div className="text-gray-600 mb-4">
                {`${apps.content
                  .split('</p>')[0]
                  .replace(/<\/?[^>]+(>|$)/g, '')
                  .replace(/^\s+|\s+$/g, '')  // 移除首尾空白
                  .substring(0, 100)
                  .replace(/[\u4e00-\u9fa5]$/, '')}...`}  
              </div>
            </Link>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {new Date(apps.date).toLocaleDateString()}
              </span>
              <Link
                href={`/app/${apps.appid}`}
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
          {getPageNumbers(currentPage, totalPages).map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${page}`} className="px-4 py-2">
                {page}
              </span>
            ) : (
              <a
                key={page}
                href={`/category/${slug}?page=${page}`}
                className={`px-4 py-2 border rounded hover:bg-gray-100 ${
                  currentPage === page ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                }`}
              >
                {page}
              </a>
            )
          ))}
        </nav>
      )}
    </div>
  )
}
