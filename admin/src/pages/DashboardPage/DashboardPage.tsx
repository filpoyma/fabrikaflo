import React from 'react'
import { Link } from 'react-router-dom'
import { useRequestsQuery } from '../../api/requests'
import { useOrdersQuery } from '../../api/orders'
import { Button } from '../../shared/ui'
import { PeonyIcon, DeliveryIcon, PinIcon } from '../../components/BotanicalIcons'

const StatCard: React.FC<{
  label: string
  value: number
  hint: string
  to?: string
  numberColor?: string
  pending?: boolean
}> = ({ label, value, hint, to, numberColor = 'var(--text-primary)', pending = false }) => {
  const inner = (
    <div
      className="glass-card"
      style={{
        padding: '26px 26px 22px',
        backgroundColor: '#FFFFFF',
        textAlign: 'left',
        cursor: to ? 'pointer' : 'default',
        opacity: pending ? 0.55 : 1,
      }}
    >
      <span className="eyebrow" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', letterSpacing: '0.28em' }}>
        {label}
      </span>
      <div
        style={{
          fontSize: '3rem',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 300,
          color: numberColor,
          marginTop: '10px',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}
      >
        {pending ? '—' : value}
      </div>
      <div
        style={{
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-light)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
        }}
      >
        {hint}
      </div>
    </div>
  )
  return to ? (
    <Link to={to} style={{ display: 'block', textDecoration: 'none' }} data-testid={`stat-${label}`}>
      {inner}
    </Link>
  ) : (
    inner
  )
}

export const DashboardPage: React.FC = () => {
  const { data: requests, isPending: requestsPending } = useRequestsQuery()
  const { data: orders, isPending: ordersPending } = useOrdersQuery()

  const requestsList = requests ?? []
  const ordersList = orders ?? []

  const pendingRequests = requestsList.filter((r) => r.status === 'PENDING')
  const activeOrders = ordersList.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
  const deliveringOrders = ordersList.filter((o) => o.status === 'DELIVERING')

  const todayStr = new Date().toDateString()
  const completedToday = ordersList.filter(
    (o) => o.status === 'DELIVERED' && new Date(o.updatedAt).toDateString() === todayStr,
  )

  const requestsLoading = requestsPending && requests === undefined
  const ordersLoading = ordersPending && orders === undefined

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} data-testid="dashboard-page">
      <header className="page-header">
        <span className="eyebrow">Мастерская · Сегодня</span>
        <h1>
          Панель <em>управления</em>
        </h1>
        <p>Оперативная сводка о заявках, сборке и доставках цветочного цеха fabrika.flo.</p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        <StatCard
          label="Новые заявки"
          value={pendingRequests.length}
          hint="ожидают обработки"
          to="/requests"
          numberColor="var(--color-sage)"
          pending={requestsLoading}
        />
        <StatCard
          label="Активные заказы"
          value={activeOrders.length}
          hint="в сборке / согласовании"
          to="/orders"
          pending={ordersLoading}
        />
        <StatCard
          label="В доставке"
          value={deliveringOrders.length}
          hint="курьеры в пути"
          to="/orders"
          numberColor="var(--color-gold-deep)"
          pending={ordersLoading}
        />
        <StatCard
          label="Доставлено сегодня"
          value={completedToday.length}
          hint="заказов завершено"
          numberColor="var(--color-success)"
          pending={ordersLoading}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        <div className="glass-card" style={{ padding: '28px 30px', backgroundColor: '#FFFFFF', textAlign: 'left' }} data-testid="inquiries-block">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <span className="eyebrow">Из Telegram</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                Последние заявки
              </h3>
            </div>
            <Link
              to="/requests"
              style={{
                color: 'var(--color-sage)',
                textDecoration: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.65rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderBottom: '1px solid var(--color-sage)',
                paddingBottom: '2px',
                whiteSpace: 'nowrap',
              }}
            >
              все заявки
            </Link>
          </div>

          {requestsLoading ? (
            <div className="empty-state" style={{ padding: '24px 8px' }}>
              <PeonyIcon size={40} color="var(--color-gold-deep)" />
              <div className="headline">Загрузка заявок…</div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 8px' }}>
              <PeonyIcon size={54} color="var(--color-gold-deep)" />
              <div className="headline">Все обработаны</div>
              <p>Нет новых заявок из бота. Флористы работают над текущими заказами.</p>
            </div>
          ) : (
            <div className="hair-list">
              {pendingRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-eyebrow" style={{ marginBottom: '3px', fontSize: '0.6rem' }}>{req.deliveryType === 'PICKUP' ? 'Самовывоз' : 'Доставка'}</div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {req.client?.name || 'Клиент'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {req.occasion} · <span style={{ color: 'var(--color-sage)' }}>{req.budget} ₽</span>
                    </div>
                  </div>
                  <Button to="/requests" variant="secondary" size="sm">Открыть</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '28px 30px', backgroundColor: '#FFFFFF', textAlign: 'left' }} data-testid="deliveries-block">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
            <div>
              <span className="eyebrow">В пути</span>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: '1.5rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                Активные доставки
              </h3>
            </div>
            <Link
              to="/orders"
              style={{
                color: 'var(--color-sage)',
                textDecoration: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '0.65rem',
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                fontWeight: 600,
                borderBottom: '1px solid var(--color-sage)',
                paddingBottom: '2px',
                whiteSpace: 'nowrap',
              }}
            >
              все заказы
            </Link>
          </div>

          {ordersLoading ? (
            <div className="empty-state" style={{ padding: '24px 8px' }}>
              <DeliveryIcon size={44} color="var(--color-gold-deep)" />
              <div className="headline">Загрузка заказов…</div>
            </div>
          ) : deliveringOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 8px' }}>
              <DeliveryIcon size={56} color="var(--color-gold-deep)" />
              <div className="headline">Курьеры отдыхают</div>
              <p>В данный момент нет букетов в пути. Как только заказ будет отправлен курьеру — появится здесь.</p>
            </div>
          ) : (
            <div className="hair-list">
              {deliveringOrders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cell-eyebrow" style={{ marginBottom: '3px', fontSize: '0.6rem' }}>
                      Курьер · {ord.courier?.name || 'не назначен'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {ord.recipientName || 'Получатель не указан'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <PinIcon size={12} color="var(--color-gold-deep)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ord.deliveryAddress || 'Самовывоз'}
                      </span>
                    </div>
                  </div>
                  <Button to="/orders" variant="secondary" size="sm">Просмотр</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
