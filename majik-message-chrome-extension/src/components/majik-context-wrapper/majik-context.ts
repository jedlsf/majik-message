// MajikContext.ts
import { createContext } from 'react'

import type { MajikMessageDatabase } from './majik-message-database'

export interface MajikContextValue {
  majik: MajikMessageDatabase
  loading: boolean
  locked: boolean
  setPin?: (pin: string) => Promise<void>
  clearPin?: () => Promise<void>
  unlockWithPin?: (pin: string) => Promise<boolean>
  updateInstance: (updatedInstance: MajikMessageDatabase) => void
}

export const MajikContext = createContext<MajikContextValue | undefined>(undefined)
