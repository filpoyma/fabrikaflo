import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg'
import ArrowRightIcon from '../../assets/icons/arrow-right.svg'
import MinusIcon from '../../assets/icons/minus.svg'
import PlusIcon from '../../assets/icons/plus.svg'
import { useProductQuery, useProductsQuery } from '../../api/gallery'
import { useTelegram } from '../../hooks/useTelegram'
import {
  BackFloating,
  Button,
  Chip,
  ProductPlaceholder,
  QtyStepper,
  SaleBadge,
} from '../../shared/ui'
import type { PageWithCartProps } from '../../types/pages.ts'
import styles from './ProductPage.module.css'

export default function ProductPage(_props: PageWithCartProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { haptic } = useTelegram()

  const { data: product, isPending: loading } = useProductQuery(id)
  const { data: allProducts = [] } = useProductsQuery()

  const similarProducts = useMemo(
    () =>
      product
        ? allProducts
            .filter((x) => x.id !== product.id && x.category_slug === product.category_slug)
            .slice(0, 4)
        : [],
    [allProducts, product],
  )
  const [variantIndex, setVariantIndex] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  if (loading) return <div className="spinner" />
  if (!product) {
    return (
      <div className="container">
        <p>Букет не найден</p>
      </div>
    )
  }

  const handleOrder = () => {
    haptic.impact('medium')
    navigate(
      `/checkout?ref_id=${product.id}&ref_photo=${encodeURIComponent(product.photo_url ?? '')}&ref_title=${encodeURIComponent(product.name)}`,
    )
  }

  const currentVariant = product.variants && product.variants[variantIndex]
  const priceStr = currentVariant ? currentVariant.price_display : product.price_display
  const oldPriceStr = currentVariant ? currentVariant.old_price_display : product.old_price_display

  return (
    <div className="page-transition" data-testid="product-page">
      <BackFloating onClick={() => navigate(-1)} data-testid="back-btn" aria-label="Назад">
        <ArrowLeftIcon width={18} height={18} strokeWidth={1.5} />
      </BackFloating>

      <div className={styles.hero}>
        {product.photo_url ? (
          <img src={product.photo_url} alt={product.name} className={styles.heroImage} />
        ) : (
          <ProductPlaceholder size="lg" />
        )}
        {product.is_sale && product.discount_percent != null && (
          <SaleBadge percent={product.discount_percent} size="lg" />
        )}
        <div className={styles.productNumber}>
          № {String(product.id).slice(-3).padStart(3, '0')}
        </div>
      </div>

      <div className="container">
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={`eyebrow ${styles.eyebrowChampagne}`}>Авторский букет</span>
            <h1 className={styles.title}>{product.name}</h1>
          </div>

          <p className={styles.description}>{product.description}</p>

          {product.variants && product.variants.length > 0 && (
            <div className={styles.variants}>
              <div className={`eyebrow ${styles.variantLabel}`}>Размер</div>
              <div className={styles.variantRow}>
                {product.variants.map((v, i) => (
                  <Chip
                    key={i}
                    active={i === variantIndex}
                    onClick={() => {
                      setVariantIndex(i)
                      haptic.impact('light')
                    }}
                    data-testid={`variant-${i}`}
                  >
                    {v.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <div className={styles.priceRow}>
            <div>
              <div className={`eyebrow ${styles.priceLabel}`}>Цена</div>
              {oldPriceStr && <span className={`old-price ${styles.oldPrice}`}>{oldPriceStr}</span>}
              <div className={styles.priceValue} data-testid="product-price">
                {priceStr}
              </div>
            </div>
            <QtyStepper
              size="sm"
              value={qty}
              onDecrease={() => setQty(Math.max(1, qty - 1))}
              onIncrease={() => setQty(qty + 1)}
              decreaseLabel="Уменьшить количество"
              increaseLabel="Увеличить количество"
              decreaseIcon={<MinusIcon width={13} height={13} strokeWidth={1.5} />}
              increaseIcon={<PlusIcon width={13} height={13} strokeWidth={1.5} />}
              decreaseTestId="qty-minus"
              increaseTestId="qty-plus"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleOrder}
            data-testid="order-similar-btn"
          >
            Заказать аналогичный <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
          </Button>
        </div>

        {similarProducts.length > 0 && (
          <div className={styles.similar}>
            <div className="section-heading">
              <h2>
                Схожие <em>работы</em>
              </h2>
              <Link to="/catalog">весь каталог</Link>
            </div>
            <div className={`responsive-products-grid ${styles.similarGrid}`}>
              {similarProducts.map((p) => (
                <Link
                  to={`/product/${p.id}`}
                  key={p.id}
                  className={styles.similarLink}
                  data-testid={`similar-${p.id}`}
                >
                  <div className="product-card">
                    <div className="thumb">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} loading="lazy" />
                      ) : (
                        <ProductPlaceholder />
                      )}
                    </div>
                    <div>
                      <div className="name">{p.name}</div>
                      <div className={`price ${styles.similarPrice}`}>{p.price_display}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
