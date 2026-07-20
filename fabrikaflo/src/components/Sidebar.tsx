import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authActions, selectAuthUser } from '../store/reducers/auth';

import HomeIcon from '../assets/icons/home.svg';
import InboxIcon from '../assets/icons/inbox.svg';
import ShoppingBagIcon from '../assets/icons/shopping-bag.svg';
import UsersIcon from '../assets/icons/users.svg';
import PhotoIcon from '../assets/icons/photo.svg';
import UserGroupIcon from '../assets/icons/user-group.svg';
import LogoutIcon from '../assets/icons/logout.svg';

export const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectAuthUser);

  const handleLogout = () => {
    dispatch(authActions.logout());
    navigate('/login');
  };

  const activeStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: isActive ? 600 : 500,
    textDecoration: 'none',
    color: isActive ? 'var(--text-primary)' : 'var(--text-light)',
    backgroundColor: isActive ? 'var(--color-sage)' : 'transparent',
    transition: 'all 0.2s ease',
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
        padding: '24px 16px',
        borderRight: '1px solid rgba(253, 251, 247, 0.1)',
        height: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {/* Brand Header */}
        <div style={{ padding: '0 8px' }}>
          <h2
            style={{
              color: 'var(--text-light)',
              fontFamily: 'var(--font-serif)',
              fontSize: '2.1rem',
              fontWeight: 600,
            }}
          >
            fabrika.flo
          </h2>
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--color-sage)',
            }}
          >
            Цветочный цех
          </span>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/" style={activeStyle}>
            <HomeIcon style={{ width: '20px', height: '20px' }} />
            <span>Панель</span>
          </NavLink>
          <NavLink to="/requests" style={activeStyle}>
            <InboxIcon style={{ width: '20px', height: '20px' }} />
            <span>Заявки</span>
          </NavLink>
          <NavLink to="/orders" style={activeStyle}>
            <ShoppingBagIcon style={{ width: '20px', height: '20px' }} />
            <span>Заказы</span>
          </NavLink>
          <NavLink to="/clients" style={activeStyle}>
            <UsersIcon style={{ width: '20px', height: '20px' }} />
            <span>Клиенты CRM</span>
          </NavLink>
          <NavLink to="/team" style={activeStyle}>
            <UserGroupIcon style={{ width: '20px', height: '20px' }} />
            <span>Команда</span>
          </NavLink>
          <NavLink to="/gallery" style={activeStyle}>
            <PhotoIcon style={{ width: '20px', height: '20px' }} />
            <span>Галерея работ</span>
          </NavLink>
        </nav>
      </div>

      {/* Admin Profile & Logout */}
      <div
        style={{
          borderTop: '1px solid rgba(253, 251, 247, 0.1)',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-accent)' }}>
            {user?.name || 'Администратор'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-sage)' }}>
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
            padding: '12px',
            backgroundColor: 'rgba(244, 215, 212, 0.08)',
            border: '1px solid rgba(244, 215, 212, 0.2)',
            borderRadius: '6px',
            color: 'var(--text-light)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-error)';
            e.currentTarget.style.borderColor = 'var(--color-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(244, 215, 212, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(244, 215, 212, 0.2)';
          }}
        >
          <LogoutIcon style={{ width: '18px', height: '18px' }} />
          <span>Выйти из системы</span>
        </button>
      </div>
    </div>
  );
};
