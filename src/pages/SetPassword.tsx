import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { API_BASE } from '../config'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validatePassword(p: string): string | null {
    if (p.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(p)) return 'Password must contain at least one uppercase letter'
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) return 'Password must contain at least one special character'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (!token) {
      setError('Invalid or missing link')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed (${res.status})`)
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-300 to-amber-600 p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-2">
            <div className="w-48 h-48">
              <img src="src/assets/logo.png" alt="Logo" />
            </div>
          </div>
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="text-center">Password set</CardTitle>
            <CardDescription className="text-center">
              You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <a href="/login">
              <Button variant="primary" className="rounded-lg">
                Go to login
              </Button>
            </a>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-orange-300 to-amber-600 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-2">
          <div className="w-48 h-48">
            <img src="src/assets/logo.png" alt="Logo" />
          </div>
        </div>
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl text-center font-bold text-gray-900">Create password</CardTitle>
            <CardDescription className="text-center text-gray-600">
              At least 8 characters, one uppercase letter and one special character.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="New password"
                  className="w-full h-12 border-gray-300 px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-lg font-semibold text-gray-700">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="w-full h-12 border-gray-300 px-4"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-6 w-6" />
                  <AlertDescription className="ml-2 text-red-800">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-lg font-semibold rounded-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting password...
                  </span>
                ) : (
                  'Set password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
