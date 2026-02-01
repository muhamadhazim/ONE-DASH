export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    if (!exp) return true
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

export function checkAuthAndLogout(router: any) {
  const token = localStorage.getItem('token')
  
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
    return false
  }
  
  return true
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('token')
  if (!token) return false
  
  return !isTokenExpired(token)
}
