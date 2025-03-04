import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Pagination } from "@/components/ui/Pagination";

interface TagItem {
  id: number;
  name: string;
  enname: string;
}

interface TagListResponse {
  data: TagItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 生成元数据
export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations();
  const title = params.locale === 'en' ? 'All Tags' : '所有标签';
  const description = params.locale === 'en' 
    ? 'Browse all software tags and categories' 
    : '浏览所有软件标签和分类';

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/tag`;
  if (params.locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${params.locale}/tag`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export const revalidate = 604800; // 7天

async function getTagList(locale: string, page: number) {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    const url = new URL(`${protocol}://${host}/api/app/tag/list`);
    url.searchParams.set('page', page.toString());
    
    const response = await fetch(url);  // 移除 revalidate 配置

    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }

    return await response.json() as TagListResponse;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return null;
  }
}

// 更新分页函数
function getPageNumbers(current: number, total: number) {
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
}

export default async function TagPage({ 
  params,
  searchParams 
}: { 
  params: { locale: string };
  searchParams: { page?: string }
}) {
  const { locale } = params;
  const currentPage = Number(searchParams.page) || 1;
  const tagData = await getTagList(locale, currentPage);

  if (!tagData) {
    return (
      <div className="text-center py-8">
        {locale === 'en' ? 'Failed to load tags' : '加载标签失败'}
      </div>
    );
  }

  const pageNumbers = getPageNumbers(currentPage, tagData.pagination.totalPages);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        {locale === 'en' ? 'Tags' : '标签'}
      </h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {tagData.data.map((tag) => (
          <Link
            key={tag.id}
            href={`${locale === 'zh' ? '/zh' : ''}/tag/${tag.id}`}
            className="block p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <span className="text-lg font-medium">
              {locale === 'zh' ? tag.name : tag.enname}
            </span>
          </Link>
        ))}
      </div>

      {/* 更新分页显示部分 */}
      {tagData.pagination.totalPages > 1 && (
        <nav className="flex justify-center space-x-2 mt-8">
          {getPageNumbers(currentPage, tagData.pagination.totalPages).map((page, index) => (
            typeof page === 'string' ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2">
                ...
              </span>
            ) : (
              <Link
                key={page}
                href={locale === 'en' ? `/tag?page=${page}` : `/${locale}/tag?page=${page}`}
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
