import { NextResponse } from 'next/server';

// ⬇️ ЗАМЕНИ эти адреса на свои!
const REACT_ORIGIN  = 'https://tatar.clientdemo.live/';     // твой React (десктоп)
const FRAMER_ORIGIN = 'https://tender-colors-228871.framer.app';    // твой Framer (мобайл)

// Простая проверка на мобильный User-Agent
const MOBILE_RE = /(Mobile|Android|iPhone|iPod|IEMobile|Opera Mini)/i;

// Настройки: исключаем служебные пути Next
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)',
  ],
};

export function middleware(req) {
  const ua = req.headers.get('user-agent') || '';
  const isMobile = MOBILE_RE.test(ua);

  const url = new URL(req.url);
  const upstreamBase = isMobile ? FRAMER_ORIGIN : REACT_ORIGIN;

  // Перенаправляем запрос на нужный origin, сохраняя путь и query
  const upstream = new URL(url.pathname + url.search, upstreamBase);
  const res = NextResponse.rewrite(upstream.toString());

  // Важно: чтобы кэши CDN не путали версии
  res.headers.set('Vary', 'User-Agent');

  return res;
}
