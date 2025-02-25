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
export default async function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  let apps: App[] = [];
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  // 从 URL 中获取当前语言
  const pathname = headersList.get('x-invoke-path') || '';
  const locale = pathname.startsWith('/en/') ? 'en' : 'zh';

  try {
    // 构建 URL，如果是英文则添加 locale 参数
    const url = new URL(`${protocol}://${host}/api/app/category/0`);
    if (locale === 'en') {
      url.searchParams.set('locale', 'en');
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data); // 调试日志
    apps = data.apps || [];
    console.log('Processed apps:', apps); // 调试日志
  } catch (error) {
    console.error('Failed to fetch apps:', error);
    apps = [];
  }

  // 调试日志
  console.log('Apps length:', apps.length);
  console.log('First app:', apps[0]);

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
            
       

            {/* 修改条件渲染逻辑 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map((app) => (
                <Link 
                  key={app.appid}
                  href={`/app/${app.appid}`}
                  className="group p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary">
                    {app.title}
                  </h3>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(app.date).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>

            {apps.length > 0 && (
              <div className="mt-8">
                <Link href="/category">
                  <Button variant="outline" size="lg">
                    查看更多
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
