const BASE = (process.env.API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Nest often returns a raw "Internal server error"; customers need a next step. */
export function friendlyApiMessage(status: number, message: string): string {
  const raw = message.trim().toLowerCase()
  if (
    status >= 500 ||
    raw === 'internal server error' ||
    raw.includes('econnrefused') ||
    raw.includes('fetch failed')
  ) {
    return 'The booking service is unavailable right now. Check that the API is running, then refresh.'
  }
  if (status === 0 || raw.includes('network')) {
    return 'Could not reach the booking service. Check your connection and try again.'
  }
  return message
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) },
      cache: 'no-store',
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'fetch failed'
    throw new ApiError(0, friendlyApiMessage(0, detail))
  }

  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') msg = body.message
      else if (Array.isArray(body.message)) msg = body.message[0] ?? msg
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, friendlyApiMessage(res.status, msg))
  }

  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
