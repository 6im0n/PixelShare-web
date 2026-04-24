const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface PasswordChange {
  current: string
  next: string
  confirm: string
}

export function useAccount() {
  const api = useApi()
  const { getSession } = useAuth()

  async function updateName(name: string): Promise<void> {
    const trimmed = name.trim()
    if (trimmed.length < 2) throw new Error('Name must be at least 2 characters.')
    if (trimmed.length > 80) throw new Error('Name is too long (max 80 characters).')
    await api.patch('/account/me', { name: trimmed })
    await getSession()
  }

  async function updateEmail(email: string): Promise<void> {
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) throw new Error('Please enter a valid email address.')
    await api.post('/account/me/email-change', { email: trimmed })
  }

  async function updatePassword({ current, next, confirm }: PasswordChange): Promise<void> {
    if (!current) throw new Error('Please enter your current password.')
    if (next.length < 8) throw new Error('New password must be at least 8 characters.')
    if (next === current) throw new Error('New password must differ from the current one.')
    if (next !== confirm) throw new Error('Passwords do not match.')
    await api.patch('/account/me', { currentPassword: current, password: next })
  }

  return { updateName, updateEmail, updatePassword }
}
