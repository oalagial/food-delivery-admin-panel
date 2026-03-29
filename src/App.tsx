import './App.css'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState, type ReactElement } from 'react'
import Header from './components/Header'
import Login from './pages/Login'
import SetPassword from './pages/SetPassword'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import RequireAuth from './components/RequireAuth'
import RequireRouteAccess from './components/RequireRouteAccess'
import { getToken, syncPermissionsFromServer } from './utils/api'
import { getStoredPermissions } from './utils/permissions'
import { Sidebar } from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import Orders from './pages/Orders'
import Restaurant from './pages/Restaurant'
import RestaurantCreate from './pages/RestaurantCreate'
import DeliveryLocations from './pages/DeliveryLocations'
import DeliveryLocationCreate from './pages/DeliveryLocationCreate'
import Users from './pages/Users'
import UserCreate from './pages/UserCreate'
import Roles from './pages/Roles'
import RoleCreate from './pages/RoleCreate'
import PermissionsPage from './pages/Permissions'
import Types from './pages/Types'
import TypeCreate from './pages/TypeCreate'
import Products from './pages/Products'
import ProductCreate from './pages/ProductCreate'
import Menus from './pages/Menus'
import MenuCreate from './pages/MenuCreate'
import Sections from './pages/Sections'
import SectionCreate from './pages/SectionCreate'
import Offers from './pages/Offers'
import OfferCreate from './pages/OfferCreate'
import CustomerCollection from './pages/CustomerCollection'
import Coupons from './pages/Coupons'
import CouponCreate from './pages/CouponCreate'

type RouteConfig = {
  path: string
  element: React.ReactElement
  protected?: boolean
}

const routes: RouteConfig[] = [
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard />, protected: true },
  { path: '/orders', element: <Orders />, protected: true },
  { path: '/stats', element: <Stats />, protected: true },
  { path: '/restaurant', element: <Restaurant />, protected: true },
  { path: '/restaurant/creation', element: <RestaurantCreate />, protected: true },
  { path: '/restaurant/creation/:id', element: <RestaurantCreate />, protected: true },
  { path: '/delivery-locations', element: <DeliveryLocations />, protected: true },
  { path: '/delivery-locations/creation', element: <DeliveryLocationCreate />, protected: true },
  { path: '/delivery-locations/creation/:id', element: <DeliveryLocationCreate />, protected: true },
  { path: '/types', element: <Types />, protected: true },
  { path: '/types/creation', element: <TypeCreate />, protected: true },
  { path: '/types/creation/:id', element: <TypeCreate />, protected: true },
  { path: '/products', element: <Products />, protected: true },
  { path: '/products/creation', element: <ProductCreate />, protected: true },
  { path: '/products/creation/:id', element: <ProductCreate />, protected: true },
  { path: '/menus', element: <Menus />, protected: true },
  { path: '/menus/creation', element: <MenuCreate />, protected: true },
  { path: '/menus/creation/:id', element: <MenuCreate />, protected: true },
  { path: '/sections', element: <Sections />, protected: true },
  { path: '/sections/creation', element: <SectionCreate />, protected: true },
  { path: '/sections/creation/:id', element: <SectionCreate />, protected: true },
  { path: '/users', element: <Users />, protected: true },
  { path: '/users/creation', element: <UserCreate />, protected: true },
  { path: '/users/creation/:id', element: <UserCreate />, protected: true },
  { path: '/roles', element: <Roles />, protected: true },
  { path: '/roles/creation', element: <RoleCreate />, protected: true },
  { path: '/roles/creation/:id', element: <RoleCreate />, protected: true },
  { path: '/permissions', element: <PermissionsPage />, protected: true },
  { path: '/offers', element: <Offers />, protected: true },
  { path: '/offers/creation', element: <OfferCreate />, protected: true },
  { path: '/offers/creation/:id', element: <OfferCreate />, protected: true },
  { path: '/customers', element: <CustomerCollection />, protected: true },
  { path: '/coupons', element: <Coupons />, protected: true },
  { path: '/coupons/creation', element: <CouponCreate />, protected: true },
  { path: '/coupons/creation/:id', element: <CouponCreate />, protected: true },
  { path: '/', element: <Dashboard />, protected: true },
]

const PUBLIC_AUTH_PATHS = ['/set-password', '/reset-password', '/forgot-password'] as const

function isPublicAuthPath(pathname: string): boolean {
  return (PUBLIC_AUTH_PATHS as readonly string[]).includes(pathname)
}

function AuthenticatedLayout() {
  const location = useLocation()
  const [permissionsReady, setPermissionsReady] = useState(
    () => typeof window !== 'undefined' && getStoredPermissions() !== null,
  )

  useEffect(() => {
    if (getStoredPermissions() !== null) {
      setPermissionsReady(true)
      return
    }
    void syncPermissionsFromServer().finally(() => setPermissionsReady(true))
  }, [])

  // On mobile start closed; on desktop (md+) start open so sidebar is visible
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768
  )

  const handleSidebarNavigate = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  // On mobile, close sidebar when route changes (e.g. navigation or back button)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  if (!permissionsReady) {
    return (
      <div className="app-root">
        <main className="main">
          <div className="panel p-8 text-center text-muted-foreground">{/* i18n optional */}Loading…</div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-root">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onNavigate={handleSidebarNavigate} />

      <main className="main">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <div className="panel">
          <Routes>
            {routes.map(({ path, element, protected: isProtected }) => (
              <Route
                key={path}
                path={path}
                element={
                  isProtected ? (
                    <RequireAuth>
                      <RequireRouteAccess>{element}</RequireRouteAccess>
                    </RequireAuth>
                  ) : (
                    element
                  )
                }
              />
            ))}
          </Routes>
        </div>
      </main>
    </div>
  )
}

const PERMISSIONS_SYNC_THROTTLE_MS = 2500

function AppRoutes(): ReactElement {
  const location = useLocation()
  const [token, setToken] = useState<string | null>(getToken())
  const onPublicAuthPage = isPublicAuthPath(location.pathname)

  useEffect(() => {
    const update = () => setToken(getToken())
    window.addEventListener('storage', update)
    window.addEventListener('auth', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('auth', update)
    }
  }, [])

  useEffect(() => {
    if (!token || onPublicAuthPage) return
    void syncPermissionsFromServer()
  }, [token, onPublicAuthPage])

  useEffect(() => {
    if (!token || onPublicAuthPage) return
    let last = 0
    const run = () => {
      const now = Date.now()
      if (now - last < PERMISSIONS_SYNC_THROTTLE_MS) return
      last = now
      void syncPermissionsFromServer()
    }
    const onVis = () => {
      if (document.visibilityState === 'visible') run()
    }
    window.addEventListener('focus', run)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('focus', run)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [token, onPublicAuthPage])

  if (onPublicAuthPage) {
    return (
      <Routes>
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Login />} />
      </Routes>
    )
  }

  return <AuthenticatedLayout />
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
