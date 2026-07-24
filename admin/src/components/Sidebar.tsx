import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';

import { useLogoutMutation } from '../api/auth';
import { setAccessToken } from '../api/authSession.ts';
import HomeIcon from '../assets/icons/home.svg';
import InboxIcon from '../assets/icons/inbox.svg';
import LogoutIcon from '../assets/icons/logout.svg';
import PhotoIcon from '../assets/icons/photo.svg';
import ShoppingBagIcon from '../assets/icons/shopping-bag.svg';
import UserGroupIcon from '../assets/icons/user-group.svg';
import UsersIcon from '../assets/icons/users.svg';
import { authActions, selectAuthUser } from '../store/reducers/auth';

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);
  const logoutMutation = useLogoutMutation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setAccessToken(null);
        dispatch(authActions.logout());
        navigate('/login');
      },
    });
  };

  const activeStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 16px',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    textDecoration: 'none',
    color: isActive ? 'var(--text-primary)' : 'rgba(245, 239, 231, 0.72)',
    backgroundColor: isActive ? 'var(--color-gold)' : 'transparent',
    borderLeft: isActive ? '2px solid var(--color-gold-deep)' : '2px solid transparent',
    transition: 'background-color 0.25s ease, color 0.25s ease',
    fontFamily: 'var(--font-sans)',
  });

  return (
    <div
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-sidebar)',
        color: 'var(--text-light)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '32px 18px',
        borderRight: '1px solid rgba(213, 180, 123, 0.14)',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '44px' }}>
        {/* Brand */}
        <div style={{ padding: '0 10px' }}>
          <div
            style={{
              color: 'var(--text-light)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '2rem',
              fontWeight: 300,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            fabrika<span style={{ color: 'var(--color-gold)' }}>.</span>flo
          </div>
          <div
            style={{
              marginTop: '10px',
              width: '32px',
              height: '1px',
              background: 'var(--color-gold-deep)',
            }}
          />
          <span
            style={{
              display: 'block',
              marginTop: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.62rem',
              textTransform: 'uppercase',
              letterSpacing: '0.34em',
              color: 'rgba(245, 239, 231, 0.72)',
              fontWeight: 500,
            }}
          >
            Цветочный цех
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink to="/" style={activeStyle} end data-testid="nav-dashboard">
            <HomeIcon style={{ width: '18px', height: '18px' }} />
            <span>Доска</span>
          </NavLink>
          <NavLink to="/requests" style={activeStyle} data-testid="nav-requests">
            <InboxIcon style={{ width: '18px', height: '18px' }} />
            <span>Заявки</span>
          </NavLink>
          <NavLink to="/orders" style={activeStyle} data-testid="nav-orders">
            <ShoppingBagIcon style={{ width: '18px', height: '18px' }} />
            <span>Заказы</span>
          </NavLink>
          <NavLink to="/clients" style={activeStyle} data-testid="nav-clients">
            <UsersIcon style={{ width: '18px', height: '18px' }} />
            <span>Клиенты</span>
          </NavLink>
          <NavLink to="/team" style={activeStyle} data-testid="nav-team">
            <UserGroupIcon style={{ width: '18px', height: '18px' }} />
            <span>Команда</span>
          </NavLink>
          <NavLink to="/gallery" style={activeStyle} data-testid="nav-gallery">
            <PhotoIcon style={{ width: '18px', height: '18px' }} />
            <span>Галерея</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom: Profile + Logout */}
      <div
        style={{
          borderTop: '1px solid rgba(213, 180, 123, 0.14)',
          paddingTop: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px', gap: '3px' }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.05rem',
              fontWeight: 400,
              color: 'var(--color-accent)',
            }}
          >
            {user?.name || 'Администратор'}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-gold-deep)',
              fontWeight: 500,
            }}
          >
            @{user?.tgname || 'admin'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '11px',
            backgroundColor: 'rgba(245, 239, 231, 0.05)',
            border: '1px solid rgba(213, 180, 123, 0.22)',
            borderRadius: '999px',
            color: 'var(--text-light)',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-sans)',
            transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-gold)';
            e.currentTarget.style.borderColor = 'var(--color-gold)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(245, 239, 231, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(213, 180, 123, 0.22)';
            e.currentTarget.style.color = 'var(--text-light)';
          }}
          data-testid="logout-btn"
        >
          <LogoutIcon style={{ width: '15px', height: '15px' }} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};
