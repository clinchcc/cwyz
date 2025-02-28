import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
  if (params.locale !== "zh") {
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

async function getTagList(locale: string, page: number) {
  try {
    const headersList = headers();
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = headersList.get('host');
    
    const url = new URL(`${protocol}://${host}/api/app/tag/list`);
    url.searchParams.set('page', page.toString());
    
    const response = await fetch(url, {
      next: { revalidate: 3600 } // 缓存1小时
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tags');
    }

    return await response.json() as TagListResponse;
  } catch (error) {
    console.error('Error fetching tags:', error);
    return null;
  }
}

// 生成分页按钮
function getPageNumbers(current: number, total: number) {
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
            href={`${locale === 'en' ? '/en' : ''}/tag/${tag.id}`}
            className="block p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <span className="text-lg font-medium">
              {locale === 'en' ? tag.enname : tag.name}
            </span>
          </Link>
        ))}
      </div>

      {/* 分页导航 */}
      {tagData.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {pageNumbers.map((pageNumber, index) => (
            pageNumber === '...' ? (
              <span key={`ellipsis-${index}`} className="px-4 py-2">...</span>
            ) : (
              <Link
                key={pageNumber}
                href={`${locale === 'en' ? '/en' : ''}/tag?page=${pageNumber}`}
                className={`px-4 py-2 rounded ${
                  currentPage === pageNumber
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-accent'
                }`}
              >
                {pageNumber}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
}
