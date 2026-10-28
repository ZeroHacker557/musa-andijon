import { ArrowIcon, TruckIcon } from '../icons/AtlasIcons'
import { useI18n } from '../../i18n'
import { usePresence } from '../../hooks/use-presence'
import { formatCountdown, useDeliveryTimer } from '../../hooks/use-delivery-timer'
import { hapticSelection } from '../../utils/telegram'

/** 3 daqiqadan kam qolsa — shoshiltiruvchi (qizil) rang. */
const URGENT_MS = 3 * 60_000

/**
 * Sanoq raqamli kataklarda: «19 : 56». Har katak alohida — raqam
 * almashganda faqat o'sha katak yangilanadi (key), qolganlari joyida.
 */
function Tiles({ ms, size = 'lg' }: { ms: number; size?: 'lg' | 'sm' }) {
  const [mm, ss] = formatCountdown(ms).split(':')
  return (
    <span className={'fdc-tiles fdc-tiles--' + size} aria-hidden="true">
      {[...mm].map((d, i) => <b key={`m${i}${d}`}>{d}</b>)}
      <i>:</i>
      {[...ss].map((d, i) => <b key={`s${i}${d}`}>{d}</b>)}
    </span>
  )
}

/**
 * «Yetkazib berish BEPUL» — taymer boshlanganda ekran o'rtasiga tushadigan
 * kupon chiptasi: tepada sariq qism, yirtiladigan chiziq, pastda sanoq.
 */
export function FreeDeliverySheet({ open, hasCart, onShop, onClose }: {
  open: boolean
  hasCart: boolean
  onShop: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const timer = useDeliveryTimer()
  const visible = open && timer.active
  const { mounted, leaving } = usePresence(visible, 260)
  if (!mounted) return null

  const minutes = Math.round(timer.totalMs / 60_000)
  const urgent = timer.remainingMs < URGENT_MS

  return (
    <div className={'fdc-overlay' + (leaving ? ' leaving' : '')} onClick={onClose}>
      <div
        className={'fdc-ticket' + (urgent ? ' is-urgent' : '') + (leaving ? ' leaving' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={`${t('timer.title')} ${t('timer.free')}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fdc-ticket__top">
          <span className="fdc-badge">{t('timer.badge')}</span>
          <h2 className="fdc-title">
            <small>{t('timer.title')}</small>
            <b>{t('timer.free')}</b>
          </h2>
          <span className="fdc-ticket__truck" aria-hidden="true"><TruckIcon size={44} strokeWidth={1.8} /></span>
        </div>

        {/* Yirtiladigan chiziq — chetlarida o'yiq */}
        <div className="fdc-tear" aria-hidden="true" />

        <div className="fdc-ticket__bottom">
          <div className="fdc-clock" role="timer" aria-live="off" aria-label={formatCountdown(timer.remainingMs)}>
            <Tiles ms={timer.remainingMs} />
            <small>{t('timer.left')}</small>
          </div>
          <span className="fdc-bar" style={{ ['--p' as string]: `${timer.progress * 100}%` }} />
          <p className="fdc-sub">{t('timer.subtitle', { minutes })}</p>
          <button
            className="btn-primary fdc-cta"
            onClick={() => {
              hapticSelection()
              onShop()
            }}
          >
            {hasCart ? t('timer.ctaCart') : t('timer.cta')} <ArrowIcon size={18} />
          </button>
          <button className="fdc-later" onClick={onClose}>{t('timer.later')}</button>
        </div>
      </div>
    </div>
  )
}

/** Bosh sahifadagi kichik kupon — sanoq tugaguncha turadi. */
export function FreeDeliveryBanner({ onShop }: { onShop: () => void }) {
  const { t } = useI18n()
  const timer = useDeliveryTimer()
  const { mounted, leaving } = usePresence(timer.active, 300)
  if (!mounted) return null
  const urgent = timer.remainingMs < URGENT_MS

  return (
    <section className="px-5 pt-4 sm:px-10">
      <button
        className={'fdc-strip' + (urgent ? ' is-urgent' : '') + (leaving ? ' leaving' : '')}
        onClick={onShop}
        aria-label={`${t('timer.bannerTitle')} — ${formatCountdown(timer.remainingMs)}`}
      >
        <span className="fdc-strip__main">
          <span className="fdc-strip__icon"><TruckIcon size={20} strokeWidth={2.2} /></span>
          <span className="fdc-strip__text">
            <b>{t('timer.bannerTitle')}</b>
            <span>{t('timer.bannerText')}</span>
          </span>
        </span>
        <span className="fdc-strip__time">
          <Tiles ms={timer.remainingMs} size="sm" />
        </span>
        <span className="fdc-bar fdc-bar--strip" style={{ ['--p' as string]: `${timer.progress * 100}%` }} />
      </button>
    </section>
  )
}

/** Savat va buyurtma sahifasida: «Yetkazish bepul — 12:30». */
export function FreeDeliveryChip({ line = false }: { line?: boolean }) {
  const { t } = useI18n()
  const timer = useDeliveryTimer()
  if (!timer.active) return null
  const time = formatCountdown(timer.remainingMs)
  const urgent = timer.remainingMs < URGENT_MS

  if (line) {
    return (
      <div className={'fdc-cartline' + (urgent ? ' is-urgent' : '')}>
        <span><TruckIcon size={16} /> {t('timer.cartLine')}</span>
        <b>{time}</b>
      </div>
    )
  }
  return <span className={'fdc-chip' + (urgent ? ' is-urgent' : '')}>{time}</span>
}
