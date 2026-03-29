import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { API_BASE } from '../config'
import { clearToken } from '../utils/api'

export default function SetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    clearToken()
  }, [])
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function validatePassword(p: string): string | null {
    if (p.length < 8) return t('setPassword.errMinLength')
    if (!/[A-Z]/.test(p)) return t('setPassword.errUppercase')
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) return t('setPassword.errSpecial')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('setPassword.errMismatch'))
      return
    }
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (!email || !token) {
      setError(t('setPassword.errInvalidLink'))
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = text || `Request failed (${res.status})`
        try {
          const j = JSON.parse(text) as { message?: string | string[] }
          if (Array.isArray(j.message)) msg = j.message.join(', ')
          else if (typeof j.message === 'string') msg = j.message
        } catch {
          /* use raw text */
        }
        throw new Error(msg)
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('setPassword.errGeneric'))
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
              <img src="src/assets/logo.png" alt={t('common.logoAlt')} />
            </div>
          </div>
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-center">{t('setPassword.successTitle')}</CardTitle>
              <CardDescription className="text-center">{t('setPassword.successDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <a href="/login">
                <Button variant="primary" className="rounded-lg">
                  {t('setPassword.goLogin')}
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
            <img src="src/assets/logo.png" alt={t('common.logoAlt')} />
          </div>
        </div>
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl text-center font-bold text-gray-900">{t('setPassword.title')}</CardTitle>
            <CardDescription className="text-center text-gray-600">{t('setPassword.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-gray-700">
                  {t('setPassword.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('setPassword.passwordPh')}
                  className="w-full h-12 border-gray-300 px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-lg font-semibold text-gray-700">
                  {t('setPassword.confirm')}
                </Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder={t('setPassword.confirmPh')}
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
                    {t('setPassword.setting')}
                  </span>
                ) : (
                  t('setPassword.submit')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
