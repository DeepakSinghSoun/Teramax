const TOKEN_KEY = 'teramax_admin_token'
export const getToken = () => sessionStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY))

export async function api(path, { method = 'GET', body, admin = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (admin && getToken()) headers.Authorization = 'Bearer ' + getToken()
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) {
    if (admin && res.status === 401) setToken(null)
    const d = data?.detail
    const msg = Array.isArray(d) ? d.map((x) => x.loc?.slice(-1)[0] + ': ' + x.msg).join('; ') : d
    const err = new Error(msg || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}
