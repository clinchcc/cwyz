import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';


// https://www.lvruan.com/api/clear-cache?path=/app/79257&secret=YOUR_SECRET
//目前用不上，因为revalidatePath和revalidateTag在app/api/revalidate/route.ts中已经实现  
//但是可以用来清除tag和category的缓存，方法如下：   
// https://www.lvruan.com/api/clear-cache?tag=tag1&secret=YOUR_SECRET
// https://www.lvruan.com/api/clear-cache?category=category1&secret=YOUR_SECRET
// 创建一个 API 路由来清除缓存
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const tag = searchParams.get('tag');
  const category = searchParams.get('category');
  const allPages = searchParams.get('allPages') === 'true';
  const secret = searchParams.get('secret');
  const page = searchParams.get('page');
  
  // 验证密钥
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  
  try {
    // 清除路径缓存
    if (path) {
      // 基本路径刷新
      revalidatePath(path, 'layout');
      console.log(`Revalidated path: ${path}`);
      
      // 检查是否是分类页面
      const categoryMatch = path.match(/\/(?:en\/)?category\/([^/?]+)/);
      if (categoryMatch) {
        const slug = categoryMatch[1];
        
        // 如果需要刷新所有页面
        if (allPages) {
          // 刷新基本分类标签
          revalidateTag(`category-${slug}`);
          
          // 刷新所有分页
          for (let i = 1; i <= 100; i++) {
            revalidateTag(`category-${slug}-page-${i}`);
          }
          console.log(`Revalidated all pages for category path: ${path}`);
        }
        // 检查是否有特定页面参数
        else {
          const pageMatch = path.match(/page=(\d+)/);
          if (pageMatch) {
            const pageNum = pageMatch[1];
            revalidateTag(`category-${slug}-page-${pageNum}`);
            console.log(`Revalidated category: ${slug}, page: ${pageNum}`);
          }
        }
      }
    }
    
    // 清除标签缓存
    if (tag) {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }
    
    // 清除分类缓存
    if (category) {
      // 基本分类标签
      revalidateTag(`category-${category}`);
      console.log(`Revalidated category: ${category}`);
      
      // 如果需要刷新所有页面
      if (allPages) {
        // 假设最多有100页，这是一个保守估计
        for (let i = 1; i <= 100; i++) {
          revalidateTag(`category-${category}-page-${i}`);
        }
        console.log(`Revalidated all pages for category: ${category}`);
      }
      
      if (page) {
        revalidateTag(`category-${category}-page-${page}`);
        console.log(`Revalidated category: ${category}, page: ${page}`);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
