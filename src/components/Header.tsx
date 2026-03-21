import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  getToken,
  clearToken,
  fetchCurrentUserSession,
  getCurrentUserJwtHints,
  getCurrentUserRole,
  type CurrentUserSessionInfo,
} from '../utils/api'
import { Button } from './ui/button'
import { FiLogOut, FiClock, FiMenu, FiMoon, FiSun, FiChevronDown } from 'react-icons/fi'

type HeaderProps = {
  onToggleSidebar?: () => void
}

function timeLocale(lng: string): string {
  return lng.startsWith('it') ? 'it-IT' : 'en-GB'
}

function userInitials(info: { email?: string; username?: string }): string {
  const primary = (info.username || info.email || '').trim()
  if (!primary) return '?'
  const parts = primary.split(/[\s._@]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
  }
  return primary.slice(0, 2).toUpperCase()
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const [time, setTime] = useState<string>(() =>
    new Date().toLocaleTimeString(timeLocale(i18n.language))
  )
  const [token, setToken] = useState<string | null>(getToken())
  const [session, setSession] = useState<CurrentUserSessionInfo | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountWrapRef = useRef<HTMLDivElement>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })
  const navigate = useNavigate()

  const jwtHints = getCurrentUserJwtHints()
  const roleFromJwt = getCurrentUserRole()
  const displayUser = {
    email: session?.email ?? jwtHints.email,
    username: session?.username ?? jwtHints.username,
    roleLabel:
      session?.roleLabel ?? (roleFromJwt ? roleFromJwt.replace(/_/g, ' ') : undefined),
  }
  const displayName = displayUser.username || displayUser.email || t('header.account')

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString(timeLocale(i18n.language)))
    }, 1000)
    return () => clearInterval(interval)
  }, [i18n.language])

  useEffect(() => {
    const sync = () => setToken(getToken())
    window.addEventListener('storage', sync)
    window.addEventListener('auth', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('auth', sync)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setSession(null)
      setSessionLoading(false)
      setAccountOpen(false)
      return
    }
    let cancelled = false
    setSessionLoading(true)
    void fetchCurrentUserSession()
      .then((data) => {
        if (!cancelled) setSession(data)
      })
      .catch(() => {
        if (!cancelled) setSession(null)
      })
      .finally(() => {
        if (!cancelled) setSessionLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!accountOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (!accountWrapRef.current?.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [accountOpen])

  useEffect(() => {
    if (!accountOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [accountOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  function handleLogout() {
    clearToken()
    setToken(null)
    setAccountOpen(false)
    navigate('/login')
  }

  function handleLogin() {
    navigate('/login')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:sticky md:top-0">
      <div className="flex w-full min-w-0 items-center justify-between gap-3 py-3 pl-3 pr-4 md:py-4 md:pl-4 md:pr-6">
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100/95 via-orange-50/90 to-amber-200/60 text-amber-950 shadow-sm ring-1 ring-amber-200/40 transition hover:from-amber-200/90 hover:via-amber-100/95 hover:to-orange-100/80 hover:shadow-md hover:ring-amber-300/50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-900 dark:text-amber-50 dark:ring-amber-900/40 dark:hover:from-slate-700 dark:hover:via-slate-700 dark:hover:to-slate-800 dark:hover:ring-amber-700/30 dark:focus-visible:ring-orange-400"
            onClick={onToggleSidebar}
            aria-label={t('header.toggleSidebar')}
          >
            <FiMenu
              className="h-[22px] w-[22px] transition group-hover:scale-105"
              strokeWidth={2.25}
            />
          </button>
        </div>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-3">
          <label className="sr-only" htmlFor="header-lang">
            {t('header.language')}
          </label>
          <select
            id="header-lang"
            value={i18n.language.startsWith('it') ? 'it' : 'en'}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="en">{t('header.english')}</option>
            <option value="it">{t('header.italian')}</option>
          </select>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
            aria-label={t('header.toggleTheme')}
          >
            {theme === 'dark' ? (
              <FiSun className="h-4 w-4" />
            ) : (
              <FiMoon className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? t('header.light') : t('header.dark')}
            </span>
          </button>

          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:flex dark:bg-slate-800 dark:text-slate-100">
            <FiClock className="h-4 w-4" />
            <span>{time}</span>
          </div>

          {token ? (
            <div className="relative" ref={accountWrapRef}>
              <button
                type="button"
                id="header-account-trigger"
                aria-label={t('header.accountMenu')}
                aria-haspopup="dialog"
                aria-expanded={accountOpen}
                aria-controls="header-account-panel"
                onClick={() => setAccountOpen((o) => !o)}
                className={`flex h-10 w-10 shrink-0 items-center justify-center gap-0 rounded-full border border-slate-200/90 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 max-sm:bg-gradient-to-br max-sm:from-amber-200/90 max-sm:to-orange-300/80 max-sm:text-sm max-sm:font-semibold max-sm:text-amber-950 max-sm:hover:border-amber-300/80 max-sm:hover:shadow-md max-sm:active:scale-[0.97] dark:border-slate-600 dark:max-sm:from-amber-900/55 dark:max-sm:to-orange-950/55 dark:max-sm:text-amber-100 sm:h-auto sm:w-auto sm:max-w-[min(100vw-8rem,14rem)] sm:gap-2.5 sm:rounded-xl sm:bg-white sm:py-1.5 sm:pl-1.5 sm:pr-2.5 sm:text-left sm:hover:border-amber-200/80 sm:hover:bg-amber-50/40 dark:sm:bg-slate-800/90 dark:sm:hover:border-slate-500 dark:sm:hover:bg-slate-800 ${accountOpen ? 'border-amber-300/70 ring-1 ring-amber-200/50 dark:border-amber-700/40 dark:ring-amber-900/30' : ''}`}
              >
                <span
                  className="select-none sm:hidden"
                  aria-hidden
                >
                  {sessionLoading ? '…' : userInitials(displayUser)}
                </span>
                <span
                  className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-200/90 to-orange-300/80 text-sm font-semibold text-amber-950 sm:flex dark:from-amber-900/50 dark:to-orange-950/60 dark:text-amber-100"
                  aria-hidden
                >
                  {userInitials(displayUser)}
                </span>
                <span className="hidden min-w-0 flex-1 sm:block">
                  <span className="block truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {sessionLoading ? t('header.loadingUser') : displayName}
                  </span>
                  {displayUser.email && displayName !== displayUser.email ? (
                    <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {displayUser.email}
                    </span>
                  ) : null}
                </span>
                <FiChevronDown
                  className={`hidden h-4 w-4 shrink-0 text-slate-500 transition sm:block dark:text-slate-400 ${accountOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>

              {accountOpen ? (
                <div
                  id="header-account-panel"
                  role="dialog"
                  aria-label={t('header.account')}
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-1.5rem),18rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t('header.account')}
                  </p>
                  <div className="mt-3 space-y-2.5 text-sm">
                    {displayUser.username ? (
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {t('header.username')}
                        </p>
                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                          {displayUser.username}
                        </p>
                      </div>
                    ) : null}
                    {displayUser.email ? (
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {t('header.email')}
                        </p>
                        <p className="break-all font-medium text-slate-900 dark:text-slate-100">
                          {displayUser.email}
                        </p>
                      </div>
                    ) : null}
                    {!displayUser.username && !displayUser.email ? (
                      <p className="text-slate-600 dark:text-slate-300">
                        {sessionLoading ? t('header.loadingUser') : '—'}
                      </p>
                    ) : null}
                    {displayUser.roleLabel ? (
                      <div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {t('header.role')}
                        </p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {displayUser.roleLabel}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="danger"
                      className="w-full justify-center px-4 py-2"
                      icon={<FiLogOut className="h-4 w-4" />}
                      onClick={handleLogout}
                    >
                      {t('header.logout')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={handleLogin}
              className="px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base"
            >
              {t('header.login')}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
