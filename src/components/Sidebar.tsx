import { useEffect, useState } from 'react'
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
import { getCurrentUserRole } from '../utils/api'
import { roleHasFullPanelAccess } from '../utils/userRoles'

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

type NavItem = {
  to: string
  label: string
  icon: React.ReactNode
  /** If true, only shown for SUPER_ADMIN / ADMIN / USER (and unknown JWT role). */
  fullPanelOnly?: boolean
}

const MANAGEMENT_LINKS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome className="w-5 h-5" /> },
  { to: '/orders', label: 'Orders', icon: <FiShoppingCart className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/stats', label: 'Statistics', icon: <FiBarChart2 className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/restaurant', label: 'Restaurant', icon: <FiCoffee className="w-5 h-5" />, fullPanelOnly: true },
  {
    to: '/delivery-locations',
    label: 'Delivery Locations',
    icon: <FiMapPin className="w-5 h-5" />,
    fullPanelOnly: true,
  },
]

const USER_MGMT_LINKS: NavItem[] = [
  { to: '/users', label: 'Users', icon: <FiUsers className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/roles', label: 'Roles', icon: <FiShield className="w-5 h-5" />, fullPanelOnly: true },
]

const CONTENT_LINKS: NavItem[] = [
  { to: '/types', label: 'Types', icon: <FiTag className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/products', label: 'Products', icon: <FiBox className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/menus', label: 'Menus', icon: <FiList className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/sections', label: 'Sections', icon: <FiLayers className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/offers', label: 'Offers', icon: <FiHome className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/coupons', label: 'Coupons', icon: <FiTag className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/customers', label: 'Customers', icon: <FiUsers className="w-5 h-5" />, fullPanelOnly: true },
]

function filterNavItems(items: NavItem[], fullPanel: boolean): NavItem[] {
  return items.filter((item) => !item.fullPanelOnly || fullPanel)
}

function NavList({
  items,
  onNavigate,
}: {
  items: NavItem[]
  onNavigate?: () => void
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onNavigate}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const [fullPanel, setFullPanel] = useState(() => roleHasFullPanelAccess(getCurrentUserRole()))

  useEffect(() => {
    const sync = () => setFullPanel(roleHasFullPanelAccess(getCurrentUserRole()))
    sync()
    window.addEventListener('auth', sync)
    return () => window.removeEventListener('auth', sync)
  }, [])

  const management = filterNavItems(MANAGEMENT_LINKS, fullPanel)
  const userMgmt = filterNavItems(USER_MGMT_LINKS, fullPanel)
  const content = filterNavItems(CONTENT_LINKS, fullPanel)

  return (
    <aside
      className={`sidebar fixed inset-y-0 left-0 z-40 w-[240px] max-w-[80%] transform transition-transform duration-200 ease-in-out md:static md:inset-y-auto md:left-auto md:shrink-0 md:max-w-none md:transform-none md:overflow-hidden md:transition-[width] md:duration-200 md:ease-in-out ${
        isOpen ? 'translate-x-0 md:w-[240px]' : '-translate-x-full md:translate-x-0 md:w-0'
      }`}
      style={{ width: isOpen ? 'min(240px, 80vw)' : '0px' }}
    >
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" style={{ width: '100px', height: 'auto' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavSection title="MANAGEMENT">
          <NavList items={management} onNavigate={onNavigate} />
        </NavSection>

        {userMgmt.length > 0 && (
          <NavSection title="USER MANAGEMENT">
            <NavList items={userMgmt} onNavigate={onNavigate} />
          </NavSection>
        )}

        {content.length > 0 && (
          <NavSection title="CONTENT">
            <NavList items={content} onNavigate={onNavigate} />
          </NavSection>
        )}
      </nav>
    </aside>
  )
}
