import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './store/reducers/auth'

import { Sidebar } from './components/Sidebar.tsx'
import { LoginPage } from './pages/LoginPage/LoginPage.tsx'
import { DashboardPage } from './pages/DashboardPage/DashboardPage.tsx'
import { RequestsPage } from './pages/RequestsPage/RequestsPage.tsx'
import { OrdersPage } from './pages/OrdersPage/OrdersPage.tsx'
import { ClientsPage } from './pages/ClientsPage/ClientsPage.tsx'
import { GalleryPage } from './pages/GalleryPage/GalleryPage.tsx'
import { TeamPage } from './pages/TeamPage/TeamPage.tsx'

export const App: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-container" style={{ width: '100vw', display: 'flex' }}>
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
