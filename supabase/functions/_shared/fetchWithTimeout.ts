/** Fetch with AbortController timeout to avoid hanging Edge Function invocations. */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}
