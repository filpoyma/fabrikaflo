import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginWithTelegramWidgetMutation } from '../../api/auth'
import { useTelegram } from '../../hooks/useTelegram'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { haptic } = useTelegram()
  const loginMutation = useLoginWithTelegramWidgetMutation()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const widgetContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      navigate('/profile')
      return
    }
    if (localStorage.getItem('auth_token')) {
      navigate('/profile')
      return
    }

    window.onTelegramAuth = async (user) => {
      setLoading(true)
      setError('')
      try {
        haptic.impact('heavy')
        const res = await loginMutation.mutateAsync(user)
        if (res.ok && res.token) {
          localStorage.setItem('auth_token', res.token)
          localStorage.setItem('user_info', JSON.stringify(res.user))
          navigate('/profile')
        } else setError('Ошибка входа')
      } catch (e: unknown) {
        console.error(e)
        const message = e instanceof Error ? e.message : String(e)
        setError('Не удалось авторизоваться: ' + message)
      } finally {
        setLoading(false)
      }
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', 'fabrikaflo_bot')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '999')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')
    script.async = true
    if (widgetContainerRef.current) widgetContainerRef.current.appendChild(script)

    return () => {
      if (widgetContainerRef.current) widgetContainerRef.current.innerHTML = ''
      delete window.onTelegramAuth
    }
  }, [navigate, haptic])

  return (
    <div className={`container page-transition ${styles.page}`} data-testid="login-page">
      <div className={styles.card}>
        <div className={styles.monogram}>
          f<span className={styles.accent}>.</span>f
        </div>
        <div className={styles.rule} />
        <div className={styles.brand}>
          fabrika<span className={styles.accent}>.</span>flo
        </div>
        <div className={styles.tagline}>цветочный цех</div>

        <p className={styles.description}>
          Войдите через Telegram — чтобы видеть историю заказов, избранное и адреса доставки.
        </p>

        {loading ? (
          <div className="spinner" />
        ) : (
          <div ref={widgetContainerRef} className={styles.widget} data-testid="tg-widget" />
        )}

        {error && (
          <div className={styles.error} data-testid="login-error">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
