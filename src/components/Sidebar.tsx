import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiShoppingCart,
  FiCoffee,
  FiMapPin,
  FiUsers,
  FiShield,
  FiTag,
  FiBox,
  FiList,
  FiLayers,
  FiBarChart2,
} from 'react-icons/fi'

type NavSectionProps = {
  title: string
  children: React.ReactNode
}

function NavSection({ title, children }: NavSectionProps) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 px-4">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

type SidebarProps = {
  isOpen: boolean
  onNavigate?: () => void
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-40 w-[280px] max-w-[80%] transform transition-transform duration-200 ease-in-out md:static md:inset-y-auto md:left-auto md:shrink-0 md:max-w-none md:transform-none md:overflow-hidden md:transition-[width] md:duration-200 md:ease-in-out ${
        isOpen ? 'translate-x-0 md:w-[280px]' : '-translate-x-full md:translate-x-0 md:w-0'
      }`}
      style={{ width: isOpen ? 'min(280px, 80vw)' : '0px' }}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" style={{ width: '100px', height: 'auto' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavSection title="MANAGEMENT">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiHome className="w-5 h-5" />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/orders"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiShoppingCart className="w-5 h-5" />
                <span>Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/stats"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiBarChart2 className="w-5 h-5" />
                <span>Statistics</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/restaurant"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiCoffee className="w-5 h-5" />
                <span>Restaurant</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/delivery-locations"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
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
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiUsers className="w-5 h-5" />
                <span>Users</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/roles"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiShield className="w-5 h-5" />
                <span>Roles</span>
              </NavLink>
            </li>
          </ul>
        </NavSection>

        <NavSection title="CONTENT">
          <ul className="space-y-1">
            <li>
              <NavLink
                to="/types"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiTag className="w-5 h-5" />
                <span>Types</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiBox className="w-5 h-5" />
                <span>Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/menus"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiList className="w-5 h-5" />
                <span>Menus</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/sections"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiLayers className="w-5 h-5" />
                <span>Sections</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/offers"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiHome className="w-5 h-5" />
                <span>Offers</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/coupons"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiTag className="w-5 h-5" />
                <span>Coupons</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/customers"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onNavigate}
              >
                <FiUsers className="w-5 h-5" />
                <span>Customers</span>
              </NavLink>
            </li>
          </ul>
        </NavSection>
      </nav>
    </aside>
  )
}

