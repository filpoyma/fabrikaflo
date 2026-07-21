import React, { useState } from 'react';
import clsx from 'clsx';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../api/auth';
import { authActions } from '../../store/reducers/auth';
import { setAccessToken } from '../../api/authSession.ts';
import { Button, Input } from '../../shared/ui';
import styles from './LoginPage.module.css'

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
      className={styles.page}
    >
      <div
        className={clsx('glass-card', 'animated-fade-in', styles.loginCard)}
      >
        <div className={styles.intro}>
          <h1 className={styles.brandTitle}>
            fabrika.flo
          </h1>
          <p
            className={styles.brandSubtitle}
          >
            Система управления мастерской
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className={styles.loginForm}
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

          <div className={clsx('form-group', styles.passwordField)}>
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
              className={styles.errorMessage}
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
