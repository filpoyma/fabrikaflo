import { useNavigate } from 'react-router-dom'
import Trash2Icon from '../../assets/icons/trash-2.svg'
import PlusIcon from '../../assets/icons/plus.svg'
import MinusIcon from '../../assets/icons/minus.svg'
import ArrowRightIcon from '../../assets/icons/arrow-right.svg'
import { useCartQuery, useRemoveFromCartMutation, useUpdateCartItemQtyMutation } from '../../api/cart'
import { useTelegram } from '../../hooks/useTelegram'
import { Button, EmptyState, PageTitle, QtyStepper, cx } from '../../shared/ui'
import type { ICartItem } from '../../types/webapp.ts'
import type { PageWithCartProps } from '../../types/pages.ts'
import styles from './CartPage.module.css'

export default function CartPage({ updateCart }: PageWithCartProps) {
  const { data: cart = { items: [], subtotal_usd: 0 }, isPending: loading } = useCartQuery()
  const removeMutation = useRemoveFromCartMutation()
  const updateQtyMutation = useUpdateCartItemQtyMutation()
  const { haptic, showAlert } = useTelegram()
  const navigate = useNavigate()

  const handleRemove = async (product_id: string, variant_index: number) => {
    try {
      haptic.impact('light')
      await removeMutation.mutateAsync({ productId: product_id, variantIndex: variant_index })
      await updateCart?.()
    } catch (e) {
      console.error(e)
    }
  }

  const handleQtyChange = async (item: ICartItem, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty < 1) return
    try {
      haptic.impact('light')
      await updateQtyMutation.mutateAsync({
        productId: item.product_id,
        variantIndex: item.variant_index,
        qty: newQty,
      })
      await updateCart?.()
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="spinner" />

  if (cart.items.length === 0) {
    return (
      <div className="container page-transition" data-testid="cart-empty">
        <EmptyState
          variant="padded"
          word="пусто"
          title={
            <>
              Корзина <em>пуста</em>
            </>
          }
          description="Перейдите в каталог, чтобы добавить букет."
          action={
            <Button to="/catalog">
              В каталог <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
            </Button>
          }
        />
      </div>
    )
  }

  const hasOutOfStock = cart.items.some((i) => i.in_stock === false)

  return (
    <div className="container page-transition" data-testid="cart-page">
      <PageTitle eyebrow="Заказ">
        Ваш <em>букет</em>
      </PageTitle>

      <div className={styles.itemsList}>
        {cart.items.map((item, idx) => (
          <div
            key={idx}
            className={cx(styles.cartItem, item.in_stock === false && styles.outOfStock)}
            data-testid={`cart-item-${item.product_id}`}
          >
            <div className={styles.itemInfo}>
              <h3 className={styles.itemName}>{item.product_name}</h3>
              <div className={styles.variantName}>{item.variant_name}</div>
              {item.in_stock === false ? (
                <div className={styles.stockWarning}>Нет в наличии</div>
              ) : (
                <div className={styles.subtotal}>{item.subtotal_display}</div>
              )}
            </div>

            <div className={styles.itemActions}>
              <QtyStepper
                size="sm"
                value={item.quantity}
                onDecrease={() => handleQtyChange(item, -1)}
                onIncrease={() => {
                  if (item.in_stock !== false) handleQtyChange(item, 1)
                }}
                decreaseLabel="Уменьшить количество"
                increaseLabel="Увеличить количество"
                decreaseIcon={<MinusIcon width={13} height={13} strokeWidth={1.5} />}
                increaseIcon={<PlusIcon width={13} height={13} strokeWidth={1.5} />}
                increaseDisabled={item.in_stock === false}
              />
              <Button
                variant="tertiary"
                tone="danger"
                size="sm"
                className={styles.removeBtn}
                onClick={() => handleRemove(item.product_id, item.variant_index)}
              >
                <Trash2Icon width={12} height={12} strokeWidth={1.5} /> убрать
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.summary}>
        {(cart.discount_percent ?? 0) > 0 && (
          <>
            <div className={cx('flex-between', styles.summaryRow)}>
              <span>Сумма</span>
              <span className={styles.summaryRowStrikethrough}>
                {cart.subtotal_display || `$ ${(cart.subtotal_usd || 0).toFixed(0)}`}
              </span>
            </div>
            <div className={cx('flex-between', styles.summaryRowDiscount)}>
              <span>Скидка · {cart.discount_percent}%</span>
              <span>− {cart.discount_usd ? `$ ${cart.discount_usd.toFixed(0)}` : ''}</span>
            </div>
          </>
        )}
        <div className={cx('flex-between', styles.totalRow)}>
          <span className={styles.totalLabel}>Итого без доставки</span>
          <span className={styles.totalValue}>
            {cart.total_display || `$ ${(cart.total_usd || 0).toFixed(0)}`}
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={hasOutOfStock}
        onClick={() =>
          hasOutOfStock
            ? showAlert('Пожалуйста, удалите из корзины товары, которых нет в наличии')
            : navigate('/checkout')
        }
        data-testid="checkout-btn"
      >
        Оформить заказ <ArrowRightIcon width={14} height={14} strokeWidth={1.6} />
      </Button>
    </div>
  )
}
