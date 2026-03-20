import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  titleKey: string
  children: React.ReactNode
}

function NavSection({ titleKey, children }: NavSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="mt-8 first:mt-0">
      <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-4 px-4">
        {t(titleKey)}
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
  labelKey: string
  icon: React.ReactNode
  /** If true, only shown for SUPER_ADMIN / ADMIN / USER (and unknown JWT role). */
  fullPanelOnly?: boolean
}

const MANAGEMENT_LINKS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: <FiHome className="w-5 h-5" /> },
  { to: '/orders', labelKey: 'nav.orders', icon: <FiShoppingCart className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/stats', labelKey: 'nav.statistics', icon: <FiBarChart2 className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/restaurant', labelKey: 'nav.restaurant', icon: <FiCoffee className="w-5 h-5" />, fullPanelOnly: true },
  {
    to: '/delivery-locations',
    labelKey: 'nav.deliveryLocations',
    icon: <FiMapPin className="w-5 h-5" />,
    fullPanelOnly: true,
  },
]

const USER_MGMT_LINKS: NavItem[] = [
  { to: '/users', labelKey: 'nav.users', icon: <FiUsers className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/roles', labelKey: 'nav.roles', icon: <FiShield className="w-5 h-5" />, fullPanelOnly: true },
]

const CONTENT_LINKS: NavItem[] = [
  { to: '/types', labelKey: 'nav.types', icon: <FiTag className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/products', labelKey: 'nav.products', icon: <FiBox className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/menus', labelKey: 'nav.menus', icon: <FiList className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/sections', labelKey: 'nav.sections', icon: <FiLayers className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/offers', labelKey: 'nav.offers', icon: <FiHome className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/coupons', labelKey: 'nav.coupons', icon: <FiTag className="w-5 h-5" />, fullPanelOnly: true },
  { to: '/customers', labelKey: 'nav.customers', icon: <FiUsers className="w-5 h-5" />, fullPanelOnly: true },
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
  const { t } = useTranslation()
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
            <span>{t(item.labelKey)}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
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
          <img src="/logo.png" alt={t('common.logoAlt')} style={{ width: '100px', height: 'auto' }} />
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavSection titleKey="nav.management">
          <NavList items={management} onNavigate={onNavigate} />
        </NavSection>

        {userMgmt.length > 0 && (
          <NavSection titleKey="nav.userManagement">
            <NavList items={userMgmt} onNavigate={onNavigate} />
          </NavSection>
        )}

        {content.length > 0 && (
          <NavSection titleKey="nav.content">
            <NavList items={content} onNavigate={onNavigate} />
          </NavSection>
        )}
      </nav>
    </aside>
  )
}
