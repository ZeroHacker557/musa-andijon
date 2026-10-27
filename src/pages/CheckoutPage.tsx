import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FreeDeliveryBar } from '../components/cart/FreeDeliveryBar'
import { useFreeDelivery } from '../hooks/use-free-delivery'
import { productThumb } from '../utils/product-image'
import { ArrowRight, Banknote, Check, Copy, CreditCard, Loader2, Lock, Pencil, MessageSquare, Phone, Send, Tag, User } from 'lucide-react'
import { BackIcon, CartIcon, PinIcon, UserIcon } from '../components/icons/AtlasIcons'
import { formatPrice } from '../data'
import { hapticFeedback } from '../utils/telegram'
import { setBackInterceptor } from '../utils/back-interceptor'
import { playSound, preloadSound } from '../utils/sound'
import { getPaymentSettings, getDeliverySettings } from '../lib/firebase'
import { apiErrorText } from '../utils/api-error'
import { apiPost } from '../lib/api'
import { useT } from '../i18n'
import type { Address, AppPage, DeliverySettings, OrderForm, PaymentSettings, Product, UserProfile } from '../types/domain'
import { PageTitle } from '../components/layout/PageTitle'
import { AddressConfirmSheet } from '../components/checkout/AddressConfirmSheet'
import { ReceiptSheet, type ReceiptUpload } from '../components/checkout/ReceiptSheet'
import { PAY_TILES, cardTileOf, providerLabel, type CardDraft } from '../utils/payment'
import { FreeDeliveryChip } from '../components/promo/FreeDeliveryTimer'
import { useDeliveryTimer } from '../hooks/use-delivery-timer'
import { PayLogo } from '../components/payment/PayLogo'

/*
 * Sahifa har ochilganda qayta yaratiladi, shuning uchun «oldin qaysi
 * manzillar bor edi» va «qaysi biri tanlangan edi» modul darajasida
 * eslab qolinadi: manzil sahifasidan qaytilganda yangi qo'shilgani o'zi
 * tanlanadi, tahrirlangani (matni o'zgargan bo'lsa ham) tanlovdan tushmaydi.
 */
let knownAddressIds: Set<string> | null = null
let pickedAddressId: string | null = null

/**
 * DEV: `?addrDemo` — Telegram'siz brauzerda profil yuklanmaydi; tasdiqlash
 * oynasini ko'rish uchun namunaviy manzillar. Production'da `null`.
 */
/** DEV: `?payDemo` — onlayn to'lov tanlovini sozlamasiz ko'rish. Production'da `false`. */
const PAY_DEMO = import.meta.env.DEV && new URLSearchParams(location.search).has('payDemo')

const DEMO_PROFILE: UserProfile | null =
  import.meta.env.DEV && new URLSearchParams(location.search).has('addrDemo')
    ? {
        id: 1,
        first_name: 'Test',
        addresses: [
          { id: 'd1', name: 'Uy', address: 'Andijon, Bobur shoh ko‘chasi, 12-uy', location: { lat: 40.7835, lng: 72.3398 } },
          { id: 'd2', name: 'Ish', address: 'Andijon, Navoiy shoh ko‘chasi, 3', location: { lat: 40.7781, lng: 72.3515 } },
        ],
      } as UserProfile
    : null

type AppliedPromo = {
  code: string
  discountPercent: number
  discount: number
  total: number
}

type Props = {
  profile: UserProfile | null
  cartProducts: { product: Product; quantity: number; size?: string; color?: string; cartKey: string }[]
  cartTotal: number
  orderForm: OrderForm
  onUpdateForm: (field: keyof OrderForm, value: unknown) => void
  /** Karta bilan to'lovda — karta ma'lumoti (faqat shu so'rov uchun). */
  onSubmit: (card?: CardDraft, receipt?: ReceiptUpload) => Promise<boolean>
  isSubmitting: boolean
  onBack: () => void
  onNavigate: (page: AppPage) => void
  /** Oxirgi buyurtmadagi manzil — shu manzil o'zi tanlanadi. */
  lastUsedAddress?: string
  /** Manzilni tahrirlash sahifasini ochadi. */
  onEditAddress: (addressId: string) => void
  /** Yangi manzil — joylashuv darhol so'raladi. */
  onAddAddress: () => void
}

/** Ovozli eslatmalar: ism / telefon / manzil kiritilmagan bo'lsa. */
const NAME_VOICE = '/sounds/name-required.mp3'
const PHONE_VOICE = '/sounds/phone-required.mp3'
const ADDRESS_VOICE = '/sounds/address-required.mp3'

export function CheckoutPage({
  cartProducts, cartTotal, orderForm, onUpdateForm, onSubmit, isSubmitting, onBack, onNavigate,
  profile: realProfile, lastUsedAddress, onEditAddress, onAddAddress,
}: Props) {
  const profile = realProfile ?? DEMO_PROFILE
  const t = useT()
  /* Qabul qiluvchi boshqa odammi — qo'shimcha maydonlar shunga qarab ochiladi */
  const [otherRecipient, setOtherRecipient] = useState(
    Boolean(orderForm.recipientName || orderForm.recipientPhone),
  )
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoError, setPromoError] = useState('')
  const [payment, setPayment] = useState<PaymentSettings | null>(null)
  const [delivery, setDelivery] = useState<DeliverySettings | null>(null)
  const { text: freeText } = useFreeDelivery()
  /** «Manzilingizni tasdiqlaysizmi?» — sahifaga har kirganda bir marta. */
  const [confirming, setConfirming] = useState(true)

  // useMemo: har renderdagi yangi bo'sh massiv effektlarni qayta ishga tushirmasin
  const addresses = useMemo(() => profile?.addresses || [], [profile?.addresses])

  useEffect(() => {
    let alive = true
    getPaymentSettings().then((s) => alive && setPayment(PAY_DEMO ? { ...s, online: true, onlineProviders: ['payme', 'click', 'card'] } : s))
    getDeliverySettings().then((s) => alive && setDelivery(s))
    return () => { alive = false }
  }, [])

  // Profil ma'lumotlari bilan avtomatik to'ldirish.
  // Render paytida emas, effekt ichida — aks holda React ogohlantiradi (F-11).
  useEffect(() => {
    if (!profile) return
    if (!orderForm.name && (profile.contactName || profile.first_name)) {
      onUpdateForm('name', profile.contactName || `${profile.first_name}${profile.last_name ? ' ' + profile.last_name : ''}`)
    }
    if (!orderForm.phone && profile.phone) {
      onUpdateForm('phone', profile.phone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const discount = appliedPromo?.discount ?? 0
  const discountedSubtotal = Math.max(cartTotal - discount, 0)
  // «Yetkazib berish bepul» taymeri ishlayotgan bo'lsa — server ham bepul qiladi
  const freeTimer = useDeliveryTimer().active
  const deliveryFee =
    delivery === null || freeTimer || (delivery.freeFrom > 0 && discountedSubtotal >= delivery.freeFrom)
      ? 0
      : delivery.fee
  const finalTotal = discountedSubtotal + deliveryFee

  /*
   * Minimal summa — mahsulotlar summasi bo'yicha (yetkazish va promokod
   * chegirmasisiz). Sozlanmagan bo'lsa 0 keladi va cheklov ishlamaydi.
   */
  const minOrder = delivery?.minOrder ?? 0
  const belowMin = minOrder > 0 && cartTotal < minOrder

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const result = await apiPost<AppliedPromo>('/api/promo', { code, subtotal: cartTotal })
      setAppliedPromo(result)
      onUpdateForm('promoCode', result.code)
    } catch (error) {
      setAppliedPromo(null)
      onUpdateForm('promoCode', undefined)
      setPromoError(apiErrorText(error, t, 'reviews.error', formatPrice))
    } finally {
      setPromoLoading(false)
    }
  }

  const handleClearPromo = () => {
    setAppliedPromo(null)
    setPromoInput('')
    setPromoError('')
    onUpdateForm('promoCode', undefined)
  }

  const chooseAddress = useCallback((address: Address) => {
    pickedAddressId = address.id
    onUpdateForm('address', address.address)
    onUpdateForm('location', address.location)
  }, [onUpdateForm])

  /*
   * Manzil O'ZI tanlanadi. Tartib:
   *   1) manzil sahifasida hozirgina qo'shilgani;
   *   2) formada turgani (tahrirlangan bo'lsa — yangilangan matni bilan);
   *   3) oxirgi buyurtmadagisi, bo'lmasa birinchisi.
   * Mijozning ko'pchiligida bitta manzil bor — uni har safar qo'lda
   * belgilash ortiqcha ish edi.
   */
  useEffect(() => {
    // Saqlangan manzil yo'q — formada eski matn qolmasin (manzilsiz buyurtma ketib qolardi)
    if (addresses.length === 0) {
      if (orderForm.address || orderForm.location) {
        onUpdateForm('address', '')
        onUpdateForm('location', null)
      }
      return
    }
    const fresh = knownAddressIds ? addresses.find((a) => !knownAddressIds!.has(a.id)) : undefined
    knownAddressIds = new Set(addresses.map((a) => a.id))
    const current =
      addresses.find((a) => a.address === orderForm.address) ??
      addresses.find((a) => a.id === pickedAddressId)
    const pick = fresh ?? current ?? addresses.find((a) => a.address === lastUsedAddress) ?? addresses[0]
    const sameSpot =
      pick.address === orderForm.address &&
      pick.location?.lat === orderForm.location?.lat &&
      pick.location?.lng === orderForm.location?.lng
    if (!sameSpot) chooseAddress(pick)
    else pickedAddressId = pick.id
  }, [addresses, lastUsedAddress, orderForm.address, orderForm.location, chooseAddress, onUpdateForm])

  const selectedAddressId = addresses.find((a) => a.address === orderForm.address)?.id ?? null

  /*
   * Onlayn to'lov (WLCM) — admin yoqqan bo'lsa. Mavjud usullar admin
   * tanlagani va ilovaning ro'yxati kesishmasi, ilova tartibida.
   */
  // Sinov rejimida — faqat ega/adminlar (server ham tekshiradi)
  const onlineAllowed = Boolean(payment?.online)
    && (!payment?.onlineTestOnly || (profile ? payment.onlineTesters?.includes(Number(profile.id)) === true : false))
  /** Onlayn to'lov tugmalari (Payme, Click, Uzcard, Humo…) — admin yoqqan usullar bo'yicha. */
  const payTiles = useMemo(
    () => (onlineAllowed ? PAY_TILES.filter((tile) => payment?.onlineProviders?.includes(tile.provider)) : []),
    [payment, onlineAllowed],
  )
  const onlineOn = payTiles.length > 0
  const activeTile = orderForm.paymentMethod === 'Onlayn'
    ? payTiles.find((tile) => tile.id === (orderForm.paymentTile ?? orderForm.paymentProvider)) ?? null
    : null

  /*
   * Karta formasi (Uzcard/Humo). Ma'lumot faqat shu sahifaning xotirasida —
   * store'ga ham, brauzer xotirasiga ham yozilmaydi.
   */
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const cardDigits = cardNumber.replace(/\D/g, '')
  const expiryDigits = cardExpiry.replace(/\D/g, '')
  const expiryOk = (() => {
    if (expiryDigits.length !== 4) return false
    const month = Number(expiryDigits.slice(0, 2))
    const year = 2000 + Number(expiryDigits.slice(2))
    if (month < 1 || month > 12) return false
    const now = new Date()
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
  })()
  const cardOk = cardDigits.length === 16 && expiryOk

  const chooseTile = (tile: (typeof PAY_TILES)[number]) => {
    hapticFeedback('light')
    onUpdateForm('paymentMethod', 'Onlayn')
    onUpdateForm('paymentProvider', tile.provider)
    onUpdateForm('paymentTile', tile.id)
  }

  /*
   * Karta (o'tkazma): kartaga pul o'tkaziladi, «Buyurtma berish» da chek
   * yuklash oynasi ochiladi — buyurtma chek bilan birga yaratiladi.
   * Karta raqami sozlanmagan bo'lsa bu usul ko'rinmaydi.
   */
  const transferOn = Boolean(payment?.cardNumber) && payment?.transfer !== false
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyCard = () => {
    if (!payment?.cardNumber) return
    void navigator.clipboard?.writeText(payment.cardNumber.replace(/\s/g, '')).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    })
  }
  // Karta sozlanmagan (yoki o'chirilgan) bo'lsa — naqdga qaytadi
  useEffect(() => {
    if (payment !== null && !transferOn && orderForm.paymentMethod === 'Karta') onUpdateForm('paymentMethod', 'Naqd')
  }, [payment, transferOn, orderForm.paymentMethod, onUpdateForm])

  // Onlayn tanlangan-u o'chirilgan (yoki tugma yo'q) bo'lsa — naqdga qaytamiz
  useEffect(() => {
    if (payment === null || orderForm.paymentMethod !== 'Onlayn') return
    if (!onlineOn) onUpdateForm('paymentMethod', 'Naqd')
    else if (!activeTile) {
      onUpdateForm('paymentProvider', payTiles[0].provider)
      onUpdateForm('paymentTile', payTiles[0].id)
    }
  }, [payment, onlineOn, activeTile, payTiles, orderForm.paymentMethod, onUpdateForm])

  // Manzil — faqat saqlangan manzillardan biri haqiqatan tanlangan bo'lsa (matnning o'zi yetmaydi)
  const addressOk = selectedAddressId !== null && Boolean(orderForm.address.trim())
  const isValid = Boolean(orderForm.name.trim() && orderForm.phone.trim() && addressOk)
  const canSubmit = isValid && !isSubmitting && !belowMin && (!activeTile?.card || cardOk)

  /*
   * Tugma doim bosiladi: to'ldirilmagan joy bo'lsa — o'sha maydonga
   * aylantiriladi, qizil bilan belgilanadi; telefon yo'q bo'lsa ovozli eslatma.
   */
  type Missing = 'name' | 'phone' | 'address' | 'card'
  const [missing, setMissing] = useState<Missing[]>([])
  /** Har bosishda silkinish animatsiyasi qayta boshlansin. */
  const [shake, setShake] = useState(0)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const addressRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    preloadSound(NAME_VOICE)
    preloadSound(PHONE_VOICE)
    preloadSound(ADDRESS_VOICE)
  }, [])
  // Maydon to'ldirilishi bilan qizil belgisi ketadi
  const stillMissing = missing.filter((key) =>
    key === 'name' ? !orderForm.name.trim()
      : key === 'phone' ? !orderForm.phone.trim()
        : key === 'address' ? !addressOk
          : Boolean(activeTile?.card) && !cardOk)

  /*
   * Bosqichlar: 0 — kim va qayerga, 1 — to'lov va qo'shimcha, 2 — tekshirib
   * tasdiqlash. Har bosqichda faqat o'sha qism ko'rinadi; pastdagi panelda
   * doim jami summa va «Davom etish» (oxirgisida — «Buyurtma berish»).
   */
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [slide, setSlide] = useState<'next' | 'prev' | null>(null)
  const goToStep = useCallback((next: 0 | 1 | 2) => {
    setSlide(next > step ? 'next' : 'prev')
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  // «Orqaga» (Telegram tugmasi ham) — avval oldingi bosqichga
  useEffect(
    () => setBackInterceptor(() => {
      if (step === 0) return false
      goToStep((step - 1) as 0 | 1)
      return true
    }),
    [step, goToStep],
  )

  /** Qaysi bosqichda to'ldiriladi. */
  const stepOf = (key: Missing): 0 | 1 => (key === 'card' ? 1 : 0)

  /**
   * To'ldirilmaganini ko'rsatadi. `keys` — faqat shularni tekshiradi
   * (bosqich ichida). Kamchilik boshqa bosqichda bo'lsa — o'sha bosqichga
   * qaytiladi. `true` — hammasi joyida.
   */
  const checkForm = (keys: Missing[] = ['name', 'phone', 'address', 'card']): boolean => {
    const list: Missing[] = []
    if (keys.includes('name') && !orderForm.name.trim()) list.push('name')
    if (keys.includes('phone') && !orderForm.phone.trim()) list.push('phone')
    if (keys.includes('address') && !addressOk) list.push('address')
    if (keys.includes('card') && activeTile?.card && !cardOk) list.push('card')
    setMissing(list)
    if (!list.length) return true

    hapticFeedback('heavy')
    setShake((n) => n + 1)
    // Ovoz — bosish ichida (telefon brauzeri bloklamaydi). Ikkalasi bo'sh bo'lsa —
    // faqat birinchisi (sahifa o'sha joyga aylanadi), ovozlar ustma-ust tushmasin
    if (list.includes('name')) playSound(NAME_VOICE)
    else if (list.includes('phone')) playSound(PHONE_VOICE)
    else if (list.includes('address')) playSound(ADDRESS_VOICE)
    const first = list[0]
    const reveal = () => {
      const target = first === 'name' ? nameRef.current : first === 'phone' ? phoneRef.current : first === 'card' ? cardRef.current : addressRef.current
      try {
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        if (target instanceof HTMLInputElement) target.focus({ preventScroll: true })
      } catch {
        // eski brauzer — aylantirishsiz ham qizil belgi ko'rinadi
      }
    }
    // Maydon boshqa bosqichda — avval o'sha bosqich chiziladi
    if (stepOf(first) !== step) {
      goToStep(stepOf(first))
      window.setTimeout(reveal, 80)
    } else reveal()
    return false
  }
  // Ikki xil nomli animatsiya almashadi — har bosishda qayta silkinadi, maydon qayta yaratilmaydi (fokus yo'qolmaydi)
  const shakeClass = shake % 2 ? ' shake-a' : ' shake-b'
  const fieldClass = (key: Missing) => 'field' + (stillMissing.includes(key) ? ' is-error' + shakeClass : '')
  const errorText = (key: Missing, text: string) =>
    stillMissing.includes(key) ? <p key={`${key}-${shake}`} className="field-error">{text}</p> : null

  const submit = async () => {
    if (isSubmitting) return
    if (!canSubmit && !checkForm()) return
    if (!canSubmit) return
    // Karta (o'tkazma) — avval chek yuklanadi, buyurtma shundan keyin
    if (orderForm.paymentMethod === 'Karta') {
      hapticFeedback('light')
      setReceiptOpen(true)
      return
    }
    const ok = await onSubmit(activeTile?.card ? { number: cardDigits, expiry: expiryDigits } : undefined)
    // Karta ma'lumoti ekranda qolmasin
    if (ok) { setCardNumber(''); setCardExpiry('') }
  }

  const next = () => {
    hapticFeedback('light')
    if (step === 0 && checkForm(['name', 'phone', 'address'])) goToStep(1)
    else if (step === 1 && checkForm(['card'])) goToStep(2)
  }

  const STEPS = [t('checkout.stepWho'), t('checkout.stepPay'), t('checkout.stepConfirm')]
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? null
  const paymentLabel = activeTile
    ? (activeTile.card ? `${t('checkout.cardTile')} · ${activeTile.label}` : activeTile.label)
    : orderForm.paymentMethod === 'Karta' ? t('checkout.card') : t('checkout.cash')

  /** Tekshirish bosqichidagi bitta qator: belgi, sarlavha, qiymat va «O'zgartirish». */
  const reviewRow = (icon: React.ReactNode, title: string, value: React.ReactNode, back: 0 | 1) => (
    <div className="co-review-row">
      <span className="co-review-row__icon">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="co-review-row__title">{title}</p>
        <div className="co-review-row__value">{value}</div>
      </div>
      <button type="button" className="co-review-row__edit" onClick={() => goToStep(back)}>
        {t('checkout.change')}
      </button>
    </div>
  )

  return (
    <>
      <header className="page-head page-head--solo flex items-center gap-3 px-5 pt-8 sm:px-10 page-animate">
        <button
          onClick={() => (step > 0 ? goToStep((step - 1) as 0 | 1) : onBack())}
          className="back-button"
          aria-label={t('common.back')}
        >
          <BackIcon size={20} />
        </button>
        <PageTitle className="text-2xl font-extrabold">{t('checkout.title')}</PageTitle>

        {/* Bosqichlar chizig'i — o'tilganini bosib qaytish mumkin */}
        <ol className="co-steps" aria-label={t('checkout.stepOf', { n: step + 1 })}>
          {STEPS.map((label, index) => (
            <li key={label} className={index < step ? 'is-done' : index === step ? 'is-on' : ''}>
              <button
                type="button"
                disabled={index >= step}
                onClick={() => goToStep(index as 0 | 1)}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="co-steps__bar" />
                <span className="co-steps__label">
                  {index < step && <Check size={12} strokeWidth={3} />}
                  {label}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div
        key={step}
        className={'kb-safe co-body px-5 pt-6 sm:px-10' + (slide ? ` cat-slide-${slide}` : ' page-animate')}
      >
        {step === 0 && (
          <>
            {/* Kim qabul qiladi */}
            <section>
              <h3 className="co-sec-title">{t('checkout.whoTitle')}</h3>
              <div className="co-card space-y-3">
                <div>
                  <div className={fieldClass('name')}>
                    <User size={19} className="shrink-0" style={{ color: 'var(--faint)' }} />
                    <input
                      ref={nameRef}
                      value={orderForm.name}
                      onChange={(e) => onUpdateForm('name', e.target.value)}
                      placeholder={t('checkout.namePlaceholder')}
                      aria-label={t('checkout.name')}
                      className="text-sm"
                    />
                  </div>
                  {errorText('name', t('checkout.fillName'))}
                </div>
                <div>
                  <div className={fieldClass('phone')}>
                    <Phone size={19} className="shrink-0" style={{ color: 'var(--faint)' }} />
                    <input
                      ref={phoneRef}
                      value={orderForm.phone}
                      onChange={(e) => onUpdateForm('phone', e.target.value)}
                      placeholder="+998 90 123 45 67"
                      aria-label={t('checkout.phone')}
                      type="tel"
                      inputMode="tel"
                      className="text-sm"
                    />
                  </div>
                  {errorText('phone', t('checkout.fillPhone'))}
                </div>

                {/* Buyurtmani boshqa odam oladimi */}
                <button
                  type="button"
                  onClick={() => {
                    // O'chirilganda maydonlar tozalanadi — aks holda
                    // ko'rinmay turgan eski qiymat buyurtmaga tushardi
                    if (otherRecipient) {
                      onUpdateForm('recipientName', '')
                      onUpdateForm('recipientPhone', '')
                    }
                    setOtherRecipient((v) => !v)
                  }}
                  className={'co-toggle' + (otherRecipient ? ' is-on' : '')}
                  aria-pressed={otherRecipient}
                >
                  <span className="min-w-0 flex-1 text-left">
                    <b className="block text-sm" style={{ color: 'var(--ink)' }}>{t('checkout.otherRecipient')}</b>
                    <span className="block text-xs" style={{ color: 'var(--muted)' }}>{t('checkout.otherRecipientHint')}</span>
                  </span>
                  <span className="co-toggle__switch" aria-hidden="true" />
                </button>

                {otherRecipient && (
                  <div className="space-y-3" style={{ animation: 'fadeInUp 0.25s ease' }}>
                    <div className="field">
                      <UserIcon size={19} className="shrink-0" style={{ color: 'var(--faint)' }} />
                      <input
                        value={orderForm.recipientName || ''}
                        onChange={(e) => onUpdateForm('recipientName', e.target.value)}
                        placeholder={t('checkout.recipientName')}
                      />
                    </div>
                    <div className="field">
                      <Phone size={19} className="shrink-0" style={{ color: 'var(--faint)' }} />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={orderForm.recipientPhone || ''}
                        onChange={(e) => onUpdateForm('recipientPhone', e.target.value)}
                        placeholder={t('checkout.recipientPhone')}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Qayerga */}
            <section
              ref={addressRef}
              className={'mt-6' + (stillMissing.includes('address') ? ' address-missing' + shakeClass : '')}
            >
              <h3 className="co-sec-title">{t('checkout.whereTitle')}</h3>
              {errorText('address', t('checkout.fillAddress'))}

              {addresses.length === 0 ? (
                <div className="co-card text-center">
                  <span className="co-empty-pin"><PinIcon size={24} /></span>
                  <p className="mb-3 mt-3 text-sm" style={{ color: 'var(--muted)' }}>{t('checkout.noAddresses')}</p>
                  <button onClick={() => onNavigate('addresses')} className="btn-primary mx-auto px-5 py-2.5 text-sm">
                    {t('checkout.addAddress')}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr) => {
                    const isSelected = orderForm.address === addr.address
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          hapticFeedback('light')
                          // Tanlangan manzil qayta bosilsa — uni tahrirlashga o'tamiz:
                          // mijoz ko'pincha aynan shu manzilni to'g'rilamoqchi bo'ladi
                          if (isSelected) return onEditAddress(addr.id)
                          chooseAddress(addr)
                        }}
                        className={'address-option ' + (isSelected ? 'selected' : '')}
                      >
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-full"
                          style={{
                            background: isSelected ? 'var(--surface)' : 'var(--surface-3)',
                            color: isSelected ? 'var(--brand)' : 'var(--muted)',
                          }}
                        >
                          <PinIcon size={19} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold" style={{ color: isSelected ? 'var(--brand)' : 'var(--ink)' }}>
                            {addr.name}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'var(--muted)' }}>{addr.address}</p>
                        </div>
                        {isSelected ? (
                          <span
                            className="flex shrink-0 items-center gap-1 self-center rounded-full px-2 py-1 text-[11px] font-bold"
                            style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
                          >
                            <Pencil size={12} />
                            {t('common.edit')}
                          </span>
                        ) : (
                          <span
                            className="grid size-6 shrink-0 place-items-center self-center rounded-full border-2 transition"
                            style={{ borderColor: 'var(--line)' }}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => onNavigate('addresses')}
                    className="mt-2 w-full rounded-2xl border border-dashed py-3 text-sm font-bold transition"
                    style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
                  >
                    {t('checkout.addAnotherAddress')}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {step === 1 && (
          <>
            {/* To'lov usuli */}
            <section>
              <h3 className="co-sec-title">{t('checkout.payTitle')}</h3>

              {/* To'lov usullari — har biri o'z logotipi bilan; naqd — oxirida keng */}
              <div className="pay-tiles">
                {payTiles.map((tile) => {
                  const on = activeTile?.id === tile.id
                  return (
                    <button
                      key={tile.id}
                      type="button"
                      className={'pay-tile ' + (on ? 'is-on' : '')}
                      onClick={() => chooseTile(tile)}
                      aria-pressed={on}
                      aria-label={tile.label}
                    >
                      <span className="pay-tile__logo"><PayLogo id={tile.id} /></span>
                      <span className="pay-tile__name">{tile.card ? t('checkout.cardTile') : tile.label}</span>
                      {on && <span className="pay-tile__check"><Check size={12} strokeWidth={3.2} /></span>}
                    </button>
                  )
                })}
                {transferOn && (
                  <button
                    type="button"
                    className={'pay-tile pay-tile--cash ' + (orderForm.paymentMethod === 'Karta' ? 'is-on' : '')}
                    onClick={() => { hapticFeedback('light'); onUpdateForm('paymentMethod', 'Karta') }}
                    aria-pressed={orderForm.paymentMethod === 'Karta'}
                  >
                    <span className="pay-tile__logo">
                      <span className="plogo plogo--cash"><CreditCard size={22} strokeWidth={2.2} /> {t('checkout.card')}</span>
                    </span>
                    <span className="pay-tile__name">{t('checkout.cardSub')}</span>
                    {orderForm.paymentMethod === 'Karta' && (
                      <span className="pay-tile__check"><Check size={12} strokeWidth={3.2} /></span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  className={'pay-tile pay-tile--cash ' + (orderForm.paymentMethod === 'Naqd' ? 'is-on' : '')}
                  onClick={() => { hapticFeedback('light'); onUpdateForm('paymentMethod', 'Naqd') }}
                  aria-pressed={orderForm.paymentMethod === 'Naqd'}
                >
                  <span className="pay-tile__logo">
                    <span className="plogo plogo--cash"><Banknote size={22} strokeWidth={2.2} /> {t('checkout.cash')}</span>
                  </span>
                  <span className="pay-tile__name">{t('checkout.cashSub')}</span>
                  {orderForm.paymentMethod === 'Naqd' && (
                    <span className="pay-tile__check"><Check size={12} strokeWidth={3.2} /></span>
                  )}
                </button>
              </div>

              {/* Uzcard / Humo — karta shu yerning o'zida */}
              {activeTile?.card && (
                <div className="card-form" style={{ animation: 'fadeInUp 0.25s ease' }}>
                  <label className="field-label" htmlFor="card-number">{t('card.number')}</label>
                  <div className={fieldClass('card')}>
                    <CreditCard size={19} className="shrink-0" style={{ color: 'var(--faint)' }} />
                    <input
                      ref={cardRef}
                      id="card-number"
                      value={cardNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
                        setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '))
                        // Raqamdan karta turi — tugma o'zi almashadi (9860 — Humo)
                        const kind = cardTileOf(digits)
                        const tile = kind ? payTiles.find((x) => x.id === kind) : undefined
                        if (tile && tile.id !== activeTile.id) chooseTile(tile)
                      }}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder={activeTile.id === 'humo' ? '9860 0000 0000 0000' : '8600 0000 0000 0000'}
                      className="font-mono text-sm tracking-wider"
                    />
                  </div>
                  <label className="field-label mt-3" htmlFor="card-expiry">{t('card.expiry')}</label>
                  <div className="field max-w-[160px]">
                    <input
                      id="card-expiry"
                      value={cardExpiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits)
                      }}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder={t('card.expiryHint')}
                      className="font-mono text-sm tracking-wider"
                    />
                  </div>
                  {expiryDigits.length === 4 && !expiryOk && (
                    <p className="mt-1 text-[11px] font-bold" style={{ color: 'var(--danger)' }}>{t('card.expiryBad')}</p>
                  )}
                </div>
              )}

              {orderForm.paymentMethod === 'Karta' && payment?.cardNumber && (
                <div className="transfer-card" style={{ animation: 'fadeInUp 0.25s ease' }}>
                  <p className="transfer-card__title">{t('checkout.cardDetails')}</p>
                  <div className="transfer-card__row">
                    <div className="min-w-0">
                      <p className="transfer-card__label">{t('checkout.cardNumber')}</p>
                      <p className="transfer-card__number">{payment.cardNumber}</p>
                      <p className="transfer-card__owner">{payment.cardOwner}</p>
                    </div>
                    <button
                      type="button"
                      onClick={copyCard}
                      className={'transfer-card__copy ' + (copied ? 'is-done' : '')}
                      aria-label={t('receiptSheet.copy')}
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p className="transfer-card__note">{t('checkout.transferNote', { amount: formatPrice(finalTotal) })}</p>
                </div>
              )}

              {activeTile && (
                <p className="pay-providers__note" style={{ animation: 'fadeInUp 0.25s ease' }}>
                  <Lock size={12} />
                  {activeTile.card ? t('checkout.cardPayNote', { card: activeTile.label }) : t('checkout.onlineNote')}
                </p>
              )}
            </section>

            {/* Qo'shimcha: promokod va izoh */}
            <section className="mt-6">
              <h3 className="co-sec-title">{t('checkout.extraTitle')}</h3>
              <div className="co-card space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div
                      className="field h-11 py-0"
                      style={{ borderColor: appliedPromo ? 'var(--success)' : promoError ? 'var(--danger)' : 'var(--line)' }}
                    >
                      <Tag size={16} style={{ color: appliedPromo ? 'var(--success)' : 'var(--faint)' }} />
                      <input
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); setAppliedPromo(null) }}
                        placeholder={t('checkout.promoPlaceholder')}
                        className="text-sm font-bold"
                        style={{ color: appliedPromo ? 'var(--success)' : 'var(--ink)' }}
                        readOnly={!!appliedPromo}
                      />
                    </div>
                    {promoError && (
                      <p className="mt-1 pl-1 text-[11px] font-bold" style={{ color: 'var(--danger)' }}>{promoError}</p>
                    )}
                    {appliedPromo && (
                      <p className="mt-1 pl-1 text-[11px] font-bold" style={{ color: 'var(--success)' }}>
                        {t('checkout.promoApplied', { percent: appliedPromo.discountPercent })}
                      </p>
                    )}
                  </div>
                  {!appliedPromo ? (
                    <button
                      onClick={handleApplyPromo}
                      disabled={!promoInput.trim() || promoLoading}
                      className="btn-primary h-11 w-24 text-sm"
                    >
                      {promoLoading ? <Loader2 size={16} className="animate-spin" /> : t('checkout.promoApply')}
                    </button>
                  ) : (
                    <button onClick={handleClearPromo} className="btn-ghost h-11 w-24 text-sm">
                      {t('checkout.promoClear')}
                    </button>
                  )}
                </div>

                <div className="field items-start">
                  <MessageSquare size={19} className="mt-0.5 shrink-0" style={{ color: 'var(--faint)' }} />
                  <textarea
                    value={orderForm.comment}
                    onChange={(e) => onUpdateForm('comment', e.target.value)}
                    placeholder={t('checkout.commentPlaceholder')}
                    aria-label={t('checkout.comment')}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="co-sec-title">{t('checkout.reviewTitle')}</h3>

            {/* Kim, qayerga, qanday — har birini bosib o'zgartirish mumkin */}
            <section className="co-card co-review">
              {reviewRow(
                <User size={18} />,
                t('checkout.recipient'),
                <>
                  <b>{orderForm.name}</b> · {orderForm.phone}
                  {otherRecipient && orderForm.recipientName && (
                    <span className="block">→ {orderForm.recipientName}{orderForm.recipientPhone ? ` · ${orderForm.recipientPhone}` : ''}</span>
                  )}
                </>,
                0,
              )}
              {reviewRow(
                <PinIcon size={18} />,
                t('checkout.address'),
                <>
                  {selectedAddress && <b>{selectedAddress.name}</b>}
                  <span className="block truncate">{orderForm.address}</span>
                </>,
                0,
              )}
              {reviewRow(
                orderForm.paymentMethod === 'Naqd' ? <Banknote size={18} /> : <CreditCard size={18} />,
                t('checkout.paymentMethod'),
                <b>{paymentLabel}</b>,
                1,
              )}
              {orderForm.comment.trim() && reviewRow(
                <MessageSquare size={18} />,
                t('checkout.comment'),
                <span className="block truncate">{orderForm.comment}</span>,
                1,
              )}
            </section>

            {/* Buyurtma tarkibi va hisob */}
            <section className="co-card mt-4">
              <h4 className="flex items-center gap-2 text-sm font-extrabold" style={{ color: 'var(--ink)' }}>
                <CartIcon size={17} style={{ color: 'var(--brand)' }} />
                {t('checkout.summary', { count: cartProducts.length })}
              </h4>

              <div className="mt-3 space-y-3">
                {cartProducts.map(({ product, quantity, size, color, cartKey }) => (
                  <div key={cartKey} className="flex items-center gap-3">
                    <img
                      src={productThumb(product)}
                      alt={product.name}
                      loading="lazy"
                      className="size-12 shrink-0 rounded-xl border object-contain p-1"
                      style={{ borderColor: 'var(--line)', background: '#ffffff' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold" style={{ color: 'var(--ink)' }}>{product.name}</p>
                      <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                        {quantity} × {formatPrice(product.price)}
                        {(size || color) && <> · {size}{size && color && ' · '}{color}</>}
                      </p>
                    </div>
                    <b className="text-sm" style={{ color: 'var(--ink)' }}>{formatPrice(product.price * quantity)}</b>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--line)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('checkout.products')}</span>
                  <span className="font-bold" style={{ color: 'var(--ink)' }}>{formatPrice(cartTotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--muted)' }}>
                      {t('checkout.discount')} {appliedPromo ? `(${appliedPromo.discountPercent}%)` : ''}
                    </span>
                    <span className="font-bold" style={{ color: 'var(--success)' }}>-{formatPrice(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span style={{ color: 'var(--muted)' }}>{t('checkout.delivery')}</span>
                  {delivery === null ? (
                    <span className="skeleton h-4 w-16" />
                  ) : deliveryFee === 0 ? (
                    <span className="font-bold" style={{ color: 'var(--success)' }}>
                      {t('checkout.deliveryFree')}
                      <FreeDeliveryChip />
                    </span>
                  ) : (
                    <span className="font-bold" style={{ color: 'var(--ink)' }}>{formatPrice(deliveryFee)}</span>
                  )}
                </div>

                {/* Promokoddan keyingi summa bo'yicha — server ham shunday hisoblaydi */}
                {delivery !== null && delivery.freeFrom > 0 && (
                  <div className="pt-1">
                    <FreeDeliveryBar
                      subtotal={discountedSubtotal}
                      fee={delivery.fee}
                      freeFrom={delivery.freeFrom}
                      text={freeText}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t pt-2.5" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-bold" style={{ color: 'var(--ink)' }}>{t('checkout.total')}</span>
                  <b className="text-lg" style={{ color: 'var(--brand)' }}>{formatPrice(finalTotal)}</b>
                </div>
              </div>
            </section>

            <p className="mt-4 text-center text-xs" style={{ color: 'var(--faint)' }}>{t('checkout.disclaimer')}</p>
          </>
        )}
      </div>

      {/* Pastki panel — doim: jami summa va keyingi qadam */}
      <div className="co-bar">
        <div className="co-bar__island">
          {belowMin && (
            <p className="co-bar__warn">{t('checkout.minOrderLeft', { amount: formatPrice(minOrder - cartTotal) })}</p>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 shrink-0">
              <p className="co-bar__label">{t('checkout.total')}</p>
              <b className="co-bar__total">{formatPrice(finalTotal)}</b>
            </div>
            {step < 2 ? (
              <button onClick={next} disabled={belowMin} className="btn-primary ml-auto flex-1 py-3.5">
                {t('checkout.next')}
                <ArrowRight size={19} />
              </button>
            ) : (
              <button onClick={submit} disabled={isSubmitting || belowMin} className="btn-primary ml-auto flex-1 py-3.5">
                {isSubmitting ? (
                  <><Loader2 size={20} className="animate-spin" />{t('checkout.submitting')}</>
                ) : activeTile ? (
                  <>
                    <Lock size={18} />
                    <span className="truncate">
                      {activeTile.card
                        ? t('checkout.payCard', { card: activeTile.label })
                        : t('checkout.payNow', { provider: providerLabel(activeTile.provider) })}
                    </span>
                  </>
                ) : orderForm.paymentMethod === 'Karta' ? (
                  <><Send size={19} /><span className="truncate">{t('checkout.submitTransfer')}</span></>
                ) : (
                  <><Send size={19} /><span className="truncate">{t('checkout.submit')}</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {receiptOpen && payment?.cardNumber && (
        <ReceiptSheet
          amount={finalTotal}
          cardNumber={payment.cardNumber}
          cardOwner={payment.cardOwner}
          busy={isSubmitting}
          onSubmit={(receipt) => onSubmit(undefined, receipt)}
          onClose={() => setReceiptOpen(false)}
        />
      )}

      {/* Profil yuklangach — aks holda «manzil yo'q» deb noto'g'ri chiqardi */}
      {confirming && profile && (
        <AddressConfirmSheet
          addresses={addresses}
          selectedId={selectedAddressId}
          onSelect={chooseAddress}
          onConfirm={() => setConfirming(false)}
          onEdit={(id) => { setConfirming(false); onEditAddress(id) }}
          onAddNew={() => { setConfirming(false); onAddAddress() }}
        />
      )}
    </>
  )
}
