import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../utils/api'
import { Button } from './ui/button'
import { FiLogOut, FiClock } from 'react-icons/fi'

export default function Header(){
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString())
  const [token, setToken] = useState<string | null>(getToken())
  const navigate = useNavigate()

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval) // καθαρισμός interval
  }, [])


  useEffect(()=>{
    const onStorage = () => setToken(getToken())
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  }, [])

  function handleLogout(){
    clearToken()
    setToken(null)
    navigate('/login')
  }

  function handleLogin(){
    navigate('/login')
  }

  return (
    <header className="header-bar">
      <div className="header-left">
        <h1 className="header-title">Admin Dashboard</h1>
        <p className="header-subtitle">Manage your food delivery platform</p>
      </div>
      <div className="header-right">
        <div className="header-time">
          <FiClock className="w-5 h-5" />
          <span className="font-medium">{time}</span>
        </div>
        {token ? (
          <Button variant="danger" onClick={handleLogout} className="px-5 py-2.5 text-base flex items-center gap-2">
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
        ) : (
          <Button variant="primary" onClick={handleLogin} className="px-5 py-2.5 text-base">Login</Button>
        )}
      </div>
    </header>
  )
}
