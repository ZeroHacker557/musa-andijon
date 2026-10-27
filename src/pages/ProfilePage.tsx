import type { ComponentType } from 'react'
import { datedNumber } from '../utils/order-label'
import { Bike } from 'lucide-react'
import { BellIcon, ChevronIcon, HelpIcon, LanguageIcon, MoonIcon, OrdersIcon, PinIcon, SunIcon, UserIcon , type IconProps } from '../components/icons/AtlasIcons'
import { formatPrice } from '../data'
import { formatOrderDate } from '../utils/date'
import { IconButton } from '../components/ui/IconButton'
import { OrderImages } from '../components/order/OrderImages'
import { OrderCardSkeleton, TextSkeleton } from '../components/ui/LoadingSkeletons'
import { getTelegramUser } from '../utils/telegram'
import { useI18n, type TranslationKey } from '../i18n'
import type { ThemeMode } from '../utils/theme'
import type { AppPage, Order, UserProfile } from '../types/domain'
import { PageTitle } from '../components/layout/PageTitle'

type Option = {
  icon: ComponentType<IconProps>
  titleKey: TranslationKey
  subKey: TranslationKey
  page?: AppPage
  value?: string
}

type Props = {
  profile: UserProfile | null
  orders: Order[]
  /** Buyurtmalar kelmaguncha statistika «0» emas, skelet. */
  ordersReady: boolean
  theme: ThemeMode
  onToggleTheme: () => void
  onNavigate: (page: AppPage) => void
  onNotify: (msg: string) => void
  /** Faqat kuryerlarga — do'kondan kuryer sahifasiga qaytish. */
  onOpenCourier?: () => void
}

export function ProfilePage({ profile, orders, ordersReady, theme, onToggleTheme, onNavigate, onNotify, onOpenCourier }: Props) {
  const { t, lang } = useI18n()
  const tgUser = getTelegramUser()

  const userName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`
    : tgUser
      ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`
      : t('nav.profile')

  const userPhone = profile?.phone
    || (tgUser?.username ? `@${tgUser.username}` : t('profile.connected'))

  const photo = profile?.photo_url || tgUser?.photo_url
  const lastOrder = orders[0]

  const options: Option[] = [
    { icon: UserIcon, titleKey: 'profile.personal', subKey: 'profile.personalSub', page: 'profile_edit' },
    { icon: PinIcon, titleKey: 'profile.addresses', subKey: 'profile.addressesSub', page: 'addresses' },
    { icon: OrdersIcon, titleKey: 'profile.history', subKey: 'profile.historySub', page: 'orders' },
    {
      icon: LanguageIcon,
      titleKey: 'profile.language',
      subKey: 'profile.languageSub',
      page: 'language',
      value: lang === 'ru' ? 'Русский' : "O'zbekcha",
    },
    { icon: HelpIcon, titleKey: 'profile.help', subKey: 'profile.helpSub', page: 'support' as const },
  ]

  const isDark = theme === 'dark'

  const stats = [
    { label: t('profile.statOrders'), value: orders.length },
    {
      label: t('profile.statActive'),
      value: orders.filter((o) => o.status === 'Yangi' || o.status === 'Qabul qilindi' || o.status === 'Yetkazilmoqda').length,
    },
    { label: t('profile.statDone'), value: orders.filter((o) => o.status === 'Yetkazildi').length },
  ]

  return (
    <>
      {/* Atlas qalpoq ichida — mijoz kartochkasi */}
      <header className="page-head profile-cap px-5 pt-8 sm:px-10">
        <div className="profile-cap__row">
          <PageTitle className="text-3xl font-extrabold">{t('profile.title')}</PageTitle>
          {/* ml-auto: to'liq ekranda nom tepaga ketgach ham tugma o'ngda qolsin */}
          <IconButton label={t('notifications.title')} onClick={() => onNavigate('notifications')} className="ml-auto">
            <BellIcon />
          </IconButton>
        </div>
        <button className="profile-cap__me" onClick={() => onNavigate('profile_edit')}>
          <span className="profile-cap__avatar">
            {photo ? <img src={photo} alt="" /> : <UserIcon size={32} />}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <b className="profile-cap__name">{userName}</b>
            <small className="profile-cap__sub">{userPhone}</small>
          </span>
          <span className="profile-cap__edit" aria-hidden="true"><ChevronIcon size={18} /></span>
        </button>
      </header>

      {/* Statistika — qalpoq chetiga tushib turgan bitta karta */}
      <section className="profile-stats" style={{ animation: 'fadeInUp 0.4s ease 0.05s both' }}>
        {stats.map(({ label, value }, i) => (
          <div key={label} className={'profile-stats__cell profile-stats__cell--' + i}>
            {ordersReady ? (
              <b style={{ animation: 'fadeIn 0.3s ease' }}>{value}</b>
            ) : (
              // Balandlik raqam bilan bir xil — kelganda karta sakramaydi
              <span className="flex h-8 items-center justify-center">
                <TextSkeleton className="h-6 w-8" />
              </span>
            )}
            <small>{label}</small>
          </div>
        ))}
      </section>

      {onOpenCourier && (
        <button
          className="crr-option crr-option--brand mx-5 mt-3 w-[calc(100%-2.5rem)] sm:mx-10 sm:w-[calc(100%-5rem)]"
          onClick={onOpenCourier}
          style={{ animation: 'fadeInUp 0.4s ease 0.03s both' }}
        >
          <span className="crr-option__icon"><Bike size={19} /></span>
          <span className="min-w-0 flex-1 text-left">
            <b className="block text-sm" style={{ color: 'var(--ink)' }}>{t('courier.backToCourier')}</b>
            <span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('courier.backToCourierSub')}</span>
          </span>
          <ChevronIcon size={18} style={{ color: 'var(--muted)' }} />
        </button>
      )}

      {/* Oxirgi buyurtma — kelguncha skelet */}
      {!ordersReady && (
        <section className="px-5 pt-7 sm:px-10">
          <TextSkeleton className="mb-4 h-6 w-40" />
          <OrderCardSkeleton />
        </section>
      )}
      {ordersReady && lastOrder && (
        <section className="px-5 pt-7 sm:px-10" style={{ animation: 'fadeInUp 0.4s ease 0.1s both' }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">{t('profile.lastOrder')}</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-sm font-bold transition hover:opacity-70"
              style={{ color: 'var(--brand)' }}
            >
              {t('home.seeAll')}
            </button>
          </div>
          <button onClick={() => onNavigate('orders')} className="order-card w-full text-left">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-extrabold" style={{ color: 'var(--ink)' }}>
                {lastOrder.products.map((p) => p.product.name).join(', ')}
              </h3>
              <p className="mt-1 text-xs font-bold" style={{ color: 'var(--muted)' }}>{datedNumber(lastOrder.orderNumber, lastOrder.orderDay, lastOrder.createdAt)}</p>
              <div className="mt-2">
                <OrderImages products={lastOrder.products} />
                <p className="mt-1 text-[11px]" style={{ color: 'var(--muted)' }}>
                  {t('orders.itemCount', { count: lastOrder.products.length })}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <strong className="block text-lg" style={{ color: 'var(--ink)' }}>{formatPrice(lastOrder.total)}</strong>
              <p className="mt-1 text-xs" style={{ color: 'var(--faint)' }}>
                {formatOrderDate(lastOrder.createdAt) || lastOrder.date}
              </p>
            </div>
          </button>
        </section>
      )}

      {/* Hisob */}
      <section className="px-5 pb-32 pt-7 sm:px-10" style={{ animation: 'fadeInUp 0.4s ease 0.15s both' }}>
        <h2 className="section-title mb-4">{t('profile.account')}</h2>
        {/* Ko'rinish — bir bosishda almashadi */}
        <button onClick={onToggleTheme} className="profile-theme">
          <span className="profile-tile__icon profile-tile__icon--atlas">
            {isDark ? <MoonIcon size={22} /> : <SunIcon size={22} />}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <b className="block text-sm" style={{ color: 'var(--ink)' }}>{t('profile.theme')}</b>
            <span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('profile.themeSub')}</span>
          </span>
          {/* Switch */}
          <span className={'profile-switch' + (isDark ? ' is-on' : '')} role="switch" aria-checked={isDark}>
            <span />
          </span>
        </button>

        <div className="profile-tiles">
          {options.map(({ icon: Icon, titleKey, subKey, page, value }, index) => (
            <button
              key={titleKey}
              onClick={() => (page ? onNavigate(page) : onNotify(`${t(titleKey)} — ${t('common.soon')}`))}
              className="profile-tile"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className={'profile-tile__icon profile-tile__icon--' + (['anor', 'zafar', 'osmon', 'atlas'][index % 4])}>
                <Icon size={22} />
              </span>
              <b className="profile-tile__title">{t(titleKey)}</b>
              <span className="profile-tile__sub">{value ?? t(subKey)}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
