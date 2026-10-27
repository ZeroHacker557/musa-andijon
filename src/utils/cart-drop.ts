/**
 * «Savatga tushish» — savatga qo'shilgandagi effekt.
 *
 * Rasm kartadan uchib bormaydi. Uch qisqa lahza:
 *   1. bosilgan tugma atrofida yashil halqa tarqaladi;
 *   2. savat tepasida mahsulotning kichik dumaloq rasmi paydo bo'lib,
 *      savat ichiga tushadi;
 *   3. savat siqilib-cho'ziladi va undan sariq «+1» ko'tarilib so'nadi.
 *
 * React holatiga tegmaydi: vaqtincha `document.body` ga elementlar
 * qo'shiladi va Web Animations API bilan harakatlantiriladi (faqat
 * transform/opacity). «Harakatni kamaytirish» yoqilgan bo'lsa — hech narsa.
 */

const TARGET = '[data-cart-target]'

/**
 * Ekranda ko'rinib turgan savat belgisi (pastki menyu yoki sahifa tepasidagi).
 * `data-cart-target="primary"` — asosiysi (mahsulot sahifasi pastidagi savat):
 * ko'rinib turgan bo'lsa, boshqalaridan oldin shu tanlanadi.
 */
function visibleTarget(): HTMLElement | null {
  const all = [...document.querySelectorAll<HTMLElement>(TARGET)]
  const ordered = [
    ...all.filter((el) => el.dataset.cartTarget === 'primary'),
    ...all.filter((el) => el.dataset.cartTarget !== 'primary'),
  ]
  for (const el of ordered) {
    const r = el.getBoundingClientRect()
    if (r.width && r.height && r.bottom > 0 && r.top < innerHeight) return el
  }
  return null
}

function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Vaqtinchalik element — animatsiya tugagach (yoki kafolat taymeri bilan) o'chadi. */
function spawn(className: string, rect: { x: number; y: number }, size: number): HTMLElement {
  const el = document.createElement('div')
  el.className = className
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.left = `${rect.x - size / 2}px`
  el.style.top = `${rect.y - size / 2}px`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 1600)
  return el
}

const center = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

/** Bosilgan tugma atrofida tarqaladigan halqa. */
function ring(from: Element) {
  const r = from.getBoundingClientRect()
  if (!r.width) return
  const size = Math.max(r.width, r.height)
  const el = spawn('cd-ring', center(r), size)
  el.animate(
    [
      { transform: 'scale(0.8)', opacity: 0.9 },
      { transform: 'scale(1.9)', opacity: 0 },
    ],
    { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  ).onfinish = () => el.remove()
}

/** Savat belgisini siqib-cho'zadi va «+1» chiqaradi (qayta bosilsa ham takrorlanadi). */
export function bumpCart() {
  const target = visibleTarget()
  if (!target || reducedMotion()) return
  target.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.14, 0.84)', offset: 0.3 },
      { transform: 'scale(0.94, 1.1)', offset: 0.6 },
      { transform: 'scale(1)' },
    ],
    { duration: 460, easing: 'ease-out' },
  )

  const r = target.getBoundingClientRect()
  const plus = spawn('cd-plus', { x: r.left + r.width / 2, y: r.top }, 30)
  plus.textContent = '+1'
  plus.animate(
    // Egri chiziq har bosqichga alohida — butun animatsiyaga bitta egri
    // berilsa, belgi to'liq ko'rinishga ulgurmay so'nib qoladi
    [
      { transform: 'translateY(6px) scale(0.5)', opacity: 0, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      { transform: 'translateY(-16px) scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(-20px) scale(1)', opacity: 1, offset: 0.65, easing: 'ease-in' },
      { transform: 'translateY(-38px) scale(0.9)', opacity: 0 },
    ],
    { duration: 900 },
  ).onfinish = () => plus.remove()
}

/**
 * `from` — bosilgan tugma yoki karta ichidagi element. Tushadigan rasm
 * shu elementning eng yaqin kartasidan (`[data-fly-source]`) olinadi.
 */
export function dropIntoCart(from: Element | null) {
  if (!from || reducedMotion()) return
  ring(from)

  const target = visibleTarget()
  if (!target) return
  const card = from.closest('[data-fly-source]') ?? from
  const img = card.querySelector('img')
  const end = target.getBoundingClientRect()
  if (!end.width) return

  const size = 40
  const drop = spawn('cd-drop', center(end), size)
  if (img?.currentSrc || img?.src) drop.style.backgroundImage = `url("${img.currentSrc || img.src}")`

  const fall = drop.animate(
    // Avval paydo bo'ladi (sakrab), biroz turadi, keyin tezlashib tushadi
    [
      { transform: 'translateY(-84px) scale(0.3)', opacity: 0, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      { transform: 'translateY(-76px) scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(-72px) scale(1)', opacity: 1, offset: 0.45, easing: 'cubic-bezier(0.55, 0, 0.9, 0.4)' },
      { transform: 'translateY(0) scale(0.35)', opacity: 0.3 },
    ],
    { duration: 720 },
  )
  fall.onfinish = () => {
    drop.remove()
    bumpCart()
  }
  fall.oncancel = () => drop.remove()
}
