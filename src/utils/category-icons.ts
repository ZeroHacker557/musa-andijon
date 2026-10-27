import type { ComponentType, SVGProps } from 'react'
import {
  CakeIcon, CatalogIcon, CurdBarIcon, CutletIcon, DrumstickIcon, DumplingIcon, FishIcon,
  IceCreamIcon, MeatIcon, MilkIcon, PizzaIcon, PopsicleIcon, PotIcon, SamsaIcon,
  SetIcon, SnowIcon, SoupIcon, WheatIcon, BoxIcon,
} from '../components/icons/AtlasIcons'

/**
 * Ikonka komponenti.
 *
 * Barchasi «Atlas» to'plamidan (components/icons/AtlasIcons.tsx) —
 * ikki tusli, MUSA Andijon uchun chizilgan.
 */
export type CategoryIconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>

/**
 * Kategoriya ikonkasi.
 *
 * Avval bazadagi `icon` maydoniga qaraydi (admin tanlagan), topilmasa
 * nom bo'yicha taxmin qiladi, u ham bo'lmasa umumiy qozon ishlatiladi.
 * Ilgari faqat oldindan yozilgan nomlar bilan solishtirilardi, shuning
 * uchun har qanday yangi kategoriya doim quti bo'lib qolardi (F-17).
 *
 * Ro'yxat MUSA assortimentiga moslangan: yarim tayyor mahsulotlar
 * (chuchvara, manti, somsa, kotlet, naggets), muzqaymoq va siroklar.
 */
const BY_KEY: Record<string, CategoryIconType> = {
  all: CatalogIcon,

  // Xamirli mahsulotlar
  dumpling: DumplingIcon,
  chuchvara: DumplingIcon,
  pelmeni: DumplingIcon,
  manti: DumplingIcon,
  somsa: SamsaIcon,
  samsa: SamsaIcon,
  hanum: PotIcon,
  xamir: WheatIcon,
  dough: WheatIcon,
  lagmon: SoupIcon,
  ugra: WheatIcon,

  // Go'shtli mahsulotlar
  meat: MeatIcon,
  gosht: MeatIcon,
  beef: MeatIcon,
  mol: MeatIcon,
  chicken: DrumstickIcon,
  tovuq: DrumstickIcon,
  nugget: DrumstickIcon,
  kotlet: CutletIcon,
  cutlet: CutletIcon,
  lulya: CutletIcon,
  kabob: CutletIcon,
  sausage: CutletIcon,
  hotdog: CutletIcon,
  burger: CutletIcon,
  pizza: PizzaIcon,

  // Muzqaymoq va sut shirinliklari
  muzqaymoq: IceCreamIcon,
  morojniy: IceCreamIcon,
  plombir: IceCreamIcon,
  eskimo: PopsicleIcon,
  popsicle: PopsicleIcon,
  rojok: IceCreamIcon,
  vedro: IceCreamIcon,
  sirok: CurdBarIcon,
  syrok: CurdBarIcon,
  glazur: CurdBarIcon,
  tvorog: MilkIcon,
  sut: MilkIcon,
  dairy: MilkIcon,
  milk: MilkIcon,

  // Boshqa
  fish: FishIcon,
  baliq: FishIcon,
  egg: PotIcon,
  tuxum: PotIcon,
  vegetable: PotIcon,
  sabzavot: PotIcon,
  salad: SoupIcon,
  vegan: PotIcon,
  dessert: CakeIcon,
  shirinlik: CakeIcon,
  frozen: SnowIcon,
  muzlatilgan: SnowIcon,
  set: SetIcon,
  box: BoxIcon,
}

const BY_NAME: [RegExp, CategoryIconType][] = [
  [/chuchvara|pelmen|dumpling|пельмен|чучвар/i, DumplingIcon],
  [/manti|hanum|xonim|мант|ханум/i, DumplingIcon],
  [/somsa|samsa|самс/i, SamsaIcon],
  [/lagʻmon|lagmon|ugra|лагман/i, SoupIcon],
  [/xamir|dough|тест/i, WheatIcon],
  [/kotlet|lyulya|lʻulya|kabob|kolbasa|sosiska|котлет|люля|колбас|сосис/i, CutletIcon],
  [/tovuq|nagget|nugget|chicken|товук|кур|наггет/i, DrumstickIcon],
  [/goʻsht|gosht|mol|qoʻy|beef|meat|мяс|говяд/i, MeatIcon],
  [/baliq|fish|рыб/i, FishIcon],
  [/burger|sendvich|hot ?dog|бургер|сэндвич/i, CutletIcon],
  [/pitsa|pizza|пицц/i, PizzaIcon],
  [/tuxum|egg|яйц/i, PotIcon],
  [/sabzavot|vegetable|овощ/i, PotIcon],
  [/salat|salad|салат/i, SoupIcon],
  [/sirok|syrok|glazur|tvorog|сырок|сырк|творож|глазир/i, CurdBarIcon],
  [/eskimo|muzli tayoq|эскимо/i, PopsicleIcon],
  [/muzqaymoq|plombir|morojen|rojok|морожен|пломбир|рожок/i, IceCreamIcon],
  [/sut|dairy|молоч|молоко/i, MilkIcon],
  [/shirinlik|dessert|tort|десерт|торт/i, CakeIcon],
  [/muzlatilgan|frozen|заморож/i, SnowIcon],
  [/toʻplam|set|combo|набор/i, SetIcon],
  [/yarim tayyor|полуфабрикат/i, DumplingIcon],
  [/barcha|hamma|все|all/i, CatalogIcon],
]

/**
 * Bot yangi kategoriyaga doim "package" yozadi — bu "tanlanmagan" degani.
 * Shuning uchun uni e'tiborsiz qoldirib, nom bo'yicha aniqlashga o'tamiz.
 */
const UNSET_ICONS = new Set(['', 'package', 'BoxIcon'])

export function categoryIcon(icon?: string, name?: string): CategoryIconType {
  if (icon && !UNSET_ICONS.has(icon.trim())) {
    const found = BY_KEY[icon.toLowerCase().trim()]
    if (found) return found
  }
  if (name) {
    for (const [pattern, Icon] of BY_NAME) {
      if (pattern.test(name)) return Icon
    }
  }
  return PotIcon
}
