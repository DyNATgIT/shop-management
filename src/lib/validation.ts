import { CartItem, Vegetable } from './types'

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function validatePositive(value: number, label: string) {
  if (!isFiniteNumber(value) || value <= 0) return `${label} must be greater than 0.`
  return ''
}

export function validateNonNegative(value: number, label: string) {
  if (!isFiniteNumber(value) || value < 0) return `${label} cannot be negative.`
  return ''
}

export function validateVegetableInput(vegetable: Vegetable) {
  const errors: string[] = []
  if (!vegetable.name.trim()) errors.push('Vegetable name is required.')
  if (!vegetable.unit) errors.push('Unit is required.')
  ;[
    validateNonNegative(vegetable.stock, 'Stock'),
    validateNonNegative(vegetable.purchaseRate, 'Purchase rate'),
    validateNonNegative(vegetable.sellingRate, 'Selling rate'),
    validateNonNegative(vegetable.lowStock, 'Low stock level'),
    validateNonNegative(vegetable.wastagePercent, 'Wastage percent')
  ].filter(Boolean).forEach(error => errors.push(error))
  return errors
}

export function validateCartItems(items: CartItem[]) {
  const errors: string[] = []
  if (!items.length) errors.push('Add at least one item to bill.')
  items.forEach((item, index) => {
    const label = item.name || `Item ${index + 1}`
    const qtyError = validatePositive(item.qty, `${label} quantity`)
    const rateError = validateNonNegative(item.rate, `${label} rate`)
    const discountError = validateNonNegative(item.discount, `${label} discount`)
    if (qtyError) errors.push(qtyError)
    if (rateError) errors.push(rateError)
    if (discountError) errors.push(discountError)
    if (item.discount > item.qty * item.rate) errors.push(`${label} discount cannot be greater than item amount.`)
  })
  return errors
}

export function showValidation(errors: string[]) {
  if (!errors.length) return false
  alert(errors.join('\n'))
  return true
}
