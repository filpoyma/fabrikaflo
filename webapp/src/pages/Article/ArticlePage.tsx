import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg'
import { BackFloating, Button, EmptyState, cx } from '../../shared/ui'
import type { IArticle } from '../../types/webapp.ts'
import styles from './ArticlePage.module.css'

const articleNotImplemented = (): Promise<IArticle> =>
  Promise.reject(new Error('Articles endpoint not implemented on backend'))

export default function ArticlePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [article, setArticle] = useState<IArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    articleNotImplemented()
      .then(setArticle)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="spinner" />

  if (!article) {
    return (
      <div className="container">
        <EmptyState
          variant="article"
          word="404"
          title={
            <>
              Заметка не <em>найдена</em>
            </>
          }
          action={
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className={styles.homeAction}
            >
              На главную
            </Button>
          }
        />
      </div>
    )
  }

  const renderContentPart = (part: string, pIdx: number) => {
    if (part.startsWith('@')) {
      const username = part.substring(1)
      return (
        <a
          key={pIdx}
          href={`https://t.me/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.telegramLink}
          onClick={(e) => {
            if (window.Telegram?.WebApp?.openTelegramLink) {
              e.preventDefault()
              window.Telegram.WebApp.openTelegramLink(`https://t.me/${username}`)
            }
          }}
        >
          {part}
        </a>
      )
    }
    return part
  }

  return (
    <div className="page-transition" data-testid="article-page">
      <BackFloating onClick={() => navigate(-1)} data-testid="back-btn" aria-label="Назад">
        <ArrowLeftIcon width={18} height={18} strokeWidth={1.5} />
      </BackFloating>

      {article.photo_url && (
        <div className={styles.hero}>
          <img src={article.photo_url} alt={article.title} className={styles.heroImage} />
        </div>
      )}

      <div
        className={cx(
          'container',
          styles.articleContainer,
          article.photo_url && styles.articleContainerWithPhoto,
        )}
      >
        <div className={styles.header}>
          <span className={cx('eyebrow', styles.eyebrow)}>Заметка · fabrika.flo</span>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.rule} />
        </div>

        {article.short_description && (
          <p className={styles.lead}>{article.short_description}</p>
        )}

        <div className={styles.content}>
          {article.content.split('\n').map((para, idx) => {
            if (!para.trim()) return null
            let content = para
            let isHeading = false
            let isBullet = false
            if (content.startsWith('**') && content.endsWith('**')) {
              content = content.replace(/\*\*/g, '')
              isHeading = true
            } else if (content.startsWith('•') || content.startsWith('-')) {
              content = content.substring(1).trim()
              isBullet = true
            }

            const parts = content.split(/(@[a-zA-Z0-9_]{5,32})/g)
            const rendered = parts.map((part, pIdx) => renderContentPart(part, pIdx))

            if (isHeading) {
              return (
                <h3 key={idx} className={styles.heading}>
                  {rendered}
                </h3>
              )
            }
            if (isBullet) {
              return (
                <div key={idx} className={styles.bullet}>
                  <span className={styles.bulletMark}>—</span>
                  {rendered}
                </div>
              )
            }
            return (
              <p key={idx} className={styles.paragraph}>
                {rendered}
              </p>
            )
          })}
        </div>

        <div className={cx('hairline', styles.hairlineSpaced)} aria-hidden="true">
          <span className="dot" /> <span className={styles.brandMark}>f.f</span>{' '}
          <span className="dot" />
        </div>
      </div>
    </div>
  )
}
