import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth.api.ts'
import { setCredentials } from '../../store'

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(username, password),
    onSuccess: (data) => {
      dispatch(setCredentials(data))
      navigate('/')
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Ошибка входа. Проверьте логин и пароль.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!username || !password) {
      setErrorMsg('Пожалуйста, заполните все поля.')
      return
    }
    loginMutation.mutate()
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="glass-card animated-fade-in"
        style={{
          width: '420px',
          padding: '40px',
          backgroundColor: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '8px' }}>
            fabrika.flo
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Система управления мастерской
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label">Логин или телефон</label>
            <input
              type="text"
              className="form-input"
              placeholder="admin или +7..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Пароль</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                color: 'var(--color-error)',
                backgroundColor: '#FCE8E6',
                border: '1px solid rgba(200, 92, 92, 0.2)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Вход в систему...' : 'Войти в панель'}
          </button>
        </form>
      </div>
    </div>
  )
}
