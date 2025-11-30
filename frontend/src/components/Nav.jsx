import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    let mounted = true
    const check = async () => {
      try {
        const res = await api.get('/session-status')
        if (!mounted) return
        setLoggedIn(!!res.data?.loggedIn)
      } catch (err) {
        setLoggedIn(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const toggleSidebar = () => {
    document.body.classList.toggle('sidebar-open')
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">☰</button>
          <div className="brand">Electronics Astra</div>
        </div>
        <div className="links">
          <label style={{display:'inline-flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={dark} onChange={() => setDark(s => !s)} />
            <span className="small">Dark</span>
          </label>
          {loggedIn ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/logout">Logout</Link>
            </>
          ) : (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
