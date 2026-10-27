import type { ReactNode, SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }

/**
 * «Atlas» ikonkalar to'plami — MUSA Andijon'ning o'z ikonkalari.
 *
 * Uslub: ikki tusli (duotone). Kontur — `currentColor` chizig'i,
 * ichki qismi — o'sha rangning xira quyilmasi (`.ai-fill`), kichik
 * urg'u joylari (olmos, nuqta) — to'liq quyilgan (`.ai-dot`). Ko'p
 * ikonkada atlas naqshidagi olmos bor — brend belgisi bilan bir oila.
 *
 * Umumiy ikonkalar (orqaga, yopish, plyus...) ham shu yerda: ilovadagi
 * ko'rinadigan barcha asosiy belgilar bir qo'lda chizilgan bo'lsin.
 */
function Svg({ size = 24, strokeWidth = 1.9, children, className = '', ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={'atlas-icon ' + className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

const F = 'ai-fill'
const D = 'ai-dot'

/* ── Navigatsiya ─────────────────────────────────────────── */

export function HomeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z" />
      <path d="M2.8 11.6 12 4l9.2 7.6" />
      <path d="M5 10v9a1.6 1.6 0 0 0 1.6 1.6h10.8A1.6 1.6 0 0 0 19 19v-9" />
      <path className={D} d="m12 11.2 2.1 2.6-2.1 2.6-2.1-2.6z" />
    </Svg>
  )
}

/** Katalog — to'rt bo'limli setka (bittasi quyilgan). */
export function CatalogIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect className={D} x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </Svg>
  )
}

export function CartIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M6.3 8h14.2l-1.6 7.4a1.6 1.6 0 0 1-1.6 1.3H8.9a1.6 1.6 0 0 1-1.6-1.3z" />
      <path d="M2.8 3.6h2.3L7.3 15.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L20.5 8H6" />
      <circle className={D} cx="9.4" cy="20.2" r="1.5" />
      <circle className={D} cx="17" cy="20.2" r="1.5" />
    </Svg>
  )
}

/** Buyurtmalar — tishli chek. */
export function OrdersIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z" />
      <path d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </Svg>
  )
}

export function UserIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle className={F} cx="12" cy="8" r="4" />
      <circle cx="12" cy="8" r="4" />
      <path d="M4.2 20.6c1.3-3.7 4.2-5.6 7.8-5.6s6.5 1.9 7.8 5.6" />
    </Svg>
  )
}

/* ── Sarlavha va amallar ─────────────────────────────────── */

export function PinIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M12 21.5s-7-6.1-7-11.8a7 7 0 0 1 14 0c0 5.7-7 11.8-7 11.8z" />
      <path d="M12 21.5s-7-6.1-7-11.8a7 7 0 0 1 14 0c0 5.7-7 11.8-7 11.8z" />
      <path className={D} d="m12 6.6 2.3 3-2.3 3-2.3-3z" />
    </Svg>
  )
}

export function BellIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M6 9.6a6 6 0 0 1 12 0v4l1.9 3.2H4.1L6 13.6z" />
      <path d="M6 9.6a6 6 0 0 1 12 0v4l1.9 3.2H4.1L6 13.6z" />
      <path d="M9.7 19.8a2.5 2.5 0 0 0 4.6 0" />
    </Svg>
  )
}

export function HeartIcon({ filled = false, ...p }: IconProps & { filled?: boolean }) {
  return (
    <Svg {...p}>
      <path
        className={filled ? D : F}
        d="M12 20.2S3.6 15.3 3.6 9.3A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.4 2.6c0 6-8.4 10.9-8.4 10.9z"
      />
      <path d="M12 20.2S3.6 15.3 3.6 9.3A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.4 2.6c0 6-8.4 10.9-8.4 10.9z" />
    </Svg>
  )
}

export function SearchIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle className={F} cx="10.5" cy="10.5" r="6.5" />
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.4 15.4 5.1 5.1" strokeWidth={2.4} />
    </Svg>
  )
}

export function FilterIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3.5 7h9M18.5 7h2M3.5 17h2.5M11.5 17h9" />
      <path className={D} d="m15.5 4.4 2.6 2.6-2.6 2.6-2.6-2.6z" />
      <path className={D} d="m8.8 14.4 2.6 2.6-2.6 2.6-2.6-2.6z" />
    </Svg>
  )
}

export function BackIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M19.5 12h-14" />
      <path d="m10.5 6-6 6 6 6" />
    </Svg>
  )
}

export function ArrowIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4.5 12h14" />
      <path d="m13.5 6 6 6-6 6" />
    </Svg>
  )
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </Svg>
  )
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg strokeWidth={2.6} {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function MinusIcon(p: IconProps) {
  return (
    <Svg strokeWidth={2.6} {...p}>
      <path d="M5 12h14" />
    </Svg>
  )
}

/** Yulduz — reyting. Har doim quyilgan. */
export function StarIcon(p: IconProps) {
  return (
    <Svg strokeWidth={1.4} {...p}>
      <path className={D} d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z" />
    </Svg>
  )
}

export function TruckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M2.5 6h11v10h-11z" />
      <path d="M2.5 6h11v10h-11zM13.5 9.5h4l3.5 3.7V16h-7.5" />
      <circle className={D} cx="6.5" cy="17.8" r="1.9" />
      <circle className={D} cx="17" cy="17.8" r="1.9" />
    </Svg>
  )
}

export function SnowIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 2.5v19M3.8 7.3l16.4 9.4M20.2 7.3 3.8 16.7" />
      <path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />
      <path className={D} d="m12 9.6 2.1 2.4-2.1 2.4-2.1-2.4z" />
    </Svg>
  )
}

export function BoxIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4z" />
      <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4zM3.5 7.5l8.5 4 8.5-4M12 11.5v9" />
    </Svg>
  )
}

/* ── Profil ──────────────────────────────────────────────── */

export function SunIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle className={F} cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Svg>
  )
}

export function MoonIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </Svg>
  )
}

export function LanguageIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M3 5.5A2.5 2.5 0 0 1 5.5 3h7A2.5 2.5 0 0 1 15 5.5v4a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3A2.5 2.5 0 0 1 3 9.5z" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h7A2.5 2.5 0 0 1 15 5.5v4a2.5 2.5 0 0 1-2.5 2.5H8l-3.5 3v-3A2.5 2.5 0 0 1 3 9.5z" />
      <path d="M17.5 9.5h1A2.5 2.5 0 0 1 21 12v4a2.5 2.5 0 0 1-1.5 2.3V21l-3.2-2.5H13a2.5 2.5 0 0 1-2.4-1.8" />
    </Svg>
  )
}

export function HelpIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle className={F} cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.7" />
      <circle className={D} cx="12" cy="17" r="1.1" />
    </Svg>
  )
}

export function ChevronIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </Svg>
  )
}

/* ── Oziq-ovqat (kategoriyalar) ──────────────────────────── */

/** Chuchvara — gumbaz va burmali chekka. */
export function DumplingIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M3 15.5a9 9 0 0 1 18 0z" />
      <path d="M21 15.5a9 9 0 0 0-18 0" />
      <path d="M3 15.5q2.25 2.7 4.5 0t4.5 0 4.5 0 4.5 0" />
      <path d="M8.2 10.4 9 12M12 8.6v1.8M15.8 10.4 15 12" />
    </Svg>
  )
}

export function IceCreamIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M7.3 11.5a4.7 4.7 0 1 1 9.4 0z" />
      <path d="M7.3 11.5a4.7 4.7 0 1 1 9.4 0" />
      <path d="M7.5 11.5h9L12 21.5z" />
      <path d="m9.6 14.4 3.9 2.6M14.4 14.4l-3.9 2.6" />
    </Svg>
  )
}

export function PopsicleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M8 6.5a4 4 0 0 1 8 0V15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z" />
      <path d="M8 6.5a4 4 0 0 1 8 0V15a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1zM12 16v5" />
      <path d="M8 9.5c1.4 1 2.7-1 4 0s2.6 1 4 0" />
    </Svg>
  )
}

/** Sirok — glazurlangan baton. */
export function CurdBarIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect className={F} x="2.5" y="7" width="19" height="10" rx="3.2" />
      <rect x="2.5" y="7" width="19" height="10" rx="3.2" />
      <path d="M2.8 11.3c2-1.5 3.5 1.5 5.4 0s3.5 1.5 5.4 0 3.5 1.5 5.4 0 1.5.9 2.4.4" />
    </Svg>
  )
}

export function SamsaIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M12 4 3.2 19.5h17.6z" />
      <path d="M12 4 3.2 19.5h17.6z" />
      <path d="M12 4v15.5M7.6 13h8.8" />
    </Svg>
  )
}

/** Set — sovg'a qutisi. */
export function SetIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M4.5 10.5h15V20a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z" />
      <path d="M4.5 10.5h15V20a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1zM3 7.5h18v3H3zM12 7.5V21" />
      <path d="M12 7.5c-1.6-3.4-5.4-3.4-4.6-.6.3 1 2.4.6 4.6.6zm0 0c1.6-3.4 5.4-3.4 4.6-.6-.3 1-2.4.6-4.6.6z" />
    </Svg>
  )
}

/** Kotlet — panjara izlari bilan. */
export function CutletIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <ellipse className={F} cx="12" cy="13" rx="8.8" ry="5.8" />
      <ellipse cx="12" cy="13" rx="8.8" ry="5.8" />
      <path d="m7 11 3.5 3.5M11 9.6l4 4M15.4 9.8l2.4 2.4" />
    </Svg>
  )
}

export function DrumstickIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M15.5 3a5.5 5.5 0 0 1 0 11c-1.6 0-2.8.6-3.8 1.6l-1.2 1.2-3.3-3.3 1.2-1.2c1-1 1.6-2.2 1.6-3.8A5.5 5.5 0 0 1 15.5 3z" />
      <path d="M15.5 3a5.5 5.5 0 0 1 0 11c-1.6 0-2.8.6-3.8 1.6l-1.2 1.2-3.3-3.3 1.2-1.2c1-1 1.6-2.2 1.6-3.8A5.5 5.5 0 0 1 15.5 3z" />
      <path d="M7.2 13.5 4.6 16.1a1.8 1.8 0 1 0 1.7 3 1.8 1.8 0 1 0 3-1.7l2.6-2.6" />
    </Svg>
  )
}

export function PizzaIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M12 21 3.6 7.3A14 14 0 0 1 20.4 7.3z" />
      <path d="M12 21 3.6 7.3A14 14 0 0 1 20.4 7.3zM5.2 10a11 11 0 0 1 13.6 0" />
      <circle className={D} cx="10" cy="12" r="1.3" />
      <circle className={D} cx="14" cy="14.5" r="1.3" />
    </Svg>
  )
}

export function MeatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M5 10c0-3.6 3-6.5 7-6.5 4.8 0 8 3.2 8 7.6 0 5.2-4.6 9.4-9.6 9.4C7 20.5 5 17.8 5 15z" />
      <path d="M5 10c0-3.6 3-6.5 7-6.5 4.8 0 8 3.2 8 7.6 0 5.2-4.6 9.4-9.6 9.4C7 20.5 5 17.8 5 15z" />
      <circle cx="11.5" cy="12" r="2.4" />
    </Svg>
  )
}

export function FishIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M2.5 12c3-4.4 9-5.8 13.5-2l4.5-3v10l-4.5-3c-4.5 3.8-10.5 2.4-13.5-2z" />
      <path d="M2.5 12c3-4.4 9-5.8 13.5-2l4.5-3v10l-4.5-3c-4.5 3.8-10.5 2.4-13.5-2z" />
      <circle className={D} cx="7.5" cy="11.2" r="1" />
    </Svg>
  )
}

export function SoupIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M3 11h18a9 6.5 0 0 1-18 0z" />
      <path d="M3 11h18a9 6.5 0 0 1-18 0zM9 20.5h6" />
      <path d="M8.5 3.5c-1 1.2 1 2 0 3.5M12 3c-1 1.2 1 2 0 3.5M15.5 3.5c-1 1.2 1 2 0 3.5" />
    </Svg>
  )
}

export function MilkIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M6.5 8.5 9 3.5h6l2.5 5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z" />
      <path d="M6.5 8.5 9 3.5h6l2.5 5V20a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1zM6.5 8.5h11" />
      <path className={D} d="m12 12 2 2.5-2 2.5-2-2.5z" />
    </Svg>
  )
}

export function CakeIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M4 12h16v8.5H4z" />
      <path d="M4 12h16v8.5H4zM4 15.5c2 1.5 4-1.5 6 0s4 1.5 6 0 2.5 1 4 0M8 12V9M12 12V9M16 12V9" />
      <path className={D} d="M8 4.5c.8.9.8 1.8 0 2.4-.8-.6-.8-1.5 0-2.4zM12 4.5c.8.9.8 1.8 0 2.4-.8-.6-.8-1.5 0-2.4zM16 4.5c.8.9.8 1.8 0 2.4-.8-.6-.8-1.5 0-2.4z" />
    </Svg>
  )
}

/** Qozon — kategoriya ikonkasi topilmaganda. */
export function PotIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path className={F} d="M4.5 10h15v6.5a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4z" />
      <path d="M4.5 10h15v6.5a4 4 0 0 1-4 4h-7a4 4 0 0 1-4-4zM2.5 10h19M10 6.5h4" />
      <path d="M8 4c-.8.8.8 1.4 0 2.4M16 4c-.8.8.8 1.4 0 2.4" />
    </Svg>
  )
}

export function WheatIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 21.5V7" />
      <path className={F} d="M12 7c-2-1-2.6-3.4-1.6-5 1.8.6 2.6 3 1.6 5zm0 0c2-1 2.6-3.4 1.6-5-1.8.6-2.6 3-1.6 5z" />
      <path d="M12 12c-2.6 0-4.4-1.8-4.4-4.2 2.4 0 4.4 1.8 4.4 4.2zm0 0c2.6 0 4.4-1.8 4.4-4.2-2.4 0-4.4 1.8-4.4 4.2zM12 17c-2.6 0-4.4-1.8-4.4-4.2 2.4 0 4.4 1.8 4.4 4.2zm0 0c2.6 0 4.4-1.8 4.4-4.2-2.4 0-4.4 1.8-4.4 4.2z" />
    </Svg>
  )
}
