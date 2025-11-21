import './App.css'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Restaurant from './pages/Restaurant'
import RestaurantCreate from './pages/RestaurantCreate'
import DeliveryLocations from './pages/DeliveryLocations'
import DeliveryLocationCreate from './pages/DeliveryLocationCreate'
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
    <div className="mt-4">
      <div className="text-xs text-gray-400 mb-2">{title}</div>
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
        <div >
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
        <aside className="w-64 bg-white rounded-md p-4 shadow border">
          <div className="mb-4">
            <div className="text-lg font-semibold text-blue-600">Delivery Food - Admin Panel</div>
          </div>

          <NavSection title="MANAGEMENT">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Orders
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/restaurant"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Restaurant
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/delivery-locations"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Delivery Locations
                </NavLink>
              </li>
            </ul>
          </NavSection>

          <NavSection title="USER">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Users
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/customer-collection"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Customer Collection
                </NavLink>
              </li>
            </ul>
          </NavSection>

          <NavSection title="SETTINGS">
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/roles"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Roles
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/permits"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Permits
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  Settings
                </NavLink>
              </li>
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
              <Route path="/restaurant/creation" element={<RequireAuth><RestaurantCreate /></RequireAuth>} />
              <Route path="/restaurant/creation/:token" element={<RequireAuth><RestaurantCreate /></RequireAuth>} />
              <Route path="/delivery-locations" element={<RequireAuth><DeliveryLocations /></RequireAuth>} />
              <Route path="/delivery-locations/creation" element={<RequireAuth><DeliveryLocationCreate /></RequireAuth>} />
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
