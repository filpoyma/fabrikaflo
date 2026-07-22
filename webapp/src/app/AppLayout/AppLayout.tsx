import { useEffect, useRef, useState, Suspense, lazy, type ComponentType } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import HomeIcon from '../../assets/icons/home.svg'
import PackageIcon from '../../assets/icons/package.svg'
import UserIcon from '../../assets/icons/user.svg'
import SparklesIcon from '../../assets/icons/sparkles.svg'
import { SplashScreen } from '../../components/SplashScreen'
import { setInitData } from '../../api/index.ts'
import { useTelegram } from '../../hooks/useTelegram.ts'
import type { ProtectedRouteProps } from '../../types/pages.ts'
import styles from '../../App.module.css'

const lazyWithRetry = (componentImport: () => Promise<{ default: ComponentType }>) =>
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

const HomePage = lazyWithRetry(() => import('../../pages/Home'))
const CatalogPage = lazyWithRetry(() => import('../../pages/Catalog'))
const ProductPage = lazyWithRetry(() => import('../../pages/Product'))
const ArticlePage = lazyWithRetry(() => import('../../pages/Article'))
const CheckoutPage = lazyWithRetry(() => import('../../pages/Checkout'))
const ProfilePage = lazyWithRetry(() => import('../../pages/Profile'))
const OrdersPage = lazyWithRetry(() => import('../../pages/Orders'))
const LoginPage = lazyWithRetry(() => import('../../pages/Login'))
const AiGuidePage = lazyWithRetry(() => import('../../pages/AiGuide'))

function BottomNav() {
  const { pathname } = useLocation()

  const tabs = [
    { to: '/', icon: HomeIcon, label: 'Главная' },
    { to: '/catalog', icon: PackageIcon, label: 'Каталог' },
    { to: '/checkout', icon: SparklesIcon, label: 'Заказ' },
    { to: '/profile', icon: UserIcon, label: 'Профиль' },
  ]

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
            <div className={styles.navIconWrap}>
              <Icon width={20} height={20} strokeWidth={active ? 2.2 : 1.4} />
            </div>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function DesktopHeader() {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/', label: 'Главная' },
    { to: '/catalog', label: 'Каталог' },
    { to: '/checkout', label: 'Заказать' },
    { to: '/profile', label: 'Профиль' },
  ]

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
      <div className={styles.loading}>
        <div className={`skeleton ${styles.skeletonHero}`} />
        <div className={`skeleton ${styles.skeletonTitle}`} />
        <div className="responsive-products-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonCard}`} />
          ))}
        </div>
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

export function AppLayout() {
  const { pathname } = useLocation()
  const { initData } = useTelegram()
  const [showSplash, setShowSplash] = useState(true)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInitData(initData)
    window.sessionStorage.removeItem('spa-chunk-reload')

    const timer = window.setTimeout(() => setShowSplash(false), 2400)
    return () => window.clearTimeout(timer)
  }, [initData])

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return (
    <div className="app-wrapper">
      {!showSplash && <DesktopHeader />}
      {showSplash && <SplashScreen visible={showSplash} />}
      <div
        ref={mainRef}
        id="app-main-content"
        className={`${styles.mainContent} ${showSplash ? styles.mainHidden : styles.mainVisible}`}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
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
          </Routes>
        </Suspense>
      </div>
      {!showSplash && <BottomNav />}
    </div>
  )
}
