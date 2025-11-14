import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getToken, clearToken } from '../utils/api'

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
    <header className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-xl font-semibold m-0">Administration</h3>
        <div className="text-sm text-gray-500">Manage your application</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm text-gray-500">{time}</div>
        {token ? (
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        ) : (
          <button className="btn btn-ghost" onClick={handleLogin}>Login</button>
        )}
      </div>
    </header>
  )
}
