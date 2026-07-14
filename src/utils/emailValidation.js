const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'getnada.com',
  'grr.la',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'mohmal.com',
  'nada.email',
  'sharklasers.com',
  'temp-mail.org',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
])

export const isDisposableEmail = (email = '') => {
  const domain = email.trim().toLowerCase().split('@').pop()
  if (!domain || domain === email.trim().toLowerCase()) return false

  return [...DISPOSABLE_EMAIL_DOMAINS].some(
    blockedDomain => domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
  )
}
