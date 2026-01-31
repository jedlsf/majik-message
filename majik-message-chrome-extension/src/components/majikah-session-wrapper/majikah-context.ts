// MajikahContext.ts
import { createContext } from 'react'
import type { MajikahSession } from './majikah-session'

export interface MajikahContextValue {
  majikah: MajikahSession
  loading: boolean
  reloadSession?: () => Promise<void>
}

// Intentionally undefined — enforced by hook later
export const MajikahContext = createContext<MajikahContextValue | undefined>(undefined)
