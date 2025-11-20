import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../utils/api'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault()
    setError(null)
    setLoading(true)
    try{
      await apiLogin(email, password)
      navigate('/dashboard')
    }catch(err:any){
      setError(err?.message || 'Login failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto mt-8 p-8 bg-white rounded-lg shadow-lg ring-1 ring-gray-100">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Sign in to your account</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the admin panel.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1">
              <Input
                type="email"
                className="w-full"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1">
              <Input
                type="password"
                className="w-full"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm">
              <input type="checkbox" className="mr-2 h-4 w-4" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a className="text-sm text-blue-600 hover:underline" href="#">Forgot password?</a>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div>
            <Button variant="primary" className="w-full" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Don't have an account? <span className="text-blue-600">Contact your administrator</span>
          </div>
        </form>
      </div>
    </div>
  )
}
