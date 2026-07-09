/**
 * authFetch — same signature as fetch(), but if a request comes back 401
 * with { code: 'TOKEN_EXPIRED' }, it calls /api/auth/refresh once and
 * retries the original request before giving up. Keeps pages from having
 * to know or care that access tokens are short-lived.
 */
async function authFetch(url, options = {}) {
  const opts = { credentials: 'include', ...options };
  let res = await fetch(url, opts);

  if (res.status === 401) {
    let code;
    try { code = (await res.clone().json()).code; } catch { /* not JSON, ignore */ }

    if (code === 'TOKEN_EXPIRED') {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (refreshRes.ok) {
        res = await fetch(url, opts); // retry original request once
      }
    }
  }

  return res;
}