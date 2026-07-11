import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamApi, type ITeamMember, type ICreateTeamMember } from '../../api/team.api.ts'
import { Modal } from '../../components/Modal.tsx'

import PlusIcon from '../../assets/icons/plus.svg'
import TrashIcon from '../../assets/icons/trash.svg'

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Администратор', color: '#2B3B30', bg: '#C8D8B0' },
  COURIER: { label: 'Курьер', color: '#1E3A5F', bg: '#B8D4F0' },
}

export const TeamPage: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: teamData, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: teamApi.list,
  })

  const members = teamData?.data ?? []

  const createMutation = useMutation({
    mutationFn: (body: ICreateTeamMember) => teamApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
      setIsModalOpen(false)
      resetForm()
    },
    onError: (error: any) => {
      console.error('Create team member error:', error)
      alert(`Ошибка при создании сотрудника: ${error.message || error}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] })
    },
    onError: (error: any) => {
      console.error('Delete team member error:', error)
      alert(`Ошибка при удалении сотрудника: ${error.message || error}`)
    },
  })

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'COURIER'>('COURIER')
  const [password, setPassword] = useState('')

  const resetForm = () => {
    setName('')
    setUsername('')
    setPhone('')
    setRole('COURIER')
    setPassword('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Введите имя сотрудника')
    if (role === 'ADMIN' && !password.trim()) return alert('Введите пароль для администратора')

    createMutation.mutate({
      name: name.trim(),
      username: username.trim() || undefined,
      phone: phone.trim() || undefined,
      role,
      password: password.trim() || undefined,
    })
  }

  // Split by role for display
  const admins = members.filter((m) => m.role === 'ADMIN')
  const couriers = members.filter((m) => m.role === 'COURIER')

  const renderMemberCard = (member: ITeamMember) => {
    const rl = roleLabels[member.role]
    const isLinked = !!member.telegramId
    const isDeleting = deleteMutation.isPending && deleteMutation.variables === member.id

    return (
      <div
        key={member.id}
        className="glass-card"
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Avatar + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: rl.bg,
              color: rl.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.3rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(member.name || '?')[0].toUpperCase()}
          </div>

          {/* Name + username */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {member.name || 'Без имени'}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {member.username && (
                <a
                  href={`https://t.me/${member.username}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.85rem', color: 'var(--color-accent-dark)', textDecoration: 'none', fontWeight: 500 }}
                >
                  @{member.username}
                </a>
              )}
              {member.phone && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {member.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span
            style={{
              backgroundColor: rl.bg,
              color: rl.color,
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {rl.label}
          </span>

          {/* Telegram link status */}
          <span
            style={{
              fontSize: '0.75rem',
              color: isLinked ? 'var(--color-sage)' : 'var(--text-secondary)',
              fontWeight: 500,
            }}
          >
            {isLinked ? '● Telegram подключён' : '○ Ожидает подключения'}
          </span>
        </div>

        {/* Delete button */}
        <button
          onClick={() => {
            if (confirm(`Удалить сотрудника «${member.name}»? Это действие необратимо.`)) {
              deleteMutation.mutate(member.id)
            }
          }}
          disabled={isDeleting}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid rgba(200, 92, 92, 0.3)',
            color: 'rgba(200, 92, 92, 0.85)',
            padding: '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(200, 92, 92, 0.95)'
            e.currentTarget.style.color = 'white'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'rgba(200, 92, 92, 0.85)'
          }}
        >
          <TrashIcon
            style={{
              width: '16px',
              height: '16px',
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isDeleting ? 'scale(1.45)' : 'scale(1)',
            }}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>Команда</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Управление сотрудниками: администраторы CRM и курьеры Telegram-бота.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
        >
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          <span>Добавить сотрудника</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка команды...
        </div>
      ) : members.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', color: 'var(--text-secondary)' }}>
          Сотрудники пока не добавлены. Нажмите «+ Добавить сотрудника», чтобы создать первого.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Admins section */}
          {admins.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Администраторы · {admins.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {admins.map(renderMemberCard)}
              </div>
            </div>
          )}

          {/* Couriers section */}
          {couriers.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Курьеры · {couriers.length}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {couriers.map(renderMemberCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title="Новый сотрудник"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Role selector as toggle */}
          <div className="form-group">
            <label className="form-label">Роль</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['COURIER', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${role === r ? 'var(--color-sage)' : 'var(--border-light)'}`,
                    backgroundColor: role === r ? 'rgba(var(--color-sage-rgb, 130, 160, 100), 0.08)' : 'transparent',
                    color: role === r ? 'var(--color-sage)' : 'var(--text-secondary)',
                    fontWeight: role === r ? 600 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {roleLabels[r].label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Имя *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Иван Петров"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telegram username</label>
            <input
              type="text"
              className="form-input"
              placeholder="@ivan_courier"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
              {role === 'COURIER'
                ? 'Курьер подключится автоматически, когда откроет бота.'
                : 'Необязательно для администраторов.'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Телефон</label>
            <input
              type="text"
              className="form-input"
              placeholder="+7 999 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {role === 'ADMIN' && (
            <div className="form-group">
              <label className="form-label">Пароль для входа в CRM *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Минимум 8 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setIsModalOpen(false); resetForm() }}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Создание...' : 'Добавить в команду'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
