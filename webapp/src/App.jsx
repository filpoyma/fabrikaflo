import { useEffect, useState, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Package, User, ShieldCheck, Sparkles } from "lucide-react";
import { useTelegram } from "./hooks/useTelegram";
import { setInitData, api } from "./api";
import "./App.css";

const lazyWithRetry = (componentImport) =>
  lazy(() =>
    componentImport().catch((error) => {
      const hasReloaded = window.sessionStorage.getItem("spa-chunk-reload");
      if (!hasReloaded) {
        window.sessionStorage.setItem("spa-chunk-reload", "true");
        window.location.reload();
      } else {
        throw error;
      }
    }),
  );

const HomePage = lazyWithRetry(() => import("./pages/Home"));
const CatalogPage = lazyWithRetry(() => import("./pages/Catalog"));
const ProductPage = lazyWithRetry(() => import("./pages/Product"));
const ArticlePage = lazyWithRetry(() => import("./pages/Article"));
const CartPage = lazyWithRetry(() => import("./pages/Cart"));
const CheckoutPage = lazyWithRetry(() => import("./pages/Checkout"));
const ProfilePage = lazyWithRetry(() => import("./pages/Profile"));
const OrdersPage = lazyWithRetry(() => import("./pages/Orders"));
const AdminPage = lazyWithRetry(() => import("./pages/Admin"));
const LoginPage = lazyWithRetry(() => import("./pages/Login"));
const AiGuidePage = lazyWithRetry(() => import("./pages/AiGuide"));

function BottomNav({ cartCount, isAdmin }) {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", icon: Home, label: "Главная" },
    { to: "/catalog", icon: Package, label: "Каталог" },
    { to: "/checkout", icon: Sparkles, label: "Заказ" },
    { to: "/profile", icon: User, label: "Профиль" },
  ];
  if (isAdmin) tabs.push({ to: "/admin", icon: ShieldCheck, label: "Админ" });

  return (
    <nav className="bottom-nav" data-testid="bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active =
          pathname === tab.to ||
          (tab.to !== "/" && pathname.startsWith(tab.to));
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`nav-item ${active ? "active" : ""}`}
            data-testid={`nav-${tab.to.replace("/", "") || "home"}`}
          >
            <div style={{ position: "relative" }}>
              <Icon size={20} strokeWidth={1.4} />
              {tab.badge > 0 && <span className="nav-badge">{tab.badge}</span>}
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopHeader({ isAdmin }) {
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/", label: "Главная" },
    { to: "/catalog", label: "Каталог" },
    { to: "/checkout", label: "Заказать" },
    { to: "/profile", label: "Профиль" },
  ];
  if (isAdmin) navLinks.push({ to: "/admin", label: "Админ" });

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
            (link.to !== "/" && pathname.startsWith(link.to));
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${active ? "active" : ""}`}
              data-testid={`header-nav-${link.to.replace("/", "") || "home"}`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="header-actions" />
    </header>
  );
}

function LoadingFallback() {
  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          paddingTop: "1rem",
        }}
      >
        <div className="skeleton" style={{ height: "260px" }} />
        <div className="skeleton" style={{ height: "32px", width: "55%" }} />
        <div className="responsive-products-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: "4/5" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BotanicalSvg() {
  // Hand-drawn peony/ranunculus self-drawing line-art
  return (
    <svg
      className="splash-svg"
      viewBox="0 0 220 220"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* Outer petals */}
      <path
        className="stroke"
        d="M110 40 C 80 55, 65 85, 78 118 C 55 118, 40 140, 55 165 C 80 178, 108 168, 115 145 C 135 165, 168 158, 176 132 C 190 106, 172 82, 150 82 C 158 60, 140 42, 110 40 Z"
      />
      {/* Middle ring */}
      <path
        className="stroke accent-stroke"
        d="M100 78 C 88 82, 82 96, 90 108 C 78 112, 76 128, 88 138 C 100 145, 118 138, 122 125 C 138 138, 158 128, 158 112 C 158 95, 140 88, 128 92 C 130 76, 116 72, 100 78 Z"
      />
      {/* Center */}
      <path
        className="stroke"
        d="M110 110 C 102 112, 100 122, 108 128 C 116 132, 128 128, 128 118 C 128 108, 118 106, 110 110 Z"
      />
      {/* Leaves */}
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
  );
}

function SplashScreen({ visible }) {
  if (!visible) return null;
  return (
    <div
      className="splash-screen"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
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
          fabrika<span style={{ color: "var(--champagne-lo)" }}>.</span>flo
        </div>
        <div className="splash-hairline" />
        <div className="splash-tagline">цветочный цех</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const isTelegram = !!window.Telegram?.WebApp?.initData;
  const hasToken = !!localStorage.getItem("auth_token");
  if (!isTelegram && !hasToken) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { initData, user } = useTelegram();
  const [cartCount, setCartCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [profile, setProfile] = useState(null);
  const isAdmin =
    [5082384607, 1005121723].includes(user?.id) || profile?.is_admin;

  useEffect(() => {
    setInitData(initData);
    window.sessionStorage.removeItem("spa-chunk-reload");

    const minSplash = new Promise((r) => setTimeout(r, 2400));
    const initTask =
      initData || user || localStorage.getItem("auth_token")
        ? Promise.all([updateCartCount(), loadProfile()])
        : Promise.resolve();

    Promise.all([minSplash, initTask]).then(() => setShowSplash(false));
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
    <BrowserRouter basename="/webapp">
      <div className="app-wrapper">
        {!showSplash && <DesktopHeader isAdmin={isAdmin} />}
        {showSplash && <SplashScreen visible={showSplash} />}
        <div
          style={{
            paddingBottom: "80px",
            display: showSplash ? "none" : "block",
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
  );
}
