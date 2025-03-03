import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');
  
  // 使用环境变量或临时密钥
  const validSecret = process.env.REVALIDATE_SECRET || "temporary-secret-key-for-testing";
  
  // 验证密钥
  if (secret !== validSecret) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
  
  if (!path) {
    return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 });
  }

  try {
    // 强制重新验证路径
    revalidatePath(path, 'layout'); // 使用 'layout' 选项强制重新验证整个布局树
    
    // 为确保万无一失，也尝试重新验证父路径
    const segments = path.split('/').filter(Boolean);
    let currentPath = '';
    for (const segment of segments) {
      currentPath += '/' + segment;
      revalidatePath(currentPath, 'layout');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Path ${path} and its parents have been forcefully revalidated` 
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