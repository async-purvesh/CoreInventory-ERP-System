import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { Toast }    from './components/UI'
import Sidebar       from './components/Sidebar'
import TopBar        from './components/TopBar'

import AuthPage    from './pages/AuthPage'
import Dashboard   from './pages/Dashboard'
import Products    from './pages/Products'
import Warehouses  from './pages/Warehouses'
import Receipts    from './pages/Receipts'
import Delivery    from './pages/Delivery'
import Transfers   from './pages/Transfers'
import Adjustments from './pages/Adjustments'
import History     from './pages/History'
import Profile     from './pages/Profile'

function AppShell() {
  const { user, bootstrap } = useStore()
  if (!user) return <Navigate to="/login" replace />

  useEffect(() => { bootstrap() }, [])  // eslint-disable-line

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />}   />
            <Route path="/products"    element={<Products />}    />
            <Route path="/warehouses"  element={<Warehouses />}  />
            <Route path="/receipts"    element={<Receipts />}    />
            <Route path="/delivery"    element={<Delivery />}    />
            <Route path="/transfers"   element={<Transfers />}   />
            <Route path="/adjustments" element={<Adjustments />} />
            <Route path="/history"     element={<History />}     />
            <Route path="/profile"     element={<Profile />}     />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const { toast, user, verifySession } = useStore()

  useEffect(() => {
    verifySession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
        <Route path="/*"     element={<AppShell />} />
      </Routes>
      <Toast toast={toast} />
    </>
  )
}
