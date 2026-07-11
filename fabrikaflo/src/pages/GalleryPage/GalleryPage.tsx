import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { galleryApi } from '../../api/gallery.api.ts'
import { Modal } from '../../components/Modal.tsx'
import type { IPortfolioItem } from '../../types'

import PlusIcon from '../../assets/icons/plus.svg'
import TrashIcon from '../../assets/icons/trash.svg'
import DocumentIcon from '../../assets/icons/document.svg'

export const GalleryPage: React.FC = () => {
  const queryClient = useQueryClient()

  // Queries
  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: galleryApi.list,
  })

  const items = galleryData?.data ?? []

  // Mutations
  const uploadMutation = useMutation({
    mutationFn: ({ file, title, description }: { file: File; title?: string; description?: string }) =>
      galleryApi.upload(file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      setIsUploadModalOpen(false)
      // reset form
      setFile(null)
      setPreviewUrl(null)
      setTitle('')
      setDescription('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galleryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
    },
    onError: (error: any) => {
      console.error('Delete error:', error)
      alert(`Ошибка при удалении: ${error.message || error}`)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, file, title, description }: { id: string; file?: File | null; title?: string; description?: string }) =>
      galleryApi.update(id, file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] })
      setIsEditModalOpen(false)
      setEditingItem(null)
      // reset form
      setFile(null)
      setPreviewUrl(null)
      setTitle('')
      setDescription('')
    },
    onError: (error: any) => {
      console.error('Update error:', error)
      alert(`Ошибка при редактировании: ${error.message || error}`)
    },
  })

  // States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<IPortfolioItem | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFile(null)
    setPreviewUrl(null)
    setTitle('')
    setDescription('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return alert('Пожалуйста, выберите файл!')

    uploadMutation.mutate({ file, title, description })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    updateMutation.mutate({
      id: editingItem.id,
      file,
      title,
      description,
    })
  }

  return (
    <div className="animated-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', fontWeight: 400 }}>
            Галерея работ (Портфолио)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Эти фотографии будут показываться клиентам в Telegram-боте в разделе «❤️ Наши работы».
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <PlusIcon style={{ width: '18px', height: '18px' }} />
          <span>Добавить работу</span>
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Загрузка галереи...
        </div>
      ) : (
        /* Portfolio Grid */
        <div>
          {items.length === 0 ? (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', color: 'var(--text-secondary)' }}>
              В галерее пока нет работ. Нажмите кнопку «Добавить работу», чтобы загрузить фотографии букетов для вдохновения клиентов.
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

                  {/* Absolute Edit Button on Card */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: 'var(--color-sage)',
                      color: 'white',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent-dark)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-sage)')}
                  >
                    <DocumentIcon style={{ width: '16px', height: '16px' }} />
                  </button>

                  {/* Absolute Delete Button on Card */}
                  {(() => {
                    const isDeleting = deleteMutation.isPending && deleteMutation.variables === item.id
                    return (
                      <button
                        onClick={() => {
                          if (confirm('Вы действительно хотите удалить эту работу из портфолио?')) {
                            deleteMutation.mutate(item.id)
                          }
                        }}
                        disabled={isDeleting}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: 'rgba(200, 92, 92, 0.95)',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
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
                    )
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Добавление работы в галерею"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Фотография букета</label>
            <input
              id="portfolio-image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required={!file}
              style={{ display: 'none' }}
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
                    Нажмите, чтобы изменить 📸
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
            <input
              type="text"
              className="form-input"
              placeholder="Пастельный микс с гортензией..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание / Состав</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Сезонные пионы, нежные ранункулюсы и ароматный эвкалипт..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить в портфолио'}
            </button>
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
              <input
                id="portfolio-image-edit"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
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
                      Нажмите, чтобы заменить 📸
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
              <input
                type="text"
                className="form-input"
                placeholder="Пастельный микс с гортензией..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Описание / Состав</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Сезонные пионы, нежные ранункулюсы..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
