import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../utils/api'
import { Button } from './ui/button'
import { FiLogOut, FiClock } from 'react-icons/fi'

export default function Header(){
  const time = useMemo(()=> new Date().toLocaleTimeString(), [])
  const [token, setToken] = useState<string | null>(getToken())
  const navigate = useNavigate()

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
          <FiClock className="w-4 h-4" />
          <span>{time}</span>
        </div>
        {token ? (
          <Button variant="ghost" onClick={handleLogout} className="header-logout">
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        ) : (
          <Button variant="ghost" onClick={handleLogin}>Login</Button>
        )}
      </div>
    </header>
  )
}
