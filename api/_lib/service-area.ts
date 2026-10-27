/**
 * Xizmat hududi — faqat Andijon shahri.
 *
 * Shahar markazidan RADIUS_KM ichidagi manzillarga yetkazamiz: shahar va
 * uning yonidagi mahallalar kiradi, Asaka, Shahrixon, Oltinko'l kabi
 * tuman markazlari esa kirmaydi. Mini app'dagi nusxasi — xaritada
 * manzil saqlashda tekshiradi: src/config/service-area.ts.
 * Ikkalasidagi qiymatlar bir xil bo'lishi shart.
 */
export const SERVICE_AREA = {
  name: 'Andijon shahri',
  center: { lat: 40.7828, lng: 72.3442 },
  radiusKm: 12,
} as const

/** Ikki nuqta orasidagi masofa (km) — Yer sharsimon deb olinadi. */
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(h))
}

export function isInServiceArea(point: { lat: number; lng: number } | null | undefined): boolean {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false
  return distanceKm(SERVICE_AREA.center, point) <= SERVICE_AREA.radiusKm
}
