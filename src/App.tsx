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
import UserCreate from './pages/UserCreate'
import Roles from './pages/Roles'
import RoleCreate from './pages/RoleCreate'
import Permits from './pages/Permits'
import SettingsPage from './pages/Settings'
import Types from './pages/Types'
import TypeCreate from './pages/TypeCreate'
import Products from './pages/Products'
import ProductCreate from './pages/ProductCreate'
import Menus from './pages/Menus'
import MenuCreate from './pages/MenuCreate'
import Sections from './pages/Sections'
import SectionCreate from './pages/SectionCreate'
import Header from './components/Header'
import Login from './pages/Login'
import RequireAuth from './components/RequireAuth'
import { getToken } from './utils/api'
import { FiHome, FiShoppingCart, FiCoffee, FiMapPin, FiUsers, FiShield, FiKey, FiSettings, FiTag, FiBox, FiList, FiLayers } from 'react-icons/fi'

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-4">{title}</div>
      <div className="space-y-1">{children}</div>
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
        <div className="min-h-screen">
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
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <FiMapPin className="w-6 h-6 text-white" />
              <span>Delivery Admin</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavSection title="MANAGEMENT">
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiHome className="w-5 h-5" />
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/orders"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiShoppingCart className="w-5 h-5" />
                    <span>Orders</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/restaurant"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiCoffee className="w-5 h-5" />
                    <span>Restaurant</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/delivery-locations"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiMapPin className="w-5 h-5" />
                    <span>Delivery Locations</span>
                  </NavLink>
                </li>
              </ul>
            </NavSection>

            <NavSection title="USER MANAGEMENT">
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiUsers className="w-5 h-5" />
                    <span>Users</span>
                  </NavLink>
                </li>
              </ul>
            </NavSection>

            <NavSection title="CONFIGURATION">
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/roles"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiShield className="w-5 h-5" />
                    <span>Roles</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/permits"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiKey className="w-5 h-5" />
                    <span>Permits</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/settings"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiSettings className="w-5 h-5" />
                    <span>Settings</span>
                  </NavLink>
                </li>
              </ul>
            </NavSection>

            <NavSection title="CONTENT">
              <ul className="space-y-1">
                <li>
                  <NavLink
                    to="/types"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiTag className="w-5 h-5" />
                    <span>Types</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/products"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiBox className="w-5 h-5" />
                    <span>Products</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/menus"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiList className="w-5 h-5" />
                    <span>Menus</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/sections"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiLayers className="w-5 h-5" />
                    <span>Sections</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/customers"
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <FiUsers className="w-5 h-5" />
                    <span>Customers</span>
                  </NavLink>
                </li>
              </ul>
            </NavSection>
          </nav>
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
              <Route path="/restaurant/creation/:id" element={<RequireAuth><RestaurantCreate /></RequireAuth>} />
              <Route path="/delivery-locations" element={<RequireAuth><DeliveryLocations /></RequireAuth>} />
              <Route path="/delivery-locations/creation" element={<RequireAuth><DeliveryLocationCreate /></RequireAuth>} />
              <Route path="/delivery-locations/creation/:id" element={<RequireAuth><DeliveryLocationCreate /></RequireAuth>} />
              <Route path="/types" element={<RequireAuth><Types /></RequireAuth>} />
              <Route path="/types/creation" element={<RequireAuth><TypeCreate /></RequireAuth>} />
              <Route path="/types/creation/:id" element={<RequireAuth><TypeCreate /></RequireAuth>} />
              <Route path="/products" element={<RequireAuth><Products /></RequireAuth>} />
              <Route path="/products/creation" element={<RequireAuth><ProductCreate /></RequireAuth>} />
              <Route path="/products/creation/:id" element={<RequireAuth><ProductCreate /></RequireAuth>} />
              <Route path="/menus" element={<RequireAuth><Menus /></RequireAuth>} />
              <Route path="/menus/creation" element={<RequireAuth><MenuCreate /></RequireAuth>} />
              <Route path="/menus/creation/:id" element={<RequireAuth><MenuCreate /></RequireAuth>} />
              <Route path="/sections" element={<RequireAuth><Sections /></RequireAuth>} />
              <Route path="/sections/creation" element={<RequireAuth><SectionCreate /></RequireAuth>} />
              <Route path="/sections/creation/:id" element={<RequireAuth><SectionCreate /></RequireAuth>} />
              <Route path="/users" element={<RequireAuth><Users /></RequireAuth>} />
              <Route path="/users/creation" element={<RequireAuth><UserCreate /></RequireAuth>} />
              <Route path="/users/creation/:id" element={<RequireAuth><UserCreate /></RequireAuth>} />
              <Route path="/roles" element={<RequireAuth><Roles /></RequireAuth>} />
              <Route path="/roles/creation" element={<RequireAuth><RoleCreate /></RequireAuth>} />
              <Route path="/roles/creation/:id" element={<RequireAuth><RoleCreate /></RequireAuth>} />
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
