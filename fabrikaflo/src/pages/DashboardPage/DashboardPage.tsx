import React from 'react'
import { Link } from 'react-router-dom'
import { useRequestsQuery } from '../../api/requests'
import { useOrdersQuery } from '../../api/orders'
import { Button } from '../../shared/ui'

export const DashboardPage: React.FC = () => {
  const { data: requests = [], isLoading: reqLoading } = useRequestsQuery()
  const { data: orders = [], isLoading: ordLoading } = useOrdersQuery()

  // Metrics calculations
  const pendingRequests = requests.filter((r) => r.status === 'PENDING')
  const activeOrders = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  )
  const deliveringOrders = orders.filter((o) => o.status === 'DELIVERING')

  const todayStr = new Date().toDateString()
  const completedToday = orders.filter(
    (o) => o.status === 'DELIVERED' && new Date(o.updatedAt).toDateString() === todayStr
  )

  const isLoading = reqLoading || ordLoading

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--text-primary)' }}>
          Панель управления
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Оперативная информация о работе мастерской на сегодня
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка метрик мастерской...
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
            }}
          >
            <Link to="/requests" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Новые заявки
                </span>
                <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-info)', marginTop: '8px' }}>
                  {pendingRequests.length}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ожидают обработки</span>
              </div>
            </Link>

            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Активные заказы
                </span>
                <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', marginTop: '8px' }}>
                  {activeOrders.length}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>в сборке / согласовании</span>
              </div>
            </Link>

            <Link to="/orders" style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  В доставке
                </span>
                <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-warning)', marginTop: '8px' }}>
                  {deliveringOrders.length}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>курьеры в пути</span>
              </div>
            </Link>

            <div className="glass-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Доставлено сегодня
              </span>
              <h2 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--color-success)', marginTop: '8px' }}>
                {completedToday.length}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>заказов завершено</span>
            </div>
          </div>

          {/* Quick Tasks Section */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              marginTop: '16px',
            }}
          >
            {/* New Inquiries List */}
            <div className="glass-card" style={{ padding: '28px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px' }}>
                Последние заявки из Telegram
              </h3>
              {pendingRequests.length === 0 ? (
                <div style={{ padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Нет новых заявок. Все обращения обработаны! 🌸
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingRequests.slice(0, 4).map((req) => (
                    <div
                      key={req.id}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {req.client?.name || 'Клиент'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          💐 {req.occasion} • {req.budget} руб.
                        </div>
                      </div>
                      <Button to="/requests" variant="secondary" size="sm">
                        Открыть
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Courier active deliveries list */}
            <div className="glass-card" style={{ padding: '28px', backgroundColor: '#FFFFFF', textAlign: 'left' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '20px' }}>
                Активные доставки
              </h3>
              {deliveringOrders.length === 0 ? (
                <div style={{ padding: '24px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  В данный момент нет букетов в пути. 🚗
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {deliveringOrders.slice(0, 4).map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: '16px',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          Получатель: {ord.recipientName || 'Не указан'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          📍 {ord.deliveryAddress || 'Самовывоз'} • Курьер: {ord.courier?.name || 'не назначен'}
                        </div>
                      </div>
                      <Button to="/orders" variant="secondary" size="sm">
                        Просмотр
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
