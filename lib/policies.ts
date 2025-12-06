import { readFileSync } from 'fs'
import { join } from 'path'

let cachedPolicies: string | null = null

export function getPolicies(): string {
  if (cachedPolicies) return cachedPolicies

  const policiesPath = join(process.cwd(), 'policies.txt')
  cachedPolicies = readFileSync(policiesPath, 'utf-8')
  return cachedPolicies
}

// Re-export types for convenience in server components
export * from './types'
