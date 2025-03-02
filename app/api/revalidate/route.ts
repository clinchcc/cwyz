import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');
  
  // 验证密钥
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  
  if (!path) {
    return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 });
  }

  try {
    // 使用 revalidatePath 刷新 Next.js 缓存
    // 这会使指定路径的所有缓存失效，包括不带参数的版本
    revalidatePath(path);
    
    return NextResponse.json({ 
      success: true, 
      message: `Path ${path} revalidated successfully` 
    });
  } catch (error) {
    console.error('Error revalidating path:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error revalidating path',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 