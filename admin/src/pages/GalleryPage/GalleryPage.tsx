import React, { useState } from 'react'
import clsx from 'clsx'
import { pageStyles } from '../../shared/styles'
import {
  useGalleryQuery,
  useUploadGalleryItemMutation,
  useUpdateGalleryItemMutation,
  useDeleteGalleryItemMutation,
} from '../../api/gallery'
import styles from './GalleryPage.module.css'
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
    <div className={clsx('animated-fade-in', pageStyles.page)} data-testid="gallery-page">
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
            <div className={clsx('glass-card', pageStyles.surfaceCard)}>
              <div className="empty-state">
                <PeonyIcon size={64} color="var(--color-gold-deep)" />
                <div className="headline">Портфолио пусто</div>
                <p>Нажмите «Добавить работу», чтобы загрузить первую фотографию букета для вдохновения клиентов.</p>
              </div>
            </div>
          ) : (
            <div
              className={styles.galleryGrid}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  className={clsx('glass-card', styles.galleryCard)}
                >
                  {/* Photo Container */}
                  <div className={styles.galleryImageFrame}>
                    <img
                      src={item.photoUrl}
                      alt={item.title || 'Work'}
                      className={styles.galleryImage}
                    />
                  </div>

                  {/* Info Container */}
                  <div className={styles.galleryCardContent}>
                    <h4 className={styles.galleryItemTitle}>
                      {item.title || 'Оригинальный букет'}
                    </h4>
                    <p
                      className={styles.galleryItemDescription}
                    >
                      {item.description || 'Работа нашей флористической мастерской.'}
                    </p>
                  </div>

                  <IconButton
                    variant="edit"
                    appearance="filled"
                    onClick={() => handleOpenEdit(item)}
                    className={styles.editButton}
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
                        className={styles.deleteButton}
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
        <form onSubmit={handleSubmit} className={pageStyles.formStack}>
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
                className={styles.imagePicker}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={styles.imagePreview}
                  />
                  <div
                    className={styles.imagePickerCaption}
                  >
                    Нажмите, чтобы изменить
                  </div>
                </>
              ) : (
                <div className={styles.imagePickerPlaceholder}>
                  <PlusIcon className={styles.imagePickerIcon} />
                  <span className={styles.imagePickerText}>Выбрать изображение букета</span>
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

          <div className={pageStyles.formActions}>
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
          <form onSubmit={handleEditSubmit} className={pageStyles.formStack}>
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
                className={styles.imagePicker}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className={styles.imagePreview}
                    />
                    <div
                      className={styles.imagePickerCaption}
                    >
                      Нажмите, чтобы заменить
                    </div>
                  </>
                ) : (
                  <div className={styles.imagePickerPlaceholder}>
                    <PlusIcon className={styles.imagePickerIcon} />
                    <span className={styles.imagePickerText}>Выбрать новое изображение</span>
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

            <div className={pageStyles.formActions}>
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
