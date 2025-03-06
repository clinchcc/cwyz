'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DownloadButtonProps {
  appId: string;
  locale: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data?: {
    download_token: string;
  };
}

export default function DownloadButton({ appId, locale }: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // console.log('Download button clicked with appId:', appId);
      
      const response = await fetch('/api/app/down', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ app_id: appId }),
      });

      // console.log('Response status:', response.status);
      
      const result: ApiResponse = await response.json();
      // console.log('Response result:', result);
      
      if (result.code !== 0) {
        if (result.message === 'no auth') {
          toast.error(locale === 'en' ? 'Please sign in first' : '请先登录');
          await new Promise(resolve => setTimeout(resolve, 1500));
          // router.push('/sign-in');
          return;
        }
        
        if (result.message === 'not enough credits') {
          toast.error(locale === 'en' ? 'Not enough credits' : '积分不足');
          await new Promise(resolve => setTimeout(resolve, 3000));
          router.push('/#pricing');
          return;
        }

        toast.error(result.message);
        return;
      }

      // 使用临时token进行下载
      if (result.data?.download_token) {
        window.location.href = `/api/app/download/${result.data.download_token}`;
      }
      
    } catch (error) {
      // console.error('Download error:', error);
      toast.error('Download failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className="relative group inline-flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg 
        className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        {isLoading ? (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        ) : (
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        )}
      </svg>
      <span className="text-lg font-medium">
        {isLoading 
          ? (locale === 'en' ? 'Processing...' : '处理中...') 
          : (locale === 'en' ? 'Download Software' : '下载软件')
        }
      </span>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
    </button>
  );
} 