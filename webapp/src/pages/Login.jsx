import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';

export default function Login() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const widgetContainerRef = useRef(null);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) { navigate('/profile'); return; }
    if (localStorage.getItem('auth_token'))  { navigate('/profile'); return; }

    window.onTelegramAuth = async (user) => {
      setLoading(true); setError('');
      try {
        haptic.impact('heavy');
        const res = await api.loginWithTelegramWidget(user);
        if (res.ok && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user_info', JSON.stringify(res.user));
          navigate('/profile');
        } else setError('Ошибка входа');
      } catch (e) {
        console.error(e);
        setError('Не удалось авторизоваться: ' + e.message);
      } finally { setLoading(false); }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    // TODO: replace with the real fabrika.flo Telegram bot handle when it is created.
    script.setAttribute('data-telegram-login', 'fabrikaflo_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '999');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    if (widgetContainerRef.current) widgetContainerRef.current.appendChild(script);

    return () => {
      if (widgetContainerRef.current) widgetContainerRef.current.innerHTML = '';
      delete window.onTelegramAuth;
    };
  }, [navigate, haptic]);

  return (
    <div className="container page-transition" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '82vh', textAlign: 'center', padding: '2rem'
    }} data-testid="login-page">
      <div style={{ maxWidth: '440px', width: '100%', padding: '3rem 2rem', border: '1px solid var(--line)', background: 'var(--ivory)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: '3rem', color: 'var(--wine)', lineHeight: 1 }}>
          f<span style={{color:'var(--champagne-lo)'}}>.</span>f
        </div>
        <div style={{ margin: '1rem auto 0', width: '44px', height: '1px', background: 'var(--champagne-lo)' }} />
        <div style={{ marginTop: '1rem', fontFamily: 'var(--font-sans)', fontSize: '0.7rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: 'var(--ink)' }}>
          fabrika<span style={{color:'var(--champagne-lo)'}}>.</span>flo
        </div>
        <div style={{ marginTop: '0.3rem', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '1rem', color: 'var(--ink-soft)' }}>
          цветочный цех
        </div>

        <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: '2rem auto 2rem', lineHeight: 1.65, maxWidth: '32ch' }}>
          Войдите через Telegram — чтобы видеть историю заказов, избранное и адреса доставки.
        </p>

        {loading
          ? <div className="spinner" />
          : <div ref={widgetContainerRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '40px' }} data-testid="tg-widget" />
        }

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '1rem', padding: '0.7rem', borderTop: '1px solid rgba(181,61,61,0.25)', borderBottom: '1px solid rgba(181,61,61,0.25)' }} data-testid="login-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
