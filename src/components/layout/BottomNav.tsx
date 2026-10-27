import type { ComponentType } from 'react'
import { useEffect, useRef } from 'react'
import { CartIcon, CatalogIcon, HomeIcon, OrdersIcon, UserIcon, type IconProps } from '../icons/AtlasIcons'
import { useT, type TranslationKey } from '../../i18n'
import type { AppPage } from '../../types/domain'

/**
 * Pastdagi menyu — atlas «orol».
 *
 * Ekran chetiga yopishmaydi: pastda suzib turadigan siyoh-ko'k orol,
 * o'rtasida esa ko'tarilgan anor rangli savat tugmasi.
 *
 * «Savat» ATAYLAB shu yerda, o'rtada: ilgari u faqat tepadagi kichik
 * ikonka edi va foydalanuvchilar savatni topolmasdi. «Sevimlilar» esa
 * o'rnini bo'shatib tepaga (yurak ikonkasi) ko'chdi — u kamroq
 * ishlatiladigan bo'lim.
 *
 * Savat sahifa emas, chekka oyna (CartDrawer), shuning uchun ro'yxatda
 * u alohida `cart` turi bilan turadi.
 */
type NavId = AppPage | 'cart'

const items: { id: NavId; labelKey: TranslationKey; icon: ComponentType<IconProps> }[] = [
  { id: 'home', labelKey: 'nav.home', icon: HomeIcon },
  { id: 'catalog', labelKey: 'nav.catalog', icon: CatalogIcon },
  { id: 'cart', labelKey: 'nav.cart', icon: CartIcon },
  { id: 'orders', labelKey: 'nav.orders', icon: OrdersIcon },
  { id: 'profile', labelKey: 'nav.profile', icon: UserIcon },
]

type Props = {
  page: AppPage
  onNavigate: (page: AppPage) => void
  onOpenCart: () => void
  cartOpen: boolean
  cartCount: number
  /** Holati o'zgargan, hali ko'rilmagan buyurtmalar soni. */
  ordersBadge?: number
}

export function BottomNav({ page, onNavigate, onOpenCart, cartOpen, cartCount, ordersBadge = 0 }: Props) {
  const t = useT()
  const ref = useRef<HTMLElement>(null)

  /*
   * Menyuning haqiqiy balandligi `--nav-h` ga yoziladi. U yozuvlar
   * sig'ishiga qarab o'zgaradi (tor ekranda «Bosh sahifa» ikki qatorga
   * tushadi) — menyu ustida suzadigan kartochkalar (Kuryer yo'lda) shunga
   * tayanadi va menyuni hech qachon to'smaydi.
   */
  useEffect(() => {
    const nav = ref.current
    if (!nav) return
    const root = document.documentElement
    const apply = () => root.style.setProperty('--nav-h', `${Math.ceil(nav.getBoundingClientRect().height)}px`)
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(apply)
    observer.observe(nav)
    return () => {
      observer.disconnect()
      root.style.removeProperty('--nav-h')
    }
  }, [])

  return (
    <nav ref={ref} className="bottom-nav">
      {/* Atlas «orol»: to'rt bo'lim va o'rtada ko'tarilgan anor savat */}
      <div className="bottom-nav__island">
        {items.map(({ id, labelKey, icon: Icon }) => {
          const isCart = id === 'cart'
          // Savat ochiq bo'lsa faqat savat yonadi — ostidagi sahifa emas
          const active = isCart ? cartOpen : page === id && !cartOpen
          // Savatda — mahsulotlar soni, buyurtmalarda — yangilangan buyurtmalar
          const badge = isCart ? cartCount : id === 'orders' ? ordersBadge : 0

          if (isCart) {
            return (
              <button
                key={id}
                onClick={onOpenCart}
                aria-current={active ? 'page' : undefined}
                aria-label={t(labelKey)}
                className={'nav-cart' + (active ? ' active' : '')}
              >
                {/* data-cart-target — savatga qo'shilgan mahsulot shu belgiga uchadi */}
                <span className="nav-cart__disc" data-cart-target="">
                  <Icon size={26} />
                  {badge > 0 && <span className="nav-cart__badge">{badge > 9 ? '9+' : badge}</span>}
                </span>
              </button>
            )
          }

          return (
            <button
              onClick={() => onNavigate(id as AppPage)}
              key={id}
              aria-current={active ? 'page' : undefined}
              className={'nav-item ' + (active ? 'active' : '')}
            >
              <span className="relative">
                <Icon size={23} strokeWidth={active ? 2.2 : 1.8} />
                {/* Buyurtmalarda — nechta buyurtmaning holati o'zgargan */}
                {badge > 0 && <span className="nav-item__badge nav-badge--pop">{badge > 9 ? '9+' : badge}</span>}
              </span>
              <span className="nav-item__label">{t(labelKey)}</span>
              {id === 'orders' && badge > 0 && <span className="sr-only">{t('orders.updated', { count: badge })}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
