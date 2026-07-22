import { useMemo } from 'react'
import type { IProduct } from '../../types/webapp.ts'
import { useSearchParams, Link } from 'react-router-dom'
import { useProductsQuery, useCategoriesQuery } from '../../api/gallery'
import { useTelegram } from '../../hooks/useTelegram'
import { Chip, EmptyState, PageTitle, ProductPlaceholder, SaleBadge, cx } from '../../shared/ui'
import styles from './CatalogPage.module.css'

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { haptic } = useTelegram()
  const { data: categoryList = [], isPending: categoriesLoading } = useCategoriesQuery()
  const { data: products = [], isPending: productsLoading } = useProductsQuery()

  const activeCategory = searchParams.get('cat')
  const loading = categoriesLoading || productsLoading

  const categories = useMemo(
    () => [{ name: 'Все', slug: '' }, { name: 'Акции', slug: 'sale' }, ...categoryList],
    [categoryList],
  )

  const grouped = products.reduce<Record<string, IProduct[]>>((acc, p) => {
    const cat = p.category_name || 'Прочее'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="container page-transition" data-testid="catalog-page">
      <PageTitle eyebrow="Атлас работ">
        Каталог <em>букетов</em>
      </PageTitle>

      <div className="filter-bar" data-testid="filter-bar">
        {categories.map((c) => (
          <Chip
            key={c.slug || 'all'}
            active={c.slug === (activeCategory || '')}
            onClick={() => {
              haptic.impact('light')
              setSearchParams(c.slug ? { cat: c.slug } : {})
            }}
            data-testid={`filter-${c.slug || 'all'}`}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="responsive-products-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <div className={cx('skeleton', styles.skeletonThumb)} />
              <div className={cx('skeleton', styles.skeletonLinePrimary)} />
              <div className={cx('skeleton', styles.skeletonLineSecondary)} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          variant="catalog"
          className={styles.catalogEmpty}
          word="пусто"
          title=""
          description={
            <>
              В этой категории пока нет букетов.
              <br />
              Загляните позже — коллекция обновляется каждую неделю.
            </>
          }
        />
      ) : (
        <div className={styles.sections}>
          {Object.entries(grouped).map(([categoryName, catProducts]) => (
            <div key={categoryName} data-testid={`cat-section-${categoryName}`}>
              <div className="section-heading">
                <h2>
                  <em>{categoryName}</em>
                </h2>
                <span className={styles.sectionCount}>
                  {String(catProducts.length).padStart(2, '0')} работ
                </span>
              </div>

              <div className={cx('responsive-products-grid', styles.gridNoMargin)}>
                {catProducts.map((p) => (
                  <Link
                    to={`/product/${p.id}`}
                    key={p.id}
                    className={styles.productLink}
                    data-testid={`product-${p.id}`}
                  >
                    <div className={cx('product-card', !p.in_stock && styles.outOfStock)}>
                      <div className="thumb">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={p.name} loading="lazy" />
                        ) : (
                          <ProductPlaceholder size="md" />
                        )}
                        {p.is_sale && <SaleBadge percent={p.discount_percent ?? 0} />}
                      </div>

                      <div>
                        <div className="name">{p.name}</div>
                        <div className={cx('price', styles.price)}>
                          {p.is_sale && p.old_price_display && (
                            <span className="old-price">{p.old_price_display}</span>
                          )}
                          {p.price_display}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
