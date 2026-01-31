// useMajikah.ts
import { useContext } from 'react'
import { MajikMessageRealtimeChatClientContext } from './majik-message-realtime-context'
import type { MajikMessageRealtimeChatClient } from './majik-message-realtime'

export const useMajikMessageRealtime = (): MajikMessageRealtimeChatClient => {
  const context = useContext(MajikMessageRealtimeChatClientContext)
  if (!context) {
    throw new Error(
      'useMajikMessageRealtime must be used within MajikMessageRealtimeChatClientProvider'
    )
  }
  return context.client
}
