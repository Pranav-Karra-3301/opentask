/**
 * Log in with email + password via better-auth, with an optional OIDC provider
 * button and a first-run register link (shown only while registration is open).
 * Task C — replaces the Task A stub.
 */
import { Link, useNavigate } from '@tanstack/react-router'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useDemo, useInfo } from '@/api/hooks/info'
import { AuthField, AuthShell } from '@/auth/auth-shell'
import { authClient } from '@/auth/client'
import { OidcButtons } from '@/auth/oidc-buttons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginPage() {
  const navigate = useNavigate()
  const { data: info } = useInfo()
  const demo = useDemo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // On a demo instance the credentials are published by /info; fill them in so the fields
  // aren't a pointless copy-paste chore. Guarded to fire exactly once and only into an
  // untouched form — /info resolves after first paint, and overwriting what someone has
  // already started typing would be worse than not prefilling at all.
  const prefilled = useRef(false)
  useEffect(() => {
    if (demo === null || prefilled.current) return
    prefilled.current = true
    setEmail((current) => (current === '' ? demo.email : current))
    setPassword((current) => (current === '' ? demo.password : current))
  }, [demo])

  async function signIn(withEmail: string, withPassword: string) {
    setError(null)
    setPending(true)
    const { error: authError } = await authClient.signIn.email({
      email: withEmail,
      password: withPassword,
    })
    if (authError) {
      setPending(false)
      setError(authError.message ?? authError.statusText ?? 'Unable to log in.')
      return
    }
    await navigate({ to: '/today' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signIn(email, password)
  }

  const disabled = pending || email.trim() === '' || password === ''

  return (
    <AuthShell
      title="Log in"
      footer={
        info?.registration_open === true ? (
          <>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-accent hover:underline">
              Create one
            </Link>
          </>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField id="login-email" label="Email">
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={pending}
            onChange={(event) => setEmail(event.target.value)}
          />
        </AuthField>
        <AuthField id="login-password" label="Password">
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            disabled={pending}
            onChange={(event) => setPassword(event.target.value)}
          />
        </AuthField>
        {error !== null && (
          <p role="alert" className="text-copy text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={disabled} aria-busy={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      {demo !== null && (
        <div className="mt-4 rounded-lg border border-border bg-accent-soft px-4 py-3">
          <p className="text-copy text-text-secondary">
            This is a public demo. It holds sample data, resets on a timer, and saves nothing.
          </p>
          <Button
            type="button"
            className="mt-3 w-full"
            disabled={pending}
            aria-busy={pending}
            onClick={() => void signIn(demo.email, demo.password)}
          >
            {pending ? 'Logging in…' : 'Log in as demo'}
          </Button>
        </div>
      )}
      <OidcButtons />
    </AuthShell>
  )
}
