import React, { useState } from 'react'
import {
  useTeamQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useUploadAvatarMutation,
  type ITeamMember,
  type ICreateTeamMember,
} from '../../api/team'
import { AvatarCircle, IconButton, Button, SegmentedControl, type SegmentedOption, Modal } from '../../shared/ui'

import PlusIcon from '../../assets/icons/plus.svg'
import { PeonyIcon } from '../../components/BotanicalIcons'

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Администратор', color: '#6A1A2B', bg: '#F2E8D5' },
  COURIER: { label: 'Курьер', color: '#282321', bg: '#EFE6D9' },
}

const roleOptions: SegmentedOption<'ADMIN' | 'COURIER'>[] = [
  { value: 'COURIER', label: roleLabels.COURIER.label },
  { value: 'ADMIN', label: roleLabels.ADMIN.label },
]


const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const TeamPage: React.FC = () => {
  const { data: members = [], isLoading } = useTeamQuery()

  const createMutation = useCreateTeamMemberMutation()
  const updateMutation = useUpdateTeamMemberMutation()
  const deleteMutation = useDeleteTeamMemberMutation()
  const uploadAvatarMutation = useUploadAvatarMutation()

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<ITeamMember | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [tgname, setTgname] = useState('')
  const [login, setLogin] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'COURIER'>('COURIER')
  const [password, setPassword] = useState('')

  const resetForm = () => {
    setName('')
    setTgname('')
    setLogin('')
    setPhone('')
    setRole('COURIER')
    setPassword('')
  }

  const handleOpenCreate = () => {
    resetForm()
    setEditingMember(null)
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (member: ITeamMember) => {
    resetForm()
    setEditingMember(member)
    setName(member.name || '')
    setTgname(member.tgname || '')
    setLogin(member.login || '')
    setPhone(member.phone || '')
    setRole(member.role)
    setPassword('') // keep password blank unless changing
    setIsEditModalOpen(true)
  }

  const handleCreateSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!name.trim()) return alert('Введите имя сотрудника')
    if (role === 'ADMIN' && !login.trim()) return alert('Введите логин для администратора')
    if (role === 'ADMIN' && !password.trim()) return alert('Введите пароль для администратора')

    const body: ICreateTeamMember = {
      name: name.trim(),
      tgname: tgname.trim() || undefined,
      login: role === 'ADMIN' ? login.trim() : undefined,
      phone: phone.trim() || undefined,
      role,
      password: password.trim() || undefined,
    }

    createMutation.mutate(body, {
      onSuccess: () => {
        setIsCreateModalOpen(false)
        resetForm()
      },
      onError: (error) => {
        console.error('Create team member error:', error)
        alert(`Ошибка при создании сотрудника: ${getErrorMessage(error)}`)
      },
    })
  }

  const handleEditSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingMember) return
    if (!name.trim()) return alert('Введите имя сотрудника')
    if (role === 'ADMIN' && !login.trim()) return alert('Введите логин для администратора')

    updateMutation.mutate(
      {
        id: editingMember.id,
        body: {
          name: name.trim(),
          tgname: tgname.trim() || undefined,
          login: role === 'ADMIN' ? login.trim() : undefined,
          phone: phone.trim() || undefined,
          role,
          password: password.trim() ? password.trim() : undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
          setEditingMember(null)
          resetForm()
        },
        onError: (error) => {
          console.error('Update team member error:', error)
          alert(`Ошибка при обновлении сотрудника: ${getErrorMessage(error)}`)
        },
      },
    )
  }

  // Split by role for display
  const admins = members.filter((m) => m.role === 'ADMIN')
  const couriers = members.filter((m) => m.role === 'COURIER')

  const renderMemberCard = (member: ITeamMember) => {
    const rl = roleLabels[member.role]
    const isLinked = !!member.telegramId
    const isDeleting = deleteMutation.isPending && deleteMutation.variables === member.id
    const fileInputId = `avatar-upload-${member.id}`
    const isUploadingAvatar = uploadAvatarMutation.isPending && uploadAvatarMutation.variables?.id === member.id

    const handleAvatarClick = () => {
      const el = document.getElementById(fileInputId)
      if (el) el.click()
    }

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0]
      if (selected) {
        uploadAvatarMutation.mutate(
          { id: member.id, file: selected },
          {
            onError: (error) => {
              alert(`Ошибка при загрузке аватара: ${getErrorMessage(error)}`)
            },
          },
        )
      }
    }

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
          <div
            onClick={isUploadingAvatar ? undefined : handleAvatarClick}
            style={{
              position: 'relative',
              cursor: isUploadingAvatar ? 'default' : 'pointer',
              borderRadius: '50%',
              overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}
            title={isUploadingAvatar ? 'Загрузка...' : 'Нажмите, чтобы изменить аватар'}
            onMouseEnter={(e) => {
              if (!isUploadingAvatar) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 0 8px rgba(0,0,0,0.15)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <AvatarCircle
              name={member.name}
              backgroundColor={rl.bg}
              color={rl.color}
              imageUrl={member.avatarUrl}
            />
            {/* Hover overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                opacity: isUploadingAvatar ? 1 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                transition: 'opacity 0.2s ease',
                borderRadius: '50%',
              }}
              onMouseEnter={(e) => {
                if (!isUploadingAvatar) e.currentTarget.style.opacity = '1'
              }}
              onMouseLeave={(e) => {
                if (!isUploadingAvatar) e.currentTarget.style.opacity = '0'
              }}
            >
              {isUploadingAvatar ? '...' : 'ФОТО'}
            </div>
          </div>

          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarFileChange}
          />

          {/* Name + tgname */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {member.name || 'Без имени'}
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {member.login && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  login: {member.login}
                </span>
              )}
              {member.tgname && (
                <a
                  href={`https://t.me/${member.tgname}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.85rem', color: 'var(--color-accent-dark)', textDecoration: 'none', fontWeight: 500 }}
                >
                  tg: @{member.tgname}
                </a>
              )}
              {member.phone && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ph: {member.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          {/* Status pill (role) + Telegram link status */}
          <span className={`status-pill ${member.role === 'ADMIN' ? 'status-pill--warn' : 'status-pill--sage'}`}>
            {rl.label}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: isLinked ? 'var(--color-success)' : 'var(--text-secondary)',
            }}
          >
            {isLinked ? '● Telegram подключён' : '○ Ожидает подключения'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <IconButton variant="edit" onClick={() => handleOpenEdit(member)} />
          <IconButton
            variant="delete"
            loading={isDeleting}
            disabled={isDeleting}
            onClick={() => {
              if (confirm(`Удалить сотрудника «${member.name}»? Это действие необратимо.`)) {
                deleteMutation.mutate(member.id, {
                  onError: (error) => {
                    console.error('Delete team member error:', error)
                    alert(`Ошибка при удалении сотрудника: ${getErrorMessage(error)}`)
                  },
                })
              }
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }} data-testid="team-page">
      {/* Header */}
      <header className="page-header with-action">
        <div className="head-text">
          <span className="eyebrow">Мастерская</span>
          <h1>Команда <em>цеха</em></h1>
          <p>Управление сотрудниками: администраторы CRM и курьеры Telegram-бота.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={PlusIcon} style={{ flexShrink: 0 }} data-testid="add-member-btn">
          Добавить сотрудника
        </Button>
      </header>

      {isLoading ? (
        <div className="empty-state">
          <PeonyIcon size={48} color="var(--color-gold-deep)" />
          <div className="headline">Загрузка</div>
          <p>Загружаем список сотрудников…</p>
        </div>
      ) : members.length === 0 ? (
        <div className="glass-card" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="empty-state">
            <PeonyIcon size={64} color="var(--color-gold-deep)" />
            <div className="headline">Команда ещё не собрана</div>
            <p>Нажмите «Добавить сотрудника», чтобы создать первого администратора или курьера.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <div className="section-eyebrow">
                <span>Администраторы</span>
                <span className="count">· {String(admins.length).padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {admins.map(renderMemberCard)}
              </div>
            </div>
          )}

          {/* Couriers */}
          {couriers.length > 0 && (
            <div>
              <div className="section-eyebrow">
                <span>Курьеры</span>
                <span className="count">· {String(couriers.length).padStart(2, '0')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {couriers.map(renderMemberCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Member Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); resetForm() }}
        title="Новый сотрудник"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Роль</label>
            <SegmentedControl value={role} options={roleOptions} onChange={setRole} />
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
              placeholder="@tgname"
              value={tgname}
              onChange={(e) => setTgname(e.target.value)}
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
            <>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: elena"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
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
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => { setIsCreateModalOpen(false); resetForm() }}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Создание...' : 'Добавить в команду'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); resetForm(); setEditingMember(null) }}
        title="Редактировать сотрудника"
      >
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Роль</label>
            <SegmentedControl value={role} options={roleOptions} onChange={setRole} />
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
              placeholder="@tgname"
              value={tgname}
              onChange={(e) => setTgname(e.target.value)}
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
            <>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: elena"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              type="button"
              onClick={() => { setIsEditModalOpen(false); resetForm(); setEditingMember(null) }}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
