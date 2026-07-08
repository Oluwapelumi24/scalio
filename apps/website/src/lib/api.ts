const BASE = process.env.API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) },
    cache: 'no-store',
  })

  if (!res.ok) {
    let msg = res.statusText
    try {
      const body = (await res.json()) as { message?: string | string[] }
      if (typeof body.message === 'string') msg = body.message
      else if (Array.isArray(body.message)) msg = body.message[0] ?? msg
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, msg)
  }

  return res.json() as Promise<T>
}
