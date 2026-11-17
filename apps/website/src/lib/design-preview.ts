import { cookies } from 'next/headers'
import { DESIGN_COOKIE, type DesignMode } from '@/lib/design-mode'

export async function designMode(): Promise<DesignMode> {
  const value = (await cookies()).get(DESIGN_COOKIE)?.value
  return value === 'launch' ? 'launch' : 'prelaunch'
}
