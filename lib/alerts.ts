import { Alert } from '@/components/AlertCard'

export function mergeAlerts(existing: Alert[], incoming: Alert[]): Alert[] {
  const byId = new Map<number, Alert>()
  existing.forEach((a) => byId.set(a.id, a))
  incoming.forEach((a) => byId.set(a.id, a))
  // Sort newest first by timestamp if present
  const merged = Array.from(byId.values())
  merged.sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime()
    const tb = new Date(b.timestamp || 0).getTime()
    return tb - ta
  })
  return merged
}
