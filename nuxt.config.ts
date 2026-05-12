// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxt/icon',
    '@sidebase/nuxt-auth',
  ],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap',
        },
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block',
        },
      ],
    },
  },

  icon: {
    serverBundle: {
      collections: ['material-symbols'],
    },
  },

  // Runtime config — public values exposed to the client
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },

  auth: {
    baseURL: process.env.NUXT_PUBLIC_API_BASE
      ? `${process.env.NUXT_PUBLIC_API_BASE}/api`
      : 'http://localhost:3001/api',
    provider: {
      type: 'local',
      endpoints: {
        signIn:     { path: '/auth/login',    method: 'post' },
        signOut:    false,
        signUp:     { path: '/auth/register', method: 'post' },
        getSession: { path: '/auth/me',       method: 'get'  },
      },
      token: {
        signInResponseTokenPointer: '/accessToken',
        type:              'Bearer',
        cookieName:        'auth.token',
        headerName:        'Authorization',
        maxAgeInSeconds:   900,
        sameSiteAttribute: 'lax',
      },
      refresh: {
        isEnabled: true,
        endpoint: { path: '/auth/refresh', method: 'post' },
        refreshOnlyToken: false,
        token: {
          signInResponseRefreshTokenPointer: '/refreshToken',
          refreshResponseTokenPointer:       '/accessToken',
          cookieName:      'auth.refresh-token',
          maxAgeInSeconds: 2592000,
        },
      },
      session: {
        dataType: {
          id:    'string',
          email: 'string',
          name:  'string',
          role:  "'admin' | 'photographer' | 'client'",
        },
      },
    },
    globalAppMiddleware: {
      isEnabled:         true,
      allow404WithoutAuth: true,
    },
    sessionRefresh: {
      enablePeriodically:  false,
      enableOnWindowFocus: true,
    },
  },

  css: ['~/assets/css/main.css'],
})
