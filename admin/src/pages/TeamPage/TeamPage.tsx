import React, { useState } from 'react'
import clsx from 'clsx'
import { pageStyles } from '../../shared/styles'
import {
  useTeamQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useUploadAvatarMutation,
  type ITeamMember,
  type ICreateTeamMember,
} from '../../api/team'
import styles from './TeamPage.module.css'
import { isInitialQueryLoad } from '../../api/queryUtils'
import { AvatarCircle, IconButton, Button, SegmentedControl, type SegmentedOption, Modal, InlineQueryLoader, Input } from '../../shared/ui'

import PlusIcon from '../../assets/icons/plus.svg'
import { PeonyIcon } from '../../components/BotanicalIcons'

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Администратор', color: '#6A1A2B', bg: '#F2E8D5' },
  COURIER: { label: 'Курьер', color: '#282321', bg: '#EFE6D9' },
}

type TeamRole = 'ADMIN' | 'COURIER'

const roleOptions: SegmentedOption<TeamRole>[] = [
  { value: 'COURIER', label: roleLabels.COURIER.label },
  { value: 'ADMIN', label: roleLabels.ADMIN.label },
]


const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const TeamPage: React.FC = () => {
  const { data, isPending } = useTeamQuery()
  const members = data ?? []

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
  const [role, setRole] = useState<TeamRole>('COURIER')
  const [password, setPassword] = useState('')

  const handleRoleChange = (value: TeamRole) => setRole(value)

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
        className={clsx('glass-card', styles.memberCard)}
      >
        {/* Avatar + Info */}
        <div className={styles.memberSummary}>
          <div
            onClick={isUploadingAvatar ? undefined : handleAvatarClick}
            className={clsx(styles.avatarFrame, isUploadingAvatar && styles.avatarFrameDisabled)}
            title={isUploadingAvatar ? 'Загрузка...' : 'Нажмите, чтобы изменить аватар'}
          >
            <AvatarCircle
              name={member.name}
              backgroundColor={rl.bg}
              color={rl.color}
              imageUrl={member.avatarUrl}
            />
            {/* Hover overlay */}
            <div
              className={clsx(styles.avatarOverlay, isUploadingAvatar && styles.avatarOverlayUploading)}
            >
              {isUploadingAvatar ? '...' : 'ФОТО'}
            </div>
          </div>

          <Input
            id={fileInputId}
            type="file"
            accept="image/*"
            hidden
            onChange={handleAvatarFileChange}
          />

          {/* Name + tgname */}
          <div className={styles.memberInfo}>
            <span className={styles.memberName}>
              {member.name || 'Без имени'}
            </span>
            <div className={styles.memberMeta}>
              {member.login && (
                <span className={styles.memberLogin}>
                  login: {member.login}
                </span>
              )}
              {member.tgname && (
                <a
                  href={`https://t.me/${member.tgname}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.memberTelegramLink}
                >
                  tg: @{member.tgname}
                </a>
              )}
              {member.phone && (
                <span className={styles.memberPhone}>
                  ph: {member.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Role badge */}
        <div className={styles.memberRole}>
          {/* Status pill (role) + Telegram link status */}
          <span className={clsx('status-pill', member.role === 'ADMIN' ? 'status-pill--warn' : 'status-pill--sage')}>
            {rl.label}
          </span>
          <span
            className={clsx(styles.connectionStatus, isLinked ? styles.connectionStatusLinked : styles.connectionStatusPending)}
          >
            {isLinked ? '● Telegram подключён' : '○ Ожидает подключения'}
          </span>
        </div>

        <div className={styles.memberActions}>
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
    <div className={clsx('animated-fade-in', pageStyles.page)} data-testid="team-page">
      {/* Header */}
      <header className="page-header with-action">
        <div className="head-text">
          <span className="eyebrow">Мастерская</span>
          <h1>Команда <em>цеха</em></h1>
          <p>Управление сотрудниками: администраторы CRM и курьеры Telegram-бота.</p>
        </div>
        <Button onClick={handleOpenCreate} icon={PlusIcon} className={styles.addMemberButton} data-testid="add-member-btn">
          Добавить сотрудника
        </Button>
      </header>

      {isInitialQueryLoad(isPending, data) ? (
        <InlineQueryLoader message="Загружаем список сотрудников…" />
      ) : members.length === 0 ? (
        <div className={clsx('glass-card', pageStyles.surfaceCard)}>
          <div className="empty-state">
            <PeonyIcon size={64} color="var(--color-gold-deep)" />
            <div className="headline">Команда ещё не собрана</div>
            <p>Нажмите «Добавить сотрудника», чтобы создать первого администратора или курьера.</p>
          </div>
        </div>
      ) : (
        <div className={styles.teamGroups}>
          {/* Admins */}
          {admins.length > 0 && (
            <div>
              <div className="section-eyebrow">
                <span>Администраторы</span>
                <span className="count">· {String(admins.length).padStart(2, '0')}</span>
              </div>
              <div className={styles.adminGroup}>
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
              <div className={styles.courierGroup}>
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
        <form onSubmit={handleCreateSubmit} className={pageStyles.formStack}>
          <div className="form-group">
            <label className="form-label">Роль</label>
            <SegmentedControl<TeamRole> value={role} options={roleOptions} onChange={handleRoleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Имя *</label>
            <Input
              type="text"
              placeholder="Иван Петров"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telegram username</label>
            <Input
              type="text"
              placeholder="@tgname"
              value={tgname}
              onChange={(e) => setTgname(e.target.value)}
            />
            <span className={pageStyles.fieldHint}>
              {role === 'COURIER'
                ? 'Курьер подключится автоматически, когда откроет бота.'
                : 'Необязательно для администраторов.'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Телефон</label>
            <Input
              type="text"
              placeholder="+7 999 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {role === 'ADMIN' && (
            <>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <Input
                  type="text"
                  placeholder="Например: elena"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Пароль для входа в CRM *</label>
                <Input
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className={pageStyles.formActions}>
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
        <form onSubmit={handleEditSubmit} className={pageStyles.formStack}>
          <div className="form-group">
            <label className="form-label">Роль</label>
            <SegmentedControl<TeamRole> value={role} options={roleOptions} onChange={handleRoleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Имя *</label>
            <Input
              type="text"
              placeholder="Иван Петров"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telegram username</label>
            <Input
              type="text"
              placeholder="@tgname"
              value={tgname}
              onChange={(e) => setTgname(e.target.value)}
            />
            <span className={pageStyles.fieldHint}>
              {role === 'COURIER'
                ? 'Курьер подключится автоматически, когда откроет бота.'
                : 'Необязательно для администраторов.'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Телефон</label>
            <Input
              type="text"
              placeholder="+7 999 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {role === 'ADMIN' && (
            <>
              <div className="form-group">
                <label className="form-label">Логин *</label>
                <Input
                  type="text"
                  placeholder="Например: elena"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <Input
                  type="password"
                  placeholder="Минимум 8 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div className={pageStyles.formActions}>
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
