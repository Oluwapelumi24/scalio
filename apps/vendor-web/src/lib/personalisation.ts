// Types for the personalisation API. The ranking itself happens on the backend,
// so web and mobile always show the same order for the same business.

export type HomeLayer = 'attention' | 'overview' | 'quick_action' | 'recommendation'

export interface Interest { id: string; label: string; icon: string }
export interface InterestGroup { id: string; title: string; interests: Interest[] }

export interface Preferences {
  interests: string[]
  pinnedModules: string[]
  hiddenModules: string[]
  interestsCompletedAt: string | null
}

export interface HomeItem {
  id: string
  layer: HomeLayer
  title: string
  icon: string
  status: 'available' | 'coming_soon'
  pinned: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
}

export interface HomeResponse {
  generatedAt: string
  layers: Record<HomeLayer, HomeItem[]>
  hidden: Pick<HomeItem, 'id' | 'layer' | 'title' | 'icon'>[]
}

export const MANAGER_ROLES = ['owner', 'manager']
