export async function hashPin(pin: string) {
  if (!pin) return ''
  if (!crypto?.subtle) return `plain:${pin}`
  const data = new TextEncoder().encode(`vegetable-shop-manager:${pin}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPin(pin: string, settings: any) {
  if (settings.ownerPinHash) return await hashPin(pin) === settings.ownerPinHash
  return pin === settings.ownerPin
}
