import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await api.get('/session-status')
        if (!mounted) return
        if (res.data && res.data.loggedIn) {
          setLoggedIn(true)
        } else {
          setLoggedIn(false)
        }
      } catch (err) {
        setLoggedIn(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-2">Loading...</div>
  if (!loggedIn) return <Navigate to="/login" replace />

  return children
}
