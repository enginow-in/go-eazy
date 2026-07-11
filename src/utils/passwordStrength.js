// Shared password strength rules, used by both the Sign Up form and the
// Reset Password page so the requirements stay identical everywhere.

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lowercase', label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { id: 'number', label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { id: 'special', label: 'One special character (!@#$%^&*...)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

// Returns { passed: string[], failed: string[], isValid: boolean }
export const evaluatePassword = (password = '') => {
  const passed = []
  const failed = []

  for (const rule of PASSWORD_RULES) {
    if (rule.test(password)) passed.push(rule.id)
    else failed.push(rule.id)
  }

  return {
    passed,
    failed,
    isValid: failed.length === 0,
  }
}

// A friendly, single-sentence error message for form-level validation errors
// (used where there isn't room to show the full live checklist).
export const getPasswordErrorMessage = (password = '') => {
  const { failed } = evaluatePassword(password)
  if (failed.length === 0) return null

  const firstFailed = PASSWORD_RULES.find(r => r.id === failed[0])
  return `Password needs: ${firstFailed.label.toLowerCase()}`
}