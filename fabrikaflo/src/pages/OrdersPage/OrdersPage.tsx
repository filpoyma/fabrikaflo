import React, { useState } from 'react'
import {
  useOrdersQuery,
  useUpdateOrderStatusMutation,
  useUploadOrderPhotoMutation,
  useSendOrderApprovalMutation,
  useSendOrderPaymentMutation,
  useAssignOrderCourierMutation,
} from '../../api/orders'
import { useCouriersQuery } from '../../api/clients'
import type { IOrder } from '../../types'
import { Button } from '../../shared/ui'

import InboxIcon from '../../assets/icons/inbox.svg'
import ShoppingBagIcon from '../../assets/icons/shopping-bag.svg'
import CheckIcon from '../../assets/icons/check.svg'
import TruckIcon from '../../assets/icons/scooter.svg'
import XMarkIcon from '../../assets/icons/x-mark.svg'
import PlusIcon from '../../assets/icons/plus.svg'
import ShoppingIcon from '../../assets/icons/shopping-bag.svg'
import DocumentIcon from '../../assets/icons/document.svg'

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const OrdersPage: React.FC = () => {
  const { data: orders = [], isLoading: ordLoading } = useOrdersQuery({ refetchInterval: 20_000 })
  const { data: couriers = [] } = useCouriersQuery()

  const updateStatusMutation = useUpdateOrderStatusMutation()
  const uploadPhotoMutation = useUploadOrderPhotoMutation()
  const sendApprovalMutation = useSendOrderApprovalMutation()
  const sendPaymentMutation = useSendOrderPaymentMutation()
  const assignCourierMutation = useAssignOrderCourierMutation()

  // Local component states
  const [paymentLinks, setPaymentLinks] = useState<Record<string, string>>({})
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({})

  // Columns partition
  const colAssembly = orders.filter((o) => o.status === 'CREATED' || o.status === 'ASSEMBLING')
  const colApproval = orders.filter(
    (o) =>
      o.status === 'ASSEMBLED' ||
      o.status === 'WAITING_FOR_APPROVAL' ||
      o.status === 'APPROVED' ||
      o.status === 'WAITING_FOR_PAYMENT'
  )
  const colDelivery = orders.filter((o) => o.status === 'PAID' || o.status === 'DELIVERING')
  const colCompleted = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'CANCELLED')

  const handlePhotoSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadPhotoMutation.mutate(
        { id, file },
        {
          onError: (error) => {
            console.error('Upload photo error:', error)
            alert(`Ошибка загрузки фотографии: ${getErrorMessage(error)}`)
          },
        },
      )
    }
  }

  const mutateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onError: (error) => {
          console.error('Update status error:', error)
          alert(`Ошибка обновления статуса: ${getErrorMessage(error)}`)
        },
      },
    )
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'Принят'
      case 'ASSEMBLING':
        return 'Собирается'
      case 'ASSEMBLED':
        return 'Собран'
      case 'WAITING_FOR_APPROVAL':
        return 'На согласовании'
      case 'APPROVED':
        return 'Одобрен'
      case 'WAITING_FOR_PAYMENT':
        return 'Ожидает оплаты'
      case 'PAID':
        return 'Оплачен'
      case 'DELIVERING':
        return 'В доставке'
      case 'DELIVERED':
        return 'Доставлен'
      case 'CANCELLED':
        return 'Отменен'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':
      case 'ASSEMBLING':
        return 'var(--color-info)'
      case 'ASSEMBLED':
      case 'APPROVED':
        return 'var(--color-sage)'
      case 'WAITING_FOR_APPROVAL':
      case 'WAITING_FOR_PAYMENT':
        return 'var(--color-warning)'
      case 'PAID':
      case 'DELIVERING':
        return 'var(--color-gold)'
      case 'DELIVERED':
        return 'var(--color-success)'
      case 'CANCELLED':
        return 'var(--color-error)'
      default:
        return 'var(--text-primary)'
    }
  }

  const renderOrderCard = (order: IOrder) => {
    const isUploading = uploadPhotoMutation.isPending && uploadPhotoMutation.variables?.id === order.id
    const hasPhotos = order.photos && order.photos.length > 0
    const currentPhoto = hasPhotos ? order.photos![order.photos!.length - 1].photoUrl : null

    return (
      <div
        key={order.id}
        className="glass-card"
        style={{
          padding: '20px',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          fontSize: '0.9rem',
          borderLeft: `4px solid ${getStatusColor(order.status)}`,
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Заказ #{order.id.substring(0, 8)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              👤 {order.client?.name || 'Клиент'}
              {order.client?.tgname && (
                <a
                  href={`https://t.me/${order.client.tgname}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: '6px', color: 'var(--color-accent-dark)', textDecoration: 'none' }}
                >
                  (@{order.client.tgname})
                </a>
              )}
            </div>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: getStatusColor(order.status),
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Bouquet Image Preview */}
        <div
          style={{
            width: '100%',
            height: '160px',
            backgroundColor: '#FAF8F5',
            borderRadius: '6px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-light)',
            position: 'relative',
          }}
        >
          {currentPhoto ? (
            <img src={currentPhoto} alt="Bouquet preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : order.request?.examplePhotoUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <img
                src={order.request.examplePhotoUrl}
                alt="Client reference"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  backgroundColor: 'rgba(23, 45, 31, 0.75)',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                }}
              >
                📋 Пример клиента
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isUploading ? 'Загрузка букета...' : 'Фото отсутствует'}
            </span>
          )}
        </div>

        {/* Order Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
          <div>💰 Бюджет: <strong>{order.budget} руб.</strong></div>
          {order.wishes && <div>🌿 Состав: <span style={{ color: 'var(--text-secondary)' }}>{order.wishes}</span></div>}
          {order.postcardText && <div>💌 Открытка: <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>«{order.postcardText}»</span></div>}
          {order.request?.examplePhotoUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>📷 Пример клиента:</span>
              <a
                href={order.request.examplePhotoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-light)',
                  lineHeight: 0
                }}
              >
                <img
                  src={order.request.examplePhotoUrl}
                  alt="Reference"
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                />
              </a>
            </div>
          )}

          <div style={{ borderTop: '1px dotted var(--border-light)', marginTop: '6px', paddingTop: '6px' }}>
            <div>🚗 {order.deliveryAddress ? `Доставка: ${order.deliveryAddress}` : 'Самовывоз'}</div>
            {order.deliveryTime && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                📅 Время: {new Date(order.deliveryTime).toLocaleString()}
              </div>
            )}
          </div>
          {order.courier && (
            <div style={{ color: 'var(--color-sage)', fontWeight: 500, fontSize: '0.85rem', marginTop: '4px' }}>
              🚴 Курьер: {order.courier.name}
            </div>
          )}
          {order.comment && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#FAF8F5',
                border: '1px solid var(--border-light)',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <strong>📝 Комментарий:</strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '4px', color: 'var(--text-primary)' }}>
                {order.comment}
              </div>
            </div>
          )}
          {order.clientFeedback && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#FFF5F5',
                border: '1px solid #FFE3E3',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <strong style={{ color: '#D32F2F' }}>
                ⚠️ Замечания клиента:
              </strong>
              <div style={{ whiteSpace: 'pre-line', marginTop: '4px', color: 'var(--text-primary)' }}>
                {order.clientFeedback}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div
          style={{
            borderTop: '1px solid var(--border-light)',
            paddingTop: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* CREATED state */}
          {order.status === 'CREATED' && (
            <Button
              fullWidth
              icon={ShoppingBagIcon}
              onClick={() => mutateStatus(order.id, 'ASSEMBLING')}
            >
              Начать сборку
            </Button>
          )}

          {/* ASSEMBLING state (Upload picture) */}
          {order.status === 'ASSEMBLING' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Загрузить фото готового букета</label>
              <input
                id={`order-photo-upload-${order.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoSelect(order.id, e)}
                style={{ display: 'none' }}
                disabled={isUploading}
              />
              <label
                htmlFor={`order-photo-upload-${order.id}`}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  border: '1px dashed var(--color-sage)',
                  backgroundColor: '#FAF9F6',
                  transition: 'all 0.2s',
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px', color: 'var(--color-sage)' }} />
                <span>{isUploading ? 'Загрузка...' : 'Выбрать фото'}</span>
              </label>
            </div>
          )}

          {/* ASSEMBLED state (Send approval) */}
          {order.status === 'ASSEMBLED' && (
            <Button
              fullWidth
              icon={InboxIcon}
              onClick={() =>
                sendApprovalMutation.mutate(order.id, {
                  onError: (error) => {
                    console.error('Send approval error:', error)
                    alert(`Ошибка отправки на согласование: ${getErrorMessage(error)}`)
                  },
                })
              }
              disabled={sendApprovalMutation.isPending && sendApprovalMutation.variables === order.id}
            >
              Отправить на согласование
            </Button>
          )}

          {/* WAITING_FOR_APPROVAL state */}
          {order.status === 'WAITING_FOR_APPROVAL' && (
            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-secondary)', textAlign: 'center', padding: '6px' }}>
              Согласование отправлено клиенту в Telegram... ⏳
            </div>
          )}

          {/* APPROVED or WAITING_FOR_PAYMENT (Send payment link input) */}
          {(order.status === 'APPROVED' || order.status === 'WAITING_FOR_PAYMENT' || order.status === 'ASSEMBLED' || order.status === 'WAITING_FOR_APPROVAL') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ссылка на оплату..."
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                value={paymentLinks[order.id] || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setPaymentLinks((prev) => ({ ...prev, [order.id]: val }))
                }}
              />
              <Button
                fullWidth
                size="sm"
                icon={InboxIcon}
                onClick={() => {
                  const link = (paymentLinks[order.id] || '').trim()
                  sendPaymentMutation.mutate(
                    {
                      id: order.id,
                      paymentLink: link,
                    },
                    {
                      onSuccess: (_data, variables) => {
                        setPaymentLinks((prev) => {
                          const copy = { ...prev }
                          delete copy[variables.id]
                          return copy
                        })
                      },
                      onError: (error) => {
                        console.error('Send payment error:', error)
                        alert(`Ошибка отправки ссылки на оплату: ${getErrorMessage(error)}`)
                      },
                    },
                  )
                }}
                disabled={
                  (sendPaymentMutation.isPending && sendPaymentMutation.variables?.id === order.id) ||
                  !/^https?:\/\/\S+$/i.test((paymentLinks[order.id] || '').trim())
                }
              >
                Отправить ссылку
              </Button>
              {order.status === 'WAITING_FOR_PAYMENT' && (
                <Button
                  fullWidth
                  size="sm"
                  variant="secondary"
                  icon={CheckIcon}
                  onClick={() => mutateStatus(order.id, 'PAID')}
                >
                  Оплачено вручную
                </Button>
              )}
            </div>
          )}

          {/* PAID state (Courier Selection and dispatch) */}
          {order.status === 'PAID' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <select
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                value={selectedCouriers[order.id] || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedCouriers((prev) => ({ ...prev, [order.id]: val }))
                }}
              >
                <option value="">-- Выбрать курьера --</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    🚴 {c.name} (@{c.tgname || 'нет'})
                  </option>
                ))}
              </select>
              <Button
                fullWidth
                size="sm"
                icon={TruckIcon}
                onClick={() => {
                  const courierId = selectedCouriers[order.id]
                  if (!courierId) return alert('Пожалуйста, выберите курьера!')
                  assignCourierMutation.mutate(
                    { id: order.id, courierId },
                    {
                      onError: (error) => {
                        console.error('Assign courier error:', error)
                        alert(`Ошибка назначения курьера: ${getErrorMessage(error)}`)
                      },
                    },
                  )
                }}
                disabled={!selectedCouriers[order.id] || assignCourierMutation.isPending}
              >
                Передать курьеру
              </Button>
            </div>
          )}

          {/* DELIVERING state */}
          {order.status === 'DELIVERING' && (
            <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-sage)', textAlign: 'center', padding: '6px' }}>
              Курьер в пути... Ожидаем отметки доставки. 🚚
            </div>
          )}

          {/* Cancel capability at any active stage */}
          {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
            <Button
              fullWidth
              size="sm"
              variant="secondary"
              icon={XMarkIcon}
              dangerText
              style={{ border: 'none', padding: '6px' }}
              onClick={() => mutateStatus(order.id, 'CANCELLED')}
            >
              Отменить заказ
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>
          Управление заказами
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Управляйте этапами сборки букетов, согласования по фото, отправки оплаты и личной курьерской доставки.
        </p>
      </div>

      {ordLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка доски заказов...
        </div>
      ) : (
        /* Kanban Board Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            alignItems: 'flex-start',
            boxSizing: 'border-box',
          }}
        >
          {/* Column 1: Assembly */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '2px solid var(--color-info)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingIcon style={{ width: '20px', height: '20px', color: 'var(--color-info)' }} />
              Сборка ({colAssembly.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colAssembly.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 2: Approval & Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '2px solid var(--color-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DocumentIcon style={{ width: '20px', height: '20px', color: 'var(--color-warning)' }} />
              Согласование / Оплата ({colApproval.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colApproval.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 3: Delivery */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '2px solid var(--color-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TruckIcon style={{ width: '20px', height: '20px', color: 'var(--color-gold)' }} />
              Доставка ({colDelivery.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colDelivery.map(renderOrderCard)}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', paddingBottom: '10px', borderBottom: '2px solid var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckIcon style={{ width: '20px', height: '20px', color: 'var(--color-success)' }} />
              Завершено ({colCompleted.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {colCompleted.map(renderOrderCard)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
