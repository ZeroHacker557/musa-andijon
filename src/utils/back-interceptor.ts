/**
 * «Orqaga» ushlagichi — sahifa o'z ichida orqaga qaytishni boshqarishi uchun.
 *
 * Masalan, buyurtma berish bosqichlari: Telegram'ning «orqaga» tugmasi
 * (va sahifadagi strelka) avval oldingi bosqichga qaytaradi, faqat
 * birinchi bosqichda sahifadan chiqiladi. Ushlagich `true` qaytarsa —
 * orqaga qaytish shu bilan bajarilgan, `goBack` boshqa hech narsa qilmaydi.
 */
type BackInterceptor = () => boolean

let interceptor: BackInterceptor | null = null

/** Sahifa ochiq turganda o'rnatadi; qaytgan funksiya — olib tashlaydi. */
export function setBackInterceptor(fn: BackInterceptor): () => void {
  interceptor = fn
  return () => {
    if (interceptor === fn) interceptor = null
  }
}

/** `true` — orqaga qaytishni sahifa o'zi bajardi. */
export function runBackInterceptor(): boolean {
  return interceptor?.() ?? false
}
