/**
 * Bosh sahifa bannerlari (admin panel → «Bosh sahifa bannerlari»).
 *
 * `settings/home.banners` da saqlanadi. Ilovadagi asosiy banner
 * («Uydagidek ta'm — bir necha daqiqada») doim birinchi turadi; admin
 * qo'shgan faol bannerlar undan keyin karuselda almashadi.
 * Server: api/_lib/actions/home.ts.
 */

export type BannerLayout = 'side' | 'full'
export type BannerTheme = 'green' | 'yellow' | 'red' | 'blue' | 'dark' | 'cream'
export type BannerTarget = 'none' | 'catalog' | 'category' | 'section' | 'product' | 'url'

export type HomeBanner = {
  id: string
  active: boolean
  /** side — matn chapda, rasm o'ngda (asosiy banner kabi); full — rasm butun bannerda. */
  layout: BannerLayout
  theme: BannerTheme
  image: string
  badge: string
  badgeRu: string
  title: string
  titleRu: string
  subtitle: string
  subtitleRu: string
  cta: string
  ctaRu: string
  target: BannerTarget
  /** Kategoriya nomi, bo'lim id'si yoki mahsulot id'si — `target` ga qarab. */
  value: string
  url: string
}

/*
 * Banner ranglari — MUSA logosi palitrasi (yashil, sariq, ko'k). Kalitlar (green, yellow…)
 * bazada saqlangan bannerlar buzilmasligi uchun o'zgarmaydi, faqat ranglar
 * va admin paneldagi nomlar yangilangan.
 */
export const BANNER_THEMES: Record<BannerTheme, { label: string; bg: string; ink: string; ctaBg: string; ctaInk: string; badgeBg: string; badgeInk: string }> = {
  green: {
    label: 'Yashil',
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(255 210 82 / 0.22) 0%, transparent 60%), linear-gradient(135deg, #0a9a50 0%, #025a2d 100%)',
    ink: '#ffffff', ctaBg: '#ffd252', ctaInk: '#0034ae', badgeBg: '#ffd252', badgeInk: '#0034ae',
  },
  yellow: {
    label: 'Sariq',
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(255 255 255 / 0.4) 0%, transparent 60%), linear-gradient(135deg, #ffe17a 0%, #f4b400 100%)',
    ink: '#0034ae', ctaBg: '#0034ae', ctaInk: '#ffffff', badgeBg: '#038141', badgeInk: '#ffffff',
  },
  red: {
    label: "Ko'k",
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(255 210 82 / 0.22) 0%, transparent 60%), linear-gradient(135deg, #2563e8 0%, #0034ae 100%)',
    ink: '#ffffff', ctaBg: '#ffffff', ctaInk: '#0034ae', badgeBg: '#ffd252', badgeInk: '#0034ae',
  },
  blue: {
    label: 'Osmon',
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(255 255 255 / 0.35) 0%, transparent 60%), linear-gradient(135deg, #a8ddff 0%, #4fa8e8 100%)',
    ink: '#0034ae', ctaBg: '#0034ae', ctaInk: '#ffffff', badgeBg: '#ffffff', badgeInk: '#0034ae',
  },
  dark: {
    label: 'Tun',
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(3 129 65 / 0.35) 0%, transparent 60%), linear-gradient(135deg, #0f2a1c 0%, #0b1510 100%)',
    ink: '#ffffff', ctaBg: '#ffd252', ctaInk: '#0034ae', badgeBg: '#038141', badgeInk: '#ffffff',
  },
  cream: {
    label: 'Qaymoq',
    bg: 'radial-gradient(120% 90% at 78% 45%, rgb(255 255 255 / 0.6) 0%, transparent 60%), linear-gradient(135deg, #fffbea 0%, #ffe9a8 100%)',
    ink: '#0034ae', ctaBg: '#038141', ctaInk: '#ffffff', badgeBg: '#0034ae', badgeInk: '#ffd252',
  },
}

const LAYOUTS: BannerLayout[] = ['side', 'full']
const TARGETS: BannerTarget[] = ['none', 'catalog', 'category', 'section', 'product', 'url']
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')

/** Bazadagi xom ro'yxat → toza bannerlar (noma'lum qiymatlar standartga tushadi). */
export function readBanners(value: unknown): HomeBanner[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((b): b is Record<string, unknown> => Boolean(b) && typeof b === 'object')
    .map((b, i) => ({
      id: str(b.id, 40) || `b${i}`,
      active: b.active !== false,
      layout: LAYOUTS.includes(b.layout as BannerLayout) ? (b.layout as BannerLayout) : 'side',
      theme: (b.theme as BannerTheme) in BANNER_THEMES ? (b.theme as BannerTheme) : 'green',
      image: str(b.image, 1000),
      badge: str(b.badge, 40),
      badgeRu: str(b.badgeRu, 40),
      title: str(b.title, 90),
      titleRu: str(b.titleRu, 90),
      subtitle: str(b.subtitle, 140),
      subtitleRu: str(b.subtitleRu, 140),
      cta: str(b.cta, 30),
      ctaRu: str(b.ctaRu, 30),
      target: TARGETS.includes(b.target as BannerTarget) ? (b.target as BannerTarget) : 'catalog',
      value: str(b.value, 200),
      url: str(b.url, 500),
    }))
}

/** Tilga qarab matn: ruscha bo'lmasa o'zbekchasi. */
export const pickLang = (uz: string, ru: string, lang: string) => (lang === 'ru' && ru.trim() ? ru : uz)
