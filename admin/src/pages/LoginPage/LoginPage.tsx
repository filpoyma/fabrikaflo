import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../api/auth';
import { authActions } from '../../store/reducers/auth';
import { setAccessToken } from '../../api/authSession.ts';
import { Button, Input } from '../../shared/ui';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    if (!login || !password) {
      setErrorMsg('Пожалуйста, заполните все поля.');
      return;
    }
    loginMutation.mutate(
      { login, password },
      {
        onSuccess: (data) => {
          setAccessToken(data.accessToken);
          dispatch(authActions.setSession(data.user));
          navigate('/');
        },
        onError: (err) => {
          setErrorMsg(
            err instanceof Error ? err.message : 'Ошибка входа. Проверьте логин и пароль.'
          );
        },
      }
    );
  };

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
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            Система управления мастерской
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}
        >
          <div className="form-group">
            <label className="form-label">Логин</label>
            <Input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Пароль</label>
            <Input
              type="password"
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
              {errorMsg}
            </div>
          )}

          <Button type="submit" size="lg" fullWidth disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Вход в систему...' : 'Войти в панель'}
          </Button>
        </form>
      </div>
    </div>
  );
};
