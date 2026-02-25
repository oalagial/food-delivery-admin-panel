import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../utils/api'
import { Button } from './ui/button'
import { FiLogOut, FiClock, FiMenu } from 'react-icons/fi'

type HeaderProps = {
  onToggleSidebar?: () => void
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString())
  const [token, setToken] = useState<string | null>(getToken())
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onStorage = () => setToken(getToken())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handleLogout() {
    clearToken()
    setToken(null)
    navigate('/login')
  }

  function handleLogin() {
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:hidden"
            onClick={onToggleSidebar}
          >
            <FiMenu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 md:text-2xl">
              Admin Dashboard
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block">
              Manage your food delivery platform
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 sm:flex">
            <FiClock className="h-4 w-4" />
            <span>{time}</span>
          </div>

          {token ? (
            <Button
              variant="danger"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base"
            >
              <FiLogOut className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleLogin}
              className="px-4 py-2 text-sm md:px-5 md:py-2.5 md:text-base"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
