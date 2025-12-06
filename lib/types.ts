export interface Violation {
  timestamp: string
  policy_code: string
  policy_name: string
  severity: 'L5' | 'L6' | 'L7'
  description: string
  reasoning: string
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'L5':
      return 'bg-yellow-500'
    case 'L6':
      return 'bg-orange-500'
    case 'L7':
      return 'bg-red-600'
    default:
      return 'bg-gray-500'
  }
}

export function getSeverityLabel(severity: string): string {
  switch (severity) {
    case 'L5':
      return 'Minor'
    case 'L6':
      return 'Serious'
    case 'L7':
      return 'Critical'
    default:
      return 'Unknown'
  }
}
