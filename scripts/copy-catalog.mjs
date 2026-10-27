/**
 * Katalogni eski Qara Musa bazasidan (musa-onlineshop) Musa Andijon
 * bazasiga ko'chiradi.
 *
 * Faqat katalog: mahsulotlar, kategoriyalar, bo'limlar, Linko bog'lamalari
 * va Linko sozlamasi. Buyurtma, mijoz, xodim va boshqa ma'lumotlar
 * ATAYLAB ko'chirilmaydi — Andijon bazasi toza boshlanadi.
 *
 * Ikki rejim:
 *
 *   1) Eksport — eski bazadan o'qib, faylga yozadi (hech narsani o'zgartirmaydi):
 *        node scripts/copy-catalog.mjs export <eski-kalit.json> [catalog-export.json]
 *
 *   2) Import — fayldagi katalogni yangi bazaga yozadi:
 *        node scripts/copy-catalog.mjs import <yangi-kalit.json> [catalog-export.json]
 *
 * Kalit — Firebase Console → Project Settings → Service accounts →
 * «Generate new private key» bilan olingan JSON fayl.
 *
 * Import hujjat ID'larini saqlaydi: Linko sinxroni va bot mahsulotlarni
 * shu ID'lar bo'yicha taniydi. Mavjud hujjat ustidan yoziladi (merge emas),
 * shuning uchun skriptni qayta ishga tushirish xavfsiz.
 *
 * Mahsulot rasmlari eski Storage'da qoladi — `image` havolalari ishlayveradi.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp, GeoPoint } from 'firebase-admin/firestore'

/** Butunlay ko'chiriladigan kolleksiyalar. */
const COLLECTIONS = ['products', 'categories', 'sections', 'linko_products']
/** Alohida hujjatlar (settings ichidan faqat katalogga tegishlisi). */
const DOCS = ['settings/linko']

const [mode, keyFile, outFile = 'catalog-export.json'] = process.argv.slice(2)
if (!['export', 'import'].includes(mode) || !keyFile) {
  console.error('Foydalanish:\n  node scripts/copy-catalog.mjs export <eski-kalit.json> [fayl]\n  node scripts/copy-catalog.mjs import <yangi-kalit.json> [fayl]')
  process.exit(1)
}

const key = JSON.parse(readFileSync(resolve(keyFile), 'utf8'))
const db = getFirestore(initializeApp({ credential: cert(key) }, mode))
console.log(`Loyiha: ${key.project_id} (${mode})`)

/* Firestore turlari JSON'da saqlanishi uchun belgilanadi va qaytariladi */
const encode = (v) => {
  if (v instanceof Timestamp) return { __ts: v.toMillis() }
  if (v instanceof GeoPoint) return { __geo: [v.latitude, v.longitude] }
  if (Array.isArray(v)) return v.map(encode)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, encode(x)]))
  return v
}
const decode = (v) => {
  if (Array.isArray(v)) return v.map(decode)
  if (v && typeof v === 'object') {
    if ('__ts' in v) return Timestamp.fromMillis(v.__ts)
    if ('__geo' in v) return new GeoPoint(v.__geo[0], v.__geo[1])
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, decode(x)]))
  }
  return v
}

if (mode === 'export') {
  const out = { project: key.project_id, exportedAt: new Date().toISOString(), collections: {}, docs: {} }
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get()
    out.collections[name] = snap.docs.map((d) => ({ id: d.id, data: encode(d.data()) }))
    console.log(`  ${name}: ${snap.size} ta`)
  }
  for (const path of DOCS) {
    const snap = await db.doc(path).get()
    if (snap.exists) out.docs[path] = encode(snap.data())
    console.log(`  ${path}: ${snap.exists ? 'bor' : "yo'q"}`)
  }
  writeFileSync(resolve(outFile), JSON.stringify(out, null, 2))
  console.log(`Saqlandi: ${outFile}`)
} else {
  const data = JSON.parse(readFileSync(resolve(outFile), 'utf8'))
  if (data.project === key.project_id) {
    console.error("Eksport va import bir xil loyihaga — bu yangi Andijon bazasi emas. To'xtatildi.")
    process.exit(1)
  }
  // Firestore bitta batch'da 500 tagacha yozuv oladi
  let batch = db.batch()
  let pending = 0
  let total = 0
  const flush = async () => {
    if (!pending) return
    await batch.commit()
    batch = db.batch()
    pending = 0
  }
  const put = async (ref, value) => {
    batch.set(ref, decode(value))
    pending++
    total++
    if (pending >= 450) await flush()
  }
  for (const [name, docs] of Object.entries(data.collections)) {
    for (const { id, data: value } of docs) await put(db.collection(name).doc(id), value)
    console.log(`  ${name}: ${docs.length} ta`)
  }
  for (const [path, value] of Object.entries(data.docs)) await put(db.doc(path), value)
  await flush()
  console.log(`Yozildi: ${total} ta hujjat → ${key.project_id}`)
}
process.exit(0)
