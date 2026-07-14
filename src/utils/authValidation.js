export const getPasswordError = (password, mode) => {
  if (!password) return 'Password is required'
  if (mode === 'signup' && password.length < 8) return 'Min 8 characters'
  return ''
}
