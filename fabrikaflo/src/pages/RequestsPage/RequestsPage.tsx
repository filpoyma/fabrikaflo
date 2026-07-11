import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from '../../api/requests.api.ts'
import { Modal } from '../../components/Modal.tsx'
import type { IRequest } from '../../types'

import PlusIcon from '../../assets/icons/plus.svg'
import CheckIcon from '../../assets/icons/check.svg'
import XMarkIcon from '../../assets/icons/x-mark.svg'

export const RequestsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: requestsApi.list,
  })

  const requests = requestsData?.data ?? []

  // Status updates mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      requestsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
    },
  })

  // Convert to order mutation
  const convertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      requestsApi.convert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setIsConvertModalOpen(false)
      setSelectedRequest(null)
    },
  })

  // Modal and form states
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<IRequest | null>(null)
  
  // Order Form states
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [postcardText, setPostcardText] = useState('')
  const [wishes, setWishes] = useState('')
  const [comment, setComment] = useState('')
  const [budget, setBudget] = useState(0)

  const handleOpenConvert = (req: IRequest) => {
    setSelectedRequest(req)
    setRecipientName(req.client?.name || '')
    setRecipientPhone(req.client?.phone || '')
    setDeliveryAddress(req.deliveryType === 'DELIVERY' ? 'г. Москва, ' : '')
    setDeliveryTime('')
    setPostcardText('')
    setWishes(req.comment || '')
    setComment('')
    setBudget(req.budget)
    setIsConvertModalOpen(true)
  }

  const handleConvertSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRequest) return

    const payload = {
      recipientName,
      recipientPhone,
      deliveryAddress: selectedRequest.deliveryType === 'DELIVERY' ? deliveryAddress : '',
      deliveryTime: deliveryTime || undefined,
      postcardText: postcardText || undefined,
      wishes,
      comment: comment || undefined,
      budget: Number(budget),
    }

    convertMutation.mutate({ id: selectedRequest.id, data: payload })
  }

  const statusTranslations: Record<string, string> = {
    PENDING: 'Новая заявка',
    CONTACTED: 'Связались с клиентом',
    CONVERTED: 'Оформлен заказ',
    CANCELLED: 'Отменено',
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'badge badge-pending'
      case 'CONTACTED':
        return 'badge badge-warning'
      case 'CONVERTED':
        return 'badge badge-success'
      case 'CANCELLED':
        return 'badge badge-error'
      default:
        return 'badge'
    }
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>
          Заявки на букеты
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Список обращений клиентов из Telegram-бота. Превращайте их в заказы.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка списка заявок...
        </div>
      ) : (
        <div className="glass-card" style={{ backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          {requests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Заявок пока нет. Заявки появятся, когда клиенты нажмут кнопку "🌸 Заказать букет" в боте.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAF8F5' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Клиент</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Повод / Пожелания</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Бюджет</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Доставка / Дата</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Статус</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 235, 229, 0.25)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '18px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{req.client?.name || 'Клиент'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {req.client?.username ? `@${req.client.username}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', maxWidth: '300px' }}>
                        <div style={{ fontWeight: 500 }}>{req.occasion}</div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            marginTop: '4px',
                          }}
                        >
                          {req.comment || 'без комментария'}
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px', fontWeight: 600 }}>{req.budget} руб.</td>
                      <td style={{ padding: '18px 20px' }}>
                        <div>{req.deliveryType === 'PICKUP' ? '🚗 Самовывоз' : '🚚 Доставка'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Желаемая дата: {new Date(req.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '18px 20px' }}>
                        <span className={getStatusBadgeClass(req.status)}>
                          {statusTranslations[req.status] || req.status}
                        </span>
                      </td>
                      <td style={{ padding: '18px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {req.status === 'PENDING' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'CONTACTED' })}
                            >
                              <CheckIcon style={{ width: '12px', height: '12px' }} />
                              <span>Связаться</span>
                            </button>
                          )}
                          {(req.status === 'PENDING' || req.status === 'CONTACTED') && (
                            <>
                              <button
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => handleOpenConvert(req)}
                              >
                                <PlusIcon style={{ width: '12px', height: '12px' }} />
                                <span>Создать заказ</span>
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'CANCELLED' })}
                              >
                                <XMarkIcon style={{ width: '12px', height: '12px' }} />
                                <span>Отменить</span>
                              </button>
                            </>
                          )}
                          {req.status === 'CONVERTED' && (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingRight: '8px' }}>
                              Оформлен заказ ✅
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Convert Request Modal */}
      {selectedRequest && (
        <Modal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          title={`Оформление заказа по заявке #${selectedRequest.id.substring(0, 8)}`}
        >
          <form onSubmit={handleConvertSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              Клиент: <strong>{selectedRequest.client?.name}</strong> • Повод: <strong>{selectedRequest.occasion}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Получатель (Имя)</label>
              <input
                type="text"
                className="form-input"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Телефон получателя</label>
              <input
                type="text"
                className="form-input"
                placeholder="+7..."
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
            </div>

            {selectedRequest.deliveryType === 'DELIVERY' && (
              <div className="form-group">
                <label className="form-label">Адрес доставки</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Дата и время доставки / получения</label>
              <input
                type="datetime-local"
                className="form-input"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Пожелания к букету / состав</label>
              <textarea
                className="form-input"
                style={{ minHeight: '60px', resize: 'vertical' }}
                value={wishes}
                onChange={(e) => setWishes(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Текст открытки (если нужна)</label>
              <input
                type="text"
                className="form-input"
                placeholder="С днем рождения!..."
                value={postcardText}
                onChange={(e) => setPostcardText(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Комментарии к доставке / курьеру</label>
              <input
                type="text"
                className="form-input"
                placeholder="Позвонить получателю за 15 мин..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Бюджет заказа (руб.)</label>
              <input
                type="number"
                className="form-input"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsConvertModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={convertMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckIcon style={{ width: '16px', height: '16px' }} />
                <span>{convertMutation.isPending ? 'Оформление...' : 'Оформить заказ'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
