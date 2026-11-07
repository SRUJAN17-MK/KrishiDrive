import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    try {
      const t = localStorage.getItem('kd_token')
      const u = localStorage.getItem('kd_user')
      if (t && u) {
        setToken(t)
        setUser(JSON.parse(u))

        // Re-verify session in background with backend
        api.auth.me().then(serverUser => {
          if (mounted && serverUser && (serverUser.id || serverUser.username)) {
            setUser(serverUser)
            localStorage.setItem('kd_user', JSON.stringify(serverUser))
          }
        }).catch(err => {
          if (err.status === 401 || err.status === 403) {
            // Cleanly clear invalid or expired session
            if (mounted) {
              localStorage.removeItem('kd_token')
              localStorage.removeItem('kd_user')
              setToken(null)
              setUser(null)
            }
          }
        })
      }
    } catch (e) {
      console.error('Failed to load cached auth state', e)
    } finally {
      if (mounted) setLoading(false)
    }
    return () => { mounted = false }
  }, [])

  const login = useCallback((userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('kd_token', authToken)
    localStorage.setItem('kd_user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('kd_token')
    localStorage.removeItem('kd_user')
  }, [])

  const quickLogin = useCallback(async (username, password = 'demo123') => {
    const data = await api.auth.login({ username, password })
    login(data.user, data.access_token)
    return data.user
  }, [login])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        quickLogin,
        isAuthenticated: !!token,
        isFarmer: user?.role === 'farmer',
        isDriver: user?.role === 'driver',
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
