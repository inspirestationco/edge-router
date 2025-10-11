import { NextResponse } from "next/server"

// === ТВОИ ОРИДЖИНЫ ===
const REACT_ORIGIN  = "https://tatar.clientdemo.live"                   // десктоп
const FRAMER_ORIGIN = "https://intuitive-closet-510363.framer.app"      // мобайл
// ======================

// простая проверка на моб. UA
const MOBILE_RE = /(Mobile|Android|iPhone|iPod|IEMobile|Opera Mini)/i

export const config = {
  matcher: [
    "/((?!_next|static|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
}

export function middleware(req) {
  const url = new URL(req.url)
  const path = url.pathname + url.search

  // ----- читаем куку «v» (m|d), если уже закрепили вариант -----
  const cookieHeader = req.headers.get("cookie") || ""
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => v.trim().split("="))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [decodeURIComponent(k), decodeURIComponent(v)])
  )
  const pinned = cookies.v // "m" | "d"

  if (pinned === "m") {
    if (url.origin !== FRAMER_ORIGIN) return stickAndRedirect("m", FRAMER_ORIGIN + path)
    return NextResponse.next()
  }
  if (pinned === "d") {
    if (url.origin !== REACT_ORIGIN) return stickAndRedirect("d", REACT_ORIGIN + path)
    return NextResponse.next()
  }

  // ----- первичное определение по User-Agent -----
  const ua = req.headers.get("user-agent") || ""
  const isMobile = MOBILE_RE.test(ua)
  const dest = isMobile ? FRAMER_ORIGIN : REACT_ORIGIN

  if (url.origin === dest) return NextResponse.next()

  return stickAndRedirect(isMobile ? "m" : "d", dest + path)
}

function stickAndRedirect(v, to) {
  const res = NextResponse.redirect(to, 308)
  // закрепляем выбор на 30 дней
  res.headers.append(
    "set-cookie",
    `v=${encodeURIComponent(v)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
  )
  // чтобы CDN различал варианты по UA
  res.headers.set("Vary", "User-Agent")
  return res
}
