import { verify } from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || '14ffdad15037afb574df';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    // 验证token
    const decoded = verify(token, JWT_SECRET) as {
      download_url: string;
      user_uuid: string;
    };

    // 重定向到实际的下载地址
    return NextResponse.redirect(decoded.download_url);
    
  } catch (error) {
    return new Response('Invalid or expired download link', { status: 403 });
  }
} 