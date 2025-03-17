import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
  logo: string;
  intro: string;
  tags: string[];
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
  if (hero.disabled) {
    return null;
  }

  let apps: App[] = [];
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host');

  try {
    const url = new URL(`${protocol}://${host}/api/app/category/all`);
    if (locale === 'zh') {
      url.searchParams.set('locale', 'zh');
    }

    const response = await fetch(url, {
      next: { revalidate: 120 }, // 2min
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    apps = data.apps || [];
  } catch (error) {
    apps = [];
  }

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

          {/* 搜索框 */}
          <div className="mt-8 mb-8">
              <form 
                action={locale === 'en' ? "/search" : `/${locale}/search`}
                method="GET"
                className="flex gap-2 max-w-xl mx-auto"
              >
                <Input 
                  name="keyword" 
                  placeholder={locale === 'en' ? "Search apps..." : "搜索应用..."}
                  className="flex-1"
                  required
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  {locale === 'en' ? 'Search' : '搜索'}
                </Button>
              </form>
            </div>
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
            
            {/* App grid with improved styling */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {apps.map((app) => (
                <Link 
                  key={app.appid}
                  href={locale === 'zh' ? `/zh/app/${app.appid}` : `/app/${app.appid}`}
                  className="group p-4 border rounded-lg hover:border-primary hover:shadow-lg transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={app.logo} 
                        alt={app.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate group-hover:text-primary">
                        {app.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.intro}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {app.tags?.slice(0, 2).map((tag) => (
                        <Badge 
                          key={`${app.appid}-${tag}`} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(app.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {apps.length > 0 && (
              <div className="mt-8">
                <Link href={locale === 'zh' ? '/zh/category' : '/category'}>
                  <Button variant="outline" size="lg">
                    {locale === 'zh' ? '查看更多' : 'View More'}
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
