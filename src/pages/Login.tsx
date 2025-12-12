import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../utils/api'
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">FD</span>
              </div>
            </div>
            <CardTitle className="text-5xl text-center font-bold text-gray-900">Welcome</CardTitle>
            <CardDescription className="text-center text-lg text-gray-600">Sign in to your admin account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="w-full h-20 text-xl border-gray-300 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e=>setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full h-20 text-xl border-gray-300 px-4"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-6 w-6" />
                  <AlertDescription className="ml-2 text-lg text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center pt-2">
                <Button variant="primary" className="h-14 text-lg font-semibold rounded-lg hover:shadow-lg transition-all px-12" type="submit" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600 mt-6">
                Don't have an account? <span className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700">Contact your administrator</span>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>© 2024 Food Delivery Admin. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
