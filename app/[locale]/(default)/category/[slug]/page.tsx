import { headers } from 'next/headers';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Settings,
  Code,
  Coffee,
  Image as ImageIcon,
  Globe,
  DollarSign,
  Music,
  Compass,
  Phone,
  BookOpen,
  GraduationCap,
  Shield,
  Heart,
  Cpu,
  Palette,
  Clock,
  PenTool,
  Home,
  Menu
} from "lucide-react"
import Image from 'next/image';

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
  logo: string
  intro: string
  tags: string[]
  content: string
  download_url: string
  category: number
  // 根据实际的应用数据结构添加其他必要的字段
}

// 中文分类映射
const ZH_CATEGORY_MAP = {
  0:  { name: "全部",    slug: "", icon: <Home className="w-5 h-5" /> },
  1:  { name: "连接",    slug: "connectivity", icon: <Settings className="w-5 h-5" /> },
  2:  { name: "开发",    slug: "development", icon: <Code className="w-5 h-5" /> },
  3:  { name: "游戏",    slug: "games", icon: <Coffee className="w-5 h-5" /> },
  4:  { name: "图形",    slug: "graphics", icon: <ImageIcon className="w-5 h-5" /> },
  5:  { name: "网络",    slug: "internet", icon: <Globe className="w-5 h-5" /> },
  6:  { name: "理财",    slug: "money", icon: <DollarSign className="w-5 h-5" /> },
  7:  { name: "多媒体",   slug: "multimedia", icon: <Music className="w-5 h-5" /> },
  8:  { name: "导航",    slug: "navigation", icon: <Compass className="w-5 h-5" /> },
  9:  { name: "电话短信", slug: "phone-sms", icon: <Phone className="w-5 h-5" /> },
  10: { name: "阅读",    slug: "reading", icon: <BookOpen className="w-5 h-5" /> },
  11: { name: "科学教育", slug: "science-education", icon: <GraduationCap className="w-5 h-5" /> },
  12: { name: "安全",    slug: "security", icon: <Shield className="w-5 h-5" /> },
  13: { name: "运动健康", slug: "sports-health", icon: <Heart className="w-5 h-5" /> },
  14: { name: "系统",    slug: "system", icon: <Cpu className="w-5 h-5" /> },
  15: { name: "主题",    slug: "theming", icon: <Palette className="w-5 h-5" /> },
  16: { name: "时间",    slug: "time", icon: <Clock className="w-5 h-5" /> },
  17: { name: "写作",    slug: "writing", icon: <PenTool className="w-5 h-5" /> },
  18: { name: "APP",    slug: "app", icon: <Menu className="w-5 h-5" /> },
} as const;

// 英文分类映射
const EN_CATEGORY_MAP = {
  0:  { name: "All",               slug: "", icon: <Home className="w-5 h-5" /> },
  1:  { name: "Connectivity",      slug: "connectivity", icon: <Settings className="w-5 h-5" /> },
  2:  { name: "Development",       slug: "development", icon: <Code className="w-5 h-5" /> },
  3:  { name: "Games",            slug: "games", icon: <Coffee className="w-5 h-5" /> },
  4:  { name: "Graphics",         slug: "graphics", icon: <ImageIcon className="w-5 h-5" /> },
  5:  { name: "Internet",         slug: "internet", icon: <Globe className="w-5 h-5" /> },
  6:  { name: "Money",            slug: "money", icon: <DollarSign className="w-5 h-5" /> },
  7:  { name: "Multimedia",       slug: "multimedia", icon: <Music className="w-5 h-5" /> },
  8:  { name: "Navigation",       slug: "navigation", icon: <Compass className="w-5 h-5" /> },
  9:  { name: "Phone & SMS",      slug: "phone-sms", icon: <Phone className="w-5 h-5" /> },
  10: { name: "Reading",          slug: "reading", icon: <BookOpen className="w-5 h-5" /> },
  11: { name: "Science & Education", slug: "science-education", icon: <GraduationCap className="w-5 h-5" /> },
  12: { name: "Security",         slug: "security", icon: <Shield className="w-5 h-5" /> },
  13: { name: "Sports & Health",  slug: "sports-health", icon: <Heart className="w-5 h-5" /> },
  14: { name: "System",           slug: "system", icon: <Cpu className="w-5 h-5" /> },
  15: { name: "Theming",          slug: "theming", icon: <Palette className="w-5 h-5" /> },
  16: { name: "Time",             slug: "time", icon: <Clock className="w-5 h-5" /> },
  17: { name: "Writing",          slug: "writing", icon: <PenTool className="w-5 h-5" /> },
  18: { name: "APP",              slug: "app", icon: <Menu className="w-5 h-5" /> },
} as const;

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

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug, locale } = params;
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');
  
  const canonicalUrl = `${protocol}://${host}${locale === 'zh' ? '/zh' : ''}/category/${slug}`

  // 从映射表中找到对应的分类名称
  const category = Object.values(locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP).find(cat => cat.slug === slug);
  const categoryName = category?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  
  return {
    title: locale === 'en' 
      ? `${categoryName} List` 
      : `${categoryName}列表`,
    description: locale === 'en'
      ? `Download ${categoryName} software from PWDJ`
      : `陪玩电竞提供${categoryName}分类下载`,
    alternates: {
      canonical: canonicalUrl,
    }
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug, locale } = params;
  const currentPage = Number(searchParams.page) || 1;
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  // 构建 API URL，确保添加 locale 参数
  const url = new URL(`${protocol}://${host}/api/app/category/${slug}`);
  url.searchParams.set('page', currentPage.toString());
  url.searchParams.set('limit', ITEMS_PER_PAGE.toString());
  // 关键是这里：确保在英文版时添加 locale 参数
  if (locale === 'zh') {
    url.searchParams.set('locale', 'zh');
  }

  const response = await fetch(url, {
    next: {
      revalidate: 120, // 缓存12小时
      tags: [
        `category-${slug}`, // 基本分类标签
        `category-${slug}-page-${currentPage}` // 带分页的标签
      ]
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch category apps')
  }

  const { apps, total, totalPages, term } = await response.json() as { 
    apps: apps[], 
    total: number,
    totalPages: number,
    term: { name: string, slug: string } 
  };

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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Category Menu */}
      <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex p-2 space-x-2">
          {Object.entries(locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP).map(([id, category]) => (
            <Link
              key={id}
              href={locale === 'en' 
                ? `/category/${category.slug}`
                : `/${locale}/category/${category.slug}`}
              className={`flex items-center px-3 py-2 rounded-full whitespace-nowrap ${
                params.slug === category.slug ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 bg-white border-r border-gray-200">
        {Object.entries(locale === 'en' ? EN_CATEGORY_MAP : ZH_CATEGORY_MAP).map(([id, category]) => (
          <Link
            key={id}
            href={locale === 'en' 
              ? `/category/${category.slug}`
              : `/${locale}/category/${category.slug}`}
            className={`flex items-center w-full px-4 py-3 text-left ${
              params.slug === category.slug ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
          >
            <span className="mr-3 text-gray-600">{category.icon}</span>
            <span className="text-gray-800">{category.name}</span>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              {locale === 'en' ? 'Public Web Download Jar' : '海量开源免费安卓应用下载'}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {locale === 'en' ? 'Unleash Your Android\'s Potential!' : '释放安卓潜能，提高生产力！'}
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-12">
            <form 
              action={locale === 'en' ? '/search' : `/${locale}/search`}
              method="GET" 
              className="relative"
            >
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input 
                name="keyword" 
                placeholder={locale === 'en' ? 'Search apps...' : '搜索应用...'}
                className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </form>
          </div>

          {/* App Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps && Array.isArray(apps) && apps.map((app) => (
              <Link
                key={app.appid}
                href={locale === 'en' ? `/app/${app.appid}` : `/${locale}/app/${app.appid}`}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <div className="p-6">
                  {/* App Icon */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="flex-shrink-0">
                      <Image
                        src={app.logo || "/placeholder.svg"}
                        alt={app.title}
                        width={56}
                        style={{
                          width: '56px',
                          height: '56px',
                          objectFit: 'cover'
                        }}  
                        height={56}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {app.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {app.intro || app.content.replace(/<[^>]+>/g, '')}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {app.tags && app.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {app.tags.map((tag, index) => (
                        <span
                          key={tag}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRandomTagColor()}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center space-x-2 mt-8">
              {getPageNumbers(currentPage, totalPages).map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-4 py-2">
                    ...
                  </span>
                ) : (
                  <Link
                    key={page}
                    href={locale === 'en' ? `/category/${slug}?page=${page}` : `/${locale}/category/${slug}?page=${page}`}
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
      </div>
    </div>
  )
}
