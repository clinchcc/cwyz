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
  const secret = searchParams.get('secret');
  
  // 验证密钥
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  
  try {
    // 清除路径缓存
    if (path) {
      revalidatePath(path, 'layout');
      console.log(`Revalidated path: ${path}`);
    }
    
    // 清除标签缓存
    if (tag) {
      revalidateTag(tag);
      console.log(`Revalidated tag: ${tag}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
