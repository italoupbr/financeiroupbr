// In dev, requests go through the Vite proxy (/asaas-api → target Asaas host).
// The proxy injects the access_token header server-side (vite.config.ts).
// The API key never reaches the browser bundle.
const IS_DEV = import.meta.env.DEV

const BASE_URL = IS_DEV
  ? '/asaas-api'
  : 'https://www.asaas.com/api/v3'  // production: requires a server-side proxy

async function request(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
      // access_token is injected by the Vite proxy — do NOT send from the browser
    },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.clone().json()
      if (body?.errors?.[0]?.description) detail = body.errors[0].description
    } catch { /* ignore */ }
    throw new Error(`Asaas ${res.status}: ${detail}`)
  }
  return res.json()
}

export const asaas = {
  getMyAccount: () => request('/myAccount'),

  getPayments: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/payments${q}`)
  },

  getPaymentsByStatus: (status: string) =>
    request(`/payments?status=${status}&limit=100`),

  getReceivedThisMonth: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0]
    return request(
      `/payments?status=RECEIVED&paymentDate[ge]=${start}&paymentDate[le]=${end}&limit=100`
    )
  },

  getCustomers: () => request('/customers?limit=100'),

  getCustomersAll: async (): Promise<any[]> => {
    const all: any[] = []
    let offset = 0
    for (;;) {
      const res: any = await request(`/customers?limit=100&offset=${offset}`)
      all.push(...(res.data ?? []))
      if (!res.hasMore) break
      offset += 100
    }
    return all
  },

  getMonthCharges: async (dateFrom: string, dateTo: string) => {
    const [rec, conf, pend, over] = await Promise.all([
      request(`/payments?status=RECEIVED&paymentDate%5Bge%5D=${dateFrom}&paymentDate%5Ble%5D=${dateTo}&limit=100`),
      request(`/payments?status=CONFIRMED&paymentDate%5Bge%5D=${dateFrom}&paymentDate%5Ble%5D=${dateTo}&limit=100`),
      request(`/payments?status=PENDING&dueDate%5Bge%5D=${dateFrom}&dueDate%5Ble%5D=${dateTo}&limit=100`),
      request(`/payments?status=OVERDUE&dueDate%5Bge%5D=${dateFrom}&dueDate%5Ble%5D=${dateTo}&limit=100`),
    ]) as any[]
    return {
      received: [...(rec.data ?? []), ...(conf.data ?? [])],
      pending:  pend.data ?? [],
      overdue:  over.data ?? [],
    }
  },

  getPendingPayments: () => request('/payments?status=PENDING&limit=100'),

  getOverduePayments: () => request('/payments?status=OVERDUE&limit=100'),
}

// Key lives server-side only — show a fixed masked label in the UI
export const ASAAS_KEY_MASKED = 'Configurada via servidor'

export const ASAAS_ENV: 'production' | 'sandbox' = 'production'
