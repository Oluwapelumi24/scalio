import { DesignSwitch } from '@/components/site/DesignSwitch'
import type { DesignMode } from '@/lib/design-mode'

/**
 * The floating design switch is for the team only. Production visitors stay on
 * the default (pre-launch) site unless DESIGN_SWITCH=1 is set on the host, or
 * they already have the launch preview cookie (so they can flip back).
 */
export function DesignSwitchGate({ mode }: { mode: DesignMode }) {
  const allowed =
    process.env.NODE_ENV !== 'production' ||
    process.env.DESIGN_SWITCH === '1' ||
    mode === 'launch'
  if (!allowed) return null
  return <DesignSwitch mode={mode} />
}
