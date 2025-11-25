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
import Types from './pages/Types'
import TypeCreate from './pages/TypeCreate'
import Products from './pages/Products'
import ProductCreate from './pages/ProductCreate'
import Menus from './pages/Menus'
import MenuCreate from './pages/MenuCreate'
import OpeningHours from './pages/OpeningHours'
import OpeningHourCreate from './pages/OpeningHourCreate'
import Sections from './pages/Sections'
import SectionCreate from './pages/SectionCreate'
import Header from './components/Header'
import Login from './pages/Login'
import RequireAuth from './components/RequireAuth'
import { getToken } from './utils/api'
import { FiHome, FiShoppingCart, FiCoffee, FiMapPin, FiUsers, FiDatabase, FiShield, FiKey, FiSettings, FiTag, FiBox, FiList, FiClock, FiLayers } from 'react-icons/fi'

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="text-sm font-semibold text-gray-500 mb-3">{title}</div>
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
        <aside className="w-80 md:w-96 bg-white rounded-md p-6 shadow border h-[calc(100vh-32px)] sticky top-4 overflow-auto">
          <div className="mb-4">
            <div className="text-xl font-bold text-blue-600 flex items-center gap-3"><FiMapPin className="w-6 h-6 text-sky-600" /> Delivery Food - Admin Panel</div>
          </div>

          <NavSection title="MANAGEMENT">
            <ul className="space-y-3">
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiMapPin className="w-5 h-5" />
                  <span>Delivery Locations</span>
                </NavLink>
              </li>
            </ul>
          </NavSection>

          <NavSection title="USER">
            <ul className="space-y-3">
              <li>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiUsers className="w-5 h-5" />
                  <span>Users</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/customer-collection"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiDatabase className="w-5 h-5" />
                  <span>Customer Collection</span>
                </NavLink>
              </li>
            </ul>
          </NavSection>

          <NavSection title="SETTINGS">
            <ul className="space-y-3">
              <li>
                <NavLink
                  to="/roles"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiSettings className="w-5 h-5" />
                  <span>Settings</span>
                </NavLink>
              </li>
            </ul>
          </NavSection>

          <NavSection title="CONTENT">
            <ul className="space-y-3">
              <li>
                <NavLink
                  to="/types"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiList className="w-5 h-5" />
                  <span>Menus</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/opening-hours"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiClock className="w-5 h-5" />
                  <span>Opening Hours</span>
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/sections"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
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
                    `flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`
                  }
                >
                  <FiUsers className="w-5 h-5" />
                  <span>Customers</span>
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
              <Route path="/opening-hours" element={<RequireAuth><OpeningHours /></RequireAuth>} />
              <Route path="/opening-hours/creation" element={<RequireAuth><OpeningHourCreate /></RequireAuth>} />
              <Route path="/opening-hours/creation/:id" element={<RequireAuth><OpeningHourCreate /></RequireAuth>} />
              <Route path="/sections" element={<RequireAuth><Sections /></RequireAuth>} />
              <Route path="/sections/creation" element={<RequireAuth><SectionCreate /></RequireAuth>} />
              <Route path="/sections/creation/:id" element={<RequireAuth><SectionCreate /></RequireAuth>} />
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
