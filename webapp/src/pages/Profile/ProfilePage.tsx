import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../api'
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../../api/clients'
import { useMyOrdersQuery, useRepeatOrderMutation } from '../../api/orders'
import { useTelegram } from '../../hooks/useTelegram'
import { Button, IconButton, PageTitle, cx } from '../../shared/ui'
import type { IOrder } from '../../types/domain.ts'
import type { IClientProfile, IProfileLegacyOrder } from '../../types/webapp.ts'
import { ProfileAddressSection } from './components/ProfileAddressSection'
import styles from './ProfilePage.module.css'

type TProfileOrder = Omit<IOrder, 'status'> & IProfileLegacyOrder

export default function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isPending: profileLoading } = useProfileQuery()
  const { data: orders = [], isPending: ordersLoading } = useMyOrdersQuery()
  const updateProfileMutation = useUpdateProfileMutation()
  const uploadAvatarMutation = useUploadAvatarMutation()
  const repeatOrderMutation = useRepeatOrderMutation()
  const loading = profileLoading || ordersLoading
  const [repeating, setRepeating] = useState(false)
  const { haptic, showAlert } = useTelegram()

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    haptic.impact('light')
    setUploadingAvatar(true)
    try {
      const res = await uploadAvatarMutation.mutateAsync(file)
      if (res.ok && res.url) {
        await updateProfileMutation.mutateAsync({ photo_url: res.url })
        showAlert('Аватар успешно обновлен!')
      } else {
        showAlert('Ошибка загрузки аватара')
      }
    } catch (err) {
      console.error(err)
      showAlert('Ошибка при загрузке аватара')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfileData = async () => {
    try {
      haptic.impact('medium')
      const updated = await updateProfileMutation.mutateAsync({ name: editName })
      setEditName(updated.data.name || editName)
      setIsEditingProfile(false)
    } catch (e) {
      console.error(e)
      alert('Ошибка сохранения данных')
    }
  }

  const getStatusColor = (status: string | undefined): string => {
    switch (status) {
      case 'pending':
        return 'orange'
      case 'paid':
        return 'green'
      case 'confirmed':
        return 'green'
      case 'shipped':
        return 'gold'
      case 'done':
        return 'green'
      case 'cancelled':
        return 'red'
      default:
        return 'gold'
    }
  }

  const getStatusText = (status: string | undefined): string => {
    const mapRu: Record<string, string> = {
      pending: '⏳ Ожидает оплаты',
      paid: '💰 Оплачен',
      confirmed: '✅ Подтверждён',
      shipped: '🚚 Отправлен',
      done: '🎉 Завершён',
      cancelled: '❌ Отменён',
    }
    return mapRu[status ?? ''] || status || ''
  }

  const handleRepeatOrder = async (orderId: string) => {
    try {
      setRepeating(true)
      haptic.impact('heavy')
      await repeatOrderMutation.mutateAsync(orderId)
      haptic.success()
      showAlert('Корзина успешно заполнена товарами из прошлого заказа!')
      navigate('/cart')
    } catch (e: unknown) {
      console.error(e)
      let errMsg = 'Ошибка при повторении заказа'
      if (e instanceof Error) {
        try {
          const parsed = JSON.parse(e.message) as { detail?: string }
          if (parsed.detail) {
            errMsg = parsed.detail
          }
        } catch {
          // ignore JSON parse errors
        }
      }
      showAlert(errMsg)
    } finally {
      setRepeating(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (!profile) {
    return (
      <div className="container">
        <p>Ошибка загрузки профиля</p>
      </div>
    )
  }

  const profileOrders = orders as TProfileOrder[]
  const lastOrder =
    profileOrders.find((o) => {
      const status = String(o?.status ?? '').toLowerCase()
      return status !== 'cancelled'
    }) ?? null

  return (
    <div
      className={cx('container page-transition', styles.page)}
      data-testid="profile-page"
    >
      <PageTitle eyebrow="Личный кабинет">
        Ваш <em>профиль</em>
      </PageTitle>

      <div className={styles.profileHeader}>
        <div className={styles.avatar} onClick={handleAvatarClick}>
          {profile.photo_url ? (
            <img
              src={
                profile.photo_url.startsWith('/')
                  ? `${API_URL.replace('/api', '')}${profile.photo_url}`
                  : profile.photo_url
              }
              alt="Avatar"
              className={styles.avatarImage}
            />
          ) : (
            profile.name?.charAt(0)?.toUpperCase() || '?'
          )}
          {uploadingAvatar && <div className={styles.avatarOverlay}>...</div>}
        </div>
        <input
          type="file"
          ref={avatarInputRef}
          className={styles.hiddenInput}
          accept="image/*"
          onChange={handleAvatarChange}
        />
        {isEditingProfile ? (
          <div className={styles.editForm}>
            <input
              type="text"
              placeholder="Ваше имя"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={styles.editNameInput}
            />
            <div className={styles.editActions}>
              <Button size="sm" flex className={styles.noMarginBtn} onClick={saveProfileData}>
                💾 Сохранить
              </Button>
              <Button
                variant="secondary"
                size="sm"
                flex
                className={styles.noMarginBtn}
                onClick={() => {
                  setEditName(profile.name || '')
                  setIsEditingProfile(false)
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h2 className={styles.profileName}>{profile.name || 'Имя не указано'}</h2>
              <IconButton
                variant="ghost"
                onClick={() => {
                  setEditName(profile.name || '')
                  setIsEditingProfile(true)
                }}
                aria-label="Редактировать имя"
                className={styles.editIconBtn}
              >
                ✏️
              </IconButton>
            </div>
            <p className={styles.tgName}>
              {profile.tgname ? `@${profile.tgname}` : 'Telegram-ник не указан'}
            </p>
            {profile.discount_percent != null && profile.discount_percent > 0 && (
              <span className={cx('badge', styles.discountBadge)}>
                Скидка {profile.discount_percent}%
              </span>
            )}
          </div>
        )}
      </div>

      {lastOrder && (
        <div className={cx('glass-card', styles.quickRepeatCard)}>
          <h3 className={styles.quickRepeatTitle}>🔄 Быстрый повтор заказа</h3>
          <p className={styles.quickRepeatDesc}>
            Повторить ваш прошлый заказ #{lastOrder.id} от{' '}
            {new Date(lastOrder.created_at ?? lastOrder.createdAt ?? '').toLocaleDateString()}:
          </p>
          <div className={styles.quickRepeatItems}>
            {Array.isArray(lastOrder.items) &&
              lastOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className={cx(
                    styles.quickRepeatItem,
                    idx < (lastOrder.items?.length ?? 0) - 1 && styles.quickRepeatItemSpaced,
                  )}
                >
                  • {item.qty} × {item.name} ({item.variant})
                </div>
              ))}
          </div>
          <Button
            fullWidth
            onClick={() => handleRepeatOrder(String(lastOrder.id))}
            disabled={repeating}
          >
            {repeating ? 'Добавление в корзину...' : '🛒 Повторить заказ'}
          </Button>
        </div>
      )}

      <ProfileAddressSection
        key={`${profile.address ?? ''}-${profile.address_lat ?? ''}-${profile.address_lng ?? ''}`}
        profile={profile}
        haptic={haptic}
        showAlert={showAlert}
        updateProfileMutation={updateProfileMutation}
      />

      <h3 className={styles.ordersTitle}>📋 Мои заказы</h3>
      {!Array.isArray(orders) || orders.length === 0 ? (
        <div className={cx('glass-card', styles.emptyOrders)}>
          <p className={styles.emptyOrdersText}>У вас пока нет заказов</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {profileOrders.map((o, idx) => (
            <div key={o?.id ?? `order-${idx}`} className="glass-card">
              <div className={cx('flex-between', styles.orderHeader)}>
                <div>
                  <div className={styles.orderId}>Заказ #{o?.id}</div>
                  <div className={styles.orderDate}>
                    {o?.created_at
                      ? new Date(o.created_at).toLocaleDateString('ru-RU')
                      : 'Дата неизвестна'}
                  </div>
                </div>
                <div className={`badge ${getStatusColor(o?.status)}`}>
                  {getStatusText(o?.status)}
                </div>
              </div>

              <div className={styles.orderItems}>
                {Array.isArray(o?.items)
                  ? o.items.map((item, itemIdx) => (
                      <div key={itemIdx} className={cx('flex-between', styles.orderItemRow)}>
                        <span>
                          {item?.qty} × {item?.name} ({item?.variant})
                        </span>
                        <span>${item?.subtotal}</span>
                      </div>
                    ))
                  : null}
              </div>

              <div className={cx('flex-between', styles.orderTotal)}>
                <span>
                  Итого ({o?.currency ? (o.currency === 'uah' ? 'RUB' : o.currency.toUpperCase()) : 'UNKNOWN'}
                  ):
                </span>
                <span className={styles.orderTotalValue}>
                  {o?.currency === 'usd' || o?.currency === 'usdt' ? '$' : ''}
                  {o?.total_in_currency}
                  {o?.currency === 'uah' ? ' ₽' : ''}
                  {o?.currency === 'idr' ? ' Rp' : ''}
                  {o?.currency === 'vnd' ? ' ₫' : ''}
                </span>
              </div>

              {String(o?.status) === 'pending' && (
                <Button
                  fullWidth
                  className={styles.payBtn}
                  onClick={() => {
                    showAlert(
                      `Реквизиты для оплаты:\n\n${o?.payment_details || 'Реквизиты временно недоступны. Свяжитесь с поддержкой.'}`,
                    )
                    haptic.impact('medium')
                  }}
                >
                  💳 Показать реквизиты
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
