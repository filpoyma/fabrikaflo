import React, { useState } from 'react'
import {
  useGalleryQuery,
  useUploadGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
} from '../../api/gallery'
import { isInitialQueryLoad } from '../../api/queryUtils'
import { IconButton, Button, Modal, InlineQueryLoader, Input, Textarea } from '../../shared/ui'
import type { IPortfolioItem } from '../../types'

import PlusIcon from '../../assets/icons/plus.svg'
import { PeonyIcon } from '../../components/BotanicalIcons'

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

export const GalleryPage: React.FC = () => {
  const { data, isPending } = useGalleryQuery()
  const items = data ?? []

  const uploadMutation = useUploadGalleryItemMutation()
  const deleteMutation = useDeleteGalleryItemMutation()
  const updateMutation = useUpdateGalleryItemMutation()

  // States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IPortfolioItem | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const resetForm = () => {
    setFile(null)
    setPreviewUrl(null)
    setTitle('')
    setDescription('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    resetForm()
    setIsUploadModalOpen(true)
  }

  const handleOpenEdit = (item: IPortfolioItem) => {
    setEditingItem(item)
    setFile(null)
    setPreviewUrl(item.photoUrl)
    setTitle(item.title || '')
    setDescription(item.description || '')
    setIsEditModalOpen(true)
  }

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) return alert('Пожалуйста, выберите файл!')

    uploadMutation.mutate(
      { file, title, description },
      {
        onSuccess: () => {
          setIsUploadModalOpen(false)
          resetForm()
        },
      },
    )
  }

  const handleEditSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingItem) return

    updateMutation.mutate(
      {
        id: editingItem.id,
        file,
        title,
        description,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false)
          setEditingItem(null)
          resetForm()
        },
        onError: (error) => {
          console.error('Update error:', error)
          alert(`Ошибка при редактировании: ${getErrorMessage(error)}`)
        },
      },
    )
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }} data-testid="gallery-page">
      <header className="page-header with-action">
        <div className="head-text">
          <span className="eyebrow">Портфолио · fabrika.flo</span>
          <h1>Галерея <em>работ</em></h1>
          <p>Эти фотографии показываются клиентам в Telegram-боте в разделе «Наши работы».</p>
        </div>
        <Button onClick={handleOpenCreate} icon={PlusIcon} data-testid="add-work-btn">
          Добавить работу
        </Button>
      </header>

      <div>
        {isInitialQueryLoad(isPending, data) ? (
          <InlineQueryLoader message="Собираем галерею работ…" />
        ) : items.length === 0 ? (
            <div className="glass-card" style={{ backgroundColor: '#FFFFFF' }}>
              <div className="empty-state">
                <PeonyIcon size={64} color="var(--color-gold-deep)" />
                <div className="headline">Портфолио пусто</div>
                <p>Нажмите «Добавить работу», чтобы загрузить первую фотографию букета для вдохновения клиентов.</p>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className="glass-card"
                  style={{
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '380px',
                    position: 'relative',
                  }}
                >
                  {/* Photo Container */}
                  <div style={{ width: '100%', height: '220px', overflow: 'hidden' }}>
                    <img
                      src={item.photoUrl}
                      alt={item.title || 'Work'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
                    />
                  </div>

                  {/* Info Container */}
                  <div style={{ padding: '16px', paddingRight: '48px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <h4 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {item.title || 'Оригинальный букет'}
                    </h4>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.3',
                        margin: 0,
                      }}
                    >
                      {item.description || 'Работа нашей флористической мастерской.'}
                    </p>
                  </div>

                  <IconButton
                    variant="edit"
                    appearance="filled"
                    onClick={() => handleOpenEdit(item)}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 10 }}
                  />

                  {(() => {
                    const isDeleting = deleteMutation.isPending && deleteMutation.variables === item.id
                    return (
                      <IconButton
                        variant="delete"
                        appearance="filled"
                        loading={isDeleting}
                        disabled={isDeleting}
                        onClick={() => {
                          if (confirm('Вы действительно хотите удалить эту работу из портфолио?')) {
                            deleteMutation.mutate(item.id, {
                              onError: (error) => {
                                console.error('Delete error:', error)
                                alert(`Ошибка при удалении: ${getErrorMessage(error)}`)
                              },
                            })
                          }
                        }}
                        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}
                      />
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Добавление работы в галерею"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Фотография букета</label>
            <Input
              id="portfolio-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required={!file}
              hidden
            />
            <label
              htmlFor="portfolio-image-upload"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                aspectRatio: '300 / 220',
                border: '2px dashed var(--border-light)',
                borderRadius: '8px',
                backgroundColor: '#FAF9F6',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-sage)'
                e.currentTarget.style.backgroundColor = '#F4F6F4'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)'
                e.currentTarget.style.backgroundColor = '#FAF9F6'
              }}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      backgroundColor: 'rgba(43, 59, 48, 0.75)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    Нажмите, чтобы изменить
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                  <PlusIcon style={{ width: '28px', height: '28px', color: 'var(--color-sage)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Выбрать изображение букета</span>
                </div>
              )}
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Название композиции</label>
            <Input
              type="text"
              placeholder="Пастельный микс с гортензией..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание / Состав</label>
            <Textarea
              placeholder="Сезонные пионы, нежные ранункулюсы и ароматный эвкалипт..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" type="button" onClick={() => setIsUploadModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить в портфолио'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingItem && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Редактирование работы в галерее"
        >
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Фотография букета (необязательно)</label>
              <Input
                id="portfolio-image-edit"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />
              <label
                htmlFor="portfolio-image-edit"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  aspectRatio: '300 / 220',
                  border: '2px dashed var(--border-light)',
                  borderRadius: '8px',
                  backgroundColor: '#FAF9F6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-sage)'
                  e.currentTarget.style.backgroundColor = '#F4F6F4'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)'
                  e.currentTarget.style.backgroundColor = '#FAF9F6'
                }}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        backgroundColor: 'rgba(43, 59, 48, 0.75)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    >
                      Нажмите, чтобы заменить
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                    <PlusIcon style={{ width: '28px', height: '28px', color: 'var(--color-sage)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Выбрать новое изображение</span>
                  </div>
                )}
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Название композиции</label>
              <Input
                type="text"
                placeholder="Пастельный микс с гортензией..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание / Состав</label>
              <Textarea
                placeholder="Сезонные пионы, нежные ранункулюсы..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" type="button" onClick={() => setIsEditModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
