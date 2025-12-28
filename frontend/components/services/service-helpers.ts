export function formatPrice(min?: number, max?: number): string {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })

  if (!min && !max) return 'Consultar precio'
  if (min === max) return formatter.format(min || 0)
  return `${formatter.format(min || 0)} - ${formatter.format(max || 0)}`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount)
}
