// useMajikah.ts
import { useContext } from 'react'
import { MajikahContext, type MajikahContextValue } from './majikah-context'

export const useMajikah = (): MajikahContextValue => {
  const context = useContext(MajikahContext)
  if (!context) {
    throw new Error('useMajikah must be used within a MajikahProvider')
  }
  return context
}
