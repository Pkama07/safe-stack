import { readFileSync } from 'fs'
import { join } from 'path'

export interface Policy {
  id: string
  title: string
  level: number
  description: string
}

export interface PoliciesData {
  version: number
  updated_at: string
  policies: Policy[]
}

let cachedPolicies: PoliciesData | null = null

export function getPolicies(): PoliciesData {
  if (cachedPolicies) return cachedPolicies

  const policiesPath = join(process.cwd(), 'policies_latest.json')
  cachedPolicies = JSON.parse(readFileSync(policiesPath, 'utf-8'))
  return cachedPolicies!
}

export function getPoliciesFormatted(): string {
  const data = getPolicies()
  return data.policies.map(p =>
    `[Severity ${p.level}] ${p.title}\n\nDescription: ${p.description}`
  ).join('\n\n')
}

export function findPolicyById(id: string): Policy | undefined {
  const data = getPolicies()
  return data.policies.find(p => p.id === id)
}

export function findPolicyByTitle(title: string): Policy | undefined {
  const data = getPolicies()
  return data.policies.find(p => p.title === title)
}

// Re-export types for convenience in server components
export * from './types'
