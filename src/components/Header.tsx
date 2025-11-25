import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../utils/api'
import { Button } from './ui/button'
import { FiMapPin } from 'react-icons/fi'

export default function Header(){
  const time = useMemo(()=> new Date().toLocaleString(), [])
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
    <header className="flex justify-between items-center mb-4 min-w-[800px]">
      <div>
        <h3 className="text-xl font-semibold m-0 flex items-center">
          <FiMapPin className="w-5 h-5 mr-2 text-sky-600" />
          Administration
        </h3>
        <div className="text-sm text-gray-500 mb-4">Manage your application</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-500">{time}</div>
        {token ? (
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        ) : (
          <Button variant="ghost" onClick={handleLogin}>Login</Button>
        )}
      </div>
    </header>
  )
}
