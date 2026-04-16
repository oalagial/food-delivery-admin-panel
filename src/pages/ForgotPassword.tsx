import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { API_BASE } from '../config'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = text || `Request failed (${res.status})`
        try {
          const j = JSON.parse(text) as { message?: string | string[] }
          if (Array.isArray(j.message)) msg = j.message.join(', ')
          else if (typeof j.message === 'string') msg = j.message
        } catch {
          /* use raw */
        }
        throw new Error(msg)
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('forgotPassword.errGeneric'))
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
              <img src="/logo.png" alt={t('common.logoAlt')} />
            </div>
          </div>
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader>
              <CardTitle className="text-center">{t('forgotPassword.successTitle')}</CardTitle>
              <CardDescription className="text-center">{t('forgotPassword.successDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link to="/login">
                <Button variant="primary" className="rounded-lg">
                  {t('forgotPassword.backToLogin')}
                </Button>
              </Link>
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
            <img src="/logo.png" alt={t('common.logoAlt')} />
          </div>
        </div>
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-3">
            <CardTitle className="text-3xl text-center font-bold text-gray-900">{t('forgotPassword.title')}</CardTitle>
            <CardDescription className="text-center text-gray-600">{t('forgotPassword.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-lg font-semibold text-gray-700">
                  {t('login.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder={t('forgotPassword.emailPh')}
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
                    {t('forgotPassword.sending')}
                  </span>
                ) : (
                  t('forgotPassword.submit')
                )}
              </Button>
              <p className="text-center text-sm">
                <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  {t('forgotPassword.backToLogin')}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
