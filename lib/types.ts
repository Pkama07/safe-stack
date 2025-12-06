export interface Violation {
  timestamp: string
  policy_name: string
  severity: 'Severity 1' | 'Severity 2' | 'Severity 3'
  description: string
  reasoning: string
  fix: string
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'Severity 1':
      return 'bg-yellow-500'
    case 'Severity 2':
      return 'bg-orange-500'
    case 'Severity 3':
      return 'bg-red-600'
    default:
      return 'bg-gray-500'
  }
}
