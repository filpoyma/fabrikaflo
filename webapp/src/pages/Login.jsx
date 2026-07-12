import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useTelegram } from '../hooks/useTelegram';
import { useLanguage } from '../hooks/useLanguage';

export default function Login() {
  const navigate = useNavigate();
  const { haptic } = useTelegram();
  const { language } = useLanguage();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const widgetContainerRef = useRef(null);

  useEffect(() => {
    if (window.Telegram?.WebApp?.initData) {
      navigate('/profile');
      return;
    }

    if (localStorage.getItem('auth_token')) {
      navigate('/profile');
      return;
    }

    window.onTelegramAuth = async (user) => {
      setLoading(true);
      setError('');
      try {
        haptic.impact('heavy');
        const res = await api.loginWithTelegramWidget(user);
        if (res.ok && res.token) {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('user_info', JSON.stringify(res.user));
          navigate('/profile');
        } else {
          setError(language === 'ru' ? 'Ошибка входа' : 'Login failed');
        }
      } catch (e) {
        console.error(e);
        setError(language === 'ru' ? 'Не удалось авторизоваться: ' + e.message : 'Auth failed: ' + e.message);
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'herbalspiritasia_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    if (widgetContainerRef.current) {
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = '';
      }
      delete window.onTelegramAuth;
    };
  }, [navigate, haptic, language]);

  return (
    <div className="container page-transition" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card" style={{ 
        maxWidth: '400px', 
        width: '100%', 
        padding: '2rem', 
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌸</div>
        <h2 style={{ color: 'var(--gold)', marginBottom: '0.5rem', fontSize: '1.6rem' }}>
          Fabrika Flo
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
          {language === 'ru' 
            ? 'Войдите через Telegram для просмотра профиля, истории заказов и вашей реферальной сети.' 
            : 'Log in with Telegram to view your profile, order history, and referral network.'}
        </p>

        {loading ? (
          <div className="spinner" style={{ margin: '2rem auto' }} />
        ) : (
          <div 
            ref={widgetContainerRef} 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '40px',
              marginBottom: '1rem'
            }} 
          />
        )}

        {error && (
          <div style={{ 
            color: '#ff4d4f', 
            fontSize: '0.85rem', 
            marginTop: '1rem',
            background: 'rgba(255, 77, 79, 0.1)',
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 77, 79, 0.2)'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
