import { useRef, useState, type ChangeEvent } from 'react'
import {
  useMyOrdersQuery,
  useApproveOrderMutation,
  useDisapproveOrderMutation,
  useUploadReceiptMutation,
} from '../../api/orders'
import { useTelegram } from '../../hooks/useTelegram'
import { Button, EmptyState, PageTitle, cx } from '../../shared/ui'
import type { TOrderStatus } from '../../types/domain.ts'
import CheckIcon from '../../assets/icons/check.svg'
import XIcon from '../../assets/icons/x.svg'
import UploadIcon from '../../assets/icons/upload.svg'
import CreditCardIcon from '../../assets/icons/credit-card.svg'
import styles from './OrdersPage.module.css'

const STATUS_LABEL: Record<TOrderStatus, string> = {
  CREATED: 'Создан',
  ASSEMBLING: 'Сборка',
  ASSEMBLED: 'Согласование',
  WAITING_FOR_APPROVAL: 'Согласование',
  APPROVED: 'Одобрен',
  WAITING_FOR_PAYMENT: 'Ожидает оплаты',
  PAID: 'Оплачен',
  DELIVERING: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}

function StatusPill({ status }: { status: TOrderStatus }) {
  return (
    <span
      className={styles.statusPill}
      data-status={status}
      data-testid={`order-status-${status}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export default function OrdersPage() {
  const { haptic, showAlert } = useTelegram()
  const { data: orders = [], isPending: loading, refetch } = useMyOrdersQuery()
  const approveMutation = useApproveOrderMutation()
  const disapproveMutation = useDisapproveOrderMutation()
  const uploadReceiptMutation = useUploadReceiptMutation()
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({})
  const [showFeedbackInput, setShowFeedbackInput] = useState<Record<string, boolean>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const handleApprove = async (id: string) => {
    try {
      setSubmittingId(id)
      haptic.impact('medium')
      await approveMutation.mutateAsync(id)
      haptic.success()
      showAlert('Букет одобрен. Флорист сформирует реквизиты для оплаты.')
      await refetch()
    } catch (e) {
      console.error(e)
      haptic.error()
      showAlert('Ошибка при одобрении букета.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleDisapprove = async (id: string) => {
    const text = feedbackTexts[id] || ''
    if (!text.trim()) {
      showAlert('Пожалуйста, напишите, что именно нужно исправить.')
      return
    }
    try {
      setSubmittingId(id)
      haptic.impact('medium')
      await disapproveMutation.mutateAsync({ id, feedback: text })
      haptic.success()
      showAlert('Ваши правки переданы флористу.')
      setFeedbackTexts((prev) => ({ ...prev, [id]: '' }))
      setShowFeedbackInput((prev) => ({ ...prev, [id]: false }))
      await refetch()
    } catch (e) {
      console.error(e)
      haptic.error()
      showAlert('Ошибка при отправке правок.')
    } finally {
      setSubmittingId(null)
    }
  }

  const handleReceiptUpload = async (id: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setSubmittingId(id)
      haptic.impact('light')
      await uploadReceiptMutation.mutateAsync({ orderId: id, file })
      haptic.success()
      showAlert('Чек загружен. Статус заказа обновится в ближайшее время.')
      await refetch()
    } catch (err) {
      console.error(err)
      haptic.error()
      showAlert('Ошибка при загрузке чека.')
    } finally {
      setSubmittingId(null)
    }
  }

  if (loading) return <div className="spinner" />

  if (orders.length === 0) {
    return (
      <div className="container page-transition" data-testid="orders-empty">
        <EmptyState
          variant="padded"
          word="пусто"
          title={
            <>
              Пока нет <em>заказов</em>
            </>
          }
          description="Здесь появится история ваших букетов, статусы согласования и оплаты."
        />
      </div>
    )
  }

  return (
    <div className={cx('container', 'page-transition', styles.page)} data-testid="orders-page">
      <PageTitle eyebrow="История">
        Мои <em>заказы</em>
      </PageTitle>

      <div className={styles.ordersList}>
        {orders.map((o) => {
          const lastPhoto =
            o.photos && o.photos.length > 0 ? o.photos[o.photos.length - 1].photoUrl : null
          const isWaitingApproval =
            o.status === 'WAITING_FOR_APPROVAL' || o.status === 'ASSEMBLED'
          const isWaitingPayment = o.status === 'WAITING_FOR_PAYMENT' || o.status === 'APPROVED'

          return (
            <article
              key={o.id}
              className={styles.orderArticle}
              data-testid={`order-${o.id}`}
            >
              <div className={cx('flex-between', styles.headerRow)}>
                <div>
                  <div className={cx('eyebrow', styles.orderNumber)}>
                    Заказ № {String(o.id).slice(-6)}
                  </div>
                  <div className={styles.budget}>
                    {o.budget ? `${Number(o.budget).toLocaleString('ru-RU')} ₽` : '—'}
                  </div>
                  <div className={styles.orderDate}>
                    {o.createdAt
                      ? new Date(o.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                        })
                      : ''}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>

              <div
                className={cx(styles.details, lastPhoto && styles.detailsWithPhoto)}
              >
                {o.wishes && (
                  <div>
                    <span className={styles.detailLabel}>Пожелания</span>
                    <span className={styles.detailQuote}>«{o.wishes}»</span>
                  </div>
                )}
                {o.recipientPhone && (
                  <div>
                    <span className={styles.detailLabel}>Телефон</span>
                    {o.recipientPhone}
                  </div>
                )}
                {o.deliveryAddress && o.deliveryAddress !== 'Самовывоз' && (
                  <div>
                    <span className={styles.detailLabel}>Адрес</span>
                    {o.deliveryAddress}
                  </div>
                )}
                {o.postcardText && (
                  <div className={styles.postcardBox}>
                    <div className={cx('eyebrow', styles.postcardEyebrow)}>Открытка</div>
                    <span className={styles.detailQuote}>«{o.postcardText}»</span>
                  </div>
                )}
              </div>

              {lastPhoto && (
                <div className={styles.photoSection}>
                  <div className={cx('eyebrow', styles.photoEyebrow)}>
                    Фото букета от флориста
                  </div>
                  <div className={styles.photoFrame}>
                    <img
                      src={lastPhoto}
                      alt="Готовый букет"
                      className={styles.photo}
                      data-testid={`order-photo-${o.id}`}
                    />
                  </div>
                </div>
              )}

              {isWaitingApproval && lastPhoto && (
                <div>
                  {showFeedbackInput[o.id] ? (
                    <div>
                      <label className={cx('eyebrow', styles.feedbackLabel)}>
                        Что доработать
                      </label>
                      <textarea
                        placeholder="Например: добавьте больше зелени, замените ленту"
                        rows={2}
                        value={feedbackTexts[o.id] || ''}
                        onChange={(e) =>
                          setFeedbackTexts((prev) => ({ ...prev, [o.id]: e.target.value }))
                        }
                        className={styles.feedbackTextarea}
                        data-testid={`feedback-input-${o.id}`}
                      />
                      <div className={styles.btnRow}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setShowFeedbackInput((prev) => ({ ...prev, [o.id]: false }))
                          }
                          disabled={submittingId === o.id}
                        >
                          Отмена
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          flex
                          onClick={() => handleDisapprove(o.id)}
                          disabled={submittingId === o.id}
                          data-testid={`submit-feedback-${o.id}`}
                        >
                          Отправить правки
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.btnRow}>
                      <Button
                        variant="secondary"
                        size="sm"
                        flex
                        onClick={() =>
                          setShowFeedbackInput((prev) => ({ ...prev, [o.id]: true }))
                        }
                        disabled={submittingId === o.id}
                        data-testid={`disapprove-btn-${o.id}`}
                      >
                        <XIcon width={13} height={13} strokeWidth={1.5} /> Правки
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        flex
                        onClick={() => handleApprove(o.id)}
                        disabled={submittingId === o.id}
                        data-testid={`approve-btn-${o.id}`}
                      >
                        <CheckIcon width={13} height={13} strokeWidth={1.5} /> Одобрить
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {isWaitingPayment && (
                <div className={styles.paymentSection}>
                  {o.paymentLink ? (
                    <Button
                      href={o.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="sm"
                      fullWidth
                      className={styles.payLinkBtn}
                      data-testid={`pay-link-${o.id}`}
                    >
                      <CreditCardIcon width={13} height={13} strokeWidth={1.5} /> Перейти к оплате
                    </Button>
                  ) : (
                    <div className={styles.waitingBox}>
                      <div className={cx('eyebrow', styles.waitingEyebrow)}>Ожидание</div>
                      Флорист готовит реквизиты для оплаты. Уведомим в Telegram.
                    </div>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={() => fileInputRefs.current[o.id]?.click()}
                    disabled={submittingId === o.id}
                    data-testid={`upload-receipt-btn-${o.id}`}
                  >
                    <UploadIcon width={13} height={13} strokeWidth={1.5} /> Загрузить чек
                  </Button>
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[o.id] = el
                    }}
                    onChange={(e) => handleReceiptUpload(o.id, e)}
                    accept="image/*"
                    className={styles.hiddenInput}
                  />
                </div>
              )}

              {o.clientFeedback && o.status === 'ASSEMBLING' && (
                <div className={styles.feedbackStatus}>
                  <div className={cx('eyebrow', styles.feedbackStatusEyebrow)}>
                    Ваши правки в работе
                  </div>
                  <span className={styles.detailQuote}>«{o.clientFeedback}»</span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
