import { BackIcon, CartIcon, SearchIcon } from '../icons/AtlasIcons'
import { formatPrice } from '../../data'
import { productThumb } from '../../utils/product-image'
import { useT } from '../../i18n'
import type { Product } from '../../types/domain'

type Props = {
  query: string
  results: Product[]
  onQueryChange: (value: string) => void
  onClose: () => void
  onOpenProduct: (product: Product) => void
}

export function SearchOverlay({ query, results, onQueryChange, onClose, onOpenProduct }: Props) {
  const t = useT()

  return (
    <div className="search-overlay">
      {/* Atlas qalpoq: orqaga va qidiruv maydoni */}
      <div className="search-cap">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button onClick={onClose} className="atlas-glass-btn" aria-label={t('common.back')}>
            <BackIcon size={20} />
          </button>
          <div className="search-field">
            <SearchIcon style={{ color: 'var(--brand)' }} />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={t('search.placeholder')}
              className="h-12 w-full bg-transparent outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>
        </div>
        <p className="search-cap__title mx-auto max-w-3xl">
          {query ? t('search.results', { query }) : t('search.title')}
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-10">
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {results.map((product, i) => (
            <button
              key={product.id}
              onClick={() => { onOpenProduct(product); onClose() }}
              className="search-hit"
              style={{ animation: `fadeInUp 0.25s ease ${Math.min(i, 8) * 0.04}s both` }}
            >
              <span className="search-hit__img">
                {productThumb(product)
                  ? <img src={productThumb(product)} alt={product.name} loading="lazy" />
                  : <CartIcon size={22} />}
              </span>
              <span className="search-hit__name">{product.name}</span>
              <b className="search-hit__price">{formatPrice(product.price)}</b>
            </button>
          ))}
        </div>

        {query && !results.length && (
          <div className="py-16 text-center" style={{ color: 'var(--muted)', animation: 'fadeInUp 0.3s ease' }}>
            <SearchIcon className="mx-auto mb-3" size={42} />
            <p className="font-bold" style={{ color: 'var(--ink-2)' }}>{t('search.notFound')}</p>
            <p className="mt-1 text-sm">{t('search.notFoundText')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
