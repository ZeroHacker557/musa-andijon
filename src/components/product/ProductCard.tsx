import { CartIcon, HeartIcon, MinusIcon, PlusIcon, SetIcon } from '../icons/AtlasIcons'
import { dropIntoCart } from '../../utils/cart-drop'
import { heartBurst } from '../../utils/burst'
import { markHero } from '../../utils/view-transition'
import { useState } from 'react'
import { formatPrice } from '../../data'
import { productPhoto, productThumb } from '../../utils/product-image'
import { ProductImage } from './ProductImage'
import { useT } from '../../i18n'
import type { Product, ProductActions } from '../../types/domain'

type Props = ProductActions & { product: Product; compact?: boolean }

export function ProductCard({ product, onOpen, onAddToCart, cartQtyOf, onChangeQty, likedIds, onToggleLike, compact = false }: Props) {
  const t = useT()
  const favourite = likedIds.includes(product.id)
  // Kartochkada kichik nusxa: ekranda ~170px, katta faylga hojat yo'q
  const imgSrc = productThumb(product)
  const [imgError, setImgError] = useState(false)
  const soldOut = product.stock === 0
  const qty = cartQtyOf(product)
  const weight = product.sizes?.[0]
  // Set: nechta mahsulot va alohida olinganda qancha bo'lardi
  const setCount = product.bundleItems?.reduce((sum, line) => sum + line.quantity, 0) ?? 0
  const setValue = product.bundleValue && product.bundleValue > product.price ? product.bundleValue : null
  // Set kartochkasi toza turadi: yurakcha va chegirma foizi faqat set sahifasining ichida
  const isSet = setCount > 0 || Boolean(product.bundle?.length)
  /** Raqam valyutasiz — set yorlig'ida joy tor. */
  const digits = (amount: number) => Math.round(amount).toLocaleString('ru-RU').replace(/\s/g, ' ')

  /** Savatga qo'shish yoki (qo'shilgan bo'lsa) «− soni +» — ikkala ko'rinishda bir xil. */
  const buy = qty > 0 ? (
    <div className="qty-stepper" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChangeQty(product, -1) }}
        aria-label={t('cart.decrease')}
      >
        <MinusIcon size={16} />
      </button>
      {/* key: son o'zgarganda element qayta chiziladi va animatsiya takrorlanadi */}
      <span key={qty} aria-live="polite">{qty}</span>
      <button
        type="button"
        disabled={soldOut}
        onClick={(e) => { e.stopPropagation(); dropIntoCart(e.currentTarget); onChangeQty(product, 1) }}
        aria-label={t('cart.increase')}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  ) : (
    <button
      className="add-button"
      disabled={soldOut}
      onClick={(e) => { e.stopPropagation(); dropIntoCart(e.currentTarget); onAddToCart(product) }}
      aria-label={soldOut ? t('product.soldOut') : t('product.addToCart')}
    >
      <PlusIcon size={19} strokeWidth={2.6} />
    </button>
  )

  /*
   * Set — alohida, keng kartochka: katalog to'rida ikki mahsulot o'rnini
   * egallaydi (styles.css → .product-card--set), rasm 16:9. Rasm boshqa
   * nisbatda bo'lsa qirqilmaydi — yon tomonlari o'sha rasmning xira
   * nusxasi bilan to'ladi. Gorizontal qatorda (compact) oddiy kartochka.
   */
  if (isSet && !compact) {
    const open = (e: React.MouseEvent<HTMLElement>) => {
      markHero(e.currentTarget.closest('article')?.querySelector('.product-card-image') ?? null)
      onOpen(product)
    }
    const saving = setValue ? setValue - product.price : 0
    const faces = product.bundleItems?.slice(0, 4) ?? []
    const moreFaces = (product.bundleItems?.length ?? 0) - faces.length

    return (
      <article className="product-card product-card--set" data-fly-source data-product-id={product.id}>
        <button className="set-card__media-btn" onClick={open} aria-label={product.name}>
          <div className={'product-card-image set-card__media ' + (soldOut ? 'sold-out' : '')}>
            {imgSrc && !imgError ? (
              <>
                <span className="set-card__blur" style={{ backgroundImage: `url("${imgSrc}")` }} aria-hidden="true" />
                {/* Keng kartochka — o'rta nusxa (~1200px), kichigi kelguncha o'rnida */}
                <ProductImage
                  src={productPhoto(product) || imgSrc}
                  placeholder={imgSrc}
                  alt={product.name}
                  onError={() => setImgError(true)}
                />
              </>
            ) : (
              <div className="product-card-placeholder"><SetIcon size={40} /></div>
            )}
            <span className="set-card__ribbon"><SetIcon size={13} strokeWidth={2.6} /> SET</span>
            {soldOut ? (
              <span className="set-card__save is-muted">{t('product.soldOut')}</span>
            ) : saving > 0 && (
              <span className="set-card__save">{t('product.setSave', { amount: formatPrice(saving) })}</span>
            )}
          </div>
        </button>

        <div className="set-card__row">
          {/* Ma'lumot qismi ham bosiladi; klaviatura uchun yuqoridagi rasm tugmasi yetadi */}
          <button className="set-card__info" onClick={open} tabIndex={-1} aria-hidden="true">
            <h3 className="product-card-name">{product.name}</h3>
            <span className="set-card__meta">
              {faces.length > 0 && (
                <span className="set-card__faces">
                  {faces.map((line) => (
                    <img key={line.product.id} src={productThumb(line.product)} alt="" loading="lazy" />
                  ))}
                  {moreFaces > 0 && <b>+{moreFaces}</b>}
                </span>
              )}
              {t('product.setItems', { n: setCount })}
            </span>
          </button>

          <div className="set-card__buy">
            <div className="set-price">
              {setValue && (
                <p className="set-price__was">
                  {t('product.setWas')} <s>{digits(setValue)}</s>
                </p>
              )}
              <p className="set-price__tag" aria-label={formatPrice(product.price)}>
                {digits(product.price)} <small>{t('common.currency')}</small>
              </p>
            </div>
            {buy}
          </div>
        </div>
      </article>
    )
  }

  const openCard = (e: React.MouseEvent<HTMLElement>) => {
    // Rasm shu yerdan mahsulot sahifasiga kattalashib o'tadi
    markHero(e.currentTarget.closest('article')?.querySelector('.product-card-image') ?? null)
    onOpen(product)
  }
  const weightText = setCount > 0
    ? t('product.setItems', { n: setCount })
    : [weight, product.pack ? t('product.pack', { count: product.pack }) : ''].filter(Boolean).join(' · ')

  return (
    // data-fly-source — savatga uchadigan rasm shu kartadan olinadi;
    // data-product-id — orqaga qaytishda rasm shu kartaga qaytib kiradi
    <article className={'product-card group ' + (compact ? 'compact' : '')} data-fly-source data-product-id={product.id}>
      {/* Rasm «vitrina»si: ustida vazn yorlig'i, burchagida «+» tugmasi */}
      <div className="pc-media">
        <button className="product-card-body" onClick={openCard} aria-label={product.name}>
          <div className={'product-card-image ' + (soldOut ? 'sold-out' : '')}>
            {imgSrc && !imgError ? (
              <ProductImage src={imgSrc} alt={product.name} onError={() => setImgError(true)} />
            ) : (
              <div className="product-card-placeholder">
                <CartIcon size={36} />
              </div>
            )}
          </div>
        </button>

        {!isSet && (
          <button
            className={'product-card-like ' + (favourite ? 'liked' : '')}
            onClick={(e) => {
              e.stopPropagation()
              // Qo'shilayotganda — yurakchalar sochiladi (olib tashlashda emas)
              if (!favourite) heartBurst(e.currentTarget)
              onToggleLike(product.id)
            }}
            aria-label={t('favorites.title')}
            aria-pressed={favourite}
          >
            <HeartIcon size={18} filled={favourite} />
          </button>
        )}

        {soldOut ? (
          <span className="product-card-badge muted">{t('product.soldOut')}</span>
        ) : product.discount && !isSet ? (
          <span className="product-card-badge">{product.discount}</span>
        ) : null}

        {weightText && <span className="pc-chip">{weightText}</span>}

        {/* Hali savatda bo'lmasa — rasm burchagidagi anor «+» */}
        {qty === 0 && (
          <button
            className="pc-add"
            disabled={soldOut}
            onClick={(e) => { e.stopPropagation(); dropIntoCart(e.currentTarget); onAddToCart(product) }}
            aria-label={soldOut ? t('product.soldOut') : t('product.addToCart')}
          >
            <PlusIcon size={20} />
          </button>
        )}
      </div>

      {/* Ma'lumot qismi ham bosiladi; klaviatura uchun yuqoridagi rasm tugmasi yetadi */}
      <button className="product-card-info pc-info" onClick={openCard} tabIndex={-1} aria-hidden="true">
        <h3 className="product-card-name">{product.name}</h3>
      </button>

      <div className="product-card-footer">
        {isSet ? (
          /* Set: narx yorlig'i, tepasida — tarkibni alohida olsa qancha bo'lardi */
          <div className="product-card-price-block set-price">
            {setValue && !compact && (
              <p className="set-price__was">
                {t('product.setWas')} <s>{digits(setValue)}</s>
              </p>
            )}
            {/* Kartochkada joy tor — yorliqda faqat raqam, to'liq narx ekran o'quvchi uchun */}
            <p className="set-price__tag" aria-label={formatPrice(product.price)}>
              {digits(product.price)}
            </p>
          </div>
        ) : (
          <div className="product-card-price-block">
            <p className="product-card-price">
              {digits(product.price)} <small>{t('common.currency')}</small>
            </p>
            {product.oldPrice && !compact && (
              <p className="product-card-old-price">{formatPrice(product.oldPrice)}</p>
            )}
          </div>
        )}
        {/* Savatga qo'shilgan bo'lsa — shu yerning o'zida «− soni +» */}
        {qty > 0 && buy}
      </div>
    </article>
  )
}
