import React, { useState } from 'react'
import { useClientsQuery } from '../../api/clients'
import { isInitialQueryLoad } from '../../api/queryUtils'
import { PeonyIcon } from '../../components/BotanicalIcons'
import { InlineQueryLoader, Input } from '../../shared/ui'

export const ClientsPage: React.FC = () => {
  const { data, isPending } = useClientsQuery()
  const clients = data ?? []
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = clients.filter((client) => {
    const term = searchTerm.toLowerCase()
    return (
      (client.name?.toLowerCase() || '').includes(term) ||
      (client.phone?.toLowerCase() || '').includes(term) ||
      (client.tgname?.toLowerCase() || '').includes(term)
    )
  })

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }} data-testid="clients-page">
      <header className="page-header">
        <span className="eyebrow">CRM</span>
        <h1>Клиенты <em>цветочного цеха</em></h1>
        <p>База клиентов из Telegram-бота: контакты, статистика заказов и средний чек.</p>
      </header>

      <div style={{ display: 'flex', width: '100%', gap: '16px' }}>
        <Input
          type="text"
          style={{ flex: 1, padding: '13px 18px', fontSize: '0.95rem' }}
          placeholder="Поиск по имени, телефону или @username…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="clients-search"
        />
      </div>

      <div className="glass-card" style={{ backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
        {!isInitialQueryLoad(isPending, data) && filteredClients.length === 0 ? (
          <div className="empty-state">
            <PeonyIcon size={64} color="var(--color-gold-deep)" />
            <div className="headline">{searchTerm ? 'Ничего не найдено' : 'Список пуст'}</div>
            <p>
              {searchTerm
                ? 'Попробуйте другой поисковый запрос — имя, телефон или @username.'
                : 'Новые клиенты добавляются автоматически, когда открывают Telegram-бот fabrika.flo.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="editorial-table">
              <thead>
                <tr>
                  <th>Имя</th>
                  <th>Telegram</th>
                  <th>Телефон</th>
                  <th>Присоединился</th>
                  <th className="center">Заказов</th>
                  <th className="right">Сумма покупок</th>
                  <th className="right">Средний чек</th>
                </tr>
              </thead>
              <tbody>
                {isInitialQueryLoad(isPending, data) ? (
                  <tr>
                    <td colSpan={7}>
                      <InlineQueryLoader message="Получаем базу клиентов…" />
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                  <tr key={client.id} data-testid={`client-${client.id}`}>
                    <td>
                      <div className="cell-primary">{client.name || 'Без имени'}</div>
                    </td>
                    <td>
                      {client.tgname ? (
                        <a
                          href={`https://t.me/${client.tgname}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--color-sage)', textDecoration: 'none', fontWeight: 500, borderBottom: '1px solid var(--color-gold-deep)', paddingBottom: '1px' }}
                        >
                          @{client.tgname}
                        </a>
                      ) : (
                        <span className="cell-mute" style={{ marginTop: 0 }}>отсутствует</span>
                      )}
                    </td>
                    <td>{client.phone || <span className="cell-mute" style={{ marginTop: 0 }}>не указан</span>}</td>
                    <td className="cell-mute" style={{ marginTop: 0 }}>
                      {new Date(client.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="center">
                      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                        {client.ordersCount}
                      </span>
                    </td>
                    <td className="right">
                      <span style={{ fontWeight: 600 }}>{client.totalSpend} ₽</span>
                    </td>
                    <td className="right">
                      <span className="cell-mono-num">{client.averageCheck} ₽</span>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
