import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { login as apiLogin } from '../utils/api'
import { getFirstAccessiblePanelPath } from '../utils/permissions'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiLogin(email, password)
      navigate(getFirstAccessiblePanelPath() ?? '/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg || t('login.loginFailed'))
    } finally {
      setLoading(false)
    }
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
            <CardTitle className="text-5xl text-center font-bold text-gray-900">{t('login.welcome')}</CardTitle>
            <CardDescription className="text-center text-lg text-gray-600">{t('login.subtitle')}</CardDescription>
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
                  placeholder={t('login.emailPh')}
                  className="w-full h-20 text-xl border-gray-300 px-4"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-lg font-semibold text-gray-700">
                  {t('login.password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t('login.passwordPh')}
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
                <Button
                  variant="primary"
                  className="h-14 text-lg font-semibold rounded-lg hover:shadow-lg transition-all px-12"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('login.signingIn')}
                    </div>
                  ) : (
                    t('login.signIn')
                  )}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600 mt-6">
                {t('login.noAccount')}{' '}
                <span className="text-blue-600 font-semibold cursor-pointer hover:text-blue-700">
                  {t('login.contactAdmin')}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>{t('login.footer')}</p>
        </div>
      </div>
    </div>
  )
}
