import { NextResponse } from "next/server"

// === ЗАМЕНИ на свои ===
const REACT_ORIGIN  = "https://tatar.clientdemo.live"                    // десктоп
const FRAMER_ORIGIN = "https://intuitive-closet-510363.framer.app"       // мобайл
// =======================

const MOBILE_RE = /(Mobile|Android|iPhone|iPod|IEMobile|Opera Mini)/i

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
}

export function middleware(req: Request) {
  const url = new URL(req.url)
  const path = url.pathname + url.search

  // 1) если уже «приклеены» к варианту — не решаем заново
  const cookieHeader = req.headers.get("cookie") || ""
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => v.trim().split("=").map(decodeURIComponent)).filter(p => p.length === 2)
  ) as Record<string,string>
  const pinned = cookies["v"] // "m" | "d"

  if (pinned === "m") {
    // уже мобилка — отдаем 308 на Framer (без прокси)
    if (url.origin !== FRAMER_ORIGIN) return stickAndRedirect("m", FRAMER_ORIGIN + path)
    return NextResponse.next()
  }
  if (pinned === "d") {
    // уже десктоп — 308 на React
    if (url.origin !== REACT_ORIGIN) return stickAndRedirect("d", REACT_ORIGIN + path)
    return NextResponse.next()
  }

  // 2) первичное определение по UA
  const ua = req.headers.get("user-agent") || ""
  const isMobile = MOBILE_RE.test(ua)
  const dest = isMobile ? FRAMER_ORIGIN : REACT_ORIGIN

  // если почему-то оказались уже на нужном origin — пропускаем
  if (url.origin === dest) return NextResponse.next()

  // 3) разовый 308 + кука, чтобы больше не дергать UA
  return stickAndRedirect(isMobile ? "m" : "d", dest + path)
}

function stickAndRedirect(v: "m"|"d", to: string) {
  const res = NextResponse.redirect(to, 308)
  // закрепляем ветку на 30 дней
  res.headers.append(
    "set-cookie",
    `v=${v}; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`
  )
  // чтобы CDN правильно кэшировал разные UA
  res.headers.set("Vary", "User-Agent")
  return res
}
