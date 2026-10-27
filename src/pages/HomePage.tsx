import { PromoBanner } from '../components/promo/PromoBanner'
import type { Promotion } from '../utils/promotions'
import { ArrowIcon, BellIcon, ChevronIcon, FilterIcon, HeartIcon, PinIcon, PotIcon, SearchIcon, SnowIcon } from '../components/icons/AtlasIcons'
import { productThumb } from '../utils/product-image'
import { ProductCard } from '../components/product/ProductCard'
import { ProductGridSkeleton } from '../components/ui/ProductCardSkeleton'
import { categoryIcon } from '../utils/category-icons'
import { MAIN_LINES, categoryLabel, isMainLine } from '../config/categories'
import { useMemo, useRef } from 'react'
import { useAutoScroll } from '../hooks/use-auto-scroll'
import { useReveal } from '../hooks/use-reveal'
import { useI18n, useT } from '../i18n'
import { HeroCarousel } from '../components/home/HeroCarousel'
import { HeroSlide } from '../components/home/HeroSlide'
import type { HomeBanner } from '../config/banners'
import { openExternalLink } from '../utils/telegram'
import type { Address, AppPage, Category, Product, ProductActions } from '../types/domain'
import { FreeDeliveryBanner } from '../components/promo/FreeDeliveryTimer'
import { GiveawayCard } from '../components/promo/GiveawayCard'

/** «Aksiya» nishoni shu yo'nalishning doirachasida turadi. */
const PROMO_LINE = 'Setlar'

/** Doirachalar ranglari navbat bilan — atlas matosidagi kabi. */
const STORY_TONES = ['anor', 'zafar', 'osmon', 'atlas'] as const

type Props = ProductActions & {
  products: Product[]
  categories: Category[]
  loading: boolean
  onSearch: () => void
  onNavigate: (page: AppPage) => void
  /** Hozir ishlayotgan vaqtli aksiyalar (katta chegirmasi birinchi). */
  promotions: Promotion[]
  onOpenCategory: (category: string) => void
  unreadNotificationsCount: number
  /** Admin qo'shgan bannerlar — asosiy bannerdan keyin karuselda. */
  banners: HomeBanner[]
  onOpenSection: (id: string) => void
  onOpenProduct: (id: string) => void
  /** «Yetkazib berish bepul» bannerini bosganda (savat yoki katalog). */
  onTimerShop: () => void
  /** Konkurs kartasi — taklif havolasi uchun (Telegram ID). */
  userId: number | null
  /** Mijozning birinchi saqlangan manzili — qalpoqda ko'rinadi. */
  address: Address | null
}

export function HomePage({
  products, categories, loading, promotions, onSearch, onNavigate,
  onOpenCategory, unreadNotificationsCount, banners, onOpenSection, onOpenProduct, onTimerShop, userId, address, ...productActions
}: Props) {
  const t = useT()
  const { lang } = useI18n()

  const storiesRef = useRef<HTMLDivElement>(null)
  /*
   * Faqat admin «Mashhur» deb belgilaganlar, admin tartibida.
   * Hech biri belgilanmagan bo'lsa bo'lim ko'rsatilmaydi — tasodifiy
   * mahsulotlarni «mashhur» deb ko'rsatish mijozni chalg'itadi.
   */
  const popular = useMemo(
    () => products
      .filter((p) => p.popular)
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)),
    [products],
  )

  /*
   * Doirachalar: avval asosiy yo'nalishlar (doim bor), keyin bazadagi
   * mayda kategoriyalar. Bittasi ham takrorlanmaydi.
   */
  const stories = useMemo(() => [
    ...MAIN_LINES.map((line) => ({ key: line.name, name: line.name, label: categoryLabel(line, lang), icon: line.icon })),
    ...categories
      .filter((c) => !isMainLine(c.name))
      .map((c) => ({ key: c.id, name: c.name, label: categoryLabel(c, lang), icon: c.icon })),
  ], [categories, lang])
  useAutoScroll(storiesRef, { speed: 14, enabled: stories.length > 5 })
  useReveal([loading, popular.length, stories.length])

  /** Banner bosilganda — admin tanlagan joy ochiladi. */
  const openBanner = (b: HomeBanner) => {
    if (b.target === 'catalog') onNavigate('catalog')
    else if (b.target === 'category') onOpenCategory(b.value)
    else if (b.target === 'section') onOpenSection(b.value)
    else if (b.target === 'product') onOpenProduct(b.value)
    else if (b.target === 'url' && /^https?:\/\//i.test(b.url)) openExternalLink(b.url)
  }

  /*
   * Banner rasmi — doimiy surat emas, bazadagi haqiqiy mahsulotlar:
   * uchta mashhur mahsulot oq «polaroid» kartochkalarda yelpig'ich bo'lib
   * turadi. Mahsulot almashsa banner ham o'zi yangilanadi.
   */
  const fan = useMemo(
    () => [...popular, ...products].filter((p) => productThumb(p)).slice(0, 3),
    [popular, products],
  )

  /* Asosiy banner — anor qizil karta, chetida atlas lentasi */
  const defaultHero = (
    <div className="atlas-promo">
      <div className="atlas-promo__text">
        <span className="atlas-promo__badge">{t('home.heroBadge')}</span>
        <h2 className="atlas-promo__title">{t('home.heroTitle')}</h2>
        <p className="atlas-promo__sub">{t('home.heroSubtitle')}</p>
        <button onClick={() => onNavigate('catalog')} className="atlas-promo__cta">
          {t('home.heroCta')} <ArrowIcon size={16} />
        </button>
      </div>
      <div className="atlas-fan" aria-hidden="true">
        {fan.length > 0
          ? fan.map((p, i) => (
            <span key={p.id} className={'atlas-fan__card atlas-fan__card--' + i}>
              <img src={productThumb(p)} alt="" decoding="async" />
            </span>
          ))
          : <span className="atlas-fan__empty"><SnowIcon size={64} /></span>}
        <span className="atlas-fan__temp"><SnowIcon size={13} /> −18°C</span>
      </div>
    </div>
  )

  return (
    <>
      {/* Atlas qalpoq: manzil, salomlashuv, bildirishnoma va sevimlilar */}
      <header className="atlas-hero">
        <div className="atlas-hero__bar">
          <button className="atlas-addr" onClick={() => onNavigate('addresses')}>
            <span className="atlas-addr__pin"><PinIcon size={19} /></span>
            <span className="min-w-0">
              <b className="atlas-addr__line">
                {address ? (address.name || address.address) : t('home.addressFallback')}
                <ChevronIcon size={14} />
              </b>
              <small className="atlas-addr__hint">{address ? t('home.deliveryHint') : t('home.addressHint')}</small>
            </span>
          </button>
          <button className="atlas-glass-btn" aria-label={t('notifications.title')} onClick={() => onNavigate('notifications')}>
            <BellIcon size={21} />
            {unreadNotificationsCount > 0 && <span className="atlas-glass-btn__dot" />}
          </button>
          <button className="atlas-glass-btn" aria-label={t('favorites.title')} onClick={() => onNavigate('favorites')}>
            <HeartIcon size={21} />
          </button>
        </div>
        <h1 className="atlas-hero__title">
          {t('home.greeting')}<br /><em>{t('home.greetingCity')}</em>
        </h1>
        <p className="atlas-hero__sub">{t('home.greetingSub')}</p>
      </header>

      {/* Qidiruv — qalpoq chetiga «tushib» turadi */}
      <div className="atlas-search">
        <button onClick={onSearch} className="atlas-search__field">
          <SearchIcon size={20} />
          <span className="truncate">{t('home.searchPlaceholder')}</span>
        </button>
        <button onClick={() => onNavigate('catalog')} className="atlas-search__go" aria-label={t('nav.catalog')}>
          <FilterIcon size={20} />
        </button>
      </div>

      {/* Yo'nalish va kategoriyalar — «story» doirachalari */}
      <section className="mt-5" data-reveal>
        <div ref={storiesRef} className="atlas-stories scrollbar-none">
          {stories.map((story, index) => {
            const Icon = categoryIcon(story.icon, story.name)
            return (
              <button
                key={story.key}
                onClick={() => onOpenCategory(story.name)}
                className={'atlas-story atlas-story--' + STORY_TONES[index % STORY_TONES.length]}
              >
                <span className="atlas-story__ring">
                  <span className="atlas-story__disc"><Icon size={30} /></span>
                  {story.name === PROMO_LINE && (
                    <span className="atlas-story__tag">{lang === 'ru' ? 'Акция' : 'Aksiya'}</span>
                  )}
                </span>
                <span className="atlas-story__label" lang={lang}>{story.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* «Yetkazib berish bepul» — sanoq tugaguncha */}
      <FreeDeliveryBanner onShop={onTimerShop} />

      {/* Konkurs — admin → «Konkurs» */}
      <GiveawayCard userId={userId} />

      {/* Ishlayotgan aksiya — eng katta chegirmasi bilan */}
      {promotions[0] && (
        <section className="px-4 pt-4 sm:px-10" style={{ animation: 'fadeInUp 0.4s ease' }}>
          <PromoBanner
            promotion={promotions[0]}
            onOpen={() =>
              promotions[0].target === 'category' && promotions[0].targetIds[0]
                ? onOpenCategory(promotions[0].targetIds[0])
                : onNavigate('catalog')
            }
          />
        </section>
      )}

      {/* Banner: asosiysi doim birinchi; admin qo'shgan bannerlar bo'lsa —
          karusel, har 5 soniyada o'ngga suriladi */}
      <section className="mx-4 mt-5 sm:mx-10">
        {banners.length > 0
          ? (
            <HeroCarousel
              slides={[
                defaultHero,
                ...banners.map((b) => <HeroSlide key={b.id} banner={b} lang={lang} onOpen={() => openBanner(b)} />),
              ]}
            />
          )
          : defaultHero}
      </section>

      {/* Mashhur mahsulotlar — faqat admin belgilaganlar, ikki ustunli setka */}
      {(loading || popular.length > 0 || products.length === 0) && (
      <section className="px-4 pb-36 pt-7 sm:px-10">
        <div className="atlas-section-head" data-reveal>
          <h2 className="section-title">{t('home.popular')}</h2>
          <button onClick={() => onNavigate('catalog')} className="atlas-link">
            {t('home.seeAll')} <ArrowIcon size={14} />
          </button>
        </div>

        {loading ? (
          <ProductGridSkeleton count={4} />
        ) : popular.length > 0 ? (
          <div className="mt-4 grid grid-flow-row-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product.id} product={product} {...productActions} />
            ))}
          </div>
        ) : (
          <div className="atlas-empty mt-6">
            <span className="atlas-empty__icon"><PotIcon size={30} /></span>
            <p className="mt-4 font-bold" style={{ color: 'var(--ink-2)' }}>{t('home.emptyTitle')}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{t('home.emptyText')}</p>
          </div>
        )}
      </section>
      )}
    </>
  )
}
