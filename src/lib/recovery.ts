import { AppState } from './types'
import { demoState, STORAGE_KEY } from './store'

export type RecoveryIssue = {
  hasIssue: boolean
  message: string
  raw: string
}

export function validateStateShape(value: any) {
  if (!value || typeof value !== 'object') return 'Saved data is not an object.'
  if (!value.settings || typeof value.settings !== 'object') return 'Missing settings.'
  if (!Array.isArray(value.vegetables)) return 'Missing vegetables list.'
  if (!Array.isArray(value.sales)) return 'Missing sales list.'
  if (!Array.isArray(value.customers)) return 'Missing customers list.'
  if (!Array.isArray(value.suppliers)) return 'Missing suppliers list.'
  if (!Array.isArray(value.purchases)) return 'Missing purchases list.'
  if (!Array.isArray(value.payments)) return 'Missing payments list.'
  return ''
}

export function checkStartupRecovery(): RecoveryIssue {
  const raw = localStorage.getItem(STORAGE_KEY) || ''
  if (!raw) return { hasIssue: false, message: '', raw: '' }
  try {
    const parsed = JSON.parse(raw)
    const issue = validateStateShape(parsed)
    return issue ? { hasIssue: true, message: issue, raw } : { hasIssue: false, message: '', raw }
  } catch (error) {
    return { hasIssue: true, message: `Saved data JSON is corrupted: ${error instanceof Error ? error.message : 'Unknown error'}`, raw }
  }
}

export function repairState(value: any): AppState {
  return {
    ...demoState,
    ...value,
    settings: { ...demoState.settings, ...(value?.settings || {}) },
    vegetables: Array.isArray(value?.vegetables) ? value.vegetables : demoState.vegetables,
    customers: Array.isArray(value?.customers) ? value.customers : [],
    suppliers: Array.isArray(value?.suppliers) ? value.suppliers : [],
    sales: Array.isArray(value?.sales) ? value.sales : [],
    purchases: Array.isArray(value?.purchases) ? value.purchases : [],
    expenses: Array.isArray(value?.expenses) ? value.expenses : [],
    stockLogs: Array.isArray(value?.stockLogs) ? value.stockLogs : [],
    payments: Array.isArray(value?.payments) ? value.payments : [],
    returns: Array.isArray(value?.returns) ? value.returns : [],
    auditLogs: Array.isArray(value?.auditLogs) ? value.auditLogs : [],
    billCounter: Number(value?.billCounter || 1)
  }
}
