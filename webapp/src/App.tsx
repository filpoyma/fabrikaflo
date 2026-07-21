import { useEffect, useState, Suspense, lazy, type ComponentType } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from 'react-router-dom'
import HomeIcon from './assets/icons/home.svg'
import PackageIcon from './assets/icons/package.svg'
import UserIcon from './assets/icons/user.svg'
import ShieldCheckIcon from './assets/icons/shield-check.svg'
import SparklesIcon from './assets/icons/sparkles.svg'
import { useTelegram } from './hooks/useTelegram.ts'
import { setInitData, useProfileQuery } from './api/index.ts'
import type { NavShellProps, ProtectedRouteProps, SplashScreenProps } from './types/pages.ts'
import './App.css'

const lazyWithRetry = (componentImport: () => Promise<{ default: ComponentType<any> }>) =>
  lazy(async () => {
    try {
      return await componentImport()
    } catch (error: unknown) {
      const hasReloaded = window.sessionStorage.getItem('spa-chunk-reload')
      if (!hasReloaded) {
        window.sessionStorage.setItem('spa-chunk-reload', 'true')
        window.location.reload()
      }
      throw error
    }
  })

const HomePage = lazyWithRetry(() => import('./pages/Home.tsx'))
const CatalogPage = lazyWithRetry(() => import('./pages/Catalog.tsx'))
const ProductPage = lazyWithRetry(() => import('./pages/Product.tsx'))
const ArticlePage = lazyWithRetry(() => import('./pages/Article.tsx'))
const CartPage = lazyWithRetry(() => import('./pages/Cart.tsx'))
const CheckoutPage = lazyWithRetry(() => import('./pages/Checkout.tsx'))
const ProfilePage = lazyWithRetry(() => import('./pages/Profile.tsx'))
const OrdersPage = lazyWithRetry(() => import('./pages/Orders.tsx'))
const AdminPage = lazyWithRetry(() => import('./pages/Admin.tsx'))
const LoginPage = lazyWithRetry(() => import('./pages/Login.tsx'))
const AiGuidePage = lazyWithRetry(() => import('./pages/AiGuide.tsx'))

function BottomNav({ isAdmin }: NavShellProps) {
  const { pathname } = useLocation()

  const tabs = [
    { to: '/', icon: HomeIcon, label: 'Главная' },
    { to: '/catalog', icon: PackageIcon, label: 'Каталог' },
    { to: '/checkout', icon: SparklesIcon, label: 'Заказ' },
    { to: '/profile', icon: UserIcon, label: 'Профиль' },
  ]
  if (isAdmin) tabs.push({ to: '/admin', icon: ShieldCheckIcon, label: 'Админ' })

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active =
          pathname === tab.to ||
          (tab.to !== '/' && pathname.startsWith(tab.to))
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`nav-item ${active ? 'active' : ''}`}
            data-testid={`nav-${tab.to.replace('/', '') || 'home'}`}
          >
            <div style={{ position: 'relative' }}>
              <Icon width={20} height={20} strokeWidth={1.4} />
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function DesktopHeader({ isAdmin }: NavShellProps) {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/checkout', label: 'Заказать' },
    { to: '/profile', label: 'Профиль' },
  ]
  if (isAdmin) navLinks.push({ to: '/admin', label: 'Админ' })

  return (
    <header className="desktop-header" data-testid="desktop-header">
      <Link to="/" className="header-logo" data-testid="logo-link">
        <span className="logo-title">
          fabrika<span className="dot">.</span>flo
        </span>
        <span className="logo-subtitle">Цветочный цех</span>
      </Link>

      <nav className="header-nav">
        {navLinks.map((link) => {
          const active =
            pathname === link.to ||
            (link.to !== '/' && pathname.startsWith(link.to))
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${active ? 'active' : ''}`}
              data-testid={`header-nav-${link.to.replace('/', '') || 'home'}`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="header-actions" />
    </header>
  )
}

function LoadingFallback() {
  return (
    <div className="container">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem',
          paddingTop: '1rem',
        }}
      >
        <div className="skeleton" style={{ height: '260px' }} />
        <div className="skeleton" style={{ height: '32px', width: '55%' }} />
        <div className="responsive-products-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '4/5' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function BotanicalSvg() {
  return (
    <svg
      className="splash-svg"
      viewBox="0 0 220 220"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path
        className="stroke"
        d="M110 40 C 80 55, 65 85, 78 118 C 55 118, 40 140, 55 165 C 80 178, 108 168, 115 145 C 135 165, 168 158, 176 132 C 190 106, 172 82, 150 82 C 158 60, 140 42, 110 40 Z"
      />
      <path
        className="stroke accent-stroke"
        d="M100 78 C 88 82, 82 96, 90 108 C 78 112, 76 128, 88 138 C 100 145, 118 138, 122 125 C 138 138, 158 128, 158 112 C 158 95, 140 88, 128 92 C 130 76, 116 72, 100 78 Z"
      />
      <path
        className="stroke"
        d="M110 110 C 102 112, 100 122, 108 128 C 116 132, 128 128, 128 118 C 128 108, 118 106, 110 110 Z"
      />
      <path
        className="stroke accent-stroke"
        d="M55 175 C 40 190, 30 200, 20 205"
      />
      <path
        className="stroke accent-stroke"
        d="M175 155 C 190 170, 198 185, 200 200"
      />
      <path className="stroke" d="M40 145 C 28 148, 20 155, 15 165" />
      <path className="stroke" d="M185 105 C 198 108, 205 118, 205 130" />
    </svg>
  )
}

function SplashScreen({ visible }: SplashScreenProps) {
  if (!visible) return null
  return (
    <div
      className="splash-screen"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
      data-testid="splash-screen"
    >
      <div className="splash-inner">
        <div className="splash-svg-wrap">
          <BotanicalSvg />
          <div className="splash-monogram" aria-label="fabrika.flo">
            f<span className="dot">.</span>f
          </div>
        </div>
        <div className="splash-brand">
          fabrika<span style={{ color: 'var(--champagne-lo)' }}>.</span>flo
        </div>
        <div className="splash-hairline" />
        <div className="splash-tagline">цветочный цех</div>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isTelegram = !!window.Telegram?.WebApp?.initData
  const hasToken = !!localStorage.getItem('auth_token')
  if (!isTelegram && !hasToken) return <Navigate to="/login" replace />
  return children
}

const ADMIN_IDS = [5082384607, 1005121723]

export default function App() {
  const { initData, user } = useTelegram()
  const [cartCount, setCartCount] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const hasAuth = Boolean(initData || user || localStorage.getItem('auth_token'))
  const { data: profile } = useProfileQuery({ enabled: hasAuth })
  const isAdmin =
    (user?.id != null && ADMIN_IDS.includes(user.id)) || Boolean(profile?.is_admin)

  const updateCartCount = () => {
    setCartCount(0)
  }

  useEffect(() => {
    setInitData(initData)
    window.sessionStorage.removeItem('spa-chunk-reload')

    const minSplash = new Promise<void>((r) => setTimeout(r, 2400))
    const initTask = hasAuth ? Promise.resolve(updateCartCount()) : Promise.resolve()

    Promise.all([minSplash, initTask]).then(() => setShowSplash(false))
  }, [initData, hasAuth])

  return (
    <BrowserRouter basename="/webapp">
      <div className="app-wrapper">
        {!showSplash && <DesktopHeader isAdmin={isAdmin} />}
        {showSplash && <SplashScreen visible={showSplash} />}
        <div
          style={{
            paddingBottom: '80px',
            display: showSplash ? 'none' : 'block',
          }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route
                path="/"
                element={<HomePage updateCart={updateCartCount} />}
              />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route
                path="/product/:id"
                element={<ProductPage updateCart={updateCartCount} />}
              />
              <Route path="/article/:id" element={<ArticlePage />} />
              <Route path="/login" element={<LoginPage />} />

              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage updateCart={updateCartCount} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage updateCart={updateCartCount} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-guide"
                element={
                  <ProtectedRoute>
                    <AiGuidePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              {isAdmin && (
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPage profile={profile} />
                    </ProtectedRoute>
                  }
                />
              )}
            </Routes>
          </Suspense>
        </div>
        {!showSplash && <BottomNav cartCount={cartCount} isAdmin={isAdmin} />}
      </div>
    </BrowserRouter>
  )
}
