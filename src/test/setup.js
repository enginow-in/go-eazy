import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount React trees after every test so they don't leak into the next one.
afterEach(() => {
  cleanup()
})
