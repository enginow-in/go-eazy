const ANON_VIEWER_KEY = 'ge_anon_viewer_id'

export const getOrCreateAnonViewerId = () => {
  let id = localStorage.getItem(ANON_VIEWER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(ANON_VIEWER_KEY, id)
  }
  return id
}
