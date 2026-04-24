export type UserRole = 'model' | 'photographer'

export function useRole() {
  const { data } = useAuth()

  const backendRole = computed(() => data.value?.role ?? 'client')

  const role = computed<UserRole>(() =>
    backendRole.value === 'photographer' || backendRole.value === 'admin' ? 'photographer' : 'model',
  )

  const isModel        = computed(() => role.value === 'model')
  const isPhotographer = computed(() => role.value === 'photographer')
  const isAdmin        = computed(() => backendRole.value === 'admin')

  return { role, isModel, isPhotographer, isAdmin }
}
