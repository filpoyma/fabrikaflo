import React from 'react'
import clsx from 'clsx'
import { pageStyles } from '../../shared/styles'
import { Link } from 'react-router-dom'
import { useRequestsQuery } from '../../api/requests'
import { useOrdersQuery } from '../../api/orders'
import { Button } from '../../shared/ui'
import { PeonyIcon, DeliveryIcon, PinIcon } from '../../components/BotanicalIcons'
import styles from './DashboardPage.module.css'

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
      className={clsx(
        'glass-card',
        styles.statCard,
        to && styles.statCardLink,
        pending && styles.statCardPending,
      )}
    >
      <span className={clsx('eyebrow', styles.statLabel)}>
        {label}
      </span>
      <div
        className={clsx(
          styles.statNumber,
          numberColor === 'var(--color-sage)' && styles.statNumberSage,
          numberColor === 'var(--color-gold-deep)' && styles.statNumberGold,
          numberColor === 'var(--color-success)' && styles.statNumberSuccess,
          numberColor !== 'var(--color-sage)' &&
            numberColor !== 'var(--color-gold-deep)' &&
            numberColor !== 'var(--color-success)' &&
            styles.statNumberDefault,
        )}
      >
        {pending ? '—' : value}
      </div>
      <div
        className={styles.statHint}
      >
        {hint}
      </div>
    </div>
  )
  return to ? (
    <Link to={to} className={styles.statLink} data-testid={`stat-${label}`}>
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
    <div className={clsx('animated-fade-in', pageStyles.page)} data-testid="dashboard-page">
      <header className="page-header">
        <span className="eyebrow">Мастерская · Сегодня</span>
        <h1>
          Панель <em>управления</em>
        </h1>
        <p>Оперативная сводка о заявках, сборке и доставках цветочного цеха fabrika.flo.</p>
      </header>

      <div
        className={styles.statsGrid}
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
        className={styles.overviewGrid}
      >
        <div className={clsx('glass-card', styles.panel)} data-testid="inquiries-block">
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">Из Telegram</span>
              <h3 className={styles.panelTitle}>
                Последние заявки
              </h3>
            </div>
            <Link
              to="/requests"
              className={styles.panelLink}
            >
              все заявки
            </Link>
          </div>

          {requestsLoading ? (
            <div className={clsx('empty-state', styles.emptyBlock)}>
              <PeonyIcon size={40} color="var(--color-gold-deep)" />
              <div className="headline">Загрузка заявок…</div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className={clsx('empty-state', styles.emptyBlock)}>
              <PeonyIcon size={54} color="var(--color-gold-deep)" />
              <div className="headline">Все обработаны</div>
              <p>Нет новых заявок из бота. Флористы работают над текущими заказами.</p>
            </div>
          ) : (
            <div className="hair-list">
              {pendingRequests.slice(0, 4).map((req) => (
                <div key={req.id} className="item">
                  <div className={styles.listItemContent}>
                    <div className={clsx('cell-eyebrow', styles.listItemEyebrow)}>{req.deliveryType === 'PICKUP' ? 'Самовывоз' : 'Доставка'}</div>
                    <div className={styles.requestClientName}>
                      {req.client?.name || 'Клиент'}
                    </div>
                    <div className={styles.requestMeta}>
                      {req.occasion} · <span className={styles.requestBudget}>{req.budget} ₽</span>
                    </div>
                  </div>
                  <Button to="/requests" variant="secondary" size="sm">Открыть</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={clsx('glass-card', styles.panel)} data-testid="deliveries-block">
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">В пути</span>
              <h3 className={styles.panelTitle}>
                Активные доставки
              </h3>
            </div>
            <Link
              to="/orders"
              className={styles.panelLink}
            >
              все заказы
            </Link>
          </div>

          {ordersLoading ? (
            <div className={clsx('empty-state', styles.emptyBlock)}>
              <DeliveryIcon size={44} color="var(--color-gold-deep)" />
              <div className="headline">Загрузка заказов…</div>
            </div>
          ) : deliveringOrders.length === 0 ? (
            <div className={clsx('empty-state', styles.emptyBlock)}>
              <DeliveryIcon size={56} color="var(--color-gold-deep)" />
              <div className="headline">Курьеры отдыхают</div>
              <p>В данный момент нет букетов в пути. Как только заказ будет отправлен курьеру — появится здесь.</p>
            </div>
          ) : (
            <div className="hair-list">
              {deliveringOrders.slice(0, 4).map((ord) => (
                <div key={ord.id} className="item">
                  <div className={styles.listItemContent}>
                    <div className={clsx('cell-eyebrow', styles.listItemEyebrow)}>
                      Курьер · {ord.courier?.name || 'не назначен'}
                    </div>
                    <div className={styles.deliveryRecipient}>
                      {ord.recipientName || 'Получатель не указан'}
                    </div>
                    <div className={styles.deliveryAddress}>
                      <PinIcon size={12} color="var(--color-gold-deep)" />
                      <span className={styles.addressText}>
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
