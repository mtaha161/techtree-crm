export function waLink(phone: string): string {
  let digits = phone.trim().replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '92' + digits.slice(1)
  else if (digits.startsWith('92')) { /* already correct */ }
  else digits = '92' + digits
  return `https://wa.me/${digits}`
}
