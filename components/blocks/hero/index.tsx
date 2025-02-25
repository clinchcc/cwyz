import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import HappyUsers from "./happy-users";
import HeroBg from "./bg";
import type { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import Link from "next/link";
import { headers } from 'next/headers';

// 添加类型定义
interface App {
  appid: string;
  title: string;
  content: string;
  date: string;
  download_url?: string;
  category: number;
}

// 由于是服务端组件，使用 async 组件
export default async function Hero({ 
  hero, 
  locale 
}: { 
  hero: HeroType;
  locale: string;
}) {
  // 组件初始化日志
  console.log('\x1b[35m%s\x1b[0m', '=== Hero Component Initialized ===');
  console.log('\x1b[36m%s\x1b[0m', 'Hero Props:', {
    disabled: hero.disabled,
    locale: locale,
    title: hero.title
  });

  if (hero.disabled) {
    console.log('\x1b[33m%s\x1b[0m', 'Hero Component Disabled');
    return null;
  }

  let apps: App[] = [];
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  try {
    const url = new URL(`${protocol}://${host}/api/app/category/0`);
    if (locale === 'en') {
      url.searchParams.set('locale', 'en');
    }

    // 调试日志：请求前
    console.log('Debug Fetch - Request Info:', {
      fullUrl: url.toString(),
      locale: locale,
      protocol: protocol,
      host: host,
      searchParams: Object.fromEntries(url.searchParams)
    });

    const response = await fetch(url, {
      next: { revalidate: 0 },
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    // 调试日志：响应状态
    console.log('Debug Fetch - Response Status:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 调试日志：响应数据
    console.log('Debug Fetch - Response Data:', {
      dataStructure: Object.keys(data),
      appsLength: data.apps?.length,
      firstApp: data.apps?.[0],
      locale: locale
    });

    apps = data.apps || [];
  } catch (error) {
    // 调试日志：错误信息
    console.error('Debug Fetch - Error:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    apps = [];
  }

  // 调试日志：最终结果
  console.log('Debug Fetch - Final Apps:', {
    appsLength: apps.length,
    firstApp: apps[0],
    locale: locale
  });

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <HeroBg />
      <section className="py-24">
        <div className="container">
          {hero.show_badge && (
            <div className="flex items-center justify-center mb-8">
              <img
                src="/imgs/badges/phdaily.svg"
                alt="phdaily"
                className="h-10 object-cover"
              />
            </div>
          )}
          <div className="text-center">
            {hero.announcement && (
              <a
                href={hero.announcement.url}
                className="mx-auto mb-3 inline-flex items-center gap-3 rounded-full border px-2 py-1 text-sm"
              >
                {hero.announcement.label && (
                  <Badge>{hero.announcement.label}</Badge>
                )}
                {hero.announcement.title}
              </a>
            )}

            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
                {texts[0]}
                <span className="bg-gradient-to-r from-primary via-primary to-primary bg-clip-text text-transparent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="mx-auto mb-3 mt-4 max-w-3xl text-balance text-4xl font-bold lg:mb-7 lg:text-7xl">
                {hero.title}
              </h1>
            )}

            <p
              className="m mx-auto max-w-3xl text-muted-foreground lg:text-xl"
              dangerouslySetInnerHTML={{ __html: hero.description || "" }}
            />
            {hero.buttons && (
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                {hero.buttons.map((item, i) => {
                  return (
                    <Link
                      key={i}
                      href={item.url || ""}
                      target={item.target || ""}
                      className="flex items-center"
                    >
                      <Button
                        className="w-full"
                        size="lg"
                        variant={item.variant || "default"}
                      >
                        {item.title}
                        {item.icon && (
                          <Icon name={item.icon} className="ml-1" />
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
            
       

            {/* App grid with proper language path handling */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map((app) => (
                <Link 
                  key={app.appid}
                  href={locale === 'en' ? `/en/app/${app.appid}` : `/app/${app.appid}`}
                  className="group p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">
                    {app.title}
                  </h3>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(app.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                  </div>
                </Link>
              ))}
            </div>

            {apps.length > 0 && (
              <div className="mt-8">
                <Link href={locale === 'en' ? '/en/category' : '/category'}>
                  <Button variant="outline" size="lg">
                    {locale === 'en' ? 'View More' : '查看更多'}
                    <Icon name="RiArrowRightLine" className="ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
