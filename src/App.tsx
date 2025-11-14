import './App.css'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Restaurant from './pages/Restaurant'
import DeliveryLocations from './pages/DeliveryLocations'
import Users from './pages/Users'
import CustomerCollection from './pages/CustomerCollection'
import Roles from './pages/Roles'
import Permits from './pages/Permits'
import SettingsPage from './pages/Settings'
import Header from './components/Header'
import Login from './pages/Login'
import RequireAuth from './components/RequireAuth'
import { getToken } from './utils/api'

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nav-section">
      <div className="section-title">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function App() {
  const [token, setToken] = useState<string | null>(getToken())

  useEffect(() => {
    const update = () => setToken(getToken())
    window.addEventListener('storage', update)
    window.addEventListener('auth', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('auth', update)
    }
  }, [])

  // If not authenticated, show only the Login page
  if (!token) {
    return (
      <BrowserRouter>
        <div className="app-root">
          <main className="main">
            <Header />
            <div className="panel">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<Login />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        <aside className="sidebar">
          <div className="header">
            <div className="brand">Delivery Food - Admin Panel</div>
          </div>

          <NavSection title="MANAGEMENT">
            <ul className="nav-list">
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/dashboard">Dashboard</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/orders">Orders</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/restaurant">Restaurant</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/delivery-locations">Delivery Locations</NavLink></li>
            </ul>
          </NavSection>

          <NavSection title="USER">
            <ul className="nav-list">
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/users">Users</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/customer-collection">Customer Collection</NavLink></li>
            </ul>
          </NavSection>

          <NavSection title="SETTINGS">
            <ul className="nav-list">
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/roles">Roles</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/permits">Permits</NavLink></li>
              <li><NavLink className={({isActive})=> 'nav-link' + (isActive? ' active':'')} to="/settings">Settings</NavLink></li>
            </ul>
          </NavSection>
        </aside>

        <main className="main">
          <Header />
          <div className="panel">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
              <Route path="/restaurant" element={<RequireAuth><Restaurant /></RequireAuth>} />
              <Route path="/delivery-locations" element={<RequireAuth><DeliveryLocations /></RequireAuth>} />
              <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
              <Route path="/customer-collection" element={<RequireAuth><CustomerCollection /></RequireAuth>} />
              <Route path="/roles" element={<RequireAuth><Roles /></RequireAuth>} />
              <Route path="/permits" element={<RequireAuth><Permits /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
