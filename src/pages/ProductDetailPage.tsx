import { useEffect, useState } from 'react'
import { dropIntoCart } from '../utils/cart-drop'
import { heartBurst } from '../utils/burst'
import { PromoTimer } from '../components/promo/PromoTimer'
import { productOriginal, productPhoto, productThumb } from '../utils/product-image'
import { createPortal } from 'react-dom'
import { ZoomIn } from 'lucide-react'
import { BackIcon, BoxIcon, CartIcon, CatalogIcon, HeartIcon, MinusIcon, PlusIcon, SnowIcon, TruckIcon } from '../components/icons/AtlasIcons'
import { formatPrice } from '../data'
import { ProductImage } from '../components/product/ProductImage'
import { CartButton } from '../components/ui/CartButton'
import { ImageLightbox } from '../components/ui/ImageLightbox'
import { track } from '../lib/track'
import { useT } from '../i18n'
import type { Product } from '../types/domain'
import { PageTitle } from '../components/layout/PageTitle'

type Props = {
  product: Product
  onAddToCart: (product: Product, size?: string, color?: string) => void
  onBack: () => void
  likedIds: number[]
  onToggleLike: (id: number) => void
  onOpenCart: () => void
  cartCount: number
  /** Set tarkibidagi mahsulot bosilganda — o'sha mahsulot ochiladi. */
  onOpenProduct?: (product: Product) => void
  /** Savat yoki qidiruv ochiq bo'lsa pastki panel ularni to'sib qo'ymasligi kerak. */
  hideBottomBar?: boolean
}

export function ProductDetailPage({
  product, onAddToCart, onBack, likedIds, onToggleLike, onOpenCart, cartCount, hideBottomBar = false, onOpenProduct,
}: Props) {
  const t = useT()
  const [activeImage, setActiveImage] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [count, setCount] = useState(1)

  const colorsList = product.colors
    || (product.color ? product.color.split(',').map((c) => c.trim()).filter(Boolean) : [])
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
  const [selectedColor, setSelectedColor] = useState(colorsList[0] || '')

  const favourite = likedIds.includes(product.id)
  const images = product.images || []
  const stock = product.stock
  const soldOut = stock === 0
  const lowStock = typeof stock === 'number' && stock > 0 && stock <= 5
  const maxCount = typeof stock === 'number' && stock > 0 ? Math.min(stock, 99) : 99


  // Analitika: mahsulot ko'rildi (12-band)
  useEffect(() => {
    track('view', product.id)
  }, [product.id])

  const handleAddToCart = () => {
    if (soldOut) return
    // Katta rasm tepadagi savat belgisiga uchadi
    dropIntoCart(document.querySelector('.pd-hero'))
    for (let i = 0; i < count; i++) onAddToCart(product, selectedSize, selectedColor)
    setCount(1)
  }

  return (
    <>
      {/* Atlas sahna: qalpoq va rasm bitta siyoh-ko'k maydonda, rasm oq «likopcha» ichida */}
      <div className="pd-stage">
      <header className="page-head page-head--flat flex items-center justify-between px-5 pt-8 sm:px-10 page-animate">
        <button onClick={onBack} className="back-button" aria-label={t('common.back')}>
          <BackIcon size={20} />
        </button>
        <PageTitle as="h2" className="text-lg font-bold">{t('product.title')}</PageTitle>
        <div className="ml-auto flex gap-1">
          <button
            onClick={(e) => {
              if (!favourite) heartBurst(e.currentTarget)
              onToggleLike(product.id)
            }}
            className="icon-button"
            style={{ color: favourite ? 'var(--brand)' : undefined }}
            aria-label={t('favorites.title')}
            aria-pressed={favourite}
          >
            <HeartIcon size={21} fill={favourite ? 'currentColor' : 'none'} />
          </button>
          <CartButton count={cartCount} onClick={onOpenCart} />
        </div>
      </header>

      {/* Rasm galereyasi */}
      <section className="pd-stage__gallery relative mx-auto max-w-3xl px-5" style={{ animation: 'fadeInUp 0.4s ease' }}>
        {product.discount && !soldOut && (
          <span
            className="absolute left-8 top-3 z-10 rounded-full px-3 py-1 text-xs font-extrabold"
            style={{ background: 'var(--brand)', color: 'var(--brand-ink)', boxShadow: 'var(--shadow-brand)' }}
          >
            {product.discount}
          </span>
        )}
        {/*
          * Rasm ABSOLYUT joylashtirilgan, `place-items-center` grid ichida emas.
          * Grid markazlashtirilganda element cho'zilmaydi va bolaning
          * `height: 100%` foizi hal bo'lmay `auto` ga tushadi — bo'yi baland
          * rasm konteynerdan oshib ketib, `overflow-hidden` uni pastidan
          * kesib qo'yadi. `inset-0` esa aniq quti beradi, `object-contain`
          * shu qutiga to'liq sig'diradi.
          */}
        {/* pd-hero — kartadagi rasm shu yerga kattalashib o'tadi (view-transition.ts) */}
        <div
          data-fly-source
          className={
            'pd-hero relative mx-auto w-full overflow-hidden '
            // Set rasmi 16:9 — maydon ham shunday, tepa-pastda oq bo'shliq qolmasin
            + (product.bundle?.length ? 'aspect-video' : 'h-[280px] sm:h-[380px]')
          }
          style={{ opacity: soldOut ? 0.55 : 1 }}
        >
          {images[activeImage] ? (
            <button
              className="absolute inset-0 size-full"
              style={{ cursor: 'zoom-in' }}
              onClick={() => setZoomed(true)}
              aria-label={t('product.zoom')}
            >
              {/* Kartadagidek: rasm to'liq ko'rinadi, quti xira fon bilan to'ladi.
                  Kattalashtirish uchun bosiladi. */}
              {/* O'rta nusxa (~1200px); kelguncha kartochkadagi kichik nusxa
                  ko'rinib turadi — u keshda, sahifa ochilishi bilan chiqadi. */}
              <ProductImage
                src={productPhoto(product, activeImage)}
                placeholder={productThumb(product, activeImage)}
                alt={product.name}
                loading="eager"
              />
              <span className="detail-zoom-hint">
                <ZoomIn size={18} />
              </span>
            </button>
          ) : (
            <span className="absolute inset-0 grid place-items-center">
              <CartIcon size={56} style={{ color: 'var(--faint)' }} />
            </span>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={'dot ' + (activeImage === i ? 'active' : '')}
                aria-label={`${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>
      </div>

      {/* Ma'lumot «varag'i» — sahna chetiga chiqib turadi */}
      <section className="pd-sheet page-animate">
        <div className="pd-sheet__tags">
          <span className="pd-tag">{product.category}</span>
          {product.promotion && <PromoTimer endsAt={product.promotion.endsAt} />}
        </div>

        <h1 className="pd-title" style={{ textWrap: 'balance' }}>
          {product.name}
        </h1>

        <div className="pd-pricebar">
          <div className="min-w-0">
            <strong className="pd-price">{formatPrice(product.price)}</strong>
            {product.oldPrice && <del className="pd-old">{formatPrice(product.oldPrice)}</del>}
            {product.pack && (
              <p className="pd-unit">
                {t('product.pack', { count: product.pack })} · {t('product.unitPrice', { price: formatPrice(Math.round(product.price / product.pack)) })}
              </p>
            )}
          </div>
        </div>
        {product.promotion && <p className="pd-promo-title">{product.promotion.title}</p>}

        {/* Asosiy faktlar — plitkalar */}
        <div className="pd-facts">
          <div className="pd-fact pd-fact--osmon">
            <SnowIcon size={20} />
            <small>{t('product.factStorage')}</small>
            <b>−18°C</b>
          </div>
          <div className="pd-fact pd-fact--anor">
            <TruckIcon size={20} />
            <small>{t('product.factDelivery')}</small>
            <b>{t('product.factDeliveryValue')}</b>
          </div>
          {(product.sizes?.[0] || product.pack) && (
            <div className="pd-fact pd-fact--zafar">
              <BoxIcon size={20} />
              <small>{t('product.factPack')}</small>
              <b>{product.pack ? t('product.pack', { count: product.pack }) : product.sizes?.[0]}</b>
            </div>
          )}
          <div className="pd-fact pd-fact--atlas">
            <CatalogIcon size={20} />
            <small>{t('product.factStock')}</small>
            <b>
              {soldOut
                ? t('product.soldOut')
                : lowStock
                  ? t(product.pack ? 'product.lowStockPack' : 'product.lowStock', { count: stock! })
                  : t('product.inStock')}
            </b>
          </div>
        </div>
      </section>

      <section className="mx-5 pb-40 sm:mx-10 page-animate">
        {/* Set tarkibi — narx setning o'zi, tarkib nima kirishini ko'rsatadi */}
        {!!product.bundleItems?.length && (
          <section className="set-box">
            <div className="set-box__head">
              <b>{t('product.setContents')}</b>
              <span>{t('product.setItems', { n: product.bundleItems.reduce((s, l) => s + l.quantity, 0) })}</span>
            </div>
            <ul className="set-box__list">
              {product.bundleItems.map(({ product: item, quantity }, i) => (
                <li key={item.id} style={{ animationDelay: `${i * 50}ms` }}>
                  <button className="set-box__item" onClick={() => onOpenProduct?.(item)} disabled={!onOpenProduct}>
                    {productThumb(item) ? <img src={productThumb(item)} alt="" loading="lazy" /> : <span className="set-box__noimg" />}
                    <span className="min-w-0 flex-1 text-left">
                      <b className="block truncate">{item.name}</b>
                      <span>{formatPrice(item.price)}{item.sizes?.[0] ? ` · ${item.sizes[0]}` : ''}</span>
                    </span>
                    <span className="set-box__qty">×{quantity}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!!product.bundleValue && product.bundleValue > product.price && (
              <div className="set-box__sum">
                <span>{t('product.setSeparately')}: <del>{formatPrice(product.bundleValue)}</del></span>
                <b>{t('product.setSave', { amount: formatPrice(product.bundleValue - product.price) })}</b>
              </div>
            )}
          </section>
        )}

        {colorsList.length > 0 && (
          <div className="pd-block">
            <h3 className="pd-block__title">{t('product.chooseColor')}</h3>
            <div className="pd-seg">
              {colorsList.map((c) => (
                <button
                  onClick={() => setSelectedColor(c)}
                  className={'pd-seg__item' + (selectedColor === c ? ' is-on' : '')}
                  key={c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.sizes && product.sizes.length > 0 && (
          <div className="pd-block">
            <h3 className="pd-block__title">{t('product.chooseSize')}</h3>
            <div className="pd-seg">
              {product.sizes.map((size) => (
                <button
                  onClick={() => setSelectedSize(size)}
                  className={'pd-seg__item' + (selectedSize === size ? ' is-on' : '')}
                  key={size}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {product.description && (
          <div className="pd-block">
            <h3 className="pd-block__title">{t('product.about')}</h3>
            <p className="pd-desc">{product.description}</p>
          </div>
        )}

      </section>

      {/* Pastki panel — modal ochiq bo'lsa chizilmaydi */}
      {!hideBottomBar && createPortal(
        <div className="pd-buybar">
          <div className="pd-buybar__island">
            <div className="hidden px-2 sm:block">
              <b className="pd-buybar__price">{formatPrice(product.price)}</b>
            </div>
            <div className="pd-buybar__stepper">
              <button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="grid size-8 place-items-center rounded-[10px] transition active:scale-90"
                aria-label="-"
              >
                <MinusIcon size={18} />
              </button>
              <b className="w-5 text-center">{count}</b>
              <button
                onClick={() => setCount(Math.min(maxCount, count + 1))}
                disabled={count >= maxCount}
                className="grid size-8 place-items-center rounded-[10px] transition active:scale-90 disabled:opacity-40"
                aria-label="+"
              >
                <PlusIcon size={18} />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={soldOut} className="btn-primary pd-add ml-auto flex-1 py-3.5">
              <CartIcon size={19} />
              <span className="truncate text-sm sm:text-base">
                {soldOut ? t('product.soldOut') : t('product.addToCart')}
              </span>
            </button>
            {/* Savat — soni ustida; qo'shilgan mahsulot rasmi aynan shu yerga uchadi */}
            <button
              type="button"
              onClick={onOpenCart}
              className={'pd-cart ' + (cartCount > 0 ? 'has-items' : '')}
              data-cart-target="primary"
              aria-label={`${t('cart.title')}${cartCount ? ` (${cartCount})` : ''}`}
            >
              <CartIcon size={22} strokeWidth={2.2} />
              {cartCount > 0 && (
                <span key={cartCount} className="pd-cart__badge">{cartCount > 99 ? '99+' : cartCount}</span>
              )}
            </button>
          </div>
        </div>,
        document.body,
      )}

      {zoomed && images.length > 0 && (
        <ImageLightbox
          images={images.map((_, i) => productOriginal(product, i))}
          index={activeImage}
          alt={product.name}
          onIndexChange={setActiveImage}
          onClose={() => setZoomed(false)}
        />
      )}
    </>
  )
}
