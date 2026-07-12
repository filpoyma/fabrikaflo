import React, { useState } from 'react'
import { useClientsQuery } from '../../api/clients'

export const ClientsPage: React.FC = () => {
  const { data: clients = [], isLoading } = useClientsQuery()
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
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>
          Клиенты CRM
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Список клиентов из Telegram-бота, статистика заказов и средние чеки.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', width: '100%', gap: '16px' }}>
        <input
          type="text"
          className="form-input"
          style={{ flex: 1, padding: '12px 18px', fontSize: '0.95rem' }}
          placeholder="Поиск клиентов по имени, телефону или @username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка базы клиентов...
        </div>
      ) : (
        <div className="glass-card" style={{ backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          {filteredClients.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              {searchTerm ? 'Клиенты не найдены по запросу.' : 'Список клиентов пуст. Новые клиенты добавляются при старте бота.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAF8F5' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Имя</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Telegram</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Телефон</th>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: 600 }}>Дата присоединения</th>
                    <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: 600 }}>Количество заказов</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Сумма покупок</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 600 }}>Средний чек</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 235, 229, 0.25)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '18px 20px', fontWeight: 600 }}>{client.name || 'Без имени'}</td>
                      <td style={{ padding: '18px 20px' }}>
                        {client.tgname ? (
                          <a
                            href={`https://t.me/${client.tgname}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: 'var(--color-accent-dark)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            @{client.tgname}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>отсутствует</span>
                        )}
                      </td>
                      <td style={{ padding: '18px 20px' }}>{client.phone || 'не указан'}</td>
                      <td style={{ padding: '18px 20px', color: 'var(--text-secondary)' }}>
                        {new Date(client.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '18px 20px', textAlign: 'center', fontWeight: 500 }}>
                        {client.ordersCount}
                      </td>
                      <td style={{ padding: '18px 20px', textAlign: 'right', fontWeight: 600 }}>
                        {client.totalSpend} руб.
                      </td>
                      <td style={{ padding: '18px 20px', textAlign: 'right', color: 'var(--color-sage)', fontWeight: 600 }}>
                        {client.averageCheck} руб.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
