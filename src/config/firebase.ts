/**
 * Firebase mijoz (web) konfiguratsiyasi.
 *
 * Bu qiymatlar MAXFIY EMAS — Firebase ularni brauzerga ataylab ochiq
 * beradi, himoya Firestore Rules va App Check tomonida. Shuning uchun
 * env o'zgaruvchi emas, oddiy konstanta: Vercel'da 7 ta o'zgaruvchini
 * to'ldirish o'rniga shu faylni almashtirish kifoya.
 *
 * Firebase Console → ⚙️ Project Settings → General → "Your apps" →
 * Web app → SDK setup and configuration → Config.
 *
 * DIQQAT: bu yerdagi projectId bot ishlatadigan service account
 * (bot/config.py → FIREBASE_KEY_FILE) bilan BIR XIL loyihaga tegishli
 * bo'lishi shart. Aks holda bot bir bazaga yozadi, ilova boshqasidan
 * o'qiydi va katalog bo'sh ko'rinadi. Hozir ikkalasi ham `musa-andijon`.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCaqTWr-oCGTb_zEBkHJXqN4Xim-MDvYmY',
  authDomain: 'musa-andijon.firebaseapp.com',
  projectId: 'musa-andijon',
  storageBucket: 'musa-andijon.firebasestorage.app',
  messagingSenderId: '296076776689',
  appId: '1:296076776689:web:0838d5d189b0c33f49c550',
  measurementId: 'G-WE5QY4TMXP',
}
