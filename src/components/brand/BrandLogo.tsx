import mark from '../../images/musa-mark.png'
import wordmark from '../../images/musa-wordmark.png'
import { BRAND } from '../../config/brand'

type Props = {
  /** Belgi balandligi (px). Lavha va yozuv shunga nisbatan masshtablanadi. */
  size?: number
  /** Faqat kvadrat belgi — yashil plitada sariq lavha (kichik joylar uchun). */
  markOnly?: boolean
  /** Faqat sariq «MUSA» lavhasi, shaharsiz (sarlavha qatori uchun). */
  pill?: boolean
  /** To'q fon ustida — shahar nomi och rangda. */
  onDark?: boolean
  className?: string
}

/** Lavha rasmining eni / bo'yi (src/images/musa-wordmark.png). */
const PILL_RATIO = 600 / 224

/**
 * MUSA Andijon logotipi.
 *
 * Asl logo — yashil fonda sariq lavha, ichida ko'k «MUSA». Kvadrat
 * belgi (markOnly) favicon bilan bir xil; to'liq ko'rinishda foni
 * shaffof lavha va yonida shahar nomi.
 */
export function BrandLogo({ size = 44, markOnly = false, pill = false, onDark = false, className = '' }: Props) {
  if (markOnly) {
    return (
      <span className={'flex items-center ' + className}>
        <img
          src={mark}
          alt={BRAND.name}
          width={size}
          height={size}
          className="shrink-0"
          style={{ width: size, height: size, boxShadow: onDark ? 'none' : 'var(--shadow-sm)', borderRadius: size * 0.24 }}
          decoding="async"
        />
      </span>
    )
  }

  const pillHeight = pill ? size : Math.round(size * 0.8)
  return (
    <span className={'flex items-center gap-2.5 ' + className}>
      <img
        src={wordmark}
        alt={BRAND.name}
        width={Math.round(pillHeight * PILL_RATIO)}
        height={pillHeight}
        className="shrink-0"
        style={{ height: pillHeight, width: 'auto' }}
        decoding="async"
      />
      {!pill && (
        <small
          className="block truncate font-extrabold uppercase leading-none"
          style={{
            fontSize: Math.max(8, size * 0.22),
            letterSpacing: '0.24em',
            color: onDark ? 'var(--gold-bright)' : 'var(--brand)',
          }}
        >
          {BRAND.region}
        </small>
      )}
    </span>
  )
}
