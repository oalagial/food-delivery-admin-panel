/** Digits only (no +, spaces, etc.). */
function digitsOnly(input: string): string {
  return input.replace(/\D/g, '')
}

/**
 * Builds a `https://wa.me/…` URL when the phone can be normalized to WhatsApp’s expected format
 * (international digits, no +). Returns null if the number is missing or too ambiguous.
 *
 * Supports full international numbers (11–15 digits). For shorter strings, applies common
 * Greek local patterns (leading 0 or 69… without country code).
 */
export function whatsappMeHref(phone: string | undefined | null): string | null {
  if (phone == null || String(phone).trim() === '') return null
  const d = digitsOnly(String(phone))
  if (d.length < 9) return null

  if (d.length >= 11 && d.length <= 15) {
    return `https://wa.me/${d}`
  }

  if (d.length === 10 && d.startsWith('0')) {
    return `https://wa.me/30${d.slice(1)}`
  }

  if (d.length === 10 && d.startsWith('69')) {
    return `https://wa.me/30${d}`
  }

  if (d.length === 9 && d.startsWith('69')) {
    return `https://wa.me/30${d}`
  }

  return null
}
