import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function Logout() {
  const navigate = useNavigate()

  useEffect(() => {
    const doLogout = async () => {
      try {
        await api.post('/logout')
      } catch (err) {
        // ignore
      } finally {
        navigate('/login')
      }
    }
    doLogout()
  }, [])

  return <div className="card">Logging out...</div>
}
