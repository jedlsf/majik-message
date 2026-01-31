// MajikMessageRealtimeChatClientContext.ts
import { createContext } from 'react'
import type { MajikMessageRealtimeChatClient } from './majik-message-realtime'

export interface MajikMessageRealtimeChatClientContextValue {
  client: MajikMessageRealtimeChatClient
}

// Intentionally undefined — enforced by hook later
export const MajikMessageRealtimeChatClientContext = createContext<
  MajikMessageRealtimeChatClientContextValue | undefined
>(undefined)
