// useMajik.ts
import { useContext } from 'react'
import { MajikContext, type MajikContextValue } from './majik-context'

export const useMajik = (): MajikContextValue => {
  const context = useContext(MajikContext)
  if (!context) {
    throw new Error('useMajik must be used within a MajikProvider')
  }
  return context
}
