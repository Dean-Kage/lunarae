import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API } from '../config/api.js'

const AuthContext = createContext(null)
const TOKEN_KEY   = 'lunarae_auth_token'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }

    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) setUser({ ...data.user, token })
        else           localStorage.removeItem(TOKEN_KEY)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    console.log('API URL:', API || '(relative)', '→', `${API}/api/auth/login`)
    const res  = await fetch(`${API}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser({ ...data.user, token: data.token })
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    console.log('API URL:', API || '(relative)', '→', `${API}/api/auth/register`)
    const res  = await fetch(`${API}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser({ ...data.user, token: data.token })
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    console.log('API URL:', API || '(relative)', '→', `${API}/api/auth/profile`)
    const token = localStorage.getItem(TOKEN_KEY)
    const res   = await fetch(`${API}/api/auth/profile`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Update failed')
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser({ ...data.user, token: data.token })
    return data.user
  }, [])

  const changePassword = useCallback(async (payload) => {
    const token = localStorage.getItem(TOKEN_KEY)
    const res   = await fetch(`${API}/api/auth/change-password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Password change failed')
    return data
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
