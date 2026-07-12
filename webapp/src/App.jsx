import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Package, ShoppingCart, User, ShieldCheck, Sparkles } from 'lucide-react';
import { useTelegram } from './hooks/useTelegram';
import { setInitData, api } from './api';
import { useLanguage } from './hooks/useLanguage';

// Helper for lazy loading retry on chunk load failure (e.g. after deployment updates)
const lazyWithRetry = (componentImport) => {
  return lazy(() =>
    componentImport().catch((error) => {
      const hasReloaded = window.sessionStorage.getItem('spa-chunk-reload');
      if (!hasReloaded) {
        window.sessionStorage.setItem('spa-chunk-reload', 'true');
        window.location.reload();
      } else {
        throw error;
      }
    })
  );
};

// Lazy loaded Pages
const HomePage = lazyWithRetry(() => import('./pages/Home'));
const CatalogPage = lazyWithRetry(() => import('./pages/Catalog'));
const ProductPage = lazyWithRetry(() => import('./pages/Product'));
const ArticlePage = lazyWithRetry(() => import('./pages/Article'));
const CartPage = lazyWithRetry(() => import('./pages/Cart'));
const CheckoutPage = lazyWithRetry(() => import('./pages/Checkout'));
const ProfilePage = lazyWithRetry(() => import('./pages/Profile'));
const AdminPage = lazyWithRetry(() => import('./pages/Admin'));
const LoginPage = lazyWithRetry(() => import('./pages/Login'));
const AiGuidePage = lazyWithRetry(() => import('./pages/AiGuide'));

function Navigation({ cartCount, isAdmin }) {
  const location = useLocation();
  const path = location.pathname;
  const { t } = useLanguage();

  const tabs = [
    { to: '/', icon: Home, label: t('nav_home') },
    { to: '/catalog', icon: Package, label: t('nav_catalog') },
    { to: '/checkout', icon: Sparkles, label: 'Заказать' },
    { to: '/profile', icon: User, label: t('nav_profile') },
  ];

  if (isAdmin) {
    tabs.push({ to: '/admin', icon: ShieldCheck, label: t('nav_admin') });
  }

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = path === tab.to || (tab.to !== '/' && path.startsWith(tab.to));
        return (
          <Link key={tab.to} to={tab.to} className={`nav-item ${isActive ? 'active' : ''}`}>
            <div style={{ position: 'relative' }}>
              <Icon size={24} />
              {tab.badge > 0 && <span className="nav-badge">{tab.badge}</span>}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function Header({ cartCount, isAdmin }) {
  const location = useLocation();
  const path = location.pathname;
  const { t, language, setLanguage } = useLanguage();
  const { haptic } = useTelegram();

  const navLinks = [
    { to: '/', label: t('nav_home') },
    { to: '/catalog', label: t('nav_catalog') },
    { to: '/checkout', label: 'Заказать букет' },
    { to: '/profile', label: t('nav_profile') },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: t('nav_admin') });
  }

  return (
    <header className="desktop-header">
      <Link to="/" className="header-logo">
        <span className="logo-title">Fabrika Flo</span>
        <span className="logo-subtitle">FLORISTICS 🌸</span>
      </Link>
      
      <nav className="header-nav">
        {navLinks.map((link) => {
          const isActive = path === link.to || (link.to !== '/' && path.startsWith(link.to));
          return (
            <Link key={link.to} to={link.to} className={`nav-link ${isActive ? 'active' : ''}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="header-actions">
        <button 
          onClick={() => { haptic.impact('light'); setLanguage(language === 'ru' ? 'en' : 'ru'); }}
          className="lang-toggle-btn"
        >
          {language.toUpperCase()}
        </button>
      </div>
    </header>
  );
}

function LoadingFallback() {
  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '2rem' }}>
      <div className="skeleton" style={{ height: '200px', borderRadius: '16px' }}></div>
      <div className="skeleton" style={{ height: '40px', borderRadius: '8px', width: '60%' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="skeleton" style={{ height: '150px', borderRadius: '16px' }}></div>
        <div className="skeleton" style={{ height: '150px', borderRadius: '16px' }}></div>
      </div>
    </div>
  );
}

function SplashScreen({ isVisible }) {
  if (!isVisible) return null;
  return (
    <div className="splash-screen" style={{ opacity: isVisible ? 1 : 0, pointerEvents: isVisible ? 'auto' : 'none' }}>
      <div className="splash-buddha-container">
        <img src="/fabrikaflo_logo.jpg" alt="Fabrika Flo" className="splash-buddha-img" style={{ borderRadius: '50%', border: '2px solid var(--gold)', width: '120px', height: '120px', objectFit: 'cover' }} />
        <div className="splash-logo-container">
          <span className="splash-logo-left">Fabrika</span>
          <span className="splash-logo-right">Flo</span>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isTelegram = !!(window.Telegram?.WebApp?.initData);
  const hasToken = !!localStorage.getItem('auth_token');
  
  if (!isTelegram && !hasToken) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const { tg, initData, user } = useTelegram();
  const [cartCount, setCartCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [profile, setProfile] = useState(null);
  const isAdmin = [5082384607, 1005121723].includes(user?.id) || profile?.is_admin;

  useEffect(() => {
    setInitData(initData);
    window.sessionStorage.removeItem('spa-chunk-reload');
    
    const minSplashTime = new Promise(resolve => setTimeout(resolve, 2000));
    const initTask = (initData || user || localStorage.getItem('auth_token')) ? Promise.all([updateCartCount(), loadProfile()]) : Promise.resolve();

    Promise.all([minSplashTime, initTask]).then(() => {
      setShowSplash(false);
    });
  }, [initData]);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (e) {
      console.error(e);
    }
  };

  const updateCartCount = () => {
    setCartCount(0);
  };

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        {!showSplash && <Header cartCount={cartCount} isAdmin={isAdmin} />}
        {showSplash && <SplashScreen isVisible={showSplash} />}
        <div style={{ paddingBottom: '80px', display: showSplash ? 'none' : 'block' }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage updateCart={updateCartCount} />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductPage updateCart={updateCartCount} />} />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/login" element={<LoginPage />} />
              
              {/* Защищенные роуты для браузера */}
              <Route path="/cart" element={<ProtectedRoute><CartPage updateCart={updateCartCount} /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage updateCart={updateCartCount} /></ProtectedRoute>} />
              <Route path="/ai-guide" element={<ProtectedRoute><AiGuidePage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              {isAdmin && <Route path="/admin" element={<ProtectedRoute><AdminPage profile={profile} /></ProtectedRoute>} />}
            </Routes>
          </Suspense>
        </div>
        {!showSplash && <Navigation cartCount={cartCount} isAdmin={isAdmin} />}
      </div>
    </BrowserRouter>
  );
}
