type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type ReqBody = BodyInit | Record<string, unknown> | null | undefined
type ReqOpts = {
  method?: HttpMethod
  headers?: HeadersInit
  body?: ReqBody
  query?: Record<string, unknown>
  params?: Record<string, unknown>
}

export function useApi() {
  const config = useRuntimeConfig()
  const base = config.public.apiBase
  const { token } = useAuth()

  async function request<T>(path: string, opts: ReqOpts = {}): Promise<T> {
    // Build plain-object headers so ofetch can read them reliably
    const h: Record<string, string> = {}
    if (opts.headers) {
      for (const [k, v] of new Headers(opts.headers).entries()) {
        h[k] = v
      }
    }
    const t = token.value
    if (t && !h['authorization']) h['authorization'] = t
    if (
      opts.body &&
      typeof opts.body === 'object' &&
      !(opts.body instanceof FormData) &&
      !(opts.body instanceof Blob) &&
      !h['content-type']
    ) {
      h['content-type'] = 'application/json'
    }
    return $fetch<T>(path, {
      baseURL: `${base}/api`,
      ...opts,
      headers: h,
    })
  }

  return {
    base,
    get:    <T>(path: string, opts?: Omit<ReqOpts, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'GET' }),
    post:   <T>(path: string, body?: ReqBody, opts?: Omit<ReqOpts, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'POST', body }),
    patch:  <T>(path: string, body?: ReqBody, opts?: Omit<ReqOpts, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'PATCH', body }),
    put:    <T>(path: string, body?: ReqBody, opts?: Omit<ReqOpts, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'PUT', body }),
    delete: <T>(path: string, opts?: Omit<ReqOpts, 'method' | 'body'>) => request<T>(path, { ...opts, method: 'DELETE' }),
    async getBlob(path: string, signal?: AbortSignal): Promise<Blob> {
      const t = token.value
      const res = await fetch(`${base}/api${path}`, {
        headers: t ? { authorization: t } : undefined,
        signal,
      })
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
      return res.blob()
    },
  }
}
